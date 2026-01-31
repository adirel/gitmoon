import React from 'react';
import { TrendingUp } from 'lucide-react';
import type { Commit } from '@shared/types/git';

interface CommitFrequencyGraphProps {
  commits: Commit[];
  timeRange: 'week' | 'month' | 'year';
}

interface DataPoint {
  date: string;
  count: number;
  label: string;
}

export const CommitFrequencyGraph: React.FC<CommitFrequencyGraphProps> = ({ commits, timeRange }) => {
  const graphData = React.useMemo(() => {
    // Group commits by date
    const commitsByDate = new Map<string, number>();
    const now = new Date();
    const startDate = new Date(now);

    // Set start date based on time range
    switch (timeRange) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    // Initialize all dates with 0
    const currentDate = new Date(startDate);
    while (currentDate <= now) {
      const dateStr = currentDate.toISOString().split('T')[0];
      commitsByDate.set(dateStr, 0);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Count commits for each date
    commits.forEach((commit) => {
      const commitDate = new Date(commit.date);
      if (commitDate >= startDate && commitDate <= now) {
        const dateStr = commitDate.toISOString().split('T')[0];
        commitsByDate.set(dateStr, (commitsByDate.get(dateStr) || 0) + 1);
      }
    });

    // Convert to array and sort
    const dataPoints: DataPoint[] = Array.from(commitsByDate.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => {
        const d = new Date(date);
        let label = '';
        
        if (timeRange === 'week') {
          label = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        } else if (timeRange === 'month') {
          label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        } else {
          label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        }
        
        return { date, count, label };
      });

    return dataPoints;
  }, [commits, timeRange]);

  const maxCommits = React.useMemo(() => {
    return Math.max(...graphData.map((d) => d.count), 1);
  }, [graphData]);

  const totalCommits = React.useMemo(() => {
    return graphData.reduce((sum, d) => sum + d.count, 0);
  }, [graphData]);

  // Calculate points for the line path
  const linePath = React.useMemo(() => {
    if (graphData.length === 0) return '';

    const width = 100; // percentage
    const height = 100; // percentage
    const padding = 5;

    const points = graphData.map((d, i) => {
      const x = (i / (graphData.length - 1)) * (width - padding * 2) + padding;
      const y = height - padding - ((d.count / maxCommits) * (height - padding * 2));
      return `${x},${y}`;
    });

    return `M ${points.join(' L ')}`;
  }, [graphData, maxCommits]);

  // Sample data points for labels (not all, to avoid clutter)
  const labelIndices = React.useMemo(() => {
    const step = Math.ceil(graphData.length / 7);
    return graphData
      .map((_, i) => i)
      .filter((i) => i % step === 0 || i === graphData.length - 1);
  }, [graphData]);

  return (
    <div className="glass p-4 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <TrendingUp className="w-4 h-4 text-accent" />
          <h3 className="text-sm font-semibold">Commit Frequency</h3>
        </div>
        <div className="text-xs text-muted">
          {totalCommits} commits in last {timeRange === 'week' ? '7 days' : timeRange === 'month' ? '30 days' : '365 days'}
        </div>
      </div>

      {/* Graph */}
      <div className="relative w-full" style={{ height: '200px' }}>
        {graphData.length > 0 ? (
          <>
            {/* Y-axis labels */}
            <div className="absolute left-0 top-0 bottom-6 flex flex-col justify-between text-xs text-muted">
              <span>{maxCommits}</span>
              <span>{Math.floor(maxCommits / 2)}</span>
              <span>0</span>
            </div>

            {/* Graph area */}
            <div className="absolute left-8 right-0 top-0 bottom-6">
              <svg
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                className="w-full h-full"
              >
                {/* Grid lines */}
                <line
                  x1="5"
                  y1="95"
                  x2="95"
                  y2="95"
                  stroke="currentColor"
                  strokeWidth="0.2"
                  className="text-border opacity-30"
                />
                <line
                  x1="5"
                  y1="50"
                  x2="95"
                  y2="50"
                  stroke="currentColor"
                  strokeWidth="0.2"
                  className="text-border opacity-20"
                />
                <line
                  x1="5"
                  y1="5"
                  x2="95"
                  y2="5"
                  stroke="currentColor"
                  strokeWidth="0.2"
                  className="text-border opacity-20"
                />

                {/* Area under the line (gradient fill) */}
                <defs>
                  <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="rgb(0, 212, 255)" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="rgb(0, 212, 255)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {linePath && (
                  <path
                    d={`${linePath} L 95,95 L 5,95 Z`}
                    fill="url(#areaGradient)"
                  />
                )}

                {/* Line */}
                {linePath && (
                  <path
                    d={linePath}
                    fill="none"
                    stroke="rgb(0, 212, 255)"
                    strokeWidth="0.8"
                    className="drop-shadow-[0_0_3px_rgba(0,212,255,0.5)]"
                  />
                )}

                {/* Data points */}
                {graphData.map((d, i) => {
                  const x = (i / (graphData.length - 1)) * 90 + 5;
                  const y = 95 - ((d.count / maxCommits) * 90);
                  
                  return (
                    <g key={d.date}>
                      {d.count > 0 && (
                        <circle
                          cx={x}
                          cy={y}
                          r="1.2"
                          fill="rgb(0, 212, 255)"
                          className="drop-shadow-[0_0_3px_rgba(0,212,255,0.8)]"
                        >
                          <title>{`${d.label}: ${d.count} commit${d.count !== 1 ? 's' : ''}`}</title>
                        </circle>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* X-axis labels */}
            <div className="absolute left-8 right-0 bottom-0 flex justify-between text-xs text-muted">
              {labelIndices.map((index) => (
                <span key={index} className="truncate" style={{ maxWidth: '80px' }}>
                  {graphData[index].label}
                </span>
              ))}
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-muted text-sm">
            No commit data available
          </div>
        )}
      </div>
    </div>
  );
};
