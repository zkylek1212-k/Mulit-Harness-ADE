//! The whole backend behind one call, independent of any UI framework.
pub mod bgtasks;
pub mod conn;
pub mod core;
pub mod cowork_shared;
pub mod custom_agent;
pub mod dashboard;
pub mod ext;
pub mod files;
pub mod git_ui;
pub mod manifest;
pub mod paths;
pub mod pty;
pub mod session_scan;
pub mod settings;
pub mod usage;
pub mod util;

use std::sync::Arc;

use serde_json::Value;

pub use crate::core::{AppInfo, Core, Host};

/// Long-lived feature state that needs the finished Core
#[derive(Default)]
pub struct Features {}

pub fn start_features(core: &Arc<Core>) {
    let _ = core.features.set(Features::default());
}

pub fn features_call(_core: &Arc<Core>, _window: u32, channel: &str, _args: &[Value]) -> Result<Value, String> {
    Err(format!("No handler registered for '{channel}'"))
}
