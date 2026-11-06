// Cowork 的背景執行：核准後把任務交給各家 agent，在 repo 內的 git worktree（.cowork/<runId>/）裡做。
// 執行用完整設定（使用者的 skill／MCP／外掛／hook 都會載入），權限照使用者的 Bypass 設定；
// 進度與回覆寫回 run，使用者在 Cowork 裡追問時接續同一個 session。
// 不 import electron：資料目錄、CLI 路徑、存檔與廣播都由 host 注入，scripts/check-cowork.mts 可以拿假 CLI 測。
import { createHash } from 'node:crypto'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { runProcess } from './runner'
import { describeCheck, resolveCheckCommand, runCheck } from './checks'
import {
  addTreeWorktree,
  addWorktree,
  changedFiles,
  changedPaths,
  cherryPickAll,
  commitAll,
  configuredHooksPath,
  diffGuard,
  diffStat,
  diffText,
  excludeCoworkDir,
  exportBaselineHooks,
  git,
  gitGuardState,
  linkNodeModules,
  mergeBranch,
  mergeTree,
  patchId,
  removeWorktrees,
  resetWorktree,
  revParse,
  revertFiles,
  scopeContentHash,
  treeOf
} from './git'
import {
  acceptanceGaps,
  buildExecPrompt,
  currentBoard,
  execApprovalContent,
  execInvocation,
  filesOutsideScope,
  hookPathsIn,
  maskSecrets,
  mergeBlockers,
  parseExecLine,
  parseExecResult,
  RunawayMonitor,
  topoOrder,
  touchesDependencies,
  type CheckRun,
  type ExecPreview,
  type ExecResult,
  type IntegrationCheckStatus,
  type MergeApproval,
  type TaskGateKind,
  type CoworkAgent,
  type CoworkExecMode,
  type CoworkExecution,
  type CoworkRun,
  type CoworkTaskExec,
  type CoworkTurn,
  type CallUsage
} from '../../shared/cowork'

export interface ExecCli {
  command: string
  prefixArgs?: string[]
  env?: Record<string, string>
}

export interface ExecHost {
  /** 這場 run 的資料目錄（放 codex 的 -o 檔） */
  dirOf(run: CoworkRun): string
  save(run: CoworkRun): void
  emit(run: CoworkRun): void
  resolveExecCli(agent: CoworkAgent): ExecCli | { error: string } | Promise<ExecCli | { error: string }>
  /** Same-repo execution stays exclusive until its worktrees are merged or cleaned; planning may run concurrently. */
  otherActiveRun(run: CoworkRun): CoworkRun | undefined
  /** 實作後審查：由 orchestrator 用唯讀的方式呼叫另一個模型 */
  review?(run: CoworkRun): Promise<void>
  now(): number
}

/** 給 IPC 回傳的錯誤；與 orchestrator 的 CoworkError 同形 */
export class ExecError extends Error {
  code: string
  data?: unknown
  constructor(code: string, message?: string, data?: unknown) {
    super(message || code)
    this.code = code
    this.data = data
  }
}

const TURN_TIMEOUT_MS = 30 * 60_000
const MAX_PROGRESS = 40
const MAX_TEXT = 40_000
const EMIT_MS = 1000
const MAX_WATCH = 20
/** ponytail: 單輪 token 的觀察門檻是猜的，只記錄不終止；有真實紀錄再校準 */
const TOKEN_SPIKE = 20_000_000

export interface ExecStartOptions {
  mode: CoworkExecMode
  linkDeps: boolean
  bypass: boolean
  /** execPreview 回傳的 hash：使用者看過的內容 */
  approval?: string
  review?: boolean
  worktreeRoot?: string
  runawayStop?: boolean
}

export class CoworkExecutor {
  private host: ExecHost
  private controllers = new Map<string, Set<AbortController>>()
  private active = new Map<string, number>()
  private timers = new Map<string, NodeJS.Timeout>()
  private lastEmit = new Map<string, number>()
  private shuttingDown = false

  constructor(host: ExecHost) {
    this.host = host
  }

  // ── 開始 ───────────────────────────────────────────────────────────

  /** 開始執行前給使用者看的內容；hash 綁定這些內容，任何一項變了舊核准就失效 */
  async preview(run: CoworkRun, o: Pick<ExecStartOptions, 'mode' | 'linkDeps' | 'bypass' | 'worktreeRoot'>): Promise<ExecPreview> {
    if (run.phase !== 'approved') throw new ExecError('not-allowed')
    const board = currentBoard(run)
    if (!board || board.planRevision !== run.approvedPlanRevision) throw new ExecError('not-allowed')
    const checks: ExecPreview['checks'] = []
    const list: { taskId: string | null; argv: string[] }[] = [
      ...board.tasks.flatMap((t) => (t.checks || []).map((argv) => ({ taskId: t.id, argv }))),
      ...(board.checks || []).map((argv) => ({ taskId: null, argv }))
    ]
    for (const c of list) {
      const r = await resolveCheckCommand(c.argv[0], run.repo.root)
      checks.push({ taskId: c.taskId, argv: c.argv, resolved: 'resolved' in r ? r.resolved : null, ...('error' in r ? { error: r.error } : {}) })
    }
    const base = worktreeBaseOf(run, o.worktreeRoot)
    const warnings: string[] = []
    if (o.bypass) warnings.push('bypass-on')
    if (o.linkDeps) warnings.push('shared-deps')
    if (list.length) warnings.push('checks-run-code')
    if (CLOUD_DIR.test(base)) warnings.push('cloud-worktree')
    const content = execApprovalContent(run, board, o) + JSON.stringify(checks.map((c) => c.resolved)) + base
    return {
      hash: createHash('sha256').update(content).digest('hex'),
      mode: o.mode,
      linkDeps: o.linkDeps,
      bypass: o.bypass,
      baseCommit: run.repo.baseCommit,
      checks,
      worktreeRoot: base,
      warnings
    }
  }

