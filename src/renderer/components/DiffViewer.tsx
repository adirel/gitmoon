import React from 'react';
import { X } from 'lucide-react';

interface DiffViewerProps {
  diff: string;
  fileName: string;
  onClose: () => void;
}

interface DiffLine {
  type: 'header' | 'add' | 'remove' | 'context' | 'meta';
  content: string;
  oldLineNumber?: number;
  newLineNumber?: number;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({ diff, fileName, onClose }) => {
  const parsedLines = React.useMemo(() => {
    const lines = diff.split('\n');
    const result: DiffLine[] = [];
    let oldLine = 0;
    let newLine = 0;

    for (const line of lines) {
      if (line.startsWith('diff --git') || line.startsWith('index ') || line.startsWith('---') || line.startsWith('+++')) {
        result.push({ type: 'meta', content: line });
      } else if (line.startsWith('@@')) {
        // Parse hunk header to get line numbers
        const match = line.match(/@@ -(\d+),?\d* \+(\d+),?\d* @@/);
        if (match) {
          oldLine = parseInt(match[1]);
          newLine = parseInt(match[2]);
        }
        result.push({ type: 'header', content: line });
      } else if (line.startsWith('+')) {
        result.push({
          type: 'add',
          content: line,
          newLineNumber: newLine++,
        });
      } else if (line.startsWith('-')) {
        result.push({
          type: 'remove',
          content: line,
          oldLineNumber: oldLine++,
        });
      } else {
        result.push({
          type: 'context',
          content: line,
          oldLineNumber: oldLine++,
          newLineNumber: newLine++,
        });
      }
    }

    return result;
  }, [diff]);

  const getLineStyle = (type: DiffLine['type']) => {
    switch (type) {
      case 'add':
        return 'bg-success/10 text-success border-l-2 border-success';
      case 'remove':
        return 'bg-error/10 text-error border-l-2 border-error';
      case 'header':
        return 'bg-accent/10 text-accent font-semibold';
      case 'meta':
        return 'text-muted text-xs';
      default:
        return 'text-text-primary';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="w-[90vw] h-[85vh] glass rounded-lg flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold">Diff Viewer</h2>
            <p className="text-sm text-muted font-mono">{fileName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-elevated rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Diff Content */}
        <div className="flex-1 overflow-auto custom-scrollbar bg-surface p-4">
          <div className="font-mono text-xs">
            {parsedLines.map((line, index) => (
              <div
                key={index}
                className={`flex ${getLineStyle(line.type)} px-2 py-0.5`}
              >
                {/* Line Numbers */}
                {line.type !== 'meta' && line.type !== 'header' && (
                  <div className="flex space-x-2 mr-4 select-none text-muted min-w-[80px]">
                    <span className="w-10 text-right">
                      {line.oldLineNumber !== undefined ? line.oldLineNumber : ''}
                    </span>
                    <span className="w-10 text-right">
                      {line.newLineNumber !== undefined ? line.newLineNumber : ''}
                    </span>
                  </div>
                )}
                
                {/* Content */}
                <pre className={`flex-1 whitespace-pre-wrap break-all ${
                  line.type === 'meta' || line.type === 'header' ? 'ml-0' : ''
                }`}>
                  {line.content}
                </pre>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-border flex justify-between items-center text-xs text-muted">
          <div className="flex space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-success/30 rounded"></div>
              <span>Added</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-error/30 rounded"></div>
              <span>Removed</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-surface hover:bg-surface-elevated rounded transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
