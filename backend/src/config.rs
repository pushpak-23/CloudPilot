use std::env;

#[derive(Clone, Debug)]
pub struct Config {
    pub keystone_url: String,
}

impl Config {
    pub fn from_env() -> Self {
        let keystone_url = env::var("OPENSTACK_KEYSTONE_URL")
            .unwrap_or_else(|_| "http://keystone-mock:5000/v3".to_string());
        Self { keystone_url }
    }
}