  async start(run: CoworkRun, o: ExecStartOptions): Promise<void> {
    if (run.phase !== 'approved') throw new ExecError('not-allowed')
    const board = currentBoard(run)
    if (!board || board.planRevision !== run.approvedPlanRevision) throw new ExecError('not-allowed')
    if (!topoOrder(board.tasks)) throw new ExecError('not-allowed', 'dependency cycle')
    const other = this.host.otherActiveRun(run)
    if (other) throw new ExecError('active-run-exists', undefined, { runId: other.id })
    // 在互斥範圍內重新核對：Bypass、任務板、checks 變了，舊的核准都不算數
    const seen = await this.preview(run, o)
    if (o.approval !== seen.hash) throw new ExecError('stale', 'The plan or its settings changed. Review them again.', { preview: seen })
    const missing = seen.checks.filter((c) => c.error)
    if (missing.length) throw new ExecError('check-unresolved', missing.map((c) => `${c.argv.join(' ')}: ${c.error}`).join('\n'))

    const worktreeBase = seen.worktreeRoot
    const root = path.join(worktreeBase, run.id)
    const keys = o.mode === 'sequential' ? ['main'] : [...new Set(board.tasks.map((t) => t.assignee))]
    const worktrees: CoworkExecution['worktrees'] = {}
    for (const k of keys) worktrees[k] = { path: path.join(root, k), branch: `cowork/${run.id}/${k}` }

    // 有任務會改依賴時整場都不共用 node_modules：junction 指向主工作區，安裝會直接改到使用者的環境，
    // 平行任務也會互相干擾；下游任務還會用到舊的依賴。代價是 agent 要自己安裝。
    const depTasks = board.tasks.filter((t) => touchesDependencies(t.scope)).map((t) => t.id)
    const link = o.linkDeps && depTasks.length === 0
    excludeCoworkDir(run.repo.commonDir)
    const created: string[] = []
    let hooksDir: string
    let gitGuard: Record<string, string>
    try {
      hooksDir = await exportBaselineHooks(run.repo.root, run.repo.baseCommit, path.join(this.host.dirOf(run), 'exec', 'hooks'))
      gitGuard = await gitGuardState(run.repo.root)
    } catch (e) {
      throw new ExecError('worktree-failed', (e as Error).message)
    }
    try {
      for (const k of keys) {
        await addWorktree(run.repo.root, worktrees[k].path, worktrees[k].branch, run.repo.baseCommit)
        created.push(worktrees[k].path)
        worktrees[k].depsLinked = link ? await linkNodeModules(run.repo.root, worktrees[k].path) : false
      }
    } catch (e) {
      // 建到一半失敗：收掉已建的 worktree 與分支，run 維持在已核准
      await removeWorktrees(run.repo.root, root, created, worktreeBase).catch(() => {})
      for (const k of keys) await git(run.repo.root, ['branch', '-D', worktrees[k].branch]).catch(() => '')
      throw new ExecError('worktree-failed', (e as Error).message)
    }

    const tasks: CoworkExecution['tasks'] = {}
    for (const t of board.tasks) {
      tasks[t.id] = { status: 'pending', agent: t.assignee, worktree: o.mode === 'sequential' ? 'main' : t.assignee, turns: [], commits: [] }
    }
    run.execution = {
      mode: o.mode,
      startedAt: this.host.now(),
      bypass: o.bypass,
      linkDeps: o.linkDeps,
      ...(o.linkDeps && depTasks.length ? { depsLinkSkippedFor: depTasks } : {}),
      gates: true,
      reviewOn: o.review !== false,
      runawayStop: o.runawayStop === true,
      hooksDir,
      gitGuard,
      worktreeBase,
      root,
      worktrees,
      tasks,
      paused: false,
      msUsed: 0,
      activeSince: null
    }
    run.phase = 'executing'
    run.log.push({ t: 'exec-start', mode: o.mode, bypass: o.bypass, at: this.host.now() })
    this.host.save(run)
    this.schedule(run)
  }

  // ── 排程 ───────────────────────────────────────────────────────────

  /** 依依賴順序啟動可以跑的任務：依賴都完成、所在的 worktree 沒有別的任務在跑 */
  schedule(run: CoworkRun): void {
    const ex = run.execution
    const board = currentBoard(run)
    if (!ex || !board || this.shuttingDown) return
    if (run.phase !== 'executing' && run.phase !== 'review') return
    if (!ex.paused) {
      const order = topoOrder(board.tasks) || board.tasks.map((t) => t.id)
      for (const id of order) {
        const te = ex.tasks[id]
        const task = board.tasks.find((t) => t.id === id)
        if (!te || !task || te.status !== 'pending') continue
        if (!task.dependsOn.every((d) => ex.tasks[d]?.status === 'done')) continue
        if (Object.values(ex.tasks).some((x) => x.status === 'running' && x.worktree === te.worktree)) continue
        if (board.tasks.some((other) => ex.tasks[other.id]?.status === 'running' && task.resources.some((r) => other.resources.includes(r)))) continue
        if (this.budgetLeft(run) <= 0) {
          this.pause(run, 'budget')
          return
        }
        void this.runTurn(run, id, {})
      }
    }
    const all = Object.values(ex.tasks)
    if (all.length && all.every((t) => t.status === 'done') && !all.some((t) => t.status === 'running')) {
      void this.finish(run)
    }
  }

  private budgetLeft(run: CoworkRun): number {
    const ex = run.execution!
    const used = ex.msUsed + (ex.activeSince ? this.host.now() - ex.activeSince : 0)
    return run.limits.maxExecutionMinutes * 60_000 - used
  }

  // ── 一輪對話：第一次交辦、使用者追問、或中斷後接續 ────────────────────

