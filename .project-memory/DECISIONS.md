# Architecture Decisions

## Quick Index
| ID | Title | Date | Status | Supersedes |
|---|---|---|---|---|
| DEC-001 | Shared memory is versioned in Git | <YYYY-MM-DD> | Accepted | - |
| DEC-002 | Dashboard 的會話 active 狀態由 renderer 提供，不在 main 端推斷 | 2026-09-15 | Accepted | - |
| DEC-003 | 保留 main 的 mtime 推斷以涵蓋 App 外部的 CLI；誤判由 renderer 修正 | 2026-09-15 | Accepted | 補充 DEC-002 |
| DEC-004 | 桌面擁有共用 PTY 尺寸，手機以原生捲動讀取 | 2026-10-02 | Accepted | - |
| DEC-005 | 手機端終端 Canvas Scale-to-Fit 消除水平捲動並保留 1:1 ANSI 座標 | 2026-10-02 | Accepted | 補充 DEC-004 |
| DEC-006 | 桌面座標解析 ANSI，手機文字以可讀字級換行 | 2026-10-02 | Accepted | DEC-005 |
| DEC-007 | 終端跨 Agent 歷史回溯 —— Codex 注入 `--no-alt-screen`，Claude Code 轉換清螢幕保留卷軸 | 2026-10-05 | Accepted | 補充 DEC-006 |
| DEC-008 | Cowork separates public discussion from project planning | 2026-10-08 | Accepted | - |
| DEC-009 | Cowork multi-tabs allow concurrent planning with exclusive execution | 2026-10-08 | Accepted | supplements DEC-008 |
| DEC-010 | Cowork persists cumulative recorder checkpoints before chair conclusion | 2026-10-08 | Accepted | supplements DEC-008 |

---

## DEC-001: Shared memory is versioned in Git
- Date: <YYYY-MM-DD>
- Status: Accepted
- Decision: Store canonical cross-agent memory in `.project-memory/` and sync it through Git.
- Reason: Claude Code, Codex and Antigravity all read the same repository files.
- Consequence: Memory changes are reviewed and committed alongside engineering work.

## DEC-002: Dashboard 的會話 active 狀態由 renderer 提供，不在 main 端推斷
- Date: 2026-09-15
- Status: Accepted
- Decision: 「這個 Agent 會話正在跑」以 renderer 的終端分頁狀態為準——
  `TerminalPanel` 把未 exit 且帶 `associatedSessionId` 的會話 id 寫進 store 的
  `liveAgentSessionIds`，`DashboardPanel` 直接把這些卡片標成 `active`，覆寫 main 端結果。
- Reason: main 端原本靠「PTY meta 比對 ＋ `.jsonl` mtime 時窗」兩層啟發式回推，兩層都是猜的，
  任一層失準（PTY meta 抓不到、Windows 目錄 mtime 不更新、resume 寫進不同檔案）卡片就跳回
  completed。這個事實本來就在 renderer 手上，不需要繞一圈重建。
- Consequence:
  - main 的 `dashboard.ts` PTY 比對（優先 1–4）退居 fallback，只服務終端手動開、
    沒有 `associatedSessionId` 的 standalone 卡片；**要動那段前先確認它還活著**。
  - 終端彈成獨立視窗時 store 不跨 window，該視窗退回舊推斷邏輯。
  - 頂端 `activeSessions` 計數仍是 main 的數字，可能與卡片差一個。

## DEC-003: 保留 main 的 mtime 推斷以涵蓋 App 外部的 CLI；誤判由 renderer 修正
- Date: 2026-09-15
- Status: Accepted（補充 DEC-002，非取代）
- Decision: main 端「日誌 mtime 夠新 → active」的推斷**保留不動**。它造成的誤判
  （會話剛從終端關掉、mtime 仍是幾秒前 → 卡在 active）由 renderer 的
  `closedAgentSessions`（會話 id → 關閉時間戳）壓成 idle；若關閉後日誌又被寫入，
  標記失效、回歸 main 的判斷。
