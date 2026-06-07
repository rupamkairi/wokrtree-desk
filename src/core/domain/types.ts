export type WorktreeStatus = {
  branch?: string;
  upstream?: string;
  ahead: number;
  behind: number;
  changedCount: number;
  untrackedCount: number;
  conflictCount: number;
  clean: boolean;
  detached: boolean;
};

export type WorktreeSnapshot = {
  path: string;
  headOid?: string;
  branchRef?: string;
  displayBranch: string;
  detached: boolean;
  bare: boolean;
  lockedReason?: string;
  prunableReason?: string;
  status: WorktreeStatus;
};

export type EditorPreference = "cursor" | "code" | "terminal" | "custom";
export type TerminalPreference = "terminal" | "iterm" | "custom";

export type ProjectDefaults = {
  worktreeRoot: string;
  preferredEditor: EditorPreference;
  preferredTerminal: TerminalPreference;
  editorCommand?: string;
  terminalCommand?: string;
};

export type ProjectSummary = {
  id: string;
  displayName: string;
  primaryPath: string;
  worktreeCount: number;
  modifiedWorktreeCount: number;
  attentionCount: number;
  defaults: ProjectDefaults;
};

export type ProjectDetails = {
  id: string;
  displayName: string;
  selectedPath: string;
  primaryPath: string;
  commonGitDir: string;
  defaults: ProjectDefaults;
  worktrees: WorktreeSnapshot[];
};

export type OperationDetails = {
  executable: string;
  args: string[];
  cwd: string;
  exitCode: number;
  stdout: string;
  stderr: string;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  success: boolean;
  commandDisplay: string;
};

export type RepositorySelectionResult = {
  selectedPath: string | null;
};

export type WorktreeRecord = {
  path: string;
  headOid?: string;
  branchRef?: string;
  detached: boolean;
  bare: boolean;
  lockedReason?: string;
  prunableReason?: string;
};

export type RepositoryInfo = {
  primaryPath: string;
  commonGitDir: string;
  selectedPath: string;
};

export type BranchRef = {
  fullRef: string;
  name: string;
  sha: string;
  committerDate?: string;
  checkedOut: boolean;
  checkedOutPath?: string;
  isDefault: boolean;
};

export type CommitSummary = {
  hash: string;
  shortHash: string;
  author: string;
  authorEmail: string;
  date: string;
  subject: string;
  body: string;
  parents: string[];
  isMerge: boolean;
};

export type RemoteHost = "github" | "gitlab" | "bitbucket" | "other";

export type RemoteInfo = {
  /** Web base URL like https://github.com/org/repo, or null if no usable remote. */
  baseUrl: string | null;
  host: RemoteHost;
};

export type CommitPage = {
  branchName: string;
  commits: CommitSummary[];
  skip: number;
  limit: number;
  hasMore: boolean;
};

export type BranchMode = "existing" | "new";

export type CreateWorktreePreview = {
  projectId: string;
  branchMode: BranchMode;
  branchName: string;
  targetPath: string;
  baseRef?: string;
  willCreateBranch: boolean;
  destinationExists: boolean;
  branchAlreadyCheckedOut: boolean;
  checkedOutPath?: string;
  canCreate: boolean;
  warnings: string[];
  command: {
    executable: string;
    args: string[];
    cwd: string;
  };
};

export type CopyMode = "copy" | "symlink";

export type CopyFolderSpec = {
  path: string;
  mode: CopyMode;
};

export type CreateWorktreeRequest = {
  projectId: string;
  branchMode: BranchMode;
  branchName: string;
  targetPath: string;
  baseRef?: string;
  /** Absolute source paths of files to copy into the new worktree. */
  copyFiles?: string[];
  /** Absolute source folders to copy or symlink into the new worktree. */
  copyFolders?: CopyFolderSpec[];
};

export type CreateWorktreeResult = {
  project: ProjectDetails;
  createdPath: string;
  branchName: string;
  operation: OperationDetails;
  /** Non-fatal problems while copying/symlinking files after the worktree was created. */
  copyWarnings: string[];
};

export type CreateBranchRequest = {
  projectId: string;
  branchName: string;
  baseRef: string;
  checkout: boolean;
};

export type CreateBranchResult = {
  branchName: string;
  operation: OperationDetails;
};

export type SwitchWorktreeBranchRequest = {
  projectId: string;
  worktreePath: string;
  branchName: string;
};

export type SwitchWorktreeBranchResult = {
  worktreePath: string;
  branchName: string;
  operation: OperationDetails;
};

export type ChangedFile = {
  path: string;
  oldPath?: string;
  /** Porcelain v2 X code (index/staged side). "?" when untracked. */
  index: string;
  /** Porcelain v2 Y code (worktree side). "?" when untracked. */
  worktree: string;
  untracked: boolean;
  conflict: boolean;
  /** Added/removed line counts (from numstat). Undefined when unknown; both 0 for binary. */
  additions?: number;
  deletions?: number;
  binary?: boolean;
};

export type EditorTarget = {
  id: string;
  label: string;
  /** macOS application name passed to `open -a`. */
  app: string;
};

export type FileDiffRequest = {
  projectId: string;
  kind: "worktree" | "commit";
  path: string;
  oldPath?: string;
  /** Required when kind === "worktree": the checkout to read the working file from. */
  worktreePath?: string;
  /** Required when kind === "commit": the commit to diff against its first parent. */
  hash?: string;
};

export type FileDiff = {
  path: string;
  oldPath?: string;
  original: string;
  modified: string;
  language: string;
  binary: boolean;
};

export type ConfigState = {
  version: 2;
  projects: ProjectDetails[];
  selectedProjectId: string | null;
};
