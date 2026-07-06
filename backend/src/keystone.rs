use serde::{Deserialize, Serialize};
use axum::Json;

#[derive(Deserialize, Serialize, Debug)]
pub struct LoginRequest {
    pub username: String,
    pub password: String,
    pub project: String,
    pub domain: String,
    pub auth_url: Option<String>,
    pub region: Option<String>,
    pub ca_cert: Option<String>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct LoginResponse {
    pub success: bool,
    pub token: String,
    pub user: UserSession,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct UserSession {
    pub username: String,
    pub project: String,
    pub project_id: String,
    pub roles: Vec<String>,
    pub endpoints: std::collections::HashMap<String, String>,
}

#[derive(Debug)]
pub enum AuthError {
    KeystoneError(String),
    NetworkError(String),
}

impl axum::response::IntoResponse for AuthError {
    fn into_response(self) -> axum::response::Response {
        let (status, err_code, msg) = match self {
            AuthError::KeystoneError(m) => (
                axum::http::StatusCode::UNAUTHORIZED,
                "KEYSTONE_AUTH_FAILED",
                m,
            ),
            AuthError::NetworkError(m) => (
                axum::http::StatusCode::BAD_GATEWAY,
                "KEYSTONE_NETWORK_ERROR",
                m,
            ),
        };

        let body = Json(serde_json::json!({
            "success": false,
            "error": {
                "code": err_code,
                "message": msg
            }
        }));

        (status, body).into_response()
    }
}

pub struct AuthenticatedToken {
    pub token_id: String,
    pub project_id: String,
    pub project_name: String,
    pub roles: Vec<String>,
    pub endpoints: std::collections::HashMap<String, String>,
}

pub struct KeystoneClient {
    url: String,
    client: reqwest::Client,
}

impl KeystoneClient {
    pub fn new(url: &str, ca_cert: Option<&str>) -> Self {
        let mut builder = reqwest::Client::builder()
            .danger_accept_invalid_certs(true);

        if let Some(cert_str) = ca_cert {
            let cert_trimmed = cert_str.trim();
            if !cert_trimmed.is_empty() {
                if let Ok(cert) = reqwest::Certificate::from_pem(cert_trimmed.as_bytes()) {
                    builder = builder.add_root_certificate(cert);
                }
            }
        }

        let client = builder.build().unwrap_or_else(|_| reqwest::Client::new());
        Self {
            url: url.trim_end_matches('/').to_string(),
            client,
        }
    }

    pub async fn authenticate(
        &self,
        username: &str,
        password: &str,
        project: &str,
        domain: &str,
    ) -> Result<AuthenticatedToken, AuthError> {
        let auth_payload = serde_json::json!({
            "auth": {
                "identity": {
                    "methods": ["password"],
                    "password": {
                        "user": {
                          "name": username,
                          "domain": { "name": domain },
                          "password": password
                        }
                    }
                },
                "scope": {
                    "project": {
                        "name": project,
                        "domain": { "name": domain }
                    }
                }
            }
        });

        // Normalize the URL to ensure it has /v3 prefix
        let base = if self.url.ends_with("/v3") || self.url.ends_with("/v3/") {
            self.url.trim_end_matches('/').to_string()
        } else {
            format!("{}/v3", self.url.trim_end_matches('/'))
        };
        let target_url = format!("{}/auth/tokens", base);
        tracing::debug!("POST request to: {}", target_url);

        let response = self
            .client
            .post(&target_url)
            .json(&auth_payload)
            .send()
            .await
            .map_err(|e| AuthError::NetworkError(format!("Network connection failed: {}", e)))?;

        let status = response.status();
        if !status.is_success() {
            let error_text = response.text().await.unwrap_or_default();
            return Err(AuthError::KeystoneError(format!(
                "Keystone rejected credentials (HTTP {}): {}",
                status, error_text
            )));
        }

        // Get X-Subject-Token header
        let token_id = response
            .headers()
            .get("X-Subject-Token")
            .and_then(|h| h.to_str().ok())
            .map(|s| s.to_string())
            .ok_or_else(|| AuthError::KeystoneError("Missing X-Subject-Token header in response".to_string()))?;

        // Parse body for roles, project, and catalog
        #[derive(Deserialize, Debug)]
        struct KeystoneResponse {
            token: TokenDetail,
        }
        #[derive(Deserialize, Debug)]
        struct TokenDetail {
            roles: Vec<RoleDetail>,
            project: ProjectDetail,
            catalog: Vec<CatalogItem>,
        }
        #[derive(Deserialize, Debug)]
        struct ProjectDetail {
            id: String,
            name: String,
        }
        #[derive(Deserialize, Debug)]
        struct CatalogItem {
            #[serde(rename = "type")]
            service_type: String,
            endpoints: Vec<EndpointItem>,
        }
        #[derive(Deserialize, Debug)]
        struct EndpointItem {
            interface: String,
            url: String,
        }
        #[derive(Deserialize, Debug)]
        struct RoleDetail {
            name: String,
        }

        let body: KeystoneResponse = response
            .json()
            .await
            .map_err(|e| AuthError::KeystoneError(format!("Failed to parse token response body: {}", e)))?;

        let roles = body.token.roles.into_iter().map(|r| r.name).collect();
        let project_id = body.token.project.id;
        let project_name = body.token.project.name;

        let mut endpoints = std::collections::HashMap::new();
        for item in body.token.catalog {
            for ep in item.endpoints {
                if ep.interface == "public" {
                    endpoints.insert(item.service_type.clone(), ep.url.clone());
                    break;
                }
            }
        }

        Ok(AuthenticatedToken {
            token_id,
            project_id,
            project_name,
            roles,
            endpoints,
        })
    }

    pub async fn scope_token(
        &self,
        token_id: &str,
        project: &str,
        domain: &str,
    ) -> Result<AuthenticatedToken, AuthError> {
        let scope_project = if project.len() == 32 || project.len() == 36 {
            serde_json::json!({ "id": project })
        } else {
            serde_json::json!({
                "name": project,
                "domain": { "name": domain }
            })
        };

        let auth_payload = serde_json::json!({
            "auth": {
                "identity": {
                    "methods": ["token"],
                    "token": {
                        "id": token_id
                    }
                },
                "scope": {
                    "project": scope_project
                }
            }
        });

        let base = if self.url.ends_with("/v3") || self.url.ends_with("/v3/") {
            self.url.trim_end_matches('/').to_string()
        } else {
            format!("{}/v3", self.url.trim_end_matches('/'))
        };
        let target_url = format!("{}/auth/tokens", base);
        tracing::debug!("POST (scope token) request to: {}", target_url);

        let response = self
            .client
            .post(&target_url)
            .json(&auth_payload)
            .send()
            .await
            .map_err(|e| AuthError::NetworkError(format!("Network connection failed: {}", e)))?;

        let status = response.status();
        if !status.is_success() {
            let error_text = response.text().await.unwrap_or_default();
            return Err(AuthError::KeystoneError(format!(
                "Keystone token scoping failed (HTTP {}): {}",
                status, error_text
            )));
        }

        let token_id = response
            .headers()
            .get("X-Subject-Token")
            .and_then(|h| h.to_str().ok())
            .map(|s| s.to_string())
            .ok_or_else(|| AuthError::KeystoneError("Missing X-Subject-Token header in response".to_string()))?;

        #[derive(Deserialize, Debug)]
        struct KeystoneResponse {
            token: TokenDetail,
        }
        #[derive(Deserialize, Debug)]
        struct TokenDetail {
            roles: Vec<RoleDetail>,
            project: ProjectDetail,
            catalog: Option<Vec<CatalogItem>>,
        }
        #[derive(Deserialize, Debug)]
        struct ProjectDetail {
            id: String,
            name: String,
        }
        #[derive(Deserialize, Debug)]
        struct CatalogItem {
            #[serde(rename = "type")]
            service_type: String,
            endpoints: Vec<EndpointItem>,
        }
        #[derive(Deserialize, Debug)]
        struct EndpointItem {
            interface: String,
            url: String,
        }
        #[derive(Deserialize, Debug)]
        struct RoleDetail {
            name: String,
        }

        let body: KeystoneResponse = response
            .json()
            .await
            .map_err(|e| AuthError::KeystoneError(format!("Failed to parse token response body: {}", e)))?;

        let roles = body.token.roles.into_iter().map(|r| r.name).collect();
        let project_id = body.token.project.id;
        let project_name = body.token.project.name;

        let mut endpoints = std::collections::HashMap::new();
        if let Some(catalog) = body.token.catalog {
            for item in catalog {
                for ep in item.endpoints {
                    if ep.interface == "public" {
                        endpoints.insert(item.service_type.clone(), ep.url.clone());
                        break;
                    }
                }
            }
        }

        tracing::info!("Scope token succeeded. Token ID: {}, Project ID: {}, Project Name: {}, Endpoints: {:?}", token_id, project_id, project_name, endpoints);

        Ok(AuthenticatedToken {
            token_id,
            project_id,
            project_name,
            roles,
            endpoints,
        })
    }
}
