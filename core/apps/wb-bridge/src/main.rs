// Rust core behind Electron during the migration. stdout carries protocol frames only; diagnostics go to stderr.
//
// Frame: [u8 kind][u32 LE length][payload]
//   kind 1: JSON. Request {id, method, params}; response {id, result} or {id, error: {code, message}}; event {event, ...}
//   kind 2: output of a running process: [u64 LE request id][u8 stream, 0 stdout, 1 stderr][bytes]
//   kind 3: terminal event: [u32 LE session][u8 type][payload]; 0 data, 1 snapshot (JSON), 2 resized (JSON), 3 exit (JSON)
//           These all share one FIFO and are queued under the mirror lock, so a snapshot sits at an exact stream position.
//
// Control frames jump the queue, so a flood of agent output cannot delay a cancel or a response.
// The parent closing stdin ends the bridge, and the job object then ends every agent, including after a crash.
use std::collections::{HashMap, VecDeque};
use std::io::{Read, Write};
use std::path::{Path, PathBuf};
use std::sync::{Arc, Condvar, Mutex};
use std::time::{Duration, Instant};

use serde_json::{json, Value};
use wb_proc::runner::{run_process_with, OutputSink};
use wb_proc::{resolve_command, CancelToken, KillOnCloseJob, Resolved, RunSpec};
use wb_pty::approval::looks_like_approval_prompt;
use wb_pty::{PtyOptions, PtySession};

const PROTOCOL: u32 = 1;
/// Output frames waiting to be written. A slow reader blocks process output, never control.
const MAX_OUTPUT_FRAMES: usize = 256;

#[derive(Default)]
struct Queues {
    control: VecDeque<Vec<u8>>,
    output: VecDeque<Vec<u8>>,
}

#[derive(Clone)]
struct Out(Arc<(Mutex<Queues>, Condvar)>);

fn frame(kind: u8, payload: &[u8]) -> Vec<u8> {
    let mut f = Vec::with_capacity(5 + payload.len());
    f.push(kind);
    f.extend_from_slice(&(payload.len() as u32).to_le_bytes());
    f.extend_from_slice(payload);
    f
}

impl Out {
    fn new() -> Self {
        let out = Self(Arc::new((Mutex::new(Queues::default()), Condvar::new())));
        let writer = out.clone();
        std::thread::spawn(move || {
            let mut stdout = std::io::stdout().lock();
            loop {
                let next = {
                    let (lock, cv) = &*writer.0;
                    let mut q = lock.lock().unwrap();
                    loop {
                        if let Some(f) = q.control.pop_front() {
                            break f;
                        }
                        if let Some(f) = q.output.pop_front() {
                            cv.notify_all();
                            break f;
                        }
                        q = cv.wait(q).unwrap();
                    }
                };
                if stdout.write_all(&next).and_then(|_| stdout.flush()).is_err() {
                    std::process::exit(0); // parent is gone
                }
            }
        });
        out
    }

    fn control(&self, v: &Value) {
        let (lock, cv) = &*self.0;
        lock.lock().unwrap().control.push_back(frame(1, v.to_string().as_bytes()));
        cv.notify_all();
    }

    fn output(&self, id: u64, stream: u8, bytes: &[u8]) {
        let mut payload = Vec::with_capacity(9 + bytes.len());
        payload.extend_from_slice(&id.to_le_bytes());
        payload.push(stream);
        payload.extend_from_slice(bytes);
        let (lock, cv) = &*self.0;
        let mut q = lock.lock().unwrap();
        while q.output.len() >= MAX_OUTPUT_FRAMES {
            q = cv.wait(q).unwrap();
        }
        q.output.push_back(frame(2, &payload));
        cv.notify_all();
    }
}

/// Coalesce output before judging the screen, so a partial redraw is not read as a new question.
const APPROVAL_DEBOUNCE: Duration = Duration::from_millis(120);

struct Terminal {
    session: PtySession,
    /// Output since the last approval check
    dirty: Arc<Mutex<Option<Instant>>>,
    waiting: Mutex<bool>,
}

type Terminals = Arc<Mutex<HashMap<u32, Arc<Terminal>>>>;