  private async runTurn(run: CoworkRun, taskId: string, o: { message?: string; fresh?: boolean; gate?: boolean }): Promise<void> {
    const ex = run.execution!
    const board = currentBoard(run)!
    const te = ex.tasks[taskId]
    const task = board.tasks.find((t) => t.id === taskId)!
    const wt = ex.worktrees[te.worktree]
    // 同步設成 running，排程才不會重複啟動同一個任務
    te.status = 'running'
    te.error = undefined
    te.scopeReview = undefined
    te.gate = undefined
    te.startedAt = this.host.now()
    if (o.fresh) te.sessionId = undefined
    const followUp = !!o.message && !!te.sessionId

    // 同時模式：前置任務若在別的 worktree 完成，先把它們的 commit 套過來
    if (ex.mode === 'parallel' && !followUp) {
      const order = topoOrder(board.tasks) || []
      const needed = new Set<string>()
      const walk = (id: string): void => {
        for (const d of board.tasks.find((t) => t.id === id)?.dependsOn || []) {
          if (!needed.has(d)) {
            needed.add(d)
            walk(d)
          }
        }
      }
      walk(taskId)
      const commits = order
        .filter((id) => needed.has(id) && ex.tasks[id].worktree !== te.worktree)
        .flatMap((id) => ex.tasks[id].commits)
      if (commits.length) {
        const r = await cherryPickAll(wt.path, commits, ex.hooksDir)
        if (!r.ok) {
          te.status = 'blocked'
          te.error = `Could not apply prerequisite commit ${r.commit.slice(0, 10)}: ${r.message}`
          te.endedAt = this.host.now()
          run.log.push({ t: 'task-failed', taskId, message: te.error, at: this.host.now() })
          this.host.save(run)
          this.schedule(run)
          return
        }
      }
    }

    const depSummaries = task.dependsOn.map((d) => {
      const dt = board.tasks.find((t) => t.id === d)
      const last = [...(ex.tasks[d]?.turns || [])].reverse().find((t) => t.role === 'agent' && t.text)
      return { id: d, title: dt?.title || d, summary: last?.text || '', changedFiles: ex.tasks[d]?.changedFiles, result: ex.tasks[d]?.result }
    })
    // 接續 session 只送使用者的話；沒有 session（例如上次沒能啟動）就重新交辦並附上這段話
    const prompt = followUp
      ? o.message!
      : buildExecPrompt(run, task, { branch: wt.branch, deps: depSummaries, depsLinked: wt.depsLinked, gates: ex.gates }) +
        (o.message ? `\n\nAdditional instructions from the user:\n${o.message}` : '')
    const userTurn: CoworkTurn = { role: o.message ? 'user' : 'cowork', text: (o.message || prompt).slice(0, 8000), at: this.host.now() }
    const agentTurn: CoworkTurn = { role: 'agent', text: '', at: this.host.now(), progress: [], running: true }
    te.turns.push(userTurn, agentTurn)
    run.log.push({ t: 'task-start', taskId, agent: te.agent, followUp: !!o.message, at: this.host.now() })
    this.host.save(run)

    // 先登記 controller 再等 resolveExecCli（可能要跑 where）：等待中按停止也會讓下面的 runProcess 立刻收掉
    const ac = new AbortController()
    const set = this.controllers.get(run.id) || new Set()
    set.add(ac)
    this.controllers.set(run.id, set)
    const cli = await this.host.resolveExecCli(te.agent)
    if ('error' in cli) {
      set.delete(ac)
      return this.endTurn(run, taskId, agentTurn, { ok: false, error: `${te.agent} is not available: ${cli.error}` })
    }

    const n = te.turns.length
    const outFile = path.join(this.host.dirOf(run), 'exec', `${taskId}-${n}.last.txt`)
    fs.mkdirSync(path.dirname(outFile), { recursive: true })
    const choice = run.models?.[te.agent]
    const inv = execInvocation(te.agent, {
      cwd: wt.path,
      resumeId: followUp ? te.sessionId : undefined,
      model: choice?.model,
      effort: choice?.effort,
      bypass: ex.bypass,
      outFile
    })

    let final: { ok: boolean; text: string; error?: string } | null = null
    let lastText = ''
    const monitor = new RunawayMonitor(this.host.now())
    this.clockStart(run)
    let result
    try {
      result = await runProcess(
        {
          command: cli.command,
          args: [...(cli.prefixArgs || []), ...inv.args],
          cwd: wt.path,
          stdin: inv.stdin(prompt),
          timeoutMs: Math.max(60_000, Math.min(TURN_TIMEOUT_MS, this.budgetLeft(run))),
          maxBytes: 32 * 1024 * 1024,
          env: cli.env ? { ...process.env, ...cli.env } : undefined,
          onStdoutLine: (line) => {
            const ev = parseExecLine(te.agent, line, wt.path)
            if (!ev) return null
            if (ev.sessionId) te.sessionId = ev.sessionId
            if (ev.progress) {
              agentTurn.progress!.push(ev.progress)
              if (agentTurn.progress!.length > MAX_PROGRESS) agentTurn.progress!.splice(0, agentTurn.progress!.length - MAX_PROGRESS)
            }
            if (ev.text) {
              lastText = ev.text
              agentTurn.text = ev.text.slice(0, MAX_TEXT)
            }
            if (ev.textDelta) agentTurn.text = (agentTurn.text + ev.textDelta).slice(-MAX_TEXT)
            if (ev.usage) {
              te.usage = addUsage(te.usage, ev.usage)
              const used = (ev.usage.inputTokens || 0) + (ev.usage.outputTokens || 0)
              if (used >= TOKEN_SPIKE) run.log.push({ t: 'runaway', taskId, signal: 'token-spike', detail: `${used} tokens in one turn`, stopped: false, at: this.host.now() })
            }
            if (ev.final) final = ev.final
            this.emitSoon(run)
            const stop = this.watchRunaway(run, taskId, monitor, ev)
            return stop
          }
        },
        ac.signal
      )
    } finally {
      set.delete(ac)
      this.clockStop(run)
    }

    if (result.guardReason) return this.endTurn(run, taskId, agentTurn, { ok: false, error: `Stopped by Cowork: ${result.guardReason}`, blocked: true })
    if (result.cancelled) return this.endTurn(run, taskId, agentTurn, { ok: false, error: 'stopped', cancelled: true })
    if (result.spawnError) return this.endTurn(run, taskId, agentTurn, { ok: false, error: `Could not start ${te.agent}: ${result.spawnError}` })
    if (result.timedOut) return this.endTurn(run, taskId, agentTurn, { ok: false, error: `${te.agent} did not finish within the time limit` })
    const f = final as { ok: boolean; text: string; error?: string } | null
    if (f && f.ok && result.code === 0) {
      const outText = inv.outFile && fs.existsSync(inv.outFile) ? fs.readFileSync(inv.outFile, 'utf8') : ''
      const full = f.text || lastText || outText || agentTurn.text
      agentTurn.text = full.slice(0, MAX_TEXT)
      // 結構化結果在回覆最後；從完整文字取，不受顯示用的截斷影響
      return this.endTurn(run, taskId, agentTurn, { ok: true, followUp: !!o.message, result: parseExecResult(full) })
    }
    const why = f?.error || (result.code !== 0 ? `exit ${result.code}: ${result.stderr.trim().slice(-400)}` : 'no result')
    return this.endTurn(run, taskId, agentTurn, { ok: false, error: why })
  }

