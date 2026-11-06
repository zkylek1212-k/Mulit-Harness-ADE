// Stdin: {"id":1,"window":1,"channel":"files:read","args":["a.txt"]}
// Stdout: {"id":1,"result":...} or {"id":1,"error":"..."}; events {"event":"files:treeChange","window":1,"args":[]}
// Control: {"id":1,"channel":"test:openWindow","window":2,"args":["<workspace>"]} and test:closeWindow.
// Env: WB_DATA_DIR, WB_VERSION, WB_PICK_FOLDER (what the folder dialog returns).
use std::io::{BufRead, Write};
use std::path::PathBuf;
use std::sync::{Arc, Mutex};

use serde_json::{json, Value};
use wb_core::{AppInfo, Core, Host};

#[derive(Default)]
struct Stub {
    windows: Mutex<Vec<u32>>,
    out: Mutex<()>,
}

impl Stub {
    fn print(&self, v: &Value) {
        let _g = self.out.lock().unwrap();
        let mut o = std::io::stdout().lock();
        let _ = writeln!(o, "{v}");
        let _ = o.flush();
    }
    fn action(&self, name: &str, args: Value) {
        self.print(&json!({ "event": format!("host:{name}"), "window": 0, "args": args }));
    }
}

impl Host for Stub {
    fn send(&self, window: u32, channel: &str, args: Value) {
        self.print(&json!({ "event": channel, "window": window, "args": args }));
    }
    fn send_all(&self, channel: &str, args: Value) {
        for w in self.windows() {
            self.send(w, channel, args.clone());
        }
    }
    fn focused_window(&self) -> Option<u32> {
        self.windows.lock().unwrap().first().copied()
    }
    fn windows(&self) -> Vec<u32> {
        self.windows.lock().unwrap().clone()
    }
    fn pick_folder(&self, _window: u32, _default_path: &str) -> Option<String> {
        std::env::var("WB_PICK_FOLDER").ok()
    }
    fn pick_file(&self, _title: &str) -> Option<String> {
        None
    }
    fn open_path(&self, path: &str) -> Result<(), String> {
        self.action("openPath", json!([path]));
        Ok(())
    }
    fn show_in_folder(&self, path: &str) {
        self.action("showInFolder", json!([path]));
    }
    fn open_url(&self, url: &str) {
        self.action("openUrl", json!([url]));
    }
    fn notify(&self, title: &str, body: &str) {
        self.action("notify", json!([title, body]));
    }
    fn set_title(&self, window: u32, title: &str) {
        self.action("setTitle", json!([window, title]));
    }
    fn open_project_window(&self, workspace: Option<&str>) -> bool {
        self.action("openProjectWindow", json!([workspace]));
        true
    }
    fn open_terminal_window(&self) -> bool {
        true
    }
    fn close_terminal_window(&self) -> bool {
        true
    }
    fn set_title_bar_theme(&self, _window: u32, _theme: &str) -> bool {
        true
    }
}

fn main() {
    let host = Arc::new(Stub::default());
    let info = AppInfo { version: std::env::var("WB_VERSION").unwrap_or_else(|_| "0.0.0".into()), is_packaged: false, exe_path: String::new(), resources: PathBuf::from(std::env::var("WB_RESOURCES").unwrap_or_default()) };
    let core = Core::new(host.clone(), PathBuf::from(std::env::var("WB_DATA_DIR").expect("WB_DATA_DIR")), info);
    for line in std::io::stdin().lock().lines() {
        let Ok(line) = line else { break };
        let Ok(msg) = serde_json::from_str::<Value>(&line) else { continue };
        let (core, host) = (core.clone(), host.clone());
        // Calls run concurrently, as they do from a real window
        std::thread::spawn(move || {
            let id = msg["id"].clone();
            let window = msg["window"].as_u64().unwrap_or(1) as u32;
            let channel = msg["channel"].as_str().unwrap_or("").to_string();
            let args = msg["args"].as_array().cloned().unwrap_or_default();
            let res = match channel.as_str() {
                "test:openWindow" => {
                    host.windows.lock().unwrap().push(window);
                    Ok(json!(core.register_window(window, args.first().and_then(Value::as_str))))
                }
                "test:closeWindow" => {
                    host.windows.lock().unwrap().retain(|w| *w != window);
                    core.window_closed(window);
                    Ok(Value::Null)
                }
                "test:quit" => {
                    core.shutdown();
                    std::process::exit(0);
                }
                _ => core.invoke(window, &channel, &args),
            };
            host.print(&match res {
                Ok(v) => json!({ "id": id, "result": v }),
                Err(e) => json!({ "id": id, "error": e }),
            });
        });
    }
    core.shutdown();
    std::process::exit(0);
}