impl Out {
    fn pty(&self, sid: u32, kind: u8, payload: &[u8]) {
        let mut body = Vec::with_capacity(5 + payload.len());
        body.extend_from_slice(&sid.to_le_bytes());
        body.push(kind);
        body.extend_from_slice(payload);
        let (lock, cv) = &*self.0;
        let mut q = lock.lock().unwrap();
        while q.output.len() >= MAX_OUTPUT_FRAMES {
            q = cv.wait(q).unwrap();
        }
        q.output.push_back(frame(3, &body));
        cv.notify_all();
    }
}

fn pty_spawn(p: &Value, out: &Out, job: Option<&KillOnCloseJob>, terminals: &Terminals) -> Result<Value, String> {
    let sid = p.get("sid").and_then(Value::as_u64).ok_or("missing sid")? as u32;
    let env = p.get("env").and_then(Value::as_object).map(|m| m.iter().filter_map(|(k, v)| v.as_str().map(|v| (k.clone(), v.to_string()))).collect::<Vec<_>>());
    let num = |k: &str, d: u64| p.get(k).and_then(Value::as_u64).unwrap_or(d);
    let dirty: Arc<Mutex<Option<Instant>>> = Arc::default();
    let (out2, out3, dirty2) = (out.clone(), out.clone(), dirty.clone());
    let opts = PtyOptions {
        program: s(p, "program")?.to_string(),
        args: strings(p, "args"),
        cwd: opt(p, "cwd").map(str::to_string),
        env,
        cols: num("cols", 80) as u16,
        rows: num("rows", 24) as u16,
        scrollback: num("scrollback", 5000) as usize,
        credit: None,
    };
    let session = PtySession::spawn(
        opts,
        move |bytes: &[u8]| {
            *dirty2.lock().unwrap() = Some(Instant::now());
            out2.pty(sid, 0, bytes);
        },
        move |code| out3.pty(sid, 3, json!({ "code": code }).to_string().as_bytes()),
    )?;
    let pid = session.pid();
    if let (Some(j), Some(pid)) = (job, pid) {
        let _ = j.assign(pid);
    }
    terminals.lock().unwrap().insert(sid, Arc::new(Terminal { session, dirty, waiting: Mutex::new(false) }));
    Ok(json!({ "pid": pid }))
}

/// Approval state lives with the mirror. One thread, because this only ever does work for terminals with new output.
fn watch_approvals(out: Out, terminals: Terminals) {
    std::thread::spawn(move || loop {
        std::thread::sleep(Duration::from_millis(40));
        let list: Vec<(u32, Arc<Terminal>)> = terminals.lock().unwrap().iter().map(|(k, v)| (*k, v.clone())).collect();
        for (sid, t) in list {
            let due = {
                let mut d = t.dirty.lock().unwrap();
                match *d {
                    Some(at) if at.elapsed() >= APPROVAL_DEBOUNCE => {
                        *d = None;
                        true
                    }
                    _ => false,
                }
            };
            if !due {
                continue;
            }
            let screen = t.session.screen_text();
            let waiting = looks_like_approval_prompt(&screen);
            let mut last = t.waiting.lock().unwrap();
            if *last != waiting {
                *last = waiting;
                out.control(&json!({ "event": "pty.approval", "sid": sid, "waiting": waiting, "screen": screen }));
            }
        }
    });
}

fn term_of(terminals: &Terminals, p: &Value) -> Result<(u32, Arc<Terminal>), String> {
    let sid = p.get("sid").and_then(Value::as_u64).ok_or("missing sid")? as u32;
    terminals.lock().unwrap().get(&sid).cloned().map(|t| (sid, t)).ok_or_else(|| format!("no terminal {sid}"))
}

struct Sink {
    out: Out,
    id: u64,
}

impl OutputSink for Sink {
    fn on_spawn(&mut self, pid: u32) {
        self.out.control(&json!({ "event": "proc.spawn", "id": self.id, "pid": pid }));
    }
    fn on_output(&mut self, stream: u8, bytes: &[u8]) {
        self.out.output(self.id, stream, bytes);
    }
}

fn s<'a>(p: &'a Value, k: &str) -> Result<&'a str, String> {
    p.get(k).and_then(Value::as_str).ok_or_else(|| format!("missing string param {k}"))
}

