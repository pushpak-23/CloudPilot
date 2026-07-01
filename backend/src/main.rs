use axum::{
    routing::{get, post},
    Json, Router,
};
use std::net::SocketAddr;
use tower_http::cors::{Any, CorsLayer};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod config;
mod keystone;

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

    // Setup CORS
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    // Build our application with routes
    let app = Router::new()
        .route("/api/v1/health", get(health_handler))
        .route("/api/v1/auth/login", post(login_handler))
        .route("/api/v1/proxy", post(proxy_handler))
        .layer(cors)
        .with_state(config);

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
    axum::extract::State(config): axum::extract::State<config::Config>,
    Json(payload): Json<keystone::LoginRequest>,
) -> Result<Json<keystone::LoginResponse>, keystone::AuthError> {
    tracing::info!("Login attempt for user: {}", payload.username);
    
    // Determine the Keystone URL to use (dynamic payload.auth_url takes priority over static config)
    let keystone_url = payload
        .auth_url
        .as_deref()
        .unwrap_or(&config.keystone_url);

    // Call Keystone client with custom CA certificate if present
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
    headers: axum::http::HeaderMap,
    Json(payload): Json<ProxyRequest>,
) -> Result<Json<serde_json::Value>, keystone::AuthError> {
    tracing::debug!("Proxy request received: {} {}", payload.method, payload.url);
    
    // Get X-Auth-Token from headers
    let token = headers
        .get("X-Auth-Token")
        .and_then(|h| h.to_str().ok())
        .ok_or_else(|| keystone::AuthError::KeystoneError("Missing X-Auth-Token header".to_string()))?;

    let client = reqwest::Client::builder()
        .danger_accept_invalid_certs(true)
        .build()
        .unwrap_or_default();

    let method = match payload.method.to_uppercase().as_str() {
        "GET" => reqwest::Method::GET,
        "POST" => reqwest::Method::POST,
        "PUT" => reqwest::Method::PUT,
        "DELETE" => reqwest::Method::DELETE,
        "PATCH" => reqwest::Method::PATCH,
        _ => return Err(keystone::AuthError::KeystoneError("Unsupported HTTP method".to_string())),
    };

    let mut req = client.request(method.clone(), &payload.url)
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
    
    // Parse response as JSON or return raw string
    let response_json: serde_json::Value = serde_json::from_str(&body_text)
        .unwrap_or_else(|_| serde_json::json!({ "raw_response": body_text }));

    if !status.is_success() {
        return Err(keystone::AuthError::KeystoneError(format!(
            "OpenStack API returned HTTP {}: {:?}",
            status, response_json
        )));
    }

    Ok(Json(response_json))
}
