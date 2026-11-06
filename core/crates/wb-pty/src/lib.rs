//! PTY session: a reader thread, a headless mirror, and credit-based flow control.
//! Tauri's docs promise ordered Channels but say nothing about backpressure, so the app does it:
//! the reader stops pulling from the PTY when the consumer has not returned credit.
use std::io::{Read, Write};
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::{Arc, Condvar, Mutex};

use portable_pty::{native_pty_system, Child, CommandBuilder, MasterPty, PtySize};

const DSR_QUERY: &[u8] = b"\x1b[6n";

fn contains(hay: &[u8], needle: &[u8]) -> bool {
    hay.windows(needle.len()).any(|w| w == needle)
}

pub struct PtyOptions {
    pub program: String,
    pub args: Vec<String>,
    pub cwd: Option<String>,
    pub cols: u16,
    pub rows: u16,
    pub scrollback: usize,
    /// Bytes the consumer may hold before the reader waits.
    pub credit: i64,
}

pub struct PtySession {
    master: Mutex<Box<dyn MasterPty + Send>>,
    writer: Arc<Mutex<Box<dyn Write + Send>>>,
    child: Mutex<Box<dyn Child + Send + Sync>>,
    mirror: Arc<Mutex<vt100::Parser>>,
    credit: Arc<(Mutex<i64>, Condvar)>,
    stalls: Arc<AtomicU64>,
}

impl PtySession {
    pub fn spawn(o: PtyOptions, mut on_data: impl FnMut(&[u8]) + Send + 'static) -> Result<Self, String> {
        let pair = native_pty_system()
            .openpty(PtySize { rows: o.rows, cols: o.cols, pixel_width: 0, pixel_height: 0 })
            .map_err(|e| e.to_string())?;
        let mut cmd = CommandBuilder::new(&o.program);
        cmd.args(&o.args);
        if let Some(cwd) = &o.cwd {
            cmd.cwd(cwd);
        }
        let child = pair.slave.spawn_command(cmd).map_err(|e| e.to_string())?;
        drop(pair.slave);
        let mut reader = pair.master.try_clone_reader().map_err(|e| e.to_string())?;
        let writer = Arc::new(Mutex::new(pair.master.take_writer().map_err(|e| e.to_string())?));
        let mirror = Arc::new(Mutex::new(vt100::Parser::new(o.rows, o.cols, o.scrollback)));
        let credit = Arc::new((Mutex::new(o.credit), Condvar::new()));
        let stalls = Arc::new(AtomicU64::new(0));

        let (mirror2, credit2, stalls2, writer2) = (mirror.clone(), credit.clone(), stalls.clone(), writer.clone());
        std::thread::spawn(move || {
            let mut buf = vec![0u8; 64 * 1024];
            let mut answered_startup_query = false;
            loop {
                {
                    let (lock, cv) = &*credit2;
                    let mut left = lock.lock().unwrap();
                    if *left <= 0 {
                        stalls2.fetch_add(1, Ordering::Relaxed);
                        while *left <= 0 {
                            left = cv.wait(left).unwrap();
                        }
                    }
                }
                let n = match reader.read(&mut buf) {
                    Ok(0) | Err(_) => break,
                    Ok(n) => n,
                };
                // portable-pty asks ConPTY to inherit the cursor, so conhost sends ESC[6n and produces no output until
                // it gets an answer. Answer that first one here; later queries belong to the terminal front end.
                if !answered_startup_query && contains(&buf[..n], DSR_QUERY) {
                    answered_startup_query = true;
                    let _ = writer2.lock().unwrap().write_all(b"\x1b[1;1R");
                }
                mirror2.lock().unwrap().process(&buf[..n]);
                *credit2.0.lock().unwrap() -= n as i64;
                on_data(&buf[..n]);
            }
        });
        Ok(Self { master: Mutex::new(pair.master), writer, child: Mutex::new(child), mirror, credit, stalls })
    }

    pub fn add_credit(&self, n: i64) {
        let (lock, cv) = &*self.credit;
        *lock.lock().unwrap() += n;
        cv.notify_all();
    }

