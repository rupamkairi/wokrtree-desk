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
  checkedOut: boolean;
  checkedOutPath?: string;
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

export type CreateWorktreeRequest = {
  projectId: string;
  branchMode: BranchMode;
  branchName: string;
  targetPath: string;
  baseRef?: string;
};

export type CreateWorktreeResult = {
  project: ProjectDetails;
  createdPath: string;
  branchName: string;
  operation: OperationDetails;
};

export type ConfigState = {
  version: 2;
  projects: ProjectDetails[];
  selectedProjectId: string | null;
};
