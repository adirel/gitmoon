# GitMoon Coding Standards

## TypeScript Configuration

### Strict Mode
All TypeScript code must use strict mode:
```json
{
  "strict": true,
  "noImplicitAny": true,
  "strictNullChecks": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true
}
```

### Type Annotations
- Always define explicit return types for functions
- Use interfaces for object shapes
- Use type for unions and intersections
- Avoid `any` - use `unknown` if type is truly unknown

```typescript
// ✅ Good
interface CommitData {
  sha: string;
  message: string;
  author: Author;
  date: Date;
}

function getCommit(sha: string): Promise<CommitData> {
  // ...
}

// ❌ Bad
function getCommit(sha) {
  // ...
}
```

## File Organization

### Import Order
1. External dependencies
2. Internal absolute imports
3. Relative imports from parent directories
4. Relative imports from same directory
5. Type imports last

```typescript
// External
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';

// Internal absolute
import { useRepositoryStore } from '@/stores/repository';
import { formatDate } from '@/utils/date';

// Relative
import { CommitCard } from '../CommitCard';
import { useCommitDetails } from './useCommitDetails';

// Types
import type { Commit } from '@/types/git';
```

### File Structure Template

**React Component:**
```typescript
import React from 'react';
import type { ComponentProps } from './types';

interface Props extends ComponentProps {
  // Component-specific props
}

export const ComponentName: React.FC<Props> = ({ prop1, prop2 }) => {
  // Hooks
  const [state, setState] = useState();
  
  // Event handlers
  const handleClick = () => {
    // ...
  };
  
  // Effects
  React.useEffect(() => {
    // ...
  }, []);
  
  // Render helpers
  const renderSection = () => {
    // ...
  };
  
  // Main render
  return (
    <div>
      {/* JSX */}
    </div>
  );
};
```

**Hook:**
```typescript
import { useState, useEffect } from 'react';

export function useCustomHook(param: string) {
  const [state, setState] = useState<StateType | null>(null);
  
  useEffect(() => {
    // Logic
  }, [param]);
  
  return { state, setState };
}
```

**Utility Function:**
```typescript
/**
 * Formats a commit message for display
 * @param message - Raw commit message
 * @returns Formatted message with truncation
 */
export function formatCommitMessage(message: string): string {
  // Implementation
}
```

## Naming Conventions

### Variables
- camelCase for variables and functions
- UPPER_SNAKE_CASE for constants
- PascalCase for types, interfaces, and classes

```typescript
const userEmail = 'user@example.com';
const MAX_COMMIT_LENGTH = 100;
interface UserProfile { }
type GitProvider = 'github' | 'gitlab';
```

### Functions
- Verb-first naming for actions
- Boolean functions start with `is`, `has`, `should`
- Event handlers start with `handle`

```typescript
function fetchCommits() { }
function isValidBranch(name: string): boolean { }
function hasUncommittedChanges(): boolean { }
function handleCommitClick() { }
```

### Components
- PascalCase with descriptive names
- Avoid generic names like `Container`, `Wrapper`
- Use domain-specific names

```typescript
// ✅ Good
export const CommitHistoryList: React.FC = () => { };
export const BranchComparisonView: React.FC = () => { };

// ❌ Bad
export const List: React.FC = () => { };
export const Container: React.FC = () => { };
```

## React Patterns

### Component Size
- Maximum 200 lines per component
- Extract logic to custom hooks
- Split large components into subcomponents
- Use composition

### Props
- Destructure props in function signature
- Define Props interface above component
- Use optional chaining for optional props

```typescript
interface CommitCardProps {
  commit: Commit;
  onClick?: (sha: string) => void;
  isSelected?: boolean;
}

export const CommitCard: React.FC<CommitCardProps> = ({ 
  commit, 
  onClick,
  isSelected = false 
}) => {
  // Implementation
};
```

### Hooks
- Custom hooks start with `use`
- Extract complex logic to hooks
- One hook per concern
- Return object for multiple values

```typescript
function useRepositoryState(repoPath: string) {
  const [commits, setCommits] = useState<Commit[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Logic
  
  return { commits, loading, refresh };
}
```

