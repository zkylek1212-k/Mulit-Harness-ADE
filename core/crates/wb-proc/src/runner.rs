//! One headless CLI run: prompt on stdin, bounded output, timeout and cancel take the whole tree down.
//! Mirrors `runProcess` in `src/main/cowork/runner.ts`.
use std::io::{Read, Write};
use std::process::{Command, Stdio};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};

use crate::launch::launch_plan;

#[derive(Clone, Default)]
pub struct CancelToken(Arc<AtomicBool>);

impl CancelToken {
    pub fn cancel(&self) {
        self.0.store(true, Ordering::SeqCst);
    }
    pub fn is_cancelled(&self) -> bool {
        self.0.load(Ordering::SeqCst)
    }
}

pub struct RunSpec {
    pub command: String,
    pub args: Vec<String>,
    pub cwd: String,
    pub stdin: String,
    pub timeout_ms: u64,
    /// Each of stdout and stderr; going over stops the process.
    pub max_bytes: usize,
    pub env: Vec<(String, String)>,
}

#[derive(Debug, Default, serde::Serialize)]
pub struct RunResult {
    pub code: Option<i32>,
    pub stdout: String,
    pub stderr: String,
    pub timed_out: bool,
    pub cancelled: bool,
    pub truncated: bool,
    pub ms: u64,
    pub spawn_error: Option<String>,
}

#[cfg(windows)]
pub fn kill_tree(pid: u32) {
    use std::os::windows::process::CommandExt;
    const CREATE_NO_WINDOW: u32 = 0x0800_0000;
    let _ = Command::new("taskkill").args(["/PID", &pid.to_string(), "/T", "/F"]).creation_flags(CREATE_NO_WINDOW).stdout(Stdio::null()).stderr(Stdio::null()).status();
}

#[cfg(not(windows))]
pub fn kill_tree(pid: u32) {
    let _ = Command::new("kill").args(["-KILL", &format!("-{pid}")]).status();
}

fn pump(mut from: impl Read + Send + 'static, max: usize, over: Arc<AtomicBool>) -> std::thread::JoinHandle<Vec<u8>> {
    std::thread::spawn(move || {
        let mut out = Vec::new();
        let mut buf = [0u8; 16 * 1024];
        while let Ok(n) = from.read(&mut buf) {
            if n == 0 {
                break;
            }
            if out.len() + n > max {
                over.store(true, Ordering::SeqCst);
                continue; // keep draining so the child never blocks on a full pipe
            }
            out.extend_from_slice(&buf[..n]);
        }
        out
    })
}