- Reason: 曾提議讓 mtime 永不回傳 'active'（只回 idle / completed），**使用者明確否決**：
  Dashboard 要能顯示「在 Agent Workbench 外面自己跑的 CLI」，而 mtime 是唯一線索。
  DEC-002 的 renderer 事實只涵蓋 App 內開的分頁，砍掉 mtime 等於砍掉外部會話的可見性。
- Consequence:
  - 兩個來源分工：renderer 管「App 內開的」（開 → active、關 → idle），
    main 的 mtime 管「App 外跑的」。
  - 代價是 App 外部會話的 active 仍是推測，仍可能在對方結束後短暫殘留——可接受。
  - 5 秒寬限是為了 CLI 收工時常會再補寫最後一筆日誌。

<!--
新決策取代舊的:在上方 Quick Index 追加一列並填 Supersedes,
下方追加新章節。永遠不要改寫或刪除既有決策。
-->

## DEC-004: 桌面擁有共用 PTY 尺寸，手機以原生捲動讀取
- Date: 2026-10-02
- Status: Accepted
- Decision: 手機保留桌面 PTY 的 ANSI 欄／列座標；Remote Bridge 忽略手機 resize（含舊頁面），不再於離開時還原過期尺寸。
- Reason: 一個 PTY 只有一份尺寸；手機縮窄會讓 CLI 重畫，而桌面 xterm 仍用桌面座標解讀，導致版面錯亂。
- Consequence: 手機以單一原生捲動區查看歷史及超寬內容；不能靠改小共用 PTY 讓 CLI 在手機寬度排版。仍需實體手機與 alternate-screen CLI 驗證。

## DEC-005: 手機端終端 Canvas Scale-to-Fit 消除水平捲動並保留 1:1 ANSI 座標
- Date: 2026-10-02
- Status: Accepted（補充 DEC-004）
- Decision: 手機端終端機不使用 FitAddon 重新計算 columns（保留 120/160 列 1:1 幾何），改以 CSS `transform: scale(scale)` 將終端 Canvas 依比例縮放至手機容器寬度，並透過 `.xterm-scaler-box` 與外層 `.xterm-scroll` 提供純垂直的原生滑動與歷史紀錄查閱。
- Reason: CLI 工具（如 Claude Code / Antigravity）常使用 ANSI 游標相對定址（如 `\x1b[2A`）重繪進度條與狀態列，並畫出 120 字元長的分隔線。若手機端改變 columns（如 45 列），分隔線會折成 3 行，游標跳躍行數失準導致文字重疊錯亂；而雙軸自由滾動又會導致左右晃動影響體驗。Canvas Scale-to-Fit 完美保留完整 ANSI 畫面且無需左右滾動。
- Consequence: 手機畫面文字以等比例縮放呈現，無水平滾動條；垂直捲動透過 `.xterm-scroll` 映射緩衝區行數（`term.scrollToLine`），查閱歷史順暢穩定。

## DEC-006: 桌面座標解析 ANSI，手機文字以可讀字級換行
- Date: 2026-10-02
- Status: Accepted（取代 DEC-005；保留 DEC-004 的桌面 PTY 尺寸權責）
- Decision: 使用現有 xterm 解析器保留桌面欄／列座標，不掛載或縮放 xterm DOM；從解析後的 buffer 產生原生文字行，保留 ANSI 色彩、文字樣式及游標，以 13px 字級依手機寬度換行。手機只提供原生垂直捲動。
- Reason: 使用者回報 `phone view_bug1.png` 的字被縮到無法閱讀，以及切換後 `phone view_bug2.png` 的殘缺畫面，並明確要求「一定不要左右滑動，我只接受上下滑動」。改變解析器欄數仍會破壞 ANSI 相對座標，因此只對解析後的顯示文字換行。
- Consequence: 桌面 soft-wrap 在手機顯示前合併；純分隔線限制為一行；文字由 React 安全轉義，無 HTML 注入。桌面尺寸更新不再重建解析器，snapshot/resized 訊息負責更新尺寸。保留 5000 行上限及每 120ms 合併刷新；若實測效能不足再做增量更新。這是可讀文字呈現，不保證完整 TUI 的像素／表格排版與桌面一致。