fn path(p: &Value, k: &str) -> Result<PathBuf, String> {
    Ok(PathBuf::from(s(p, k)?))
}

fn opt<'a>(p: &'a Value, k: &str) -> Option<&'a str> {
    p.get(k).and_then(Value::as_str).filter(|v| !v.is_empty())
}

fn strings(p: &Value, k: &str) -> Vec<String> {
    p.get(k).and_then(Value::as_array).map(|a| a.iter().filter_map(|v| v.as_str().map(str::to_string)).collect()).unwrap_or_default()
}

fn git_call(method: &str, p: &Value) -> Result<Value, String> {
    use wb_git as g;
    let hooks = opt(p, "hooksDir");
    Ok(match method {
        "git.run" => json!(g::git(&path(p, "cwd")?, &strings(p, "args").iter().map(String::as_str).collect::<Vec<_>>())?),
        "git.readBaseline" => serde_json::to_value(g::read_baseline(&path(p, "dir")?)?).unwrap(),
        "git.createSnapshot" => {
            g::create_snapshot(&path(p, "root")?, &path(p, "dir")?, s(p, "commit")?)?;
            Value::Null
        }
        "git.snapshotChanges" => json!(g::snapshot_changes(&path(p, "dir")?, s(p, "commit")?)?),
        "git.addWorktree" => {
            g::add_worktree(&path(p, "repoRoot")?, &path(p, "dir")?, s(p, "branch")?, s(p, "base")?)?;
            Value::Null
        }
        "git.linkNodeModules" => json!(g::link_node_modules(&path(p, "repoRoot")?, &path(p, "worktree")?)?),
        "git.commitAll" => json!(g::commit_all(&path(p, "dir")?, s(p, "message")?, hooks)?),
        "git.changedFiles" => json!(g::changed_files(&path(p, "dir")?)?),
        "git.revertFiles" => {
            g::revert_files(&path(p, "dir")?, &strings(p, "files"))?;
            Value::Null
        }
        "git.hasChanges" => json!(g::has_changes(&path(p, "dir")?)?),
        "git.cherryPickAll" => serde_json::to_value(g::cherry_pick_all(&path(p, "dir")?, &strings(p, "commits"), hooks)?).unwrap(),
        "git.diffStat" => json!(g::diff_stat(&path(p, "dir")?, s(p, "base")?, s(p, "head")?)?),
        "git.mergeBranch" => serde_json::to_value(g::merge_branch(&path(p, "repoRoot")?, s(p, "expectBranch")?, s(p, "commit")?, s(p, "message")?, hooks)?).unwrap(),
        "git.removeWorktrees" => {
            g::remove_worktrees(&path(p, "repoRoot")?, &path(p, "root")?, &strings(p, "dirs"), opt(p, "worktreeBase"))?;
            Value::Null
        }
        "git.configuredHooksPath" => json!(g::configured_hooks_path(&path(p, "repoRoot")?)),
        "git.exportBaselineHooks" => json!(g::export_baseline_hooks(&path(p, "repoRoot")?, s(p, "commit")?, &path(p, "dest")?)?),
        "git.gitGuardState" => json!(g::git_guard_state(&path(p, "dir")?)?),
        "git.scopeContentHash" => json!(g::scope_content_hash(&path(p, "dir")?, &strings(p, "files"))?),
        "git.patchId" => json!(g::patch_id(&path(p, "dir")?, s(p, "base")?, s(p, "head")?)?),
        "git.diffText" => serde_json::to_value(g::diff_text(&path(p, "dir")?, s(p, "base")?, s(p, "head")?, p.get("maxChars").and_then(Value::as_u64).unwrap_or(200_000) as usize)?).unwrap(),
        "git.changedPaths" => json!(g::changed_paths(&path(p, "dir")?, s(p, "base")?, s(p, "head")?)?),
        "git.treeOf" => json!(g::tree_of(&path(p, "dir")?)?),
        "git.mergeTree" => serde_json::to_value(g::merge_tree(&path(p, "repoRoot")?, s(p, "target")?, s(p, "commit")?)).unwrap(),
        "git.addTreeWorktree" => {
            g::add_tree_worktree(&path(p, "repoRoot")?, &path(p, "dir")?, s(p, "base")?, s(p, "tree")?)?;
            Value::Null
        }
        "git.resetWorktree" => {
            g::reset_worktree(&path(p, "dir")?)?;
            Value::Null
        }
        "git.revParse" => json!(g::rev_parse(&path(p, "cwd")?, s(p, "ref")?)?),
        other => return Err(format!("unknown method {other}")),
    })
}

