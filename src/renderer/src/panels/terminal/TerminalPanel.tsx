import React, { useEffect, useState, useRef, useMemo } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'
import { useWorkbench } from '@/store'
import type { CliLauncher } from '../../../../preload/index'

interface TerminalSession {
  id: string
  title: string
  term: Terminal
  fitAddon: FitAddon
  ptyId?: string
  disposables: (() => void)[]
  isExited: boolean
}

export default function TerminalPanel(): JSX.Element {
  const { theme } = useWorkbench()
  const [launchers, setLaunchers] = useState<CliLauncher[]>([])
  const [selectedLauncher, setSelectedLauncher] = useState<string>('')
  const [sessions, setSessions] = useState<TerminalSession[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  
  const containerRef = useRef<HTMLDivElement>(null)
  
  const termTheme = useMemo(() => {
    return theme === 'dark'
      ? { background: '#1e1e1e', foreground: '#d4d4d4', cursor: '#d4d4d4' }
      : { background: '#ffffff', foreground: '#1d1d1f', cursor: '#1d1d1f' }
  }, [theme])

  // Update themes when changed
  useEffect(() => {
    sessions.forEach(s => {
      s.term.options.theme = termTheme
    })
  }, [termTheme, sessions])

  useEffect(() => {
    window.api.pty.launchers().then(list => {
      setLaunchers(list)
      if (list.length > 0) {
        setSelectedLauncher(list[0].id)
      } else {
        setSelectedLauncher('claude')
      }
    })
  }, [])

  const handleNewTerminal = async () => {
    const sessionId = crypto.randomUUID()
    const term = new Terminal({ theme: termTheme, fontFamily: 'monospace' })
    const fitAddon = new FitAddon()
    term.loadAddon(fitAddon)

    const title = launchers.find(l => l.id === selectedLauncher)?.name || selectedLauncher

    const newSession: TerminalSession = {
      id: sessionId,
      title,
      term,
      fitAddon,
      disposables: [],
      isExited: false
    }

    setSessions(prev => [...prev, newSession])
    setActiveSessionId(sessionId)
  }

  const closeTerminal = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setSessions(prev => {
      const idx = prev.findIndex(s => s.id === id)
      if (idx === -1) return prev
      const session = prev[idx]
      
      if (session.ptyId) {
        window.api.pty.kill(session.ptyId)
      }
      session.disposables.forEach(d => d())
      session.term.dispose()
      
      const next = [...prev]
      next.splice(idx, 1)
      
      if (activeSessionId === id) {
        if (next.length > 0) {
          setActiveSessionId(next[Math.max(0, idx - 1)].id)
        } else {
          setActiveSessionId(null)
        }
      }
      return next
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'var(--bg)' }}>
      <div style={{
        display: 'flex', 
        padding: '8px', 
        borderBottom: '1px solid var(--border)',
        backgroundColor: 'var(--bg2)',
        gap: '8px',
        alignItems: 'center'
      }}>
        <select 
          value={selectedLauncher} 
          onChange={e => setSelectedLauncher(e.target.value)}
          style={{
            padding: '4px 8px',
            borderRadius: '4px',
            border: '1px solid var(--border)',
            background: 'var(--bg)',
            color: 'inherit'
          }}
        >
          {launchers.length > 0 ? (
            launchers.map(l => <option key={l.id} value={l.id}>{l.name}</option>)
          ) : (
            <>
              <option value="claude">claude</option>
              <option value="codex">codex</option>
              <option value="antigravity">antigravity</option>
            </>
          )}
        </select>
        <button 
          onClick={handleNewTerminal}
          style={{
            padding: '4px 12px',
            borderRadius: '4px',
            border: '1px solid var(--accent)',
            background: 'var(--accent)',
            color: '#fff',
            cursor: 'pointer'
          }}
        >
          ＋ 新終端
        </button>

        <div style={{ display: 'flex', gap: '4px', marginLeft: '16px', overflowX: 'auto' }}>
          {sessions.map(s => (
            <div 
              key={s.id} 
              onClick={() => setActiveSessionId(s.id)}
              style={{
                padding: '4px 8px',
                borderRadius: '4px',
                border: `1px solid ${activeSessionId === s.id ? 'var(--accent)' : 'var(--border)'}`,
                background: activeSessionId === s.id ? 'var(--bg)' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                opacity: s.isExited ? 0.6 : 1
              }}
            >
              <span style={{ fontSize: '12px' }}>{s.title}</span>
              <button 
                onClick={(e) => closeTerminal(s.id, e)}
                style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', padding: '0 4px' }}
              >×</button>
            </div>
          ))}
        </div>
      </div>
      
      <div ref={containerRef} style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {sessions.map(s => (
          <TerminalInstance 
            key={s.id} 
            session={s} 
            isActive={s.id === activeSessionId} 
            selectedLauncher={launchers.find(l => l.name === s.title)?.id || s.title}
            setSessions={setSessions}
          />
        ))}
      </div>
    </div>
  )
}

function TerminalInstance({ 
  session, 
  isActive, 
  selectedLauncher,
  setSessions
}: { 
  session: TerminalSession
  isActive: boolean
  selectedLauncher: string
  setSessions: React.Dispatch<React.SetStateAction<TerminalSession[]>>
}) {
  const elRef = useRef<HTMLDivElement>(null)
  const mounted = useRef(false)

  useEffect(() => {
    if (!elRef.current || mounted.current) return
    mounted.current = true

    session.term.open(elRef.current)
    session.fitAddon.fit()

    const opts: any = {}
    if (selectedLauncher === 'claude' || selectedLauncher === 'codex' || selectedLauncher === 'antigravity') {
      opts.command = selectedLauncher
    } else {
      opts.launcherId = selectedLauncher
    }
    
    opts.cols = session.term.cols
    opts.rows = session.term.rows

    window.api.pty.spawn(opts).then(ptyId => {
      setSessions(prev => prev.map(s => s.id === session.id ? { ...s, ptyId } : s))

      const unsubData = window.api.pty.onData(ptyId, data => {
        session.term.write(data)
      })
      
      const unsubExit = window.api.pty.onExit(ptyId, code => {
        setSessions(prev => prev.map(s => s.id === session.id ? { ...s, isExited: true, title: `${s.title} ( exited ${code} )` } : s))
      })

      const termDataDisp = session.term.onData(data => {
        window.api.pty.write(ptyId, data)
      })

      session.disposables.push(unsubData, unsubExit, () => termDataDisp.dispose())
    })

    const ro = new ResizeObserver(() => {
      try {
        session.fitAddon.fit()
        if (session.ptyId) {
          window.api.pty.resize(session.ptyId, session.term.cols, session.term.rows)
        }
      } catch (e) {}
    })
    ro.observe(elRef.current)
    session.disposables.push(() => ro.disconnect())

  }, [])

  useEffect(() => {
    if (isActive && mounted.current) {
      setTimeout(() => {
        try {
          session.fitAddon.fit()
          if (session.ptyId) {
            window.api.pty.resize(session.ptyId, session.term.cols, session.term.rows)
          }
        } catch (e) {}
      }, 0)
    }
  }, [isActive])

  return (
    <div 
      ref={elRef} 
      style={{ 
        position: 'absolute', 
        top: 0, left: 0, right: 0, bottom: 0, 
        padding: '8px',
        visibility: isActive ? 'visible' : 'hidden',
        pointerEvents: isActive ? 'auto' : 'none'
      }} 
    />
  )
}
