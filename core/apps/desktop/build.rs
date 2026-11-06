fn main() {
    // Listing the commands puts them under capabilities, so a page in a child webview cannot reach them.
    tauri_build::try_build(tauri_build::Attributes::new().app_manifest(tauri_build::AppManifest::new().commands(&[
        "ipc",
        "ipc_send",
        "subscribe",
        "window_control",
        "open_external",
        "legacy_local_storage",
        "webview_create",
        "webview_close",
        "webview_navigate",
        "webview_bounds",
        "webview_action",
        // Only has a handler in debug and e2e builds
        "e2e_result",
    ])))
    .expect("tauri build");
}
