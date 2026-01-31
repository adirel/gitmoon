import { GitProcess } from 'dugite';

export async function fetch(repoPath: string): Promise<void> {
  const result = await GitProcess.exec(['fetch', '--all', '--prune'], repoPath);
  
  if (result.exitCode !== 0) {
    throw new Error(`Git fetch failed: ${result.stderr}`);
  }
}

export async function pull(repoPath: string): Promise<void> {
  const result = await GitProcess.exec(['pull'], repoPath);
  
  if (result.exitCode !== 0) {
    throw new Error(`Git pull failed: ${result.stderr}`);
  }
}

export async function push(repoPath: string): Promise<void> {
  const result = await GitProcess.exec(['push'], repoPath);
  
  if (result.exitCode !== 0) {
    throw new Error(`Git push failed: ${result.stderr}`);
  }
}