pub fn run_process(spec: &RunSpec, cancel: &CancelToken) -> RunResult {
    let t0 = Instant::now();
    let plan = match launch_plan(&spec.command, &spec.args, cfg!(windows)) {
        Ok(p) => p,
        Err(e) => return RunResult { spawn_error: Some(e), ..Default::default() },
    };
    let mut c = Command::new(&plan.file);
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x0800_0000;
        c.creation_flags(CREATE_NO_WINDOW);
        if plan.verbatim {
            c.raw_arg(plan.args.join(" "));
        } else {
            c.args(&plan.args);
        }
    }
    #[cfg(not(windows))]
    {
        use std::os::unix::process::CommandExt;
        c.args(&plan.args);
        c.process_group(0);
    }
    c.current_dir(&spec.cwd).stdin(Stdio::piped()).stdout(Stdio::piped()).stderr(Stdio::piped());
    for (k, v) in &spec.env {
        c.env(k, v);
    }
    let mut child = match c.spawn() {
        Ok(ch) => ch,
        Err(e) => return RunResult { spawn_error: Some(e.to_string()), ms: t0.elapsed().as_millis() as u64, ..Default::default() },
    };
    // Writing stdin can fail if the process dies at once; that must not take the host down.
    let stdin = child.stdin.take();
    let input = spec.stdin.clone();
    let writer = std::thread::spawn(move || {
        if let Some(mut s) = stdin {
            let _ = s.write_all(input.as_bytes());
        }
    });
    let over = Arc::new(AtomicBool::new(false));
    let out = pump(child.stdout.take().unwrap(), spec.max_bytes, over.clone());
    let err = pump(child.stderr.take().unwrap(), spec.max_bytes, over.clone());

    let child = Arc::new(Mutex::new(child));
    let pid = child.lock().unwrap().id();
    let deadline = Duration::from_millis(spec.timeout_ms);
    let (mut timed_out, mut cancelled, mut truncated) = (false, false, false);
    let mut stopped = false;
    let code = loop {
        if let Ok(Some(status)) = child.lock().unwrap().try_wait() {
            break status.code();
        }
        if !stopped {
            if t0.elapsed() >= deadline {
                timed_out = true;
                stopped = true;
            } else if cancel.is_cancelled() {
                cancelled = true;
                stopped = true;
            } else if over.load(Ordering::SeqCst) {
                truncated = true;
                stopped = true;
            }
            if stopped {
                kill_tree(pid);
            }
        }
        std::thread::sleep(Duration::from_millis(10));
    };
    let _ = writer.join();
    let stdout = String::from_utf8_lossy(&out.join().unwrap_or_default()).into_owned();
    let stderr = String::from_utf8_lossy(&err.join().unwrap_or_default()).into_owned();
    RunResult { code, stdout, stderr, timed_out, cancelled, truncated: truncated || over.load(Ordering::SeqCst), ms: t0.elapsed().as_millis() as u64, spawn_error: None }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn node(script: &str, stdin: &str, timeout_ms: u64, max_bytes: usize) -> RunSpec {
        RunSpec {
            command: if cfg!(windows) { "node.exe".into() } else { "node".into() },
            args: vec!["-e".into(), script.into()],
            cwd: std::env::temp_dir().to_string_lossy().into_owned(),
            stdin: stdin.into(),
            timeout_ms,
            max_bytes,
            env: vec![],
        }
    }

    #[test]
    fn echoes_stdin_with_unicode_and_percent() {
        let s = node("process.stdin.pipe(process.stdout)", "中文 \"quotes\" %PATH%\nline2", 20000, 1_000_000);
        let r = run_process(&s, &CancelToken::default());
        assert_eq!(r.code, Some(0), "{r:?}");
        assert_eq!(r.stdout, "中文 \"quotes\" %PATH%\nline2");
    }

    #[test]
    fn exit_code_and_stderr() {
        let r = run_process(&node("console.error('boom');process.exit(3)", "", 20000, 1_000_000), &CancelToken::default());
        assert_eq!(r.code, Some(3));
        assert!(r.stderr.contains("boom"));
    }

    #[test]
    fn timeout_kills() {
        let r = run_process(&node("setInterval(()=>{},1000)", "", 300, 1_000_000), &CancelToken::default());
        assert!(r.timed_out);
        assert!(r.ms < 15_000);
    }

    #[test]
    fn cancel_kills() {
        let c = CancelToken::default();
        let c2 = c.clone();
        std::thread::spawn(move || {
            std::thread::sleep(Duration::from_millis(300));
            c2.cancel();
        });
        let r = run_process(&node("setInterval(()=>{},1000)", "", 30000, 1_000_000), &c);
        assert!(r.cancelled);
    }

    #[test]
    fn too_much_output_stops_it() {
        let r = run_process(&node("setInterval(()=>process.stdout.write('x'.repeat(65536)),1)", "", 30000, 200_000), &CancelToken::default());
        assert!(r.truncated, "{:?}", r.code);
        assert!(r.stdout.len() <= 200_000);
    }

    #[test]
    fn missing_executable_is_reported() {
        let mut s = node("", "", 1000, 100);
        s.command = "definitely-not-a-command-xyz".into();
        assert!(run_process(&s, &CancelToken::default()).spawn_error.is_some());
    }

    #[test]
    fn unsafe_cmd_argument_is_refused_before_spawning() {
        let mut s = node("", "", 1000, 100);
        s.command = "C:/missing/tool.cmd".into();
        s.args = vec!["100%".into()];
        if cfg!(windows) {
            assert!(run_process(&s, &CancelToken::default()).spawn_error.unwrap().contains("refusing"));
        }
    }
}
