import * as dugite from 'dugite';
import type { DiffResult, FileChange } from '../../../shared/types/git';

/**
 * Compare two branches and get the diff
 * @param repoPath - Absolute path to the repository
 * @param baseBranch - Base branch name
 * @param compareBranch - Branch to compare against base
 * @returns Diff result with file changes
 */
export async function compareBranches(
  repoPath: string,
  baseBranch: string,
  compareBranch: string
): Promise<DiffResult> {
  const result = await dugite.GitProcess.exec(
    ['diff', '--numstat', `${baseBranch}...${compareBranch}`],
    repoPath
  );

  if (result.exitCode !== 0) {
    throw new Error(`Failed to compare branches: ${result.stderr}`);
  }

  return parseDiff(result.stdout);
}

/**
 * Get diff for specific files
 * @param repoPath - Absolute path to the repository
 * @param filePaths - Array of file paths
 * @param staged - Whether to get diff for staged changes
 * @returns Diff content
 */
export async function getFileDiff(
  repoPath: string,
  filePaths: string[],
  staged: boolean = false
): Promise<string> {
  const args = ['diff'];
  if (staged) {
    args.push('--cached');
  }
  args.push('--', ...filePaths);

  const result = await dugite.GitProcess.exec(args, repoPath);

  if (result.exitCode !== 0) {
    throw new Error(`Failed to get file diff: ${result.stderr}`);
  }

  return result.stdout;
}

/**
 * Get diff between two commits
 * @param repoPath - Absolute path to the repository
 * @param fromCommit - Starting commit SHA
 * @param toCommit - Ending commit SHA
 * @returns Diff result
 */
export async function getCommitDiff(
  repoPath: string,
  fromCommit: string,
  toCommit: string
): Promise<DiffResult> {
  const result = await dugite.GitProcess.exec(
    ['diff', '--numstat', `${fromCommit}..${toCommit}`],
    repoPath
  );

  if (result.exitCode !== 0) {
    throw new Error(`Failed to get commit diff: ${result.stderr}`);
  }

  return parseDiff(result.stdout);
}

/**
 * Get diff for a specific file in a commit
 * @param repoPath - Absolute path to the repository
 * @param commitSha - Commit SHA
 * @param filePath - File path
 * @returns Diff content
 */
export async function getCommitFileDiff(
  repoPath: string,
  commitSha: string,
  filePath: string
): Promise<string> {
  const result = await dugite.GitProcess.exec(
    ['show', `${commitSha}`, '--', filePath],
    repoPath
  );

  if (result.exitCode !== 0) {
    throw new Error(`Failed to get file diff: ${result.stderr}`);
  }

  return result.stdout;
}

/**
 * Get diff for specific files between two branches
 * @param repoPath - Absolute path to the repository
 * @param baseBranch - Base branch name
 * @param compareBranch - Branch to compare against base
 * @param filePaths - Array of file paths
 * @returns Diff content
 */
export async function getBranchFileDiff(
  repoPath: string,
  baseBranch: string,
  compareBranch: string,
  filePaths: string[]
): Promise<string> {
  const result = await dugite.GitProcess.exec(
    ['diff', `${baseBranch}...${compareBranch}`, '--', ...filePaths],
    repoPath
  );

  if (result.exitCode !== 0) {
    throw new Error(`Failed to get branch file diff: ${result.stderr}`);
  }

  return result.stdout;
}

function parseDiff(output: string): DiffResult {
  const files: FileChange[] = [];
  let totalAdditions = 0;
  let totalDeletions = 0;

  const lines = output.split('\n').filter((line) => line.trim());

  for (const line of lines) {
    const parts = line.split('\t');
    if (parts.length < 3) continue;

    const additions = parts[0] === '-' ? 0 : parseInt(parts[0]);
    const deletions = parts[1] === '-' ? 0 : parseInt(parts[1]);
    const path = parts[2];

    // Determine file status
    let status: FileChange['status'] = 'modified';
    if (additions > 0 && deletions === 0) {
      status = 'added';
    } else if (additions === 0 && deletions > 0) {
      status = 'deleted';
    }

    files.push({
      path,
      status,
      additions,
      deletions,
    });

    totalAdditions += additions;
    totalDeletions += deletions;
  }

  return {
    files,
    totalAdditions,
    totalDeletions,
  };
}