fn proc_run(id: u64, p: &Value, out: &Out, job: Option<&KillOnCloseJob>, cancel: CancelToken) -> Result<Value, String> {
    let env = p.get("env").and_then(Value::as_object).map(|m| m.iter().filter_map(|(k, v)| v.as_str().map(|v| (k.clone(), v.to_string()))).collect::<Vec<_>>());
    let spec = RunSpec {
        command: s(p, "command")?.to_string(),
        args: strings(p, "args"),
        cwd: s(p, "cwd")?.to_string(),
        stdin: p.get("stdin").and_then(Value::as_str).unwrap_or("").to_string(),
        timeout_ms: p.get("timeoutMs").and_then(Value::as_u64).unwrap_or(60_000),
        max_bytes: p.get("maxBytes").and_then(Value::as_u64).unwrap_or(1 << 25) as usize,
        env,
    };
    let mut sink = Sink { out: out.clone(), id };
    let assign = |pid: u32| {
        if let Some(j) = job {
            let _ = j.assign(pid);
        }
    };
    let r = run_process_with(&spec, &cancel, &mut sink, assign);
    Ok(json!({ "code": r.code, "timedOut": r.timed_out, "cancelled": r.cancelled, "truncated": r.truncated, "ms": r.ms, "spawnError": r.spawn_error }))
}

