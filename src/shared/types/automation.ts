export type AutomationStepType = 
  | 'checkout'    // Switch to a branch
  | 'switch'      // Switch to a branch (alias for checkout)
  | 'pull'        // Pull from remote
  | 'push'        // Push to remote
  | 'fetch'       // Fetch from remote
  | 'merge'       // Merge a branch into current
  | 'commit'      // Commit staged changes
  | 'stageAll';   // Stage all changes

export interface AutomationStepConfig {
  // For checkout/merge: target branch name
  branch?: string;
  
  // For commit: commit message
  message?: string;
  
  // For push: force push flag
  force?: boolean;
  
  // For merge: no fast-forward flag
  noFastForward?: boolean;
}

export interface AutomationStep {
  id: string;
  type: AutomationStepType;
  config: AutomationStepConfig;
  continueOnError: boolean; // If true, continue script even if this step fails
}

export interface AutomationScript {
  id: string;
  repositoryId: string;
  name: string;
  description?: string;
  steps: AutomationStep[];
  createdAt: string; // ISO date string
  lastRun?: string;  // ISO date string
  enabled: boolean;
}

export type AutomationExecutionStatus = 'running' | 'success' | 'failed' | 'partial';
export type AutomationStepStatus = 'pending' | 'running' | 'success' | 'failed' | 'skipped';

export interface AutomationStepResult {
  stepId: string;
  status: AutomationStepStatus;
  error?: string;
  output?: string;
  startTime: string;
  endTime?: string;
}

export interface AutomationExecution {
  id: string;
  scriptId: string;
  scriptName: string;
  startTime: string;
  endTime?: string;
  status: AutomationExecutionStatus;
  stepResults: AutomationStepResult[];
}