## DEC-007: 終端跨 Agent 歷史回溯 —— Codex 注入 `--no-alt-screen`，Claude Code 轉換清螢幕保留卷軸
- Date: 2026-10-05
- Status: Accepted（補充 DEC-006）
- Decision:
  1. **Codex CLI**：在 `pty.ts` 中由 `applyAgentDefaultArgs` 自動注入 `--no-alt-screen`，關閉備用螢幕緩衝區，改為 inline 串流輸出模式，完整保留 xterm scrollback 歷史。
  2. **Claude Code CLI**：在手機端 `TerminalView.tsx` 透過 `ClaudeHistoryStream` 攔截 `\x1b[2J\x1b[H`（清螢幕＋游標回頂端），將其轉換為推進換行與回合分隔線（`─`），使前幾回合的內容自動推入 scrollback 緩衝區而非被擦除抹滅。手機端輸入管道（`send('\r')` / `writePty`）完全不受影響。
- Reason: 使用者回報在手機端只有 Antigravity 可以向上滑動查看歷史交談，而 Claude Code 只能顯示電腦端目前的一頁，且 Codex 預設亦無 scrollback。這是因為 Codex 預設進備用螢幕、Claude 頻繁呼叫 `\x1b[2J` 擦除螢幕。
- Consequence: 三大 Agent（Antigravity, Codex, Claude Code）在手機端與桌面端終端均具備完整的縱向歷史滾動能力，隨時可向上滑動回顧多回合交談紀錄與工具產出。

## DEC-008: Cowork separates public discussion from project planning
- Date: 2026-10-08
- Status: Accepted (user authorized implementation)
- Decision: Discussion uses sequential public replies with preceding transcript, no project context/worktree/task board. Explicit conversion opens a Project form. Project keeps independent parallel review followed by a public chair response, approval and existing execution.
- Reason: A simple introduction previously produced a task plan instead of conversation, and a high-effort chair read unnecessary project context. User wants visible interaction and fast, accurate project execution.
- Consequence: Auto effort follows stage (low / medium / high) unless manually overridden; process-spawn and first-CLI-output timings are recorded separately. Overlapping scopes require dependencies and shared resources serialize. Completed replies are public; raw private reasoning is never shown. Keep historical runs compatible; defer persistent/prewarmed CLIs until measurements justify complexity.

## DEC-009: Cowork multi-tabs allow concurrent planning with exclusive execution
- Date: 2026-10-08
- Status: Accepted (user requested multiple meeting tabs)
- Decision: Each terminal-region Cowork tab owns an independent mounted panel; closing a view does not cancel a meeting. Allow concurrent discussions and Project plans in one repo. Keep actual execution exclusive per repo until merge/cleanup, including an atomic reservation during worktree setup.
- Reason: A singleton renderer panel and a global active-meeting guard prevented multiple meetings. Read-only planning has independent snapshots; execution still shares repo integration state.
- Consequence: New tabs are fresh, background status and drafts stay per view, meetings can reopen from refreshed history. Open tabs remain session-only; the existing run store retains meeting records.

## DEC-010: Cowork persists cumulative recorder checkpoints before chair conclusion
- Date: 2026-10-08
- Status: Accepted (user requested a designated summary agent and chair conclusion before user approval)
- Decision: Recorder is a selected participant. Persist cumulative records with a covered-message prefix; feed the preceding record plus every uncovered chunk oldest-first. Trigger on demand/before context fills by default, optionally each round. Summary and chair calls share the planning budget and runner validation/recovery.
- Reason: A newest-message-only context silently forgot older discussion. User wants a compact durable record of agreements, disagreements and needed decisions, followed by the chair recommendation.
- Consequence: Original messages remain available; only successful summaries advance coverage. Finalization covers all remaining messages before the chair speaks, and new discussion invalidates the current conclusion for conversion. Conversion opens the existing Project form for code-aware review and explicit approval; records do not authorize execution. No new dependencies, separate memory service or persistent CLI introduced.