  private async endTurn(
    run: CoworkRun,
    taskId: string,
    agentTurn: CoworkTurn,
    r: { ok: boolean; error?: string; cancelled?: boolean; followUp?: boolean; result?: ExecResult; blocked?: boolean }
  ): Promise<void> {
    const ex = run.execution!
    const te = ex.tasks[taskId]
    const task = currentBoard(run)!.tasks.find((t) => t.id === taskId)!
    agentTurn.running = false
    te.endedAt = this.host.now()
    if (r.ok) {
      // 追問那一輪沒附結果區塊時，保留上一輪的
      if (r.result) te.result = r.result
      // 先看 git 設定有沒有被改：要在 harness 再跑任何 git 指令之前（設定可能指定 filter、driver）
      const tampered = await this.guardChanges(run, ex.worktrees[te.worktree].path)
      if (tampered.length) return this.blockGate(run, taskId, 'git-config', tampered, !!r.followUp)
      let files: string[]
      try {
        files = await changedFiles(ex.worktrees[te.worktree].path)
      } catch (e) {
        return this.failTask(run, taskId, agentTurn, `Could not read the changes: ${(e as Error).message}`)
      }
      const outside = filesOutsideScope(task.scope, files)
      if (outside.length) {
        // 越界的改動先不 commit：使用者決定接受、還原，或追問 agent 自己收拾
        const hash = await scopeContentHash(ex.worktrees[te.worktree].path, outside).catch(() => undefined)
        te.status = 'blocked'
        te.scopeReview = { files: outside, followUp: !!r.followUp, hash }
        te.error = `Changed ${outside.length} file(s) outside the task scope: ${outside.slice(0, 10).join(', ')}${outside.length > 10 ? ', …' : ''}`
        run.log.push({ t: 'task-scope', taskId, files: outside, at: this.host.now() })
        this.host.save(run)
        this.schedule(run)
        return
      }
      return this.completeTask(run, taskId, agentTurn, !!r.followUp)
    } else {
      agentTurn.error = r.error
      te.status = r.cancelled ? 'cancelled' : r.blocked ? 'blocked' : 'failed'
      te.error = r.error
      if (!r.cancelled) run.log.push({ t: 'task-failed', taskId, message: r.error || 'failed', at: this.host.now() })
    }
    this.host.save(run)
    this.schedule(run)
  }

  // ── 完成條件：完成與否不靠 agent 自述 ───────────────────────────────

  private async guardChanges(run: CoworkRun, dir: string): Promise<string[]> {
    const ex = run.execution!
    if (!ex.gitGuard) return []
    try {
      return diffGuard(ex.gitGuard, await gitGuardState(dir))
    } catch (e) {
      return [`could not read the git configuration: ${(e as Error).message}`]
    }
  }

  private blockGate(run: CoworkRun, taskId: string, kind: TaskGateKind, items: string[], followUp: boolean): void {
    const te = run.execution!.tasks[taskId]
    te.status = 'blocked'
    te.gate = { kind, items: items.slice(0, 50), followUp }
    te.error = `${kind}: ${items.slice(0, 3).join('; ')}`.slice(0, 1000)
    te.endedAt = this.host.now()
    run.log.push({ t: 'task-gate', taskId, kind, items: te.gate.items, at: this.host.now() })
    this.host.save(run)
    this.schedule(run)
  }

  /** 沒過就自動追問一次；第二次還沒過就停下來交給使用者 */
  private gateFollowUp(run: CoworkRun, taskId: string, kind: TaskGateKind, items: string[], followUp: boolean, message: string): void {
    const te = run.execution!.tasks[taskId]
    if ((te.gateFollowUps || 0) >= 1 || !te.sessionId || run.execution!.paused) return this.blockGate(run, taskId, kind, items, followUp)
    te.gateFollowUps = (te.gateFollowUps || 0) + 1
    run.log.push({ t: 'task-gate', taskId, kind, items: items.slice(0, 50), at: this.host.now() })
    void this.runTurn(run, taskId, { message, gate: true })
  }

  private async completeTask(run: CoworkRun, taskId: string, agentTurn: CoworkTurn | null, followUp: boolean): Promise<void> {
    const ex = run.execution!
    const te = ex.tasks[taskId]
    const task = currentBoard(run)!.tasks.find((t) => t.id === taskId)!
    if (!ex.gates) return this.commitTask(run, taskId, agentTurn, followUp)
    te.status = 'running' // 驗證到提交之間，排程不能在這個 worktree 開別的任務
    const gaps = acceptanceGaps(task, te.result)
    if (gaps.length) {
      return this.gateFollowUp(
        run,
        taskId,
        'acceptance',
        gaps,
        followUp,
        `Cowork completion check: these acceptance items are missing or not done.\n${gaps.join('\n')}\n\nFinish them, then reply again ending with a cowork-result block whose "acceptance" array reports every item.`
      )
    }
    if (!task.checks?.length) return this.commitTask(run, taskId, agentTurn, followUp)

    const dir = ex.worktrees[te.worktree].path
    const ac = new AbortController()
    const set = this.controllers.get(run.id) || new Set()
    set.add(ac)
    this.controllers.set(run.id, set)
    this.clockStart(run)
    try {
      let failed: CheckRun[] = []
      for (let attempt = 0; ; attempt++) {
        const before = await treeOf(dir)
        const runs: CheckRun[] = []
        for (const argv of task.checks) {
          const c = await runCheck(argv, dir, { signal: ac.signal, timeoutMs: this.budgetLeft(run), now: () => this.host.now(), tree: before })
          runs.push(c)
          if (!c.ok) break
        }
        te.checkRuns = runs
        if (ac.signal.aborted) {
          te.status = 'cancelled'
          te.error = 'stopped'
          this.host.save(run)
          return
        }
        failed = runs.filter((c) => !c.ok)
        const after = await treeOf(dir)
        if (after === before) break
        // checks 改了待提交的內容：剛才的結果不算數。先看有沒有越界，再對新內容重跑一次
        const outside = filesOutsideScope(task.scope, await changedFiles(dir))
        if (outside.length) {
          const hash = await scopeContentHash(dir, outside).catch(() => undefined)
          te.status = 'blocked'
          te.scopeReview = { files: outside, followUp, hash }
          te.error = `Checks changed ${outside.length} file(s) outside the task scope: ${outside.slice(0, 10).join(', ')}`
          run.log.push({ t: 'task-scope', taskId, files: outside, at: this.host.now() })
          this.host.save(run)
          this.schedule(run)
          return
        }
        if (attempt >= 1) return this.blockGate(run, taskId, 'checks', ['Checks keep changing the files they verify, so the result cannot be trusted.'], followUp)
      }
      if (failed.length) {
        const items = failed.map(describeCheck)
        return this.gateFollowUp(run, taskId, 'checks', items, followUp, `Cowork ran the approved checks and they failed:\n${items.join('\n')}\n\nFix the cause, then reply again ending with a cowork-result block.`)
      }
    } catch (e) {
      return this.failTask(run, taskId, agentTurn, `Could not run the checks: ${(e as Error).message}`)
    } finally {
      set.delete(ac)
      this.clockStop(run)
    }
    return this.commitTask(run, taskId, agentTurn, followUp)
  }

