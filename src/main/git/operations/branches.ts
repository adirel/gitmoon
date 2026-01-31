import * as dugite from 'dugite';
import type { Branch } from '../../../shared/types/git';

/**
 * Get all branches in a repository
 * @param repoPath - Absolute path to the repository
 * @returns Array of branches
 */
export async function getBranches(repoPath: string): Promise<Branch[]> {
  const result = await dugite.GitProcess.exec(
    ['branch', '--all', '-vv', '--no-color'],
    repoPath
  );

  if (result.exitCode !== 0) {
    throw new Error(`Failed to get branches: ${result.stderr}`);
  }

  return parseBranches(result.stdout);
}

/**
 * Get current branch name
 * @param repoPath - Absolute path to the repository
 * @returns Current branch name
 */
export async function getCurrentBranch(repoPath: string): Promise<string> {
  const result = await dugite.GitProcess.exec(['branch', '--show-current'], repoPath);

  if (result.exitCode !== 0) {
    throw new Error(`Failed to get current branch: ${result.stderr}`);
  }

  return result.stdout.trim();
}

/**
 * Create a new branch
 * @param repoPath - Absolute path to the repository
 * @param branchName - Name of the branch to create
 */
export async function createBranch(repoPath: string, branchName: string): Promise<void> {
  // Sanitize branch name
  const sanitized = sanitizeBranchName(branchName);
  
  const result = await dugite.GitProcess.exec(['branch', sanitized], repoPath);

  if (result.exitCode !== 0) {
    throw new Error(`Failed to create branch: ${result.stderr}`);
  }
}

/**
 * Delete a branch
 * @param repoPath - Absolute path to the repository
 * @param branchName - Name of the branch to delete
 * @param force - Force delete even if not merged
 */
export async function deleteBranch(
  repoPath: string,
  branchName: string,
  force: boolean = false
): Promise<void> {
  const flag = force ? '-D' : '-d';
  const result = await dugite.GitProcess.exec(['branch', flag, branchName], repoPath);

  if (result.exitCode !== 0) {
    throw new Error(`Failed to delete branch: ${result.stderr}`);
  }
}

/**
 * Checkout a branch
 * @param repoPath - Absolute path to the repository
 * @param branchName - Name of the branch to checkout
 */
export async function checkout(repoPath: string, branchName: string): Promise<void> {
  const result = await dugite.GitProcess.exec(['checkout', branchName], repoPath);

  if (result.exitCode !== 0) {
    throw new Error(`Failed to checkout branch: ${result.stderr}`);
  }
}

function parseBranches(output: string): Branch[] {
  const branches: Branch[] = [];
  const lines = output.split('\n').filter((line) => line.trim());

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const isRemote = trimmed.includes('remotes/');
    
    // Remove the * marker
    const withoutMarker = trimmed.replace(/^\*?\s+/, '');
    
    // Extract branch name and SHA
    const parts = withoutMarker.split(/\s+/);
    const name = parts[0];
    const sha = parts[1];

    // Skip HEAD references
    if (name.includes('HEAD')) continue;

    // Parse tracking info
    let upstream: string | undefined;
    const trackingMatch = withoutMarker.match(/\[([^\]]+)\]/);
    if (trackingMatch) {
      const tracking = trackingMatch[1];
      if (tracking.includes(':')) {
        upstream = tracking.split(':')[0];
      } else {
        upstream = tracking;
      }
    }

    branches.push({
      name: isRemote ? name.replace('remotes/', '') : name,
      sha: sha || '',
      isRemote,
      upstream,
    });
  }

  return branches;
}

function sanitizeBranchName(name: string): string {
  // Remove invalid characters and ensure it follows git branch naming rules
  return name
    .replace(/[^a-zA-Z0-9/_-]/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/--+/g, '-');
}
