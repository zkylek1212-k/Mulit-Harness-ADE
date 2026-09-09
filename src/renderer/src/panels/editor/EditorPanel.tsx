// [Task A] STUB —— Monaco 編輯器 + Diff。訂閱 @/store useWorkbench()：
//   viewMode==='edit' → 一般編輯 activeFilePath（api.files.read/write，Ctrl+S 存檔後 bumpGit()）
//   viewMode==='diff' → MonacoDiffEditor，內容用 api.git.diff(activeFilePath) 的 {head, work}
export default function EditorPanel(): JSX.Element {
  return (
    <div className="panel-stub">
      Monaco 編輯器 / Diff —— 待實作 (<code>[Task A]</code>)
    </div>
  )
}
