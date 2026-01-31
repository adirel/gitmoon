import { GitProcess } from 'dugite';

export async function getRemoteUrl(repoPath: string): Promise<string | undefined> {
  try {
    const result = await GitProcess.exec(['remote', 'get-url', 'origin'], repoPath);
    
    if (result.exitCode === 0 && result.stdout.trim()) {
      return result.stdout.trim();
    }
    
    return undefined;
  } catch (error) {
    return undefined;
  }
}
