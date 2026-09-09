import { useState } from 'react'
import FileTreePanel from '@panels/filetree/FileTreePanel'
import GitPanel from '@panels/git/GitPanel'
import EditorPanel from '@panels/editor/EditorPanel'
import PreviewPanel from '@panels/preview/PreviewPanel'
import MemoryPanel from '@panels/memory/MemoryPanel'
import TerminalPanel from '@panels/terminal/TerminalPanel'

type LeftTab = 'files' | 'git'
type CenterTab = 'editor' | 'preview' | 'memory'

// 三欄殼：左（Files/Git）｜中（Editor/Preview/Memory）｜右（CLI 終端殼）
// 這個檔由 Master 擁有，worker 只實作各自 panel，不動這裡。
export default function App(): JSX.Element {
  const [left, setLeft] = useState<LeftTab>('files')
  const [center, setCenter] = useState<CenterTab>('editor')

  return (
    <div className="app">
      <aside className="col col-left">
        <div className="tabbar">
          <button className={left === 'files' ? 'on' : ''} onClick={() => setLeft('files')}>
            檔案
          </button>
          <button className={left === 'git' ? 'on' : ''} onClick={() => setLeft('git')}>
            Git
          </button>
        </div>
        <div className="panel-body">
          <div hidden={left !== 'files'} className="fill">
            <FileTreePanel />
          </div>
          <div hidden={left !== 'git'} className="fill">
            <GitPanel />
          </div>
        </div>
      </aside>

      <main className="col col-center">
        <div className="tabbar">
          <button className={center === 'editor' ? 'on' : ''} onClick={() => setCenter('editor')}>
            編輯 / Diff
          </button>
          <button className={center === 'preview' ? 'on' : ''} onClick={() => setCenter('preview')}>
            預覽
          </button>
          <button className={center === 'memory' ? 'on' : ''} onClick={() => setCenter('memory')}>
            Memory
          </button>
        </div>
        <div className="panel-body">
          <div hidden={center !== 'editor'} className="fill">
            <EditorPanel />
          </div>
          <div hidden={center !== 'preview'} className="fill">
            <PreviewPanel />
          </div>
          <div hidden={center !== 'memory'} className="fill">
            <MemoryPanel />
          </div>
        </div>
      </main>

      <section className="col col-right">
        <div className="tabbar static">
          <span>Agent 終端</span>
        </div>
        <div className="panel-body">
          <TerminalPanel />
        </div>
      </section>
    </div>
  )
}
