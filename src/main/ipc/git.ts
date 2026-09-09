import { ipcMain } from 'electron'
import simpleGit from 'simple-git'
import path from 'path'
import fs from 'fs/promises'
import { workspace } from '../index'
import type { GitStatus, GitCommit, GitFileChange } from '../../preload/index'

export function registerGitHandlers(): void {
  // git:status -> GitStatus
  ipcMain.handle('git:status', async (): Promise<GitStatus> => {
    try {
      const git = simpleGit(workspace.root)
      const isRepo = await git.checkIsRepo()
      if (!isRepo) {
        return { isRepo: false, current: '', staged: [], unstaged: [], untracked: [] }
      }

      const status = await git.status()
      const untracked = status.not_added
      return { isRepo: true, current: status.current, staged, unstaged, untracked }
    } catch (e: any) {
      throw new Error(`git status failed: ${e.message}`)
    }
  })

  ipcMain.handle('git:log', async (_, limit: number = 50) => {
    try {
      const log = await getGit().log({ maxCount: limit })
      return log.all.map(c => ({
        hash: c.hash.substring(0, 7),
        date: c.date,
        message: c.message,
        author: c.author_name
      }))
    } catch (e: any) {
      throw new Error(`git log failed: ${e.message}`)
    }
  })

  ipcMain.handle('git:diff', async (_, filepath: string) => {
    try {
      let relPath = filepath
      if (path.isAbsolute(filepath)) {
        relPath = path.relative(workspace.root, filepath)
      }
      // Replace backslashes with forward slashes for git
      relPath = relPath.replace(/\\/g, '/')
      let head = ''
      try {
        head = await getGit().show(['HEAD:' + relPath])
      } catch (e) {
        // Not in HEAD, keep head = ''
      }
      let work = ''
      try {
        const fullPath = path.isAbsolute(filepath) ? filepath : path.join(workspace.root, filepath)
        work = await fs.readFile(fullPath, 'utf8')
      } catch (e) {
        // file doesn't exist, work = ''
      }
      return { head, work }
    } catch (e: any) {
      throw new Error(`git diff failed: ${e.message}`)
    }
  })

  ipcMain.handle('git:stage', async (_, filepath: string) => {
    try {
      await getGit().add(filepath)
    } catch (e: any) {
      throw new Error(`git stage failed: ${e.message}`)
    }
  })

  ipcMain.handle('git:unstage', async (_, filepath: string) => {
    try {
      await getGit().reset(['--', filepath])
    } catch (e: any) {
      throw new Error(`git unstage failed: ${e.message}`)
    }
  })

  ipcMain.handle('git:restore', async (_, filepath: string) => {
    try {
      await getGit().checkout(['--', filepath])
    } catch (e: any) {
      throw new Error(`git restore failed: ${e.message}`)
    }
  })

  ipcMain.handle('git:commit', async (_, message: string) => {
    try {
      await getGit().commit(message)
    } catch (e: any) {
      throw new Error(`git commit failed: ${e.message}`)
    }
  })

  ipcMain.handle('git:branches', async () => {
    try {
      const branches = await getGit().branchLocal()
      return { current: branches.current, all: branches.all }
    } catch (e: any) {
      throw new Error(`git branches failed: ${e.message}`)
    }
  })

  ipcMain.handle('git:checkout', async (_, branch: string) => {
    try {
      await getGit().checkout(branch)
    } catch (e: any) {
      throw new Error(`git checkout failed: ${e.message}`)
    }
  })
}
