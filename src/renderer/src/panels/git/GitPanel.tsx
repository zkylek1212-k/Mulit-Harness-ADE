import { useState, useEffect, useCallback, type JSX } from 'react'
import { openDiff, useWorkbench } from '@/store'
import './git.css'

type GitStatus = Awaited<ReturnType<typeof window.api.git.status>>
type GitCommit = Awaited<ReturnType<typeof window.api.git.log>>[number]
type GitFileChange = GitStatus['staged'][number]

function splitPath(fullPath: string): { fileName: string; dirPath: string } {
  const normalized = fullPath.replace(/\\/g, '/')
  const lastSlash = normalized.lastIndexOf('/')
  if (lastSlash === -1) {
    return { fileName: normalized, dirPath: '' }
  }
  return {
    fileName: normalized.slice(lastSlash + 1),
    dirPath: normalized.slice(0, lastSlash)
  }
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return dateStr
  }
}

export default function GitPanel(): JSX.Element {
  const { gitTick } = useWorkbench()

  const [status, setStatus] = useState<GitStatus | null>(null)
  const [commits, setCommits] = useState<GitCommit[]>([])
  const [branches, setBranches] = useState<{ current: string; all: string[] }>({
    current: '',
    all: []
  })
  const [error, setError] = useState<string | null>(null)
  const [commitMsg, setCommitMsg] = useState('')
  const [committing, setCommitting] = useState(false)

  // Collapsible section toggles
  const [stagedOpen, setStagedOpen] = useState(true)
  const [unstagedOpen, setUnstagedOpen] = useState(true)
  const [untrackedOpen, setUntrackedOpen] = useState(true)
  const [logOpen, setLogOpen] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const [s, l, b] = await Promise.all([
        window.api.git.status(),
        window.api.git.log(30),
        window.api.git.branches()
      ])
      setStatus(s)
      setCommits(l)
      setBranches(b)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData, gitTick])

  const handleStage = async (e: React.MouseEvent, path: string): Promise<void> => {
    e.stopPropagation()
    try {
      setError(null)
      await window.api.git.stage(path)
      await fetchData()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  const handleUnstage = async (e: React.MouseEvent, path: string): Promise<void> => {
    e.stopPropagation()
    try {
      setError(null)
      await window.api.git.unstage(path)
      await fetchData()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  const handleRestore = async (e: React.MouseEvent, path: string): Promise<void> => {
    e.stopPropagation()
    try {
      setError(null)
      await window.api.git.restore(path)
      await fetchData()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  const handleCommit = async (): Promise<void> => {
    if (!commitMsg.trim() || committing) return
    try {
      setCommitting(true)
      setError(null)
      await window.api.git.commit(commitMsg.trim())
      setCommitMsg('')
      await fetchData()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setCommitting(false)
    }
  }

  const handleBranchChange = async (branch: string): Promise<void> => {
    if (!branch || branch === branches.current) return
    try {
      setError(null)
      await window.api.git.checkout(branch)
      await fetchData()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  if (status && !status.isRepo) {
    return (
      <div className="git-container">
        <div className="git-not-repo">目前資料夾不是 git repo</div>
      </div>
    )
  }

  const stagedCount = status?.staged.length ?? 0
  const unstagedCount = status?.unstaged.length ?? 0
  const untrackedCount = status?.untracked.length ?? 0
  const isClean = stagedCount === 0 && unstagedCount === 0 && untrackedCount === 0

  return (
    <div className="git-container">
      {/* 頂部：分支列與下拉選單 */}
      <div className="git-topbar">
        <span className="git-branch-label" title={`目前分支: ${branches.current}`}>
          ⎇
        </span>
        <select
          className="git-branch-select"
          value={branches.current}
          onChange={(e) => handleBranchChange(e.target.value)}
          title="切換分支"
        >
          {branches.all.length > 0 ? (
            branches.all.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))
          ) : (
            <option value={branches.current}>{branches.current || 'no branch'}</option>
          )}
        </select>
        <button className="git-icon-btn" onClick={fetchData} title="重新整理 Git 狀態">
          ↻
        </button>
      </div>

      {/* 錯誤通知條 */}
      {error && (
        <div className="git-banner-error">
          <span>{error}</span>
          <button className="git-icon-btn" onClick={() => setError(null)}>
            ✕
          </button>
        </div>
      )}

      {/* 捲動清單區域 */}
      <div className="git-scroll-area">
        {/* Staged Changes */}
        <div className="git-section">
          <div
            className="git-section-header"
            onClick={() => setStagedOpen(!stagedOpen)}
          >
            <span>
              {stagedOpen ? '▾' : '▸'} Staged Changes
            </span>
            <span className="git-badge">{stagedCount}</span>
          </div>

          {stagedOpen && (
            <div className="git-file-list">
              {stagedCount === 0 ? (
                <div className="git-empty-msg">無暫存變更</div>
              ) : (
                status?.staged.map((f: GitFileChange) => {
                  const { fileName, dirPath } = splitPath(f.path)
                  return (
                    <div
                      key={f.path}
                      className="git-file-row"
                      onClick={() => openDiff(f.path)}
                      title={f.path}
                    >
                      <div className="git-file-info">
                        <span className="git-file-badge git-badge-green">
                          {f.index.trim() || 'A'}
                        </span>
                        <span className="git-file-name">{fileName}</span>
                        {dirPath && <span className="git-file-path">{dirPath}</span>}
                      </div>
                      <div className="git-row-actions">
                        <button
                          className="git-action-btn git-unstage-btn"
                          onClick={(e) => handleUnstage(e, f.path)}
                          title="Unstage (取消暫存)"
                        >
                          −
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}
        </div>

        {/* Changes (unstaged) */}
        <div className="git-section">
          <div
            className="git-section-header"
            onClick={() => setUnstagedOpen(!unstagedOpen)}
          >
            <span>
              {unstagedOpen ? '▾' : '▸'} Changes
            </span>
            <span className="git-badge">{unstagedCount}</span>
          </div>

          {unstagedOpen && (
            <div className="git-file-list">
              {unstagedCount === 0 ? (
                <div className="git-empty-msg">無未暫存變更</div>
              ) : (
                status?.unstaged.map((f: GitFileChange) => {
                  const { fileName, dirPath } = splitPath(f.path)
                  return (
                    <div
                      key={f.path}
                      className="git-file-row"
                      onClick={() => openDiff(f.path)}
                      title={f.path}
                    >
                      <div className="git-file-info">
                        <span className="git-file-badge git-badge-red">
                          {f.working_dir.trim() || 'M'}
                        </span>
                        <span className="git-file-name">{fileName}</span>
                        {dirPath && <span className="git-file-path">{dirPath}</span>}
                      </div>
                      <div className="git-row-actions">
                        <button
                          className="git-action-btn git-restore-btn"
                          onClick={(e) => handleRestore(e, f.path)}
                          title="Restore (還原變更)"
                        >
                          ↺
                        </button>
                        <button
                          className="git-action-btn git-stage-btn"
                          onClick={(e) => handleStage(e, f.path)}
                          title="Stage (暫存變更)"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}
        </div>

        {/* Untracked */}
        <div className="git-section">
          <div
            className="git-section-header"
            onClick={() => setUntrackedOpen(!untrackedOpen)}
          >
            <span>
              {untrackedOpen ? '▾' : '▸'} Untracked
            </span>
            <span className="git-badge">{untrackedCount}</span>
          </div>

          {untrackedOpen && (
            <div className="git-file-list">
              {untrackedCount === 0 ? (
                <div className="git-empty-msg">無未追蹤檔案</div>
              ) : (
                status?.untracked.map((filePath: string) => {
                  const { fileName, dirPath } = splitPath(filePath)
                  return (
                    <div
                      key={filePath}
                      className="git-file-row"
                      onClick={() => openDiff(filePath)}
                      title={filePath}
                    >
                      <div className="git-file-info">
                        <span className="git-file-badge git-badge-green">U</span>
                        <span className="git-file-name">{fileName}</span>
                        {dirPath && <span className="git-file-path">{dirPath}</span>}
                      </div>
                      <div className="git-row-actions">
                        <button
                          className="git-action-btn git-stage-btn"
                          onClick={(e) => handleStage(e, filePath)}
                          title="Stage (暫存變更)"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}
        </div>

        {isClean && (
          <div className="git-empty-msg" style={{ textAlign: 'center', padding: '16px 0' }}>
            工作區乾淨，無任何變更
          </div>
        )}

        {/* Recent Commits / Log */}
        <div className="git-section git-log-section">
          <div
            className="git-section-header"
            onClick={() => setLogOpen(!logOpen)}
          >
            <span>
              {logOpen ? '▾' : '▸'} Recent Commits
            </span>
            <span className="git-badge">{commits.length}</span>
          </div>

          {logOpen && (
            <div className="git-file-list">
              {commits.length === 0 ? (
                <div className="git-empty-msg">無歷史提交</div>
              ) : (
                commits.map((c: GitCommit) => (
                  <div key={c.hash} className="git-log-item" title={c.message}>
                    <div className="git-log-header">
                      <span className="git-log-hash">{c.hash}</span>
                      <span className="git-log-date">{formatDate(c.date)}</span>
                    </div>
                    <div className="git-log-msg">{c.message}</div>
                    <div className="git-log-author">{c.author}</div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* 底部：Commit 訊息與按鈕 */}
      <div className="git-commit-box">
        <textarea
          className="git-commit-textarea"
          value={commitMsg}
          onChange={(e) => setCommitMsg(e.target.value)}
          placeholder="Commit message (Ctrl+Enter to commit)..."
          rows={3}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
              e.preventDefault()
              handleCommit()
            }
          }}
        />
        <button
          className="git-commit-btn"
          disabled={committing || !commitMsg.trim() || stagedCount === 0}
          onClick={handleCommit}
          title={
            stagedCount === 0
              ? '請先暫存變更 (Stage) 再進行提交'
              : '提交暫存變更 (Ctrl+Enter)'
          }
        >
          {committing ? 'Committing...' : 'Commit'}
        </button>
      </div>
    </div>
  )
}
