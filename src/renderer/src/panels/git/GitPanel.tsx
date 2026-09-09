import { useEffect, useState } from 'react'
import { openDiff, useWorkbench } from '@/store'

export default function GitPanel(): JSX.Element {
  const { gitTick } = useWorkbench()
  const [status, setStatus] = useState<any>(null)
  const [logs, setLogs] = useState<any[]>([])
  const [branches, setBranches] = useState<{current: string, all: string[]}>({ current: '', all: [] })
  const [message, setMessage] = useState('')

  const refresh = async () => {
    try {
      const s = await window.api.git.status()
      setStatus(s)
      if (s.isRepo) {
        const l = await window.api.git.log(30)
        setLogs(l)
        const b = await window.api.git.branches()
        setBranches(b)
      }
    } catch (e) {
      console.error('Failed to refresh git', e)
    }
  }

  useEffect(() => {
    refresh()
  }, [gitTick])

  if (!status) return <div style={{ padding: 10, color: 'var(--fg)' }}>Loading...</div>
  if (!status.isRepo) return <div style={{ padding: 10, color: 'var(--fg)' }}>目前資料夾不是 git repo</div>

  const handleStage = async (path: string) => { await window.api.git.stage(path); refresh() }
  const handleUnstage = async (path: string) => { await window.api.git.unstage(path); refresh() }
  const handleRestore = async (path: string) => { await window.api.git.restore(path); refresh() }
  const handleCommit = async () => {
    if (!message) return
    await window.api.git.commit(message)
    setMessage('')
    refresh()
  }
  const handleCheckout = async (b: string) => { await window.api.git.checkout(b); refresh() }

  return (
    <div style={{ padding: 10, color: 'var(--fg)', backgroundColor: 'var(--bg2)', height: '100%', overflowY: 'auto' }}>
      <div style={{ marginBottom: 10 }}>
        Branch: 
        <select value={branches.current} onChange={e => handleCheckout(e.target.value)} style={{ marginLeft: 5, background: 'var(--bg2)', color: 'var(--fg)' }}>
          {branches.all.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>

      <div style={{ fontWeight: 'bold', marginTop: 10 }}>Staged Changes</div>
      {status.staged.length === 0 && <div style={{ opacity: 0.5 }}>No staged changes</div>}
      {status.staged.map((f: any) => (
        <div key={f.path} style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0' }}>
          <span style={{ cursor: 'pointer', color: 'var(--green)' }} onClick={() => openDiff(f.path)}>{f.path}</span>
          <button onClick={() => handleUnstage(f.path)} style={{ background: 'var(--bg2)', color: 'var(--fg)' }}>−</button>
        </div>
      ))}

      <div style={{ fontWeight: 'bold', marginTop: 10 }}>Changes</div>
      {status.unstaged.length === 0 && <div style={{ opacity: 0.5 }}>No unstaged changes</div>}
      {status.unstaged.map((f: any) => (
        <div key={f.path} style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0' }}>
          <span style={{ cursor: 'pointer', color: 'var(--accent)' }} onClick={() => openDiff(f.path)}>{f.path}</span>
          <div>
            <button onClick={() => handleRestore(f.path)} style={{ background: 'var(--bg2)', color: 'var(--fg)', marginRight: 5 }}>↺ 還原</button>
            <button onClick={() => handleStage(f.path)} style={{ background: 'var(--bg2)', color: 'var(--fg)' }}>+</button>
          </div>
        </div>
      ))}

      <div style={{ fontWeight: 'bold', marginTop: 10 }}>Untracked</div>
      {status.untracked.length === 0 && <div style={{ opacity: 0.5 }}>No untracked files</div>}
      {status.untracked.map((f: any) => (
        <div key={f} style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0' }}>
          <span style={{ cursor: 'pointer', color: 'var(--accent)' }} onClick={() => openDiff(f)}>{f}</span>
          <button onClick={() => handleStage(f)} style={{ background: 'var(--bg2)', color: 'var(--fg)' }}>+</button>
        </div>
      ))}

      <div style={{ marginTop: 20 }}>
        <input 
          type="text" 
          value={message} 
          onChange={e => setMessage(e.target.value)} 
          placeholder="Commit message"
          style={{ width: '100%', marginBottom: 5, background: 'var(--bg2)', color: 'var(--fg)', border: '1px solid var(--fg)' }}
        />
        <button onClick={handleCommit} style={{ width: '100%', background: 'var(--bg2)', color: 'var(--fg)' }}>Commit</button>
      </div>

      <div style={{ fontWeight: 'bold', marginTop: 20 }}>Log</div>
      {logs.map(l => (
        <div key={l.hash} style={{ fontSize: '0.9em', borderBottom: '1px solid #444', padding: '4px 0' }}>
          <div style={{ color: 'var(--accent)' }}>{l.hash} - {l.message}</div>
          <div style={{ opacity: 0.7 }}>{l.author} @ {l.date}</div>
        </div>
      ))}
    </div>
  )
}