    pub fn write(&self, data: &[u8]) -> std::io::Result<()> {
        self.writer.lock().unwrap().write_all(data)
    }

    pub fn resize(&self, cols: u16, rows: u16) -> Result<(), String> {
        self.master.lock().unwrap().resize(PtySize { rows, cols, pixel_width: 0, pixel_height: 0 }).map_err(|e| e.to_string())?;
        self.mirror.lock().unwrap().screen_mut().set_size(rows, cols);
        Ok(())
    }

    pub fn pid(&self) -> Option<u32> {
        self.child.lock().unwrap().process_id()
    }

    pub fn kill(&self) -> std::io::Result<()> {
        self.child.lock().unwrap().kill()
    }

    pub fn stalls(&self) -> u64 {
        self.stalls.load(Ordering::Relaxed)
    }

    /// Bytes that redraw the current screen, for a client attaching or catching up.
    pub fn snapshot(&self) -> Vec<u8> {
        self.mirror.lock().unwrap().screen().contents_formatted()
    }

    /// Visible text only, the same input as `readApprovalScreen`.
    pub fn screen_text(&self) -> String {
        let mirror = self.mirror.lock().unwrap();
        let (_, cols) = mirror.screen().size();
        screen_rows(mirror.screen(), cols).join("
")
    }
}

/// Mirror without a PTY: for comparing against @xterm/headless on recorded bytes.
pub fn mirror_text(bytes: &[u8], cols: u16, rows: u16) -> String {
    let mut p = vt100::Parser::new(rows, cols, 0);
    p.process(bytes);
    screen_rows(p.screen(), cols).join("
")
}

/// One string per visible row, like `readApprovalScreen`. `contents()` joins wrapped rows, so it cannot be used for this.
fn screen_rows(screen: &vt100::Screen, cols: u16) -> Vec<String> {
    screen.rows(0, cols).collect()
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::mpsc::channel;
    use std::time::Duration;

    #[test]
    fn mirror_handles_ansi_and_cursor() {
        let text = mirror_text(b"\x1b[32mhello\x1b[0m\r\nworld\x1b[1;3HX", 20, 4);
        assert!(text.starts_with("heXlo"), "{text:?}");
        assert!(text.contains("world"));
    }

    #[test]
    fn credit_stops_the_reader_until_returned() {
        // ConPTY only forwards screen changes, so the output has to keep changing over time, like a real agent.
        let (tx, rx) = channel::<usize>();
        let node = if cfg!(windows) { "node.exe" } else { "node" };
        let session = PtySession::spawn(
            PtyOptions {
                program: node.into(),
                args: vec!["-e".into(), "let i=0;setInterval(()=>console.log('line '+(i++)+' '+'x'.repeat(60)),2)".into()],
                cwd: None,
                cols: 80,
                rows: 24,
                scrollback: 0,
                credit: 4096,
            },
            move |b: &[u8]| {
                let _ = tx.send(b.len());
            },
        )
        .unwrap();
        let drain = |ms: u64| {
            let end = std::time::Instant::now() + Duration::from_millis(ms);
            let mut got = 0;
            while let Some(left) = end.checked_duration_since(std::time::Instant::now()) {
                if let Ok(n) = rx.recv_timeout(left) {
                    got += n;
                }
            }
            got
        };
        let first = drain(1500);
        assert!(first >= 4096, "should reach the credit limit, got {first}");
        assert!(first <= 4096 + 64 * 1024, "reader kept going past its credit: {first}");
        assert!(session.stalls() >= 1, "reader should have stopped");
        assert_eq!(drain(400), 0, "nothing flows without credit");
        session.add_credit(1024 * 1024);
        assert!(drain(800) > 0, "returned credit resumes reading");
        let _ = session.kill();
    }

    #[test]
    fn snapshot_redraws_the_same_screen() {
        let mut a = vt100::Parser::new(5, 40, 0);
        a.process(b"\x1b[31mred\x1b[0m\r\nline two\x1b[3;5Hthree");
        let snap = a.screen().contents_formatted();
        let mut b = vt100::Parser::new(5, 40, 0);
        b.process(&snap);
        assert_eq!(a.screen().contents(), b.screen().contents());
    }
}