### Event Handlers
- Define inline for simple handlers
- Extract to named function for complex logic
- Use `useCallback` for handlers passed to children

```typescript
const Component = () => {
  // Simple - inline
  <button onClick={() => console.log('clicked')}>

  // Complex - named function
  const handleComplexClick = () => {
    // Multiple lines of logic
  };
  
  // Passed to children - useCallback
  const handleMemoizedClick = useCallback(() => {
    // Logic
  }, [dependencies]);
};
```

## State Management

### Zustand Stores
- One store per domain (repos, settings, app)
- Slice pattern for large stores
- Selectors for derived state

```typescript
interface RepositoryStore {
  repositories: Repository[];
  selectedRepo: Repository | null;
  addRepository: (repo: Repository) => void;
  selectRepository: (id: string) => void;
}

export const useRepositoryStore = create<RepositoryStore>((set) => ({
  repositories: [],
  selectedRepo: null,
  addRepository: (repo) => set((state) => ({
    repositories: [...state.repositories, repo]
  })),
  selectRepository: (id) => set((state) => ({
    selectedRepo: state.repositories.find(r => r.id === id) || null
  }))
}));
```

## Error Handling

### Result Type Pattern
```typescript
type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

async function fetchData(): Promise<Result<Data>> {
  try {
    const data = await api.fetch();
    return { success: true, data };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error : new Error('Unknown error')
    };
  }
}
```

### User-Facing Errors
```typescript
// Convert technical errors to user-friendly messages
function getUserMessage(error: GitError): string {
  switch (error.code) {
    case 'REPO_NOT_FOUND':
      return 'Repository not found. Please check the path.';
    case 'NETWORK_ERROR':
      return 'Network connection failed. Check your internet.';
    default:
      return 'An unexpected error occurred. Please try again.';
  }
}
```

## Comments and Documentation

### TSDoc
Use TSDoc for functions and complex logic:
```typescript
/**
 * Compares two branches and returns the list of differing commits
 * @param baseBranch - The base branch name
 * @param compareBranch - The branch to compare against base
 * @param repoPath - Absolute path to the repository
 * @returns Array of commits unique to compareBranch
 * @throws {RepositoryNotFoundError} If repository doesn't exist
 */
export async function compareBranches(
  baseBranch: string,
  compareBranch: string,
  repoPath: string
): Promise<Commit[]> {
  // Implementation
}
```

### Inline Comments
- Explain "why" not "what"
- Use comments sparingly for obvious code
- Add TODO comments with context

```typescript
// ✅ Good - explains why
// Use debounce to prevent excessive API calls during typing
const debouncedSearch = debounce(search, 300);

// ❌ Bad - explains what (obvious from code)
// Increment counter by 1
counter += 1;

// TODO: Implement pagination once API supports it
```

## Git Commit Messages

Format:
```
<type>(<scope>): <subject>

<body>

<footer>
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding tests
- `chore`: Build process or tooling changes

Examples:
```
feat(git): add branch comparison functionality

Implement side-by-side branch comparison with file tree
and diff viewer using Monaco Editor.

Closes #123
```

```
fix(ui): correct commit list virtualization offset

Fixed incorrect scroll position calculation that caused
commits to jump when scrolling quickly.
```

## Testing

### Test File Structure
```typescript
describe('ComponentName', () => {
  describe('when prop is true', () => {
    it('should render expected output', () => {
      // Arrange
      const props = { prop: true };
      
      // Act
      render(<Component {...props} />);
      
      // Assert
      expect(screen.getByText('Expected')).toBeInTheDocument();
    });
  });
});
```

### Test Naming
- Use descriptive test names
- Follow "should" convention
- Group related tests in describe blocks

## Code Review Checklist

Before submitting PR:
- [ ] TypeScript strict mode passes
- [ ] ESLint passes with no warnings
- [ ] All tests pass
- [ ] No console.log statements
- [ ] Error handling implemented
- [ ] Loading states handled
- [ ] Accessibility considered
- [ ] Offline mode tested (for relevant features)
- [ ] Performance tested with large datasets
- [ ] Documentation updated
