import { GitProcess } from 'dugite';
import type {
  AutomationScript,
  AutomationExecution,
  AutomationStep,
  AutomationStepResult,
} from '../../shared/types/automation';
import { checkout } from '../git/operations/branches';
import { pull, push, fetch } from '../git/operations/sync';

export class AutomationExecutor {
  private repoPath: string;
  private execution: AutomationExecution | null = null;

  constructor(repoPath: string) {
    this.repoPath = repoPath;
  }

  /**
   * Execute an automation script
   */
  async executeScript(script: AutomationScript): Promise<AutomationExecution> {
    this.execution = {
      id: Date.now().toString(),
      scriptId: script.id,
      scriptName: script.name,
      startTime: new Date().toISOString(),
      status: 'running',
      stepResults: [],
    };

    let hasFailures = false;
    let hasSuccesses = false;

    for (const step of script.steps) {
      const stepResult = await this.executeStep(step);
      this.execution.stepResults.push(stepResult);

      if (stepResult.status === 'failed') {
        hasFailures = true;
        // Stop execution unless continueOnError is true
        if (!step.continueOnError) {
          break;
        }
      } else if (stepResult.status === 'success') {
        hasSuccesses = true;
      }
    }

    // Determine final status
    this.execution.endTime = new Date().toISOString();
    if (!hasFailures) {
      this.execution.status = 'success';
    } else if (hasSuccesses) {
      this.execution.status = 'partial';
    } else {
      this.execution.status = 'failed';
    }

    return this.execution;
  }

  /**
   * Execute a single automation step
   */
  private async executeStep(step: AutomationStep): Promise<AutomationStepResult> {
    const result: AutomationStepResult = {
      stepId: step.id,
      status: 'running',
      startTime: new Date().toISOString(),
    };

    try {
      switch (step.type) {
        case 'checkout':
        case 'switch':
          await this.executeCheckout(step);
          break;
        case 'pull':
          await pull(this.repoPath);
          break;
        case 'push':
          if (step.config.force) {
            const pushResult = await GitProcess.exec(['push', '--force'], this.repoPath);
            if (pushResult.exitCode !== 0) {
              throw new Error(pushResult.stderr);
            }
          } else {
            await push(this.repoPath);
          }
          break;
        case 'fetch':
          await fetch(this.repoPath);
          break;
        case 'merge':
          await this.executeMerge(step);
          break;
        case 'commit':
          await this.executeCommit(step);
          break;
        case 'stageAll':
          // Get all files and stage them
          const statusResult = await GitProcess.exec(['status', '--porcelain', '-z'], this.repoPath);
          if (statusResult.exitCode === 0 && statusResult.stdout.trim()) {
            await GitProcess.exec(['add', '--all'], this.repoPath);
          }
          break;
        default:
          throw new Error(`Unknown step type: ${step.type}`);
      }

      result.status = 'success';
      result.output = `${step.type} completed successfully`;
    } catch (error) {
      result.status = 'failed';
      result.error = error instanceof Error ? error.message : String(error);
    } finally {
      result.endTime = new Date().toISOString();
    }

    return result;
  }

  /**
   * Execute checkout step
   */
  private async executeCheckout(step: AutomationStep): Promise<void> {
    if (!step.config.branch) {
      throw new Error('Checkout step requires a branch name');
    }
    await checkout(this.repoPath, step.config.branch);
  }

  /**
   * Execute merge step
   */
  private async executeMerge(step: AutomationStep): Promise<void> {
    if (!step.config.branch) {
      throw new Error('Merge step requires a branch name');
    }

    const args = ['merge', step.config.branch];
    if (step.config.noFastForward) {
      args.push('--no-ff');
    }

    const result = await GitProcess.exec(args, this.repoPath);
    if (result.exitCode !== 0) {
      throw new Error(`Merge failed: ${result.stderr}`);
    }
  }

  /**
   * Execute commit step
   */
  private async executeCommit(step: AutomationStep): Promise<void> {
    if (!step.config.message) {
      throw new Error('Commit step requires a message');
    }

    const result = await GitProcess.exec(
      ['commit', '-m', step.config.message],
      this.repoPath
    );
    
    if (result.exitCode !== 0) {
      throw new Error(`Commit failed: ${result.stderr}`);
    }
  }

  /**
   * Get current execution
   */
  getCurrentExecution(): AutomationExecution | null {
    return this.execution;
  }
}
