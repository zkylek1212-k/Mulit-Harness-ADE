import { ipcMain, app, BrowserWindow } from 'electron'
import * as pty from '@lydell/node-pty'
import * as fs from 'fs'
import * as path from 'path'
import * as yaml from 'js-yaml'
import * as crypto from 'crypto'
import { workspace } from '../index'
import type { CliLauncher, PtySpawnOptions } from '../../preload/index'

const ptySessions = new Map<string, pty.IPty>()

app.on('before-quit', () => {
  for (const session of ptySessions.values()) {
    try {
      session.kill()
    } catch (e) {
      // ignore
    }
  }
  ptySessions.clear()
})

export function registerPtyHandlers(): void {
  ipcMain.handle('pty:launchers', async () => {
    const agentsDir = path.join(workspace.root, 'agents')
    const launchers: CliLauncher[] = []
    
    if (!fs.existsSync(agentsDir)) {
      return launchers
    }

    try {
      const files = fs.readdirSync(agentsDir)
      for (const file of files) {
        if (file.endsWith('.yaml') || file.endsWith('.yml')) {
          const content = fs.readFileSync(path.join(agentsDir, file), 'utf8')
          const parsed = yaml.load(content) as any
          if (parsed && parsed.launcher) {
            const l = parsed.launcher
            launchers.push({
              id: l.id,
              name: l.name,
              cli: l.cli,
              command: l.cli,
              args: l.args || [],
              env: l.env || {}
            })
          }
        }
      }
    } catch (e) {
      console.error('Error reading launchers:', e)
    }
    
    return launchers
  })

  ipcMain.handle('pty:spawn', async (event, opts: PtySpawnOptions) => {
    let command = opts.command || (process.platform === 'win32' ? 'cmd.exe' : 'bash')
    let args = opts.args || []
    let env = { ...process.env }
    
    if (opts.launcherId) {
      const agentsDir = path.join(workspace.root, 'agents')
      if (fs.existsSync(agentsDir)) {
        const files = fs.readdirSync(agentsDir)
        for (const file of files) {
          if (file.endsWith('.yaml') || file.endsWith('.yml')) {
            const content = fs.readFileSync(path.join(agentsDir, file), 'utf8')
            const parsed = yaml.load(content) as any
            if (parsed && parsed.launcher && parsed.launcher.id === opts.launcherId) {
              const l = parsed.launcher
              command = l.cli
              args = l.args || []
              env = { ...env, ...(l.env || {}) }
              break
            }
          }
        }
      }
    }
    
    const id = crypto.randomUUID()
    const cols = opts.cols || 80
    const rows = opts.rows || 24
    
    try {
      const ptyProcess = pty.spawn(command, args, {
        name: 'xterm-color',
        cols,
        rows,
        cwd: workspace.root,
        env: env as Record<string, string>
      })
      
      ptySessions.set(id, ptyProcess)
      
      ptyProcess.onData((data) => {
        event.sender.send(`pty:data:${id}`, data)
      })
      
      ptyProcess.onExit(({ exitCode }) => {
        event.sender.send(`pty:exit:${id}`, exitCode)
        ptySessions.delete(id)
      })
      
      return id
    } catch (e: any) {
      throw new Error(`Failed to spawn terminal: ${e.message}`)
    }
  })

  ipcMain.on('pty:write', (event, id: string, data: string) => {
    const session = ptySessions.get(id)
    if (session) {
      session.write(data)
    }
  })

  ipcMain.on('pty:resize', (event, id: string, cols: number, rows: number) => {
    const session = ptySessions.get(id)
    if (session) {
      try {
        session.resize(cols, rows)
      } catch (e) {
        // ignore
      }
    }
  })

  ipcMain.on('pty:kill', (event, id: string) => {
    const session = ptySessions.get(id)
    if (session) {
      try {
        session.kill()
      } catch (e) {
        // ignore
      }
      ptySessions.delete(id)
    }
  })
}
