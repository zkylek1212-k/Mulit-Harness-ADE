// Small HTTPS client for GitHub. A plain status is an answer, not an error; only a failed connection is an Err.
use std::io::Read;
use std::time::Duration;

use serde_json::Value;

const USER_AGENT: &str = "agent-workbench";
const MAX_BODY: u64 = 32 * 1024 * 1024;

pub struct Response {
    pub status: u16,
    pub body: Vec<u8>,
}

fn agent() -> ureq::Agent {
    ureq::Agent::config_builder().http_status_as_error(false).timeout_global(Some(Duration::from_secs(30))).build().into()
}

fn finish(res: Result<ureq::http::Response<ureq::Body>, ureq::Error>) -> Result<Response, String> {
    let mut r = res.map_err(|e| e.to_string())?;
    let status = r.status().as_u16();
    let mut body = Vec::new();
    r.body_mut().as_reader().take(MAX_BODY).read_to_end(&mut body).map_err(|e| e.to_string())?;
    Ok(Response { status, body })
}

pub fn get(url: &str, headers: &[(&str, &str)]) -> Result<Response, String> {
    let mut req = agent().get(url).header("User-Agent", USER_AGENT);
    for (k, v) in headers {
        req = req.header(*k, *v);
    }
    finish(req.call())
}

pub fn post_json(url: &str, headers: &[(&str, &str)], body: &Value) -> Result<Response, String> {
    let mut req = agent().post(url).header("User-Agent", USER_AGENT).header("Content-Type", "application/json");
    for (k, v) in headers {
        req = req.header(*k, *v);
    }
    finish(req.send(body.to_string().as_bytes()))
}
