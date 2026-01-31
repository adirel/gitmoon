import * as dugite from 'dugite';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Get the last fetch time from git
 * @param repoPath - Absolute path to the repository
 * @returns Unix timestamp of last fetch, or null if never fetched
 */
export async function getLastFetchTime(repoPath: string): Promise<number | null> {
  try {
    // Check the FETCH_HEAD file modification time
    const fetchHeadPath = path.join(repoPath, '.git', 'FETCH_HEAD');
    const stats = await fs.stat(fetchHeadPath);
    return Math.floor(stats.mtime.getTime() / 1000);
  } catch (error) {
    // File doesn't exist or can't be accessed
    return null;
  }
}

/**
 * Get repository information
 * @param repoPath - Absolute path to the repository
 * @returns Repository info including head SHA, branch, etc.
 */
export async function getRepositoryInfo(repoPath: string): Promise<{
  head: string;
  branch: string;
  isDetached: boolean;
}> {
  // Get current HEAD SHA
  const headResult = await dugite.GitProcess.exec(
    ['rev-parse', 'HEAD'],
    repoPath
  );

  if (headResult.exitCode !== 0) {
    throw new Error(`Failed to get HEAD: ${headResult.stderr}`);
  }

  const head = headResult.stdout.trim();

  // Get current branch
  const branchResult = await dugite.GitProcess.exec(
    ['rev-parse', '--abbrev-ref', 'HEAD'],
    repoPath
  );

  if (branchResult.exitCode !== 0) {
    throw new Error(`Failed to get branch: ${branchResult.stderr}`);
  }

  const branch = branchResult.stdout.trim();
  const isDetached = branch === 'HEAD';

  return {
    head,
    branch: isDetached ? head : branch,
    isDetached,
  };
}