  /** 使用者明確接受未通過的項目：留下理由，不會變成「驗證通過」 */
  async waive(run: CoworkRun, taskId: string, reason: string, allowGitConfig = false): Promise<void> {
    const ex = run.execution
    const te = ex?.tasks[taskId]
    const why = typeof reason === 'string' ? reason.trim() : ''
    if (!ex || !te) throw new ExecError('task-not-found')
    if (ex.cleaned || te.status !== 'blocked' || !te.gate) throw new ExecError('not-allowed')
    if (!why) throw new ExecError('waive-reason-required')
    // git 設定被改只能在桌面確認：手機看不到設定內容，也不該讓遠端放行
    if (te.gate.kind === 'git-config' && !allowGitConfig) throw new ExecError('not-allowed', 'Review the git configuration change on the computer.')
    if (Object.values(ex.tasks).some((x) => x.status === 'running' && x.worktree === te.worktree)) throw new ExecError('busy')
    const { kind, items, followUp } = te.gate
    te.waiver = { kind, reason: why.slice(0, 2000), items, at: this.host.now() }
    te.gate = undefined
    run.log.push({ t: 'task-waived', taskId, kind, reason: te.waiver.reason, at: this.host.now() })
    if (kind === 'git-config') ex.gitGuard = await gitGuardState(ex.worktrees[te.worktree].path)
    await this.commitTask(run, taskId, null, followUp)
  }

  private watchRunaway(run: CoworkRun, taskId: string, monitor: RunawayMonitor, ev: Parameters<RunawayMonitor['feed']>[0]): string | null {
    const ex = run.execution!
    const te = ex.tasks[taskId]
    let stop: string | null = null
    for (const s of monitor.feed(ev, this.host.now())) {
      const willStop = s.canStop && ex.runawayStop === true
      ;(te.watch ||= []).push({ signal: s.signal, detail: s.detail, at: this.host.now() })
      if (te.watch.length > MAX_WATCH) te.watch.splice(0, te.watch.length - MAX_WATCH)
      run.log.push({ t: 'runaway', taskId, signal: s.signal, detail: s.detail, stopped: willStop, at: this.host.now() })
      if (willStop) stop = s.detail
    }
    return stop
  }

  /** commit 這個任務 worktree 裡的改動並標成完成 */
  private async commitTask(run: CoworkRun, taskId: string, agentTurn: CoworkTurn | null, followUp: boolean): Promise<void> {
    const ex = run.execution!
    const te = ex.tasks[taskId]
    const task = currentBoard(run)!.tasks.find((t) => t.id === taskId)!
    const dir = ex.worktrees[te.worktree].path
    let commit: string | null = null
    try {
      const files = await changedFiles(dir)
      const msg = `cowork(${run.id}): ${task.id} ${task.title}${followUp ? ' (follow-up)' : ''}`
      commit = await commitAll(dir, msg, ex.hooksDir)
      if (commit) te.changedFiles = [...new Set([...(te.changedFiles || []), ...files])]
    } catch (e) {
      return this.failTask(run, taskId, agentTurn, `Could not commit: ${(e as Error).message}`)
    }
    if (commit) te.commits.push(commit)
    te.status = 'done'
    te.error = undefined
    te.scopeReview = undefined
    te.gate = undefined
    run.log.push({ t: 'task-done', taskId, commit, at: this.host.now() })
    this.host.save(run)
    this.schedule(run)
  }

  private failTask(run: CoworkRun, taskId: string, agentTurn: CoworkTurn | null, message: string): void {
    const te = run.execution!.tasks[taskId]
    if (agentTurn) agentTurn.error = message
    te.status = 'failed'
    te.error = message
    run.log.push({ t: 'task-failed', taskId, message, at: this.host.now() })
    this.host.save(run)
    this.schedule(run)
  }

  // ── 越界改動：使用者接受或還原 ──────────────────────────────────────

  private scopeTask(run: CoworkRun, taskId: string): { te: CoworkTaskExec; review: NonNullable<CoworkTaskExec['scopeReview']> } {
    const ex = run.execution
    const te = ex?.tasks[taskId]
    if (!ex || !te) throw new ExecError('task-not-found')
    if (ex.cleaned || te.status !== 'blocked' || !te.scopeReview) throw new ExecError('not-allowed')
    if (Object.values(ex.tasks).some((x) => x.status === 'running' && x.worktree === te.worktree)) throw new ExecError('busy')
    return { te, review: te.scopeReview }
  }

  /** 接受越界的改動。hash 是使用者看到的內容：同檔名但內容變了，舊核准就失效 */
  async acceptScope(run: CoworkRun, taskId: string, hash?: string): Promise<void> {
    const { te, review } = this.scopeTask(run, taskId)
    const ex = run.execution!
    if (review.hash) {
      const dir = ex.worktrees[te.worktree].path
      const files = filesOutsideScope(currentBoard(run)!.tasks.find((t) => t.id === taskId)!.scope, await changedFiles(dir))
      const now = await scopeContentHash(dir, files)
      if (hash !== review.hash || now !== review.hash) {
        te.scopeReview = { ...review, files, hash: now }
        this.host.save(run)
        throw new ExecError('stale', 'The files changed after you reviewed them. Review them again.')
      }
    }
    run.log.push({ t: 'task-scope-resolved', taskId, action: 'accept', files: review.files, at: this.host.now() })
    te.scopeReview = undefined
    await this.completeTask(run, taskId, null, review.followUp)
  }