fn main() {
    // One-shot mode for sync callers: stdin to stdout, nothing logged. Secrets never travel in a frame.
    let argv: Vec<String> = std::env::args().collect();
    if argv.get(1).map(String::as_str) == Some("secret") {
        let mut input = Vec::new();
        std::io::stdin().read_to_end(&mut input).expect("stdin");
        let res = match argv.get(2).map(String::as_str) {
            Some("protect") => wb_secrets::protect(&input),
            Some("unprotect") => wb_secrets::unprotect(&input),
            _ => {
                eprintln!("usage: wb-bridge secret protect|unprotect");
                std::process::exit(2)
            }
        };
        match res {
            Ok(bytes) => std::io::stdout().write_all(&bytes).expect("stdout"),
            Err(e) => {
                eprintln!("{e}");
                std::process::exit(1)
            }
        }
        return;
    }

    let out = Out::new();
    let job = KillOnCloseJob::new().ok().map(Arc::new);
    let running: Arc<Mutex<HashMap<u64, CancelToken>>> = Arc::default();
    let terminals: Terminals = Arc::default();
    watch_approvals(out.clone(), terminals.clone());
    out.control(&json!({ "event": "hello", "protocol": PROTOCOL, "pid": std::process::id() }));

    let mut stdin = std::io::stdin().lock();
    let mut head = [0u8; 5];
    while stdin.read_exact(&mut head).is_ok() {
        let len = u32::from_le_bytes([head[1], head[2], head[3], head[4]]) as usize;
        let mut payload = vec![0u8; len];
        if stdin.read_exact(&mut payload).is_err() {
            break;
        }
        let Ok(msg) = serde_json::from_slice::<Value>(&payload) else {
            eprintln!("wb-bridge: bad frame");
            continue;
        };
        let id = msg.get("id").and_then(Value::as_u64).unwrap_or(0);
        let method = msg.get("method").and_then(Value::as_str).unwrap_or("").to_string();
        let params = msg.get("params").cloned().unwrap_or(Value::Null);
        match method.as_str() {
            "ping" => out.control(&json!({ "id": id, "result": { "protocol": PROTOCOL } })),
            "cancel" => {
                if let Some(c) = running.lock().unwrap().get(&params.get("target").and_then(Value::as_u64).unwrap_or(0)) {
                    c.cancel();
                }
                out.control(&json!({ "id": id, "result": null }));
            }
            "shutdown" => {
                // A clean exit keeps independent programs started from a terminal; a crash kills the whole job.
                if let Some(j) = &job {
                    let _ = j.release();
                }
                out.control(&json!({ "id": id, "result": null }));
                std::thread::sleep(std::time::Duration::from_millis(50));
                std::process::exit(0);
            }
            // Terminal calls run in arrival order on this thread: a write must not overtake the one before it.
            "pty.spawn" => {
                let r = pty_spawn(&params, &out, job.as_deref(), &terminals);
                out.control(&match r {
                    Ok(v) => json!({ "id": id, "result": v }),
                    Err(e) => json!({ "id": id, "error": { "code": "core-error", "message": e } }),
                });
            }
            "pty.write" => {
                if let Ok((_, t)) = term_of(&terminals, &params) {
                    let _ = t.session.write(params.get("data").and_then(Value::as_str).unwrap_or("").as_bytes());
                }
            }
            "pty.resize" => {
                if let Ok((sid, t)) = term_of(&terminals, &params) {
                    let cols = params.get("cols").and_then(Value::as_u64).unwrap_or(80) as u16;
                    let rows = params.get("rows").and_then(Value::as_u64).unwrap_or(24) as u16;
                    let prelude = params.get("prelude").and_then(Value::as_str).unwrap_or("");
                    let o = out.clone();
                    let _ = t.session.resize_ordered(cols, rows, prelude.as_bytes(), |bytes| {
                        if !bytes.is_empty() {
                            o.pty(sid, 0, bytes);
                        }
                        o.pty(sid, 2, json!({ "cols": cols, "rows": rows }).to_string().as_bytes());
                    });
                    *t.dirty.lock().unwrap() = Some(Instant::now());
                }
            }
            "pty.attach" => {
                match term_of(&terminals, &params) {
                    Ok((sid, t)) => {
                        let scrollback = params.get("scrollback").and_then(Value::as_u64).unwrap_or(5000) as usize;
                        let o = out.clone();
                        // Queued under the mirror lock: this is the exact point in the stream the snapshot describes.
                        t.session.with_mirror(|m| {
                            let (cols, rows) = m.size();
                            o.pty(sid, 1, json!({ "req": id, "cols": cols, "rows": rows, "data": m.serialize(scrollback) }).to_string().as_bytes());
                        });
                        out.control(&json!({ "id": id, "result": null }));
                    }
                    Err(e) => out.control(&json!({ "id": id, "error": { "code": "core-error", "message": e } })),
                }
            }
            "pty.kill" => {
                if let Ok((_, t)) = term_of(&terminals, &params) {
                    if let Some(pid) = t.session.pid() {
                        wb_proc::runner::kill_tree(pid);
                    }
                    let _ = t.session.kill();
                }
            }
            "pty.forget" => {
                if let Some(sid) = params.get("sid").and_then(Value::as_u64) {
                    terminals.lock().unwrap().remove(&(sid as u32));
                }
            }
            "pty.looksLikeApproval" => {
                out.control(&json!({ "id": id, "result": looks_like_approval_prompt(params.get("screen").and_then(Value::as_str).unwrap_or("")) }));
            }
            "resolveCommand" => {
                let cwd = path(&params, "cwd").unwrap_or_default();
                let cmd = params.get("command").and_then(Value::as_str).unwrap_or("");
                let v = match resolve_command(cmd, Path::new(&cwd)) {
                    Resolved::Path(p) => json!({ "resolved": p }),
                    Resolved::Error(e) => json!({ "error": e }),
                };
                out.control(&json!({ "id": id, "result": v }));
            }
            _ => {
                let (out2, job2, running2) = (out.clone(), job.clone(), running.clone());
                std::thread::spawn(move || {
                    let res = if method == "proc.run" {
                        let cancel = CancelToken::default();
                        running2.lock().unwrap().insert(id, cancel.clone());
                        let r = proc_run(id, &params, &out2, job2.as_deref(), cancel);
                        running2.lock().unwrap().remove(&id);
                        r
                    } else {
                        git_call(&method, &params)
                    };
                    out2.control(&match res {
                        Ok(v) => json!({ "id": id, "result": v }),
                        Err(e) => json!({ "id": id, "error": { "code": "core-error", "message": e } }),
                    });
                });
            }
        }
    }
    // stdin closed: the parent is gone. Exiting closes the job handle, which ends every agent.
    std::process::exit(0);
}
