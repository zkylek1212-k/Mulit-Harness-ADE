// Phase 4A throwaway prototype: real CLI -> PTY -> desktop (Channels) and phone-style (WebSocket) clients.
// It exists to measure and to find blockers. It never ships.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::collections::HashMap;
use std::net::TcpListener;
use std::sync::mpsc::{sync_channel, Receiver, SyncSender, TrySendError};
use std::sync::{Arc, Mutex};
use std::time::{SystemTime, UNIX_EPOCH};

use tauri::ipc::{Channel, InvokeResponseBody};
use tauri::{Manager, State, WebviewUrl};
use wb_pty::{PtyOptions, PtySession};

const CREDIT: i64 = 1024 * 1024;
const PHONE_QUEUE: usize = 256;

fn env_num(name: &str, default: u64) -> u64 {
    std::env::var(name).ok().and_then(|v| v.parse().ok()).unwrap_or(default)
}

fn now_ms() -> u64 {
    SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_millis() as u64
}

/// One phone-style client. The queue is bounded: a slow client lags and gets a snapshot, it never slows the rest.
struct Client {
    term: u32,
    tx: SyncSender<Vec<u8>>,
    lagged: Arc<Mutex<bool>>,
}

#[derive(Default)]
struct Hub {
    clients: Mutex<Vec<Client>>,
}

impl Hub {
    fn publish(&self, term: u32, bytes: &[u8]) {
        let mut clients = self.clients.lock().unwrap();
        clients.retain(|c| {
            if c.term != term {
                return true;
            }
            match c.tx.try_send(bytes.to_vec()) {
                Ok(()) => true,
                Err(TrySendError::Full(_)) => {
                    *c.lagged.lock().unwrap() = true;
                    true
                }
                Err(TrySendError::Disconnected(_)) => false,
            }
        });
    }
}

#[derive(Default)]
struct App {
    sessions: Mutex<HashMap<u32, Arc<PtySession>>>,
    hub: Arc<Hub>,
    job: Mutex<Option<wb_proc::KillOnCloseJob>>,
}

#[tauri::command]
fn config() -> serde_json::Value {
    serde_json::json!({ "warmup_ms": env_num("BENCH_WARMUP_MS", 5000), "sample_ms": env_num("BENCH_SAMPLE_MS", 20000), "child_url": std::env::var("BENCH_CHILD_URL").unwrap_or_default() })
}

#[tauri::command]
fn start(app: State<'_, App>, channel: Channel<InvokeResponseBody>) -> Result<(), String> {
    let n = env_num("BENCH_N", 4) as u32;
    let rate = env_num("BENCH_RATE", 256 * 1024);
    let seconds = (env_num("BENCH_WARMUP_MS", 5000) + env_num("BENCH_SAMPLE_MS", 20000)) / 1000 + 5;
    let flood = std::env::var("BENCH_FLOOD").map_err(|_| "BENCH_FLOOD is not set".to_string())?;
    let job = wb_proc::KillOnCloseJob::new().map_err(|e| e.to_string())?;
    // One sender thread; with BENCH_COALESCE_MS it merges each terminal's chunks so fewer IPC messages go out.
    let (outbound, inbound) = std::sync::mpsc::channel::<(u32, u64, Vec<u8>)>();
    let coalesce = env_num("BENCH_COALESCE_MS", 0);
    std::thread::spawn(move || {
        let send = |id: u32, t0: u64, bytes: &[u8]| {
            let mut frame = Vec::with_capacity(12 + bytes.len());
            frame.extend_from_slice(&id.to_le_bytes());
            frame.extend_from_slice(&t0.to_le_bytes());
            frame.extend_from_slice(bytes);
            let _ = channel.send(InvokeResponseBody::Raw(frame));
        };
        if coalesce == 0 {
            while let Ok((id, t0, bytes)) = inbound.recv() {
                send(id, t0, &bytes);
            }
            return;
        }
        while let Ok(first) = inbound.recv() {
            let mut pending: HashMap<u32, (u64, Vec<u8>)> = HashMap::new();
            pending.insert(first.0, (first.1, first.2));
            let end = std::time::Instant::now() + std::time::Duration::from_millis(coalesce);
            while let Some(left) = end.checked_duration_since(std::time::Instant::now()) {
                match inbound.recv_timeout(left) {
                    Ok((id, t0, bytes)) => pending.entry(id).or_insert((t0, Vec::new())).1.extend_from_slice(&bytes),
                    Err(_) => break,
                }
            }
            for (id, (t0, bytes)) in pending {
                send(id, t0, &bytes);
            }
        }
    });
    for id in 0..n {
        let hub = app.hub.clone();
        let tx = outbound.clone();
        let session = PtySession::spawn(
            PtyOptions {
                program: "node".into(),
                args: vec![flood.clone(), rate.to_string(), seconds.to_string()],
                cwd: None,
                cols: 80,
                rows: 24,
                scrollback: 2000,
                credit: CREDIT,
            },
            move |bytes: &[u8]| {
                let _ = tx.send((id, now_ms(), bytes.to_vec()));
                hub.publish(id, bytes);
            },
        )
        .map_err(|e| e.to_string())?;
        if let Some(pid) = session.pid() {
            let _ = job.assign(pid);
        }
        app.sessions.lock().unwrap().insert(id, Arc::new(session));
    }
    *app.job.lock().unwrap() = Some(job);
    Ok(())
}

