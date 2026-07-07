use axum::{
    routing::{get, post},
    Json, Router,
};
use std::net::SocketAddr;
use tower_http::cors::{Any, CorsLayer};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::Mutex;
use tokio::time::Instant;

mod config;
mod keystone;

#[derive(Clone)]
pub struct ProxyCache {
    pub entries: Arc<Mutex<HashMap<String, (Instant, serde_json::Value)>>>,
}

impl ProxyCache {
    pub fn new() -> Self {
        Self {
            entries: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    pub async fn get(&self, key: &str) -> Option<serde_json::Value> {
        let entries = self.entries.lock().await;
        if let Some((instant, val)) = entries.get(key) {
            if instant.elapsed() < tokio::time::Duration::from_secs(3) {
                return Some(val.clone());
            }
        }
        None
    }

    pub async fn insert(&self, key: String, val: serde_json::Value) {
        let mut entries = self.entries.lock().await;
        entries.insert(key, (Instant::now(), val));
    }

    pub async fn invalidate_all(&self) {
        let mut entries = self.entries.lock().await;
        entries.clear();
    }
}

#[derive(Clone)]
pub struct AppState {
    pub config: config::Config,
    pub client: reqwest::Client,
    pub cache: ProxyCache,
}

#[tokio::main]
async fn main() {
    // Initialize tracing
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "backend=debug,tower_http=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    // Load environment variables
    dotenvy::dotenv().ok();
    let config = config::Config::from_env();
    tracing::info!("Loaded configuration: {:?}", config);

    // Setup HTTP/2 pooled client with accept_invalid_certs (required for many local mock/private OpenStack APIs)
    let client = reqwest::Client::builder()
        .danger_accept_invalid_certs(true)
        .pool_max_idle_per_host(20)
        .pool_idle_timeout(std::time::Duration::from_secs(90))
        .build()
        .unwrap_or_default();

    let state = AppState {
        config,
        client,
        cache: ProxyCache::new(),
    };

    // Setup CORS
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    // Build our application with routes
    let app = Router::new()
        .route("/api/v1/health", get(health_handler))
        .route("/api/v1/auth/login", post(login_handler))
        .route("/api/v1/auth/switch-project", post(switch_project_handler))
        .route("/api/v1/proxy", post(proxy_handler))
        .layer(cors)
        .with_state(state);

    // Run our app with hyper
    let addr = SocketAddr::from(([0, 0, 0, 0], 8080));
    tracing::info!("Listening on {}", addr);
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn health_handler() -> Json<serde_json::Value> {
    Json(serde_json::json!({
        "success": true,
        "status": "healthy",
        "service": "CloudPilot API Gateway"
    }))
}

async fn login_handler(
    axum::extract::State(state): axum::extract::State<AppState>,
    Json(payload): Json<keystone::LoginRequest>,
) -> Result<Json<keystone::LoginResponse>, keystone::AuthError> {
    tracing::info!("Login attempt for user: {}", payload.username);
    
    let keystone_url = payload
        .auth_url
        .as_deref()
        .unwrap_or(&state.config.keystone_url);

    let client = keystone::KeystoneClient::new(keystone_url, payload.ca_cert.as_deref());
    let token = client
        .authenticate(&payload.username, &payload.password, &payload.project, &payload.domain)
        .await?;

    Ok(Json(keystone::LoginResponse {
        success: true,
        token: token.token_id,
        user: keystone::UserSession {
            username: payload.username,
            project: payload.project,
            project_id: token.project_id,
            roles: token.roles,
            endpoints: token.endpoints,
        },
    }))
}

#[derive(serde::Deserialize, Debug)]
pub struct ProxyRequest {
    pub url: String,
    pub method: String,
    pub body: Option<serde_json::Value>,
}

async fn proxy_handler(
    axum::extract::State(state): axum::extract::State<AppState>,
    headers: axum::http::HeaderMap,
    Json(payload): Json<ProxyRequest>,
) -> Result<Json<serde_json::Value>, keystone::AuthError> {
    let method_str = payload.method.to_uppercase();
    tracing::debug!("Proxy request received: {} {}", method_str, payload.url);
    
    // Get X-Auth-Token from headers
    let token = headers
        .get("X-Auth-Token")
        .and_then(|h| h.to_str().ok())
        .ok_or_else(|| keystone::AuthError::KeystoneError("Missing X-Auth-Token header".to_string()))?;

    let method = match method_str.as_str() {
        "GET" => reqwest::Method::GET,
        "POST" => reqwest::Method::POST,
        "PUT" => reqwest::Method::PUT,
        "DELETE" => reqwest::Method::DELETE,
        "PATCH" => reqwest::Method::PATCH,
        _ => return Err(keystone::AuthError::KeystoneError("Unsupported HTTP method".to_string())),
    };

    // For non-safe methods, invalidate the cache immediately to ensure next GET queries see fresh mutations!
    if method != reqwest::Method::GET {
        state.cache.invalidate_all().await;
    }

    let cache_key = format!("{}:{}", token, payload.url);

    // If GET, try serving from cache first
    if method == reqwest::Method::GET {
        if let Some(cached_res) = state.cache.get(&cache_key).await {
            tracing::debug!("Proxy cache HIT: {}", payload.url);
            return Ok(Json(cached_res));
        }
    }

    let mut req = state.client.request(method.clone(), &payload.url)
        .header("X-Auth-Token", token);

    if let Some(body_json) = payload.body {
        if payload.url.contains("/v2/images") && method == reqwest::Method::PATCH {
            req = req.header("Content-Type", "application/openstack-images-v2-json-patch")
                .body(body_json.to_string());
        } else {
            req = req.json(&body_json);
        }
    }

    let response = req.send()
        .await
        .map_err(|e| keystone::AuthError::NetworkError(format!("Proxy request failed: {}", e)))?;

    let status = response.status();
    let body_text = response.text().await.unwrap_or_default();
    
    let response_json: serde_json::Value = serde_json::from_str(&body_text)
        .unwrap_or_else(|_| serde_json::json!({ "raw_response": body_text }));

    if !status.is_success() {
        return Err(keystone::AuthError::KeystoneError(format!(
            "OpenStack API returned HTTP {}: {:?}",
            status, response_json
        )));
    }

    // Cache the successful GET response
    if method == reqwest::Method::GET {
        state.cache.insert(cache_key, response_json.clone()).await;
    }

    Ok(Json(response_json))
}

#[derive(serde::Deserialize, Debug)]
pub struct SwitchProjectRequest {
    pub username: String,
    pub project: String,
    pub domain: String,
    pub auth_url: Option<String>,
    pub ca_cert: Option<String>,
}

async fn switch_project_handler(
    axum::extract::State(state): axum::extract::State<AppState>,
    headers: axum::http::HeaderMap,
    Json(payload): Json<SwitchProjectRequest>,
) -> Result<Json<keystone::LoginResponse>, keystone::AuthError> {
    tracing::info!("Switching project to {} for user: {}", payload.project, payload.username);
    
    // Get X-Auth-Token from headers
    let current_token = headers
        .get("X-Auth-Token")
        .and_then(|h| h.to_str().ok())
        .ok_or_else(|| keystone::AuthError::KeystoneError("Missing X-Auth-Token header".to_string()))?;

    let keystone_url = payload
        .auth_url
        .as_deref()
        .unwrap_or(&state.config.keystone_url);

    let client = keystone::KeystoneClient::new(keystone_url, payload.ca_cert.as_deref());
    let token = client
        .scope_token(current_token, &payload.project, &payload.domain)
        .await?;

    Ok(Json(keystone::LoginResponse {
        success: true,
        token: token.token_id,
        user: keystone::UserSession {
            username: payload.username,
            project: token.project_name,
            project_id: token.project_id,
            roles: token.roles,
            endpoints: token.endpoints,
        },
    }))
}