  /** 還原越界的改動（回到 HEAD；新增的檔刪掉），scope 內的改動照常 commit */
  async revertScope(run: CoworkRun, taskId: string): Promise<void> {
    const { te, review } = this.scopeTask(run, taskId)
    const dir = run.execution!.worktrees[te.worktree].path
    try {
      await revertFiles(dir, review.files)
    } catch (e) {
      throw new ExecError('revert-failed', (e as Error).message)
    }
    run.log.push({ t: 'task-scope-resolved', taskId, action: 'revert', files: review.files, at: this.host.now() })
    te.scopeReview = undefined
    await this.completeTask(run, taskId, null, review.followUp)
  }

  // ── 收尾：整合成一條分支，給使用者看 diff ─────────────────────────────

  private finishing = new Set<string>()

  private async finish(run: CoworkRun): Promise<void> {
    const ex = run.execution!
    if (this.finishing.has(run.id) || (run.phase === 'review' && ex.integration)) return
    this.finishing.add(run.id)
    try {
      const board = currentBoard(run)!
      if (ex.mode === 'sequential') {
        const wt = ex.worktrees.main
        const head = (await git(wt.path, ['rev-parse', 'HEAD'])).trim()
        ex.integration = { status: 'ok', branch: wt.branch, worktree: 'main', commit: head, stat: await diffStat(wt.path, run.repo.baseCommit, head) }
      } else {
        // 同時模式：從基線開一條整合分支，依依賴順序 cherry-pick 每個任務的 commit
        const key = 'integration'
        const branch = `cowork/${run.id}/${key}`
        const dir = path.join(ex.root, key)
        if (ex.worktrees[key]) {
          await removeWorktrees(run.repo.root, path.join(ex.root, '__none__'), [dir], ex.worktreeBase).catch(() => {})
          await git(run.repo.root, ['branch', '-D', branch]).catch(() => '')
        }
        await addWorktree(run.repo.root, dir, branch, run.repo.baseCommit)
        // 共同 checks 要能取得依賴：沿用任務的策略（有任務改依賴就不連，由核准的安裝指令負責）
        const depsLinked = ex.gates && ex.linkDeps && !ex.depsLinkSkippedFor?.length ? await linkNodeModules(run.repo.root, dir) : false
        ex.worktrees[key] = { path: dir, branch, depsLinked }
        const order = topoOrder(board.tasks) || board.tasks.map((t) => t.id)
        const commits = order.flatMap((id) => ex.tasks[id].commits)
        const r = await cherryPickAll(dir, commits, ex.hooksDir)
        if (!r.ok) {
          const owner = order.find((id) => ex.tasks[id].commits.includes(r.commit))
          ex.integration = { status: 'conflict', branch, worktree: key, message: `${owner || '?'} (${r.commit.slice(0, 10)}): ${r.message}` }
        } else {
          const head = (await git(dir, ['rev-parse', 'HEAD'])).trim()
          ex.integration = { status: 'ok', branch, worktree: key, commit: head, stat: await diffStat(dir, run.repo.baseCommit, head) }
        }
      }
    } catch (e) {
      ex.integration = { status: 'error', branch: '', message: (e as Error).message.slice(0, 500) }
    }
    try {
      if (ex.integration?.status === 'ok' && ex.gates) await this.afterIntegration(run)
    } catch (e) {
      ex.integration = { ...ex.integration!, checks: 'failed', message: (e as Error).message.slice(0, 500) }
    } finally {
      this.finishing.delete(run.id)
    }
    run.phase = 'review'
    run.log.push({ t: 'integrated', ok: ex.integration?.status === 'ok', message: ex.integration?.message || ex.integration?.branch || '', at: this.host.now() })
    this.host.save(run)
  }

  /** 整合後：共同 checks → 記下目標分支 → 實作後審查（內容沒變就不重新付費審查） */
  private async afterIntegration(run: CoworkRun): Promise<void> {
    const ex = run.execution!
    const it = ex.integration!
    const dir = ex.worktrees[it.worktree!].path
    const board = currentBoard(run)!
    it.patchId = await patchId(dir, run.repo.baseCommit, it.commit!)
    it.hookChanges = hookPathsIn(await changedPaths(dir, run.repo.baseCommit, it.commit!), await configuredHooksPath(run.repo.root))
    ex.targetHead = await revParse(run.repo.root, run.repo.sourceBranch)
    ex.targetCheck = undefined
    this.clockStart(run)
    try {
      const r = await this.runSharedChecks(run, dir, board.checks || [])
      it.checks = r.status
      it.checkRuns = r.runs
      run.log.push({ t: 'integration-checks', status: r.status, at: this.host.now() })
      this.host.save(run)
      this.host.emit(run)
      const stale = !ex.review || ex.review.status !== 'ok' || ex.review.patchId !== it.patchId
      if (ex.reviewOn && this.host.review && stale && it.checks !== 'failed') await this.host.review(run)
    } finally {
      this.clockStop(run)
    }
  }

  /** 在 harness 自己的 worktree 跑共同 checks；弄髒就還原重跑一次，還是髒就不算通過 */
  private async runSharedChecks(run: CoworkRun, dir: string, checks: string[][]): Promise<{ status: IntegrationCheckStatus; runs: CheckRun[] }> {
    if (!checks.length) return { status: 'none', runs: [] }
    const ac = new AbortController()
    const set = this.controllers.get(run.id) || new Set()
    set.add(ac)
    this.controllers.set(run.id, set)
    try {
      for (let attempt = 0; ; attempt++) {
        const head = (await git(dir, ['rev-parse', 'HEAD'])).trim()
        const runs: CheckRun[] = []
        for (const argv of checks) {
          const c = await runCheck(argv, dir, { signal: ac.signal, timeoutMs: this.budgetLeft(run), now: () => this.host.now() })
          c.commit = head
          runs.push(c)
          if (!c.ok) break
        }
        const dirty = (await git(dir, ['status', '--porcelain'])).trim()
        if (!dirty) return { status: runs.every((c) => c.ok) ? 'passed' : 'failed', runs }
        await resetWorktree(dir)
        if (attempt >= 1) {
          const last = runs[runs.length - 1]
          if (last) last.error = 'checks keep changing tracked files'
          return { status: 'failed', runs }
        }
      }
    } finally {
      set.delete(ac)
    }
  }

  // ── 使用者操作 ─────────────────────────────────────────────────────

