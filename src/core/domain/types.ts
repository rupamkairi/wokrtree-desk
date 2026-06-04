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

export type ProjectSnapshot = {
  id: string;
  displayName: string;
  selectedPath: string;
  primaryPath: string;
  commonGitDir: string;
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

export type ConfigState = {
  version: 1;
  project: ProjectSnapshot | null;
};
