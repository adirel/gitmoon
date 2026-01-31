export const IPC_CHANNELS = {
  // Repository management
  REPO_ADD: 'repo:add',
  REPO_REMOVE: 'repo:remove',
  REPO_UPDATE: 'repo:update',
  REPO_GET_ALL: 'repo:getAll',
  REPO_SELECT: 'repo:select',

  // Git operations
  GIT_GET_COMMITS: 'git:getCommits',
  GIT_GET_COMMIT_COUNT: 'git:getCommitCount',
  GIT_GET_COMMIT_DETAILS: 'git:getCommitDetails',
  GIT_GET_BRANCHES: 'git:getBranches',
  GIT_GET_STATUS: 'git:getStatus',
  GIT_COMPARE_BRANCHES: 'git:compareBranches',
  GIT_GET_DIFF: 'git:getDiff',
  GIT_GET_COMMIT_FILE_DIFF: 'git:getCommitFileDiff',
  GIT_CHECKOUT: 'git:checkout',
  GIT_CREATE_BRANCH: 'git:createBranch',
  GIT_DELETE_BRANCH: 'git:deleteBranch',
  GIT_STAGE_FILES: 'git:stageFiles',
  GIT_UNSTAGE_FILES: 'git:unstageFiles',
  GIT_COMMIT: 'git:commit',
  GIT_PUSH: 'git:push',
  GIT_PULL: 'git:pull',
  GIT_FETCH: 'git:fetch',
  GIT_GET_REMOTE_URL: 'git:getRemoteUrl',
  GIT_GET_LAST_FETCH_TIME: 'git:getLastFetchTime',

  // Network
  NETWORK_CHECK_STATUS: 'network:checkStatus',
  NETWORK_STATUS_CHANGED: 'network:statusChanged',

  // App
  APP_GET_VERSION: 'app:getVersion',
  APP_QUIT: 'app:quit',
  APP_SELECT_FOLDER: 'app:selectFolder',
  APP_OPEN_PATH: 'app:openPath',
  APP_OPEN_TERMINAL: 'app:openTerminal',
} as const;

export type IpcChannel = typeof IPC_CHANNELS[keyof typeof IPC_CHANNELS];