  /** 在 Cowork 裡對某個任務追問：接續同一個 session；沒有 session 就重新交辦並附上這段話 */
  async message(run: CoworkRun, taskId: string, text: string): Promise<void> {
    const ex = run.execution
    const te = ex?.tasks[taskId]
    const msg = text.trim()
    if (!ex || !te) throw new ExecError('task-not-found')
    if (!msg) throw new ExecError('empty-feedback')
    if (run.phase !== 'executing' && run.phase !== 'review') throw new ExecError('not-allowed')
    if (ex.cleaned) throw new ExecError('not-allowed', 'worktrees were cleaned up')
    if (te.status === 'running' || te.status === 'pending') throw new ExecError('busy')
    if (Object.values(ex.tasks).some((x) => x.status === 'running' && x.worktree === te.worktree)) throw new ExecError('busy')
    if (run.phase === 'review') run.phase = 'executing'
    te.gateFollowUps = 0
    void this.runTurn(run, taskId, { message: msg.slice(0, 20000) })
  }

  /** 失敗、卡住或被停掉的任務重新交辦（新的 session；worktree 裡已有的修改保留） */
  retry(run: CoworkRun, taskId: string): void {
    const ex = run.execution
    const te = ex?.tasks[taskId]
    if (!ex || !te) throw new ExecError('task-not-found')
    if (!['failed', 'blocked', 'cancelled'].includes(te.status)) throw new ExecError('not-allowed')
    te.status = 'pending'
    te.sessionId = undefined
    te.error = undefined
    te.scopeReview = undefined
    te.gate = undefined
    te.gateFollowUps = 0
    if (run.phase === 'review') run.phase = 'executing'
    this.host.save(run)
    this.schedule(run)
  }

  /** 停止：終止還在跑的 agent，不再排新任務，等使用者繼續 */
  pause(run: CoworkRun, reason: 'user' | 'budget' | 'restart' = 'user'): void {
    const ex = run.execution
    if (!ex) throw new ExecError('not-allowed')
    ex.paused = true
    ex.pausedReason = reason
    for (const c of this.controllers.get(run.id) || []) c.abort()
    run.log.push({ t: 'exec-paused', reason, at: this.host.now() })
    this.host.save(run)
  }

  /** 繼續：被停掉的任務有 session 就接續，沒有就重新排 */
  resume(run: CoworkRun): void {
    const ex = run.execution
    if (!ex || !ex.paused) throw new ExecError('not-allowed')
    if (this.budgetLeft(run) <= 0) throw new ExecError('budget-exhausted')
    ex.paused = false
    ex.pausedReason = undefined
    run.log.push({ t: 'exec-resumed', at: this.host.now() })
    for (const [id, te] of Object.entries(ex.tasks)) {
      if (te.status !== 'cancelled') continue
      if (te.sessionId) {
        void this.runTurn(run, id, { message: 'You were interrupted. Continue the task from where you stopped, then reply as instructed before.' })
      } else {
        te.status = 'pending'
      }
    }
    this.host.save(run)
    this.schedule(run)
  }

  /** 目標分支前進了：試算合併、對合併結果重跑共同 checks。內容（patch-id）沒變就不重新付費審查 */
  private async refreshTarget(run: CoworkRun, head: string): Promise<void> {
    const ex = run.execution!
    const it = ex.integration!
    const from = ex.targetHead || ''
    const m = await mergeTree(run.repo.root, head, it.commit!)
    ex.targetHead = head
    if (!m.ok) {
      ex.targetCheck = { head, status: 'conflict', message: m.message, at: this.host.now() }
    } else {
      const checks = currentBoard(run)?.checks || []
      if (!checks.length) {
        ex.targetCheck = { head, status: 'none', at: this.host.now() }
      } else {
        const dir = path.join(ex.root, 'target-check')
        await removeWorktrees(run.repo.root, path.join(ex.root, '__none__'), [dir], ex.worktreeBase).catch(() => {})
        await addTreeWorktree(run.repo.root, dir, head, m.tree)
        try {
          if (ex.linkDeps && !ex.depsLinkSkippedFor?.length) await linkNodeModules(run.repo.root, dir)
          // 這份內容沒有 commit，只看 check 結果
          const runs: CheckRun[] = []
          const ac = new AbortController()
          for (const argv of checks) {
            const c = await runCheck(argv, dir, { signal: ac.signal, now: () => this.host.now() })
            runs.push(c)
            if (!c.ok) break
          }
          ex.targetCheck = { head, status: runs.every((c) => c.ok) ? 'passed' : 'failed', runs, at: this.host.now() }
        } finally {
          await removeWorktrees(run.repo.root, path.join(ex.root, '__none__'), [dir], ex.worktreeBase).catch(() => {})
        }
      }
    }
    run.log.push({ t: 'target-moved', from, to: head, status: ex.targetCheck.status, at: this.host.now() })
    this.host.save(run)
  }

  private merging = new Map<string, Promise<void>>()

  /** 核准綁定整合 commit 與目標 HEAD。重複或併發送出只執行一次 */
  merge(run: CoworkRun, approval?: MergeApproval): Promise<void> {
    const inFlight = this.merging.get(run.id)
    if (inFlight) return inFlight
    const p = this.doMerge(run, approval).finally(() => this.merging.delete(run.id))
    this.merging.set(run.id, p)
    return p
  }

