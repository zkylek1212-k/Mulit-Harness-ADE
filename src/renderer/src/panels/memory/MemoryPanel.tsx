import { useState, useEffect, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useWorkbench } from '@/store'
import './memory.css'

interface MemoryDoc {
  key: string
  label: string
  relPath: string
  content: string
}

const MEMORY_FILES = [
  { key: 'handoff', label: 'handoff.md', relPath: '.project-memory/handoff.md' },
  { key: 'state', label: 'STATE.md', relPath: '.project-memory/STATE.md' },
  { key: 'decisions', label: 'DECISIONS.md', relPath: '.project-memory/DECISIONS.md' }
]

export default function MemoryPanel(): JSX.Element {
  const { gitTick } = useWorkbench()
  const [docs, setDocs] = useState<MemoryDoc[]>([])
  const [activeKey, setActiveKey] = useState<string>('handoff')
  const [loading, setLoading] = useState<boolean>(true)
  const [manualTick, setManualTick] = useState<number>(0)

  const loadMemoryDocs = useCallback(async () => {
    setLoading(true)
    try {
      let root = ''
      try {
        root = await window.api.files.workspaceRoot()
      } catch (e) {
        console.warn('files.workspaceRoot failed:', e)
      }

      const normalizedRoot = root ? root.replace(/\\/g, '/').replace(/\/+$/, '') : ''
      const loaded: MemoryDoc[] = []

      for (const item of MEMORY_FILES) {
        let content: string | null = null
        const targetPath = normalizedRoot ? `${normalizedRoot}/${item.relPath}` : item.relPath
        try {
          content = await window.api.files.read(targetPath)
        } catch {
          try {
            content = await window.api.files.read(item.relPath)
          } catch {
            content = null
          }
        }

        if (content !== null && typeof content === 'string') {
          loaded.push({
            key: item.key,
            label: item.label,
            relPath: item.relPath,
            content
          })
        }
      }

      setDocs(loaded)
      // 若目前選取的 activeKey 不在存在的清單內，切換為第一份存在的文件
      if (loaded.length > 0 && !loaded.some((d) => d.key === activeKey)) {
        setActiveKey(loaded[0].key)
      }
    } catch (err) {
      console.warn('Failed to load memory docs:', err)
      setDocs([])
    } finally {
      setLoading(false)
    }
  }, [activeKey])

  useEffect(() => {
    loadMemoryDocs()
  }, [loadMemoryDocs, gitTick, manualTick])

  const handleRefresh = (): void => {
    setManualTick((t) => t + 1)
  }

  // 三份都讀不到時顯示專屬提示卡片
  if (!loading && docs.length === 0) {
    return (
      <div className="memory-panel-container">
        <div className="memory-empty-container">
          <div className="memory-empty-card">
            <div className="memory-empty-icon">
              <svg viewBox="0 0 24 24" strokeWidth="1.5">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="M7 15h0" />
                <path d="M2 9.5h20" />
              </svg>
            </div>
            <div className="memory-empty-title">
              尚未安裝 ShareProjectMem（.project-memory/handoff.md 不存在）
            </div>
            <p className="memory-empty-desc">
              ShareProjectMem 是跨官方 CLI（Claude Code / Codex / Antigravity）與跨機協作的共享大腦與交棒核心。
              請確認工作區根目錄已建立 <code>.project-memory/handoff.md</code>。
            </p>
            <button className="memory-btn" onClick={handleRefresh}>
              <svg viewBox="0 0 24 24">
                <path d="M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
              </svg>
              <span>重新整理</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  const currentDoc = docs.find((d) => d.key === activeKey) || docs[0]

  return (
    <div className="memory-panel-container">
      {/* 頂部工具列與分頁切換 */}
      <div className="memory-toolbar">
        <div className="memory-tabs">
          {docs.map((doc) => (
            <button
              key={doc.key}
              className={`memory-tab-btn ${currentDoc?.key === doc.key ? 'active' : ''}`}
              onClick={() => setActiveKey(doc.key)}
            >
              {doc.label}
            </button>
          ))}
        </div>

        <div className="memory-actions">
          <span className="memory-badge">ShareProjectMem</span>
          <button
            className="memory-btn"
            onClick={handleRefresh}
            title="重新載入記憶文件"
            disabled={loading}
          >
            <svg viewBox="0 0 24 24">
              <path d="M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
            </svg>
            <span>重新整理</span>
          </button>
        </div>
      </div>

      {/* 內容渲染區 */}
      <div className="memory-content">
        {currentDoc ? (
          <div className="memory-markdown-body">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                a({ href, children, ...props }) {
                  return (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      {...props}
                    >
                      {children}
                    </a>
                  )
                }
              }}
            >
              {currentDoc.content}
            </ReactMarkdown>
          </div>
        ) : null}
      </div>
    </div>
  )
}
