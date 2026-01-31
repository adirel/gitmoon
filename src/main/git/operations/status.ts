import * as dugite from 'dugite';
import type { RepositoryStatus, FileChange } from '../../../shared/types/git';

/**
 * Get repository status (staged, unstaged, untracked files)
 * @param repoPath - Absolute path to the repository
 * @returns Repository status
 */
export async function getStatus(repoPath: string): Promise<RepositoryStatus> {
  const result = await dugite.GitProcess.exec(
    ['status', '--porcelain=v1', '--branch', '-z'],
    repoPath
  );

  if (result.exitCode !== 0) {
    throw new Error(`Failed to get status: ${result.stderr}`);
  }

  return parseStatus(result.stdout);
}

/**
 * Stage files
 * @param repoPath - Absolute path to the repository
 * @param files - Array of file paths to stage (relative to repo root)
 */
export async function stageFiles(repoPath: string, files: string[]): Promise<void> {
  if (files.length === 0) return;

  const result = await dugite.GitProcess.exec(['add', '--', ...files], repoPath);

  if (result.exitCode !== 0) {
    throw new Error(`Failed to stage files: ${result.stderr}`);
  }
}

/**
 * Unstage files
 * @param repoPath - Absolute path to the repository
 * @param files - Array of file paths to unstage
 */
export async function unstageFiles(repoPath: string, files: string[]): Promise<void> {
  if (files.length === 0) return;

  const result = await dugite.GitProcess.exec(['reset', 'HEAD', '--', ...files], repoPath);

  if (result.exitCode !== 0) {
    throw new Error(`Failed to unstage files: ${result.stderr}`);
  }
}

/**
 * Commit staged changes
 * @param repoPath - Absolute path to the repository
 * @param message - Commit message
 */
export async function commit(repoPath: string, message: string): Promise<void> {
  // Sanitize message to prevent command injection
  const sanitizedMessage = message.replace(/["'`]/g, '');
  
  const result = await dugite.GitProcess.exec(['commit', '-m', sanitizedMessage], repoPath);

  if (result.exitCode !== 0) {
    throw new Error(`Failed to commit: ${result.stderr}`);
  }
}

function parseStatus(output: string): RepositoryStatus {
  const entries = output.split('\0').filter((e) => e.trim());
  
  let branch = 'unknown';
  let ahead = 0;
  let behind = 0;
  const staged: FileChange[] = [];
  const unstaged: FileChange[] = [];
  const untracked: string[] = [];
  const conflicted: string[] = [];

  for (const entry of entries) {
    if (entry.startsWith('##')) {
      // Branch info
      const branchInfo = entry.substring(3);
      const branchMatch = branchInfo.match(/^([^\s.]+)/);
      if (branchMatch) {
        branch = branchMatch[1];
      }
      
      const aheadMatch = branchInfo.match(/ahead (\d+)/);
      const behindMatch = branchInfo.match(/behind (\d+)/);
      if (aheadMatch) ahead = parseInt(aheadMatch[1]);
      if (behindMatch) behind = parseInt(behindMatch[1]);
      continue;
    }

    if (entry.length < 3) continue;

    const stagedStatus = entry[0];
    const unstagedStatus = entry[1];
    const filePath = entry.substring(3);

    // Check for conflicts
    if (stagedStatus === 'U' || unstagedStatus === 'U' || (stagedStatus === 'A' && unstagedStatus === 'A')) {
      conflicted.push(filePath);
      continue;
    }

    // Staged changes
    if (stagedStatus !== ' ' && stagedStatus !== '?') {
      staged.push({
        path: filePath,
        status: getFileStatus(stagedStatus),
        additions: 0,
        deletions: 0,
      });
    }

    // Unstaged changes
    if (unstagedStatus !== ' ' && unstagedStatus !== '?') {
      unstaged.push({
        path: filePath,
        status: getFileStatus(unstagedStatus),
        additions: 0,
        deletions: 0,
      });
    }

    // Untracked files
    if (stagedStatus === '?' && unstagedStatus === '?') {
      untracked.push(filePath);
    }
  }

  return {
    branch,
    ahead,
    behind,
    staged,
    unstaged,
    untracked,
    conflicted,
  };
}

function getFileStatus(code: string): FileChange['status'] {
  switch (code) {
    case 'A':
      return 'added';
    case 'M':
      return 'modified';
    case 'D':
      return 'deleted';
    case 'R':
      return 'renamed';
    case 'C':
      return 'copied';
    default:
      return 'modified';
  }
}