  private async doMerge(run: CoworkRun, approval?: MergeApproval): Promise<void> {
    const ex = run.execution
    if (ex?.merged && approval?.commit === ex.integration?.commit) return // 同一個核准重送：已經做過了
    if (run.phase !== 'review' || !ex?.integration || ex.integration.status !== 'ok') throw new ExecError('not-allowed')
    const it = ex.integration
    const refresh = 'Reload the run and review it again.'
    if (!approval || approval.commit !== it.commit) throw new ExecError('stale', refresh)
    if ((await revParse(run.repo.root, it.branch)) !== it.commit) throw new ExecError('stale', `The branch ${it.branch} moved after review. ${refresh}`)
    const head = await revParse(run.repo.root, run.repo.sourceBranch)
    // 舊紀錄沒有 targetHead：以現在為準，只綁 commit
    const legacy = !ex.targetHead
    if (legacy) ex.targetHead = head
    if (head !== ex.targetHead) {
      await this.refreshTarget(run, head)
      throw new ExecError('stale', `${run.repo.sourceBranch} moved. The merge result was checked again. ${refresh}`, { targetHead: head })
    }
    if (!legacy && approval.targetHead !== ex.targetHead) throw new ExecError('stale', refresh, { targetHead: ex.targetHead })
    if (ex.targetCheck?.head === head && ex.targetCheck.status === 'conflict') throw new ExecError('merge-conflict', ex.targetCheck.message, { branch: run.repo.sourceBranch })
    const tampered = await this.guardChanges(run, run.repo.root)
    if (tampered.length) throw new ExecError('git-config-changed', tampered.join('\n'))
    const blockers = mergeBlockers(ex)
    const why = approval.waive?.trim()
    if (blockers.length && !why) throw new ExecError('merge-needs-waiver', blockers.join('\n'), { blockers })
    const firstLine = run.prompt.split(/\r?\n/)[0].slice(0, 72)
    const r = await mergeBranch(run.repo.root, run.repo.sourceBranch, it.commit!, `Merge Cowork ${run.id}: ${firstLine}`, ex.hooksDir)
    if (!r.ok) throw new ExecError(`merge-${r.reason}`, r.message, { branch: run.repo.sourceBranch })
    if (blockers.length && why) {
      ex.mergeWaiver = { reason: why.slice(0, 2000), items: blockers, at: this.host.now() }
      run.log.push({ t: 'merge-waived', reason: ex.mergeWaiver.reason, items: blockers, at: this.host.now() })
    }
    ex.merged = { into: run.repo.sourceBranch, commit: r.commit, at: this.host.now() }
    run.phase = 'completed'
    run.log.push({ t: 'merged', into: run.repo.sourceBranch, commit: r.commit, at: this.host.now() })
    this.host.save(run)
  }

  /** 移除 worktree（分支保留，之後還能自己合併或查看） */
  async cleanup(run: CoworkRun): Promise<void> {
    const ex = run.execution
    if (!ex) throw new ExecError('not-allowed')
    if (Object.values(ex.tasks).some((t) => t.status === 'running')) throw new ExecError('busy')
    await removeWorktrees(run.repo.root, ex.root, Object.values(ex.worktrees).map((w) => w.path), ex.worktreeBase)
    ex.cleaned = true
    run.phase = 'completed'
    run.log.push({ t: 'cleaned', at: this.host.now() })
    this.host.save(run)
  }

  /** 手機用的 diff：有大小上限，超過要明示；常見憑證格式遮罩（盡力而為） */
  async diff(run: CoworkRun): Promise<{ text: string; truncated: boolean; commit: string; targetHead: string } | null> {
    const it = run.execution?.integration
    if (!it?.commit || !it.worktree || run.execution?.cleaned) return null
    const r = await diffText(run.execution!.worktrees[it.worktree].path, run.repo.baseCommit, it.commit, 200_000)
    return { text: maskSecrets(r.text), truncated: r.truncated, commit: it.commit, targetHead: run.execution!.targetHead || '' }
  }

  /** app 重啟後：還在跑的任務當成被中斷，整個執行先暫停，等使用者按繼續 */
  recover(run: CoworkRun): boolean {
    const ex = run.execution
    if (!ex || (run.phase !== 'executing' && run.phase !== 'review')) return false
    let changed = false
    if (ex.review?.status === 'running') {
      ex.review = { ...ex.review, status: 'failed', error: 'interrupted by app restart' }
      changed = true
    }
    for (const te of Object.values(ex.tasks)) {
      if (te.status !== 'running') continue
      te.status = 'cancelled'
      te.error = 'interrupted by app restart'
      for (const t of te.turns) if (t.running) t.running = false
      changed = true
    }
    if (ex.activeSince) {
      ex.msUsed += Math.max(0, run.updatedAt - ex.activeSince)
      ex.activeSince = null
      changed = true
    }
    if (changed && !ex.paused) {
      ex.paused = true
      ex.pausedReason = 'restart'
      run.log.push({ t: 'exec-paused', reason: 'restart', at: this.host.now() })
    }
    return changed
  }

  isRunning(run: CoworkRun): boolean {
    return (this.active.get(run.id) || 0) > 0
  }

  shutdown(): void {
    this.shuttingDown = true
    for (const set of this.controllers.values()) for (const c of set) c.abort()
  }

  // ── 執行時間：只算「有 agent 在跑」的區間 ─────────────────────────────

  private clockStart(run: CoworkRun): void {
    const ex = run.execution!
    const n = (this.active.get(run.id) || 0) + 1
    this.active.set(run.id, n)
    if (n === 1) {
      ex.activeSince = this.host.now()
      const t = setInterval(() => {
        if (this.budgetLeft(run) <= 0 && !ex.paused) this.pause(run, 'budget')
      }, 1000)
      t.unref?.()
      this.timers.set(run.id, t)
    }
  }

  private clockStop(run: CoworkRun): void {
    const ex = run.execution!
    const n = Math.max(0, (this.active.get(run.id) || 1) - 1)
    this.active.set(run.id, n)
    if (n === 0) {
      if (ex.activeSince) ex.msUsed += this.host.now() - ex.activeSince
      ex.activeSince = null
      const t = this.timers.get(run.id)
      if (t) clearInterval(t)
      this.timers.delete(run.id)
    }
  }

  private emitSoon(run: CoworkRun): void {
    const last = this.lastEmit.get(run.id) || 0
    if (this.host.now() - last < EMIT_MS) return
    this.lastEmit.set(run.id, this.host.now())
    this.host.emit(run)
  }
}

const CLOUD_DIR = /onedrive|dropbox|google ?drive|我的雲端硬碟|icloud/i

function worktreeBaseOf(run: CoworkRun, custom?: string): string {
  const c = custom?.trim()
  return c && path.isAbsolute(c) ? path.resolve(c) : path.join(run.repo.root, '.cowork')
}

function addUsage(a: CallUsage | undefined, b: CallUsage): CallUsage {
  return {
    inputTokens: (a?.inputTokens || 0) + (b.inputTokens || 0),
    cachedInputTokens: (a?.cachedInputTokens || 0) + (b.cachedInputTokens || 0),
    outputTokens: (a?.outputTokens || 0) + (b.outputTokens || 0),
    costUsd: (a?.costUsd || 0) + (b.costUsd || 0) || undefined
  }
}

export type { CoworkTaskExec }
