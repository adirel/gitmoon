import * as dugite from 'dugite';
import type { Commit, Author, CommitStats, FileChange } from '../../../shared/types/git';

/**
 * Get commit history for a repository
 * @param repoPath - Absolute path to the repository
 * @param limit - Maximum number of commits to return
 * @param skip - Number of commits to skip
 * @param branch - Optional branch name to get commits from
 * @returns Array of commits
 */
export async function getCommitHistory(
  repoPath: string,
  limit: number = 50,
  skip: number = 0,
  branch?: string
): Promise<Commit[]> {
  const format = '%H%n%an%n%ae%n%cn%n%ce%n%at%n%s%n%b%n--END--';
  
  const args = [
    'log',
    `--max-count=${limit}`,
    `--skip=${skip}`,
    `--format=${format}`,
    '--no-color',
  ];

  // Add branch if specified
  if (branch) {
    args.push(branch);
  }
  
  const result = await dugite.GitProcess.exec(args, repoPath);

  if (result.exitCode !== 0) {
    throw new Error(`Failed to get commit history: ${result.stderr}`);
  }

  return parseCommits(result.stdout);
}

/**
 * Get detailed information for a specific commit including file changes
 * @param repoPath - Absolute path to the repository
 * @param sha - Commit SHA
 * @returns Commit with stats and file changes
 */
export async function getCommitDetails(repoPath: string, sha: string): Promise<Commit & { files?: FileChange[] }> {
  const format = '%H%n%an%n%ae%n%cn%n%ce%n%at%n%s%n%b';
  
  const result = await dugite.GitProcess.exec(
    ['show', sha, `--format=${format}`, '--no-patch', '--no-color'],
    repoPath
  );

  if (result.exitCode !== 0) {
    throw new Error(`Failed to get commit details: ${result.stderr}`);
  }

  const commits = parseCommits(result.stdout + '\n--END--');
  if (commits.length === 0) {
    throw new Error('Commit not found');
  }

  // Get stats and file changes
  const statsResult = await dugite.GitProcess.exec(
    ['show', sha, '--stat', '--numstat', '--format=', '--no-color'],
    repoPath
  );

  if (statsResult.exitCode === 0) {
    const { stats, files } = parseCommitStatsWithFiles(statsResult.stdout);
    commits[0].stats = stats;
    return { ...commits[0], files };
  }

  return commits[0];
}

function parseCommits(output: string): Commit[] {
  const commits: Commit[] = [];
  const commitBlocks = output.split('--END--').filter((block) => block.trim());

  for (const block of commitBlocks) {
    const lines = block.trim().split('\n');
    if (lines.length < 7) continue;

    const [sha, authorName, authorEmail, committerName, committerEmail, timestamp, subject, ...bodyLines] = lines;

    const author: Author = {
      name: authorName,
      email: authorEmail,
    };

    const committer: Author = {
      name: committerName,
      email: committerEmail,
    };

    const body = bodyLines.join('\n').trim();

    commits.push({
      sha,
      message: subject,
      body: body || undefined,
      author,
      committer,
      date: new Date(parseInt(timestamp) * 1000),
      parents: [], // Would need additional parsing
    });
  }

  return commits;
}

/**
 * Get total commit count for a repository
 * @param repoPath - Absolute path to the repository
 * @param branch - Optional branch name to count commits from
 * @returns Total number of commits
 */
export async function getCommitCount(
  repoPath: string,
  branch?: string
): Promise<number> {
  const args = [
    'rev-list',
    '--count',
  ];

  // Add branch if specified, otherwise count all reachable commits
  if (branch) {
    args.push(branch);
  } else {
    args.push('HEAD');
  }
  
  const result = await dugite.GitProcess.exec(args, repoPath);

  if (result.exitCode !== 0) {
    throw new Error(`Failed to get commit count: ${result.stderr}`);
  }

  return parseInt(result.stdout.trim()) || 0;
}

function parseCommitStatsWithFiles(output: string): { stats: CommitStats; files: FileChange[] } {
  const lines = output.trim().split('\n');
  const files: FileChange[] = [];
  let totalAdditions = 0;
  let totalDeletions = 0;
  let filesChanged = 0;

  for (const line of lines) {
    if (!line.trim()) continue;
    
    // Parse numstat format: additions deletions filename
    const parts = line.split('\t');
    if (parts.length < 3) continue;

    const additions = parts[0] === '-' ? 0 : parseInt(parts[0]) || 0;
    const deletions = parts[1] === '-' ? 0 : parseInt(parts[1]) || 0;
    const path = parts[2];

    totalAdditions += additions;
    totalDeletions += deletions;
    filesChanged++;

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
  }

  return {
    stats: {
      filesChanged,
      additions: totalAdditions,
      deletions: totalDeletions,
    },
    files,
  };
}
