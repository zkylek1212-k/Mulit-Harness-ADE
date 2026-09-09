// [Task D] STUB —— CLI 終端殼。用 @xterm/xterm + @xterm/addon-fit + window.api.pty.*：
//   上方 launcher 下拉（api.pty.launchers() 來自 agents/*.yaml）+ 「新終端」鈕，每個 session 一分頁。
//   spawn → onData 寫進 xterm，xterm onData → api.pty.write；resize → api.pty.resize；關閉 kill。
export default function TerminalPanel(): JSX.Element {
  return (
    <div className="panel-stub">
      Agent CLI 終端 (xterm + node-pty) —— 待實作 (<code>[Task D]</code>)
    </div>
  )
}
