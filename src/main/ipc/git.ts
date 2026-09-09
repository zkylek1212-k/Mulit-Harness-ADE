import { ipcMain } from 'electron'
import simpleGit from 'simple-git'
import path from 'path'
import fs from 'fs/promises'
import { workspace } from '../index'
import type { GitStatus, GitCommit, GitFileChange } from '../../preload/index'

export function registerGitHandlers(): void {
  const getGit = () => simpleGit(workspace.root)

  // git:status -> GitStatus
  ipcMain.handle('git:status', async (): Promise<GitStatus> => {
    try {
      const git = getGit()
      const isRepo = await git.checkIsRepo()
      if (!isRepo) {
        return { isRepo: false, current: '', staged: [], unstaged: [], untracked: [] }
      }

      const status = await git.status()
      const staged: GitFileChange[] = status.files
        .filter((f) => f.index && f.index.trim() !== '' && f.index !== '?')
        .map((f) => ({ path: f.path, index: f.index, working_dir: f.working_dir }))

      const unstaged: GitFileChange[] = status.files
        .filter((f) => f.working_dir && f.working_dir.trim() !== '')
        .map((f) => ({ path: f.path, index: f.index, working_dir: f.working_dir }))

      const untracked: string[] = status.not_added || []

      return {
        isRepo: true,
        current: status.current || '',
        staged,
        unstaged,
        untracked
      }
    } catch {
      return { isRepo: false, current: '', staged: [], unstaged: [], untracked: [] }
    }
  })

  // git:log (limit=50) -> GitCommit[]
  ipcMain.handle('git:log', async (_event, limit?: number): Promise<GitCommit[]> => {
    try {
      const git = getGit()
      const isRepo = await git.checkIsRepo()
      if (!isRepo) return []

      const maxCount = typeof limit === 'number' && limit > 0 ? limit : 50
      const logResult = await git.log({ maxCount })
      return logResult.all.map((c) => ({
        hash: c.hash.slice(0, 7),
        date: c.date,
        message: c.message,
        author: c.author_name
      }))
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      if (
        msg.includes('does not have any commits yet') ||
        msg.includes('bad default revision')
      ) {
        return []
      }
      throw new Error(`git:log failed: ${msg}`)
    }
  })

  // git:diff (path) -> { head: string; work: string }
  ipcMain.handle(
    'git:diff',
    async (_event, filePath: string): Promise<{ head: string; work: string }> => {
      try {
        const git = getGit()
        let relPath = path.isAbsolute(filePath)
          ? path.relative(workspace.root, filePath)
          : filePath
        relPath = relPath.replace(/\\/g, '/')

        const absPath = path.isAbsolute(filePath)
          ? filePath
          : path.resolve(workspace.root, filePath)

        let head = ''
        try {
          head = await git.show([`HEAD:${relPath}`])
        } catch {
          head = ''
        }

        let work = ''
        try {
          work = await fs.readFile(absPath, 'utf-8')
        } catch {
          work = ''
        }

        return { head, work }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        throw new Error(`git:diff failed: ${msg}`)
      }
    }
  )

  // git:stage (path) -> git.add(path)
  ipcMain.handle('git:stage', async (_event, filePath: string): Promise<void> => {
    try {
      const git = getGit()
      const relPath = path.isAbsolute(filePath)
        ? path.relative(workspace.root, filePath)
        : filePath
      await git.add(relPath.replace(/\\/g, '/'))
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      throw new Error(`git:stage failed: ${msg}`)
    }
  })

  // git:unstage (path) -> git.reset(['--', path])
  ipcMain.handle('git:unstage', async (_event, filePath: string): Promise<void> => {
    try {
      const git = getGit()
      const relPath = path.isAbsolute(filePath)
        ? path.relative(workspace.root, filePath)
        : filePath
      await git.reset(['--', relPath.replace(/\\/g, '/')])
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      throw new Error(`git:unstage failed: ${msg}`)
    }
  })

  // git:restore (path) -> git.checkout(['--', path])
  ipcMain.handle('git:restore', async (_event, filePath: string): Promise<void> => {
    try {
      const git = getGit()
      const relPath = path.isAbsolute(filePath)
        ? path.relative(workspace.root, filePath)
        : filePath
      await git.checkout(['--', relPath.replace(/\\/g, '/')])
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      throw new Error(`git:restore failed: ${msg}`)
    }
  })

  // git:commit (message) -> git.commit(message)
  ipcMain.handle('git:commit', async (_event, message: string): Promise<void> => {
    try {
      if (!message || !message.trim()) {
        throw new Error('Commit message cannot be empty')
      }
      const git = getGit()
      await git.commit(message)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      throw new Error(`git:commit failed: ${msg}`)
    }
  })

  // git:branches () -> git.branchLocal() returning { current, all }
  ipcMain.handle('git:branches', async (): Promise<{ current: string; all: string[] }> => {
    try {
      const git = getGit()
      const res = await git.branchLocal()
      return {
        current: res.current || '',
        all: res.all || []
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      throw new Error(`git:branches failed: ${msg}`)
    }
  })

  // git:checkout (branch) -> git.checkout(branch)
  ipcMain.handle('git:checkout', async (_event, branch: string): Promise<void> => {
    try {
      const git = getGit()
      await git.checkout(branch)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      throw new Error(`git:checkout failed: ${msg}`)
    }
  })
}
