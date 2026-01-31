import React from 'react';
import { X, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import type { AutomationExecution, AutomationStepStatus } from '@shared/types/automation';

interface ExecutionModalProps {
  execution: AutomationExecution;
  onClose: () => void;
}

export const ExecutionModal: React.FC<ExecutionModalProps> = ({ execution, onClose }) => {
  const getStatusIcon = (status: AutomationStepStatus) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-success" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-error" />;
      case 'running':
        return <Clock className="w-5 h-5 text-accent animate-spin" />;
      case 'skipped':
        return <AlertCircle className="w-5 h-5 text-muted" />;
      default:
        return <Clock className="w-5 h-5 text-muted" />;
    }
  };

  const getStatusColor = (status: AutomationStepStatus) => {
    switch (status) {
      case 'success':
        return 'border-success bg-success/10';
      case 'failed':
        return 'border-error bg-error/10';
      case 'running':
        return 'border-accent bg-accent/10';
      case 'skipped':
        return 'border-muted bg-muted/10';
      default:
        return 'border-border bg-surface';
    }
  };

  const getExecutionStatusColor = () => {
    switch (execution.status) {
      case 'success':
        return 'text-success';
      case 'failed':
        return 'text-error';
      case 'partial':
        return 'text-warning';
      default:
        return 'text-accent';
    }
  };

  const formatDuration = (start: string, end?: string) => {
    if (!end) return 'Running...';
    const duration = new Date(end).getTime() - new Date(start).getTime();
    return `${(duration / 1000).toFixed(1)}s`;
  };

  const totalDuration = execution.endTime
    ? formatDuration(execution.startTime, execution.endTime)
    : 'Running...';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="w-[90vw] max-w-3xl h-[85vh] glass rounded-lg flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold">Script Execution</h2>
            <p className="text-sm text-muted">{execution.scriptName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-elevated rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Execution Status */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-3">
              <span className="text-sm text-muted">Status:</span>
              <span className={`font-semibold capitalize ${getExecutionStatusColor()}`}>
                {execution.status}
              </span>
            </div>
            <div className="text-sm text-muted">
              Duration: <span className="font-mono">{totalDuration}</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 bg-surface rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                execution.status === 'success'
                  ? 'bg-success'
                  : execution.status === 'failed'
                  ? 'bg-error'
                  : execution.status === 'partial'
                  ? 'bg-warning'
                  : 'bg-accent'
              }`}
              style={{
                width: `${
                  (execution.stepResults.filter((s) => s.status !== 'pending').length /
                    execution.stepResults.length) *
                  100
                }%`,
              }}
            />
          </div>

          <div className="flex items-center justify-between mt-2 text-xs text-muted">
            <span>
              {execution.stepResults.filter((s) => s.status === 'success').length} succeeded
            </span>
            <span>
              {execution.stepResults.filter((s) => s.status === 'failed').length} failed
            </span>
            <span>
              {execution.stepResults.filter((s) => s.status === 'skipped').length} skipped
            </span>
          </div>
        </div>

        {/* Steps */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
          <div className="space-y-3">
            {execution.stepResults.map((stepResult, index) => (
              <div
                key={stepResult.stepId}
                className={`p-3 border rounded-lg ${getStatusColor(stepResult.status)}`}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-background rounded-full font-semibold text-sm flex-shrink-0">
                    {index + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      {getStatusIcon(stepResult.status)}
                      <span className="font-medium capitalize">{stepResult.status}</span>
                      {stepResult.endTime && (
                        <span className="text-xs text-muted font-mono">
                          ({formatDuration(stepResult.startTime, stepResult.endTime)})
                        </span>
                      )}
                    </div>

                    {stepResult.output && (
                      <p className="text-sm text-muted mb-2">{stepResult.output}</p>
                    )}

                    {stepResult.error && (
                      <div className="mt-2 p-2 bg-error/10 border border-error rounded text-sm text-error font-mono">
                        {stepResult.error}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-4 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-accent text-background rounded-lg hover:bg-accent-hover transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
