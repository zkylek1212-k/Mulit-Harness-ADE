//! The whole backend behind one call, independent of any UI framework.
pub mod bgtasks;
pub mod conn;
pub mod core;
pub mod cowork;
pub mod cowork_exec;
pub mod cowork_ipc;
pub mod cowork_test;
pub mod cowork_shared;
pub mod custom_agent;
pub mod dashboard;
pub mod ext;
pub mod files;
pub mod git_ui;
pub mod http;
pub mod manifest;
pub mod memsync;
pub mod paths;
pub mod remote;
pub mod pty;
pub mod session_scan;
pub mod settings;
pub mod updater;
pub mod usage;
pub mod util;

use std::sync::Arc;

use serde_json::Value;

pub use crate::core::{AppInfo, Core, Host};

/// Long-lived feature state that needs the finished Core
pub struct Features {
    pub memsync: memsync::MemSync,
    pub updater: updater::Updater,
    pub cowork: cowork_ipc::CoworkApp,
    pub remote: remote::RemoteApp,
}

pub fn start_features(core: &Arc<Core>) {
    let _ = core.features.set(Features { memsync: memsync::MemSync::default(), updater: updater::Updater::new(&core.info.version, core.info.is_packaged), cowork: cowork_ipc::CoworkApp::default(), remote: remote::start(core) });
    cowork_ipc::start_service(core);
    memsync::start_background_sync(core);
    updater::start_startup_check(core);
    remote::start_background(core);
}

pub fn features_call(core: &Arc<Core>, window: u32, channel: &str, args: &[Value]) -> Result<Value, String> {
    match channel.split(':').next().unwrap_or("") {
        "memsync" => memsync::call(core, window, channel, args),
        "updater" => updater::call(core, channel, args),
        "cowork" => cowork_ipc::call(core, window, channel, args),
        "remote" => remote::call(core, window, channel, args),
        _ => Err(format!("No handler registered for '{channel}'")),
    }
}