#[tauri::command]
fn ack(app: State<'_, App>, id: u32, n: i64) {
    if let Some(s) = app.sessions.lock().unwrap().get(&id) {
        s.add_credit(n);
    }
}

#[tauri::command]
fn ping() -> u32 {
    1
}

#[tauri::command]
fn fail(app: tauri::AppHandle, message: String) {
    let _ = std::fs::write(std::env::var("BENCH_OUT").unwrap_or_else(|_| "bench-error.txt".into()), format!("{{\"error\":{message:?}}}"));
    app.exit(1);
}

#[tauri::command]
fn finish(app: tauri::AppHandle, state: State<'_, App>, report: String) {
    let mem = std::process::Command::new("powershell.exe")
        .args(["-NoProfile", "-ExecutionPolicy", "Bypass", "-File"])
        .arg(std::env::var("BENCH_MEM").unwrap_or_default())
        .arg(std::process::id().to_string())
        .output()
        .ok()
        .and_then(|o| serde_json::from_slice::<serde_json::Value>(&o.stdout).ok())
        .unwrap_or(serde_json::Value::Null);
    let mut out: serde_json::Value = serde_json::from_str(&report).unwrap_or_default();
    out["shell"] = "tauri".into();
    out["rate_kib_s"] = (env_num("BENCH_RATE", 256 * 1024) / 1024).into();
    out["memory"] = mem;
    out["credit_stalls"] = state.sessions.lock().unwrap().values().map(|s| s.stalls()).sum::<u64>().into();
    if let Some(path) = std::env::var_os("BENCH_OUT") {
        let _ = std::fs::write(path, serde_json::to_string(&out).unwrap());
    }
    app.exit(0);
}

/// Tauri has no <webview> tag; a child webview is the candidate replacement. Reports what really happens.
// async on purpose: creating a webview inside a sync command deadlocks on Windows (hung in testing, rc=124).
#[tauri::command]
async fn child_webview(app: tauri::AppHandle, url: String) -> Result<String, String> {
    let parsed: tauri::Url = url.parse().map_err(|e| format!("{e}"))?;
    let window = app.get_window("main").ok_or("no window")?;
    let log = std::env::var("BENCH_WEBVIEW_LOG").unwrap_or_default();
    let builder = tauri::webview::WebviewBuilder::new("child", WebviewUrl::External(parsed)).on_page_load(move |wv, payload| {
        if !log.is_empty() {
            let line = format!("{:?} {}\n", payload.event(), wv.url().map(|u| u.to_string()).unwrap_or_default());
            let _ = std::fs::OpenOptions::new().create(true).append(true).open(&log).map(|mut f| std::io::Write::write_all(&mut f, line.as_bytes()));
        }
    });
    window
        .add_child(builder, tauri::LogicalPosition::new(0.0, 400.0), tauri::LogicalSize::new(1280.0, 400.0))
        .map(|w| w.label().to_string())
        .map_err(|e| e.to_string())
}

/// WebSocket path for phone-style clients: snapshot first, then a live stream; lagging gets a fresh snapshot.
fn serve_phone(app: tauri::AppHandle, hub: Arc<Hub>, port: u16) {
    let Ok(listener) = TcpListener::bind(("127.0.0.1", port)) else { return };
    for stream in listener.incoming().flatten() {
        let app = app.clone();
        let hub = hub.clone();
        std::thread::spawn(move || {
            let Ok(mut ws) = tungstenite::accept(stream) else { return };
            let Ok(tungstenite::Message::Text(first)) = ws.read() else { return };
            let term: u32 = first.as_str().trim().parse().unwrap_or(0);
            let (tx, rx): (SyncSender<Vec<u8>>, Receiver<Vec<u8>>) = sync_channel(PHONE_QUEUE);
            let lagged = Arc::new(Mutex::new(false));
            hub.clients.lock().unwrap().push(Client { term, tx, lagged: lagged.clone() });
            let session = app.state::<App>().sessions.lock().unwrap().get(&term).cloned();
            let Some(session) = session else { return };
            if ws.send(tungstenite::Message::binary(session.snapshot())).is_err() {
                return;
            }
            let mut resyncs = 0u32;
            while let Ok(chunk) = rx.recv() {
                if ws.send(tungstenite::Message::binary(chunk)).is_err() {
                    return;
                }
                if std::mem::take(&mut *lagged.lock().unwrap()) {
                    // Queue overflowed: what is queued no longer lines up. Drop it and send the current screen.
                    while rx.try_recv().is_ok() {}
                    resyncs += 1;
                    if ws.send(tungstenite::Message::text(format!("resync {resyncs}"))).is_err() || ws.send(tungstenite::Message::binary(session.snapshot())).is_err() {
                        return;
                    }
                }
            }
        });
    }
}

fn main() {
    tauri::Builder::default()
        .manage(App::default())
        .invoke_handler(tauri::generate_handler![config, start, ack, ping, fail, finish, child_webview])
        .setup(|app| {
            let handle = app.handle().clone();
            let hub = app.state::<App>().hub.clone();
            let port = env_num("BENCH_PHONE_PORT", 0) as u16;
            if port != 0 {
                std::thread::spawn(move || serve_phone(handle, hub, port));
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("run prototype");
}
