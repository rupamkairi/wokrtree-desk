import { z } from "zod";

const editorPreferenceSchema = z.enum(["cursor", "code", "terminal", "custom"]);
const terminalPreferenceSchema = z.enum(["terminal", "iterm", "custom"]);
const branchModeSchema = z.enum(["existing", "new"]);

export const worktreeStatusSchema = z.object({
  branch: z.string().optional(),
  upstream: z.string().optional(),
  ahead: z.number().int().nonnegative(),
  behind: z.number().int().nonnegative(),
  changedCount: z.number().int().nonnegative(),
  untrackedCount: z.number().int().nonnegative(),
  conflictCount: z.number().int().nonnegative(),
  clean: z.boolean(),
  detached: z.boolean(),
});

export const worktreeSnapshotSchema = z.object({
  path: z.string(),
  headOid: z.string().optional(),
  branchRef: z.string().optional(),
  displayBranch: z.string(),
  detached: z.boolean(),
  bare: z.boolean(),
  lockedReason: z.string().optional(),
  prunableReason: z.string().optional(),
  status: worktreeStatusSchema,
});

export const projectDefaultsSchema = z.object({
  worktreeRoot: z.string().min(1),
  preferredEditor: editorPreferenceSchema,
  preferredTerminal: terminalPreferenceSchema,
  editorCommand: z.string().optional(),
  terminalCommand: z.string().optional(),
});

export const projectSummarySchema = z.object({
  id: z.string(),
  displayName: z.string(),
  primaryPath: z.string(),
  worktreeCount: z.number().int().nonnegative(),
  modifiedWorktreeCount: z.number().int().nonnegative(),
  attentionCount: z.number().int().nonnegative(),
  defaults: projectDefaultsSchema,
});

export const projectDetailsSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  selectedPath: z.string(),
  primaryPath: z.string(),
  commonGitDir: z.string(),
  defaults: projectDefaultsSchema,
  worktrees: z.array(worktreeSnapshotSchema),
});

export const branchRefSchema = z.object({
  fullRef: z.string(),
  name: z.string(),
  sha: z.string(),
  committerDate: z.string().optional(),
  checkedOut: z.boolean(),
  checkedOutPath: z.string().optional(),
  isDefault: z.boolean(),
});

export const commitSummarySchema = z.object({
  hash: z.string(),
  shortHash: z.string(),
  author: z.string(),
  authorEmail: z.string(),
  date: z.string(),
  subject: z.string(),
  body: z.string(),
  parents: z.array(z.string()),
  isMerge: z.boolean(),
});

export const commitPageSchema = z.object({
  branchName: z.string(),
  commits: z.array(commitSummarySchema),
  skip: z.number().int().nonnegative(),
  limit: z.number().int().positive(),
  hasMore: z.boolean(),
});

export const getCommitsRequestSchema = z.object({
  projectId: z.string().min(1),
  branchName: z.string().min(1),
  limit: z.number().int().positive().optional(),
  skip: z.number().int().nonnegative().optional(),
});

export const operationDetailsSchema = z.object({
  executable: z.string(),
  args: z.array(z.string()),
  cwd: z.string(),
  exitCode: z.number().int(),
  stdout: z.string(),
  stderr: z.string(),
  startedAt: z.string(),
  finishedAt: z.string(),
  durationMs: z.number().nonnegative(),
  success: z.boolean(),
  commandDisplay: z.string(),
});

export const repositorySelectionResultSchema = z.object({
  selectedPath: z.string().nullable(),
});

export const openPathRequestSchema = z.object({
  path: z.string().min(1),
});

export const registerProjectRequestSchema = z.object({
  selectedPath: z.string().min(1),
  defaults: projectDefaultsSchema,
});

export const updateProjectDefaultsRequestSchema = z.object({
  projectId: z.string().min(1),
  defaults: projectDefaultsSchema,
});

export const getProjectRequestSchema = z.object({
  projectId: z.string().min(1),
});

export const getBranchRefsRequestSchema = z.object({
  projectId: z.string().min(1),
});

const copyModeSchema = z.enum(["copy", "symlink"]);

export const copyFolderSpecSchema = z.object({
  path: z.string().min(1),
  mode: copyModeSchema,
});

export const createWorktreeRequestSchema = z.object({
  projectId: z.string().min(1),
  branchMode: branchModeSchema,
  branchName: z.string().min(1),
  targetPath: z.string().min(1),
  baseRef: z.string().optional(),
  copyFiles: z.array(z.string().min(1)).optional(),
  copyFolders: z.array(copyFolderSpecSchema).optional(),
});

export const createBranchRequestSchema = z.object({
  projectId: z.string().min(1),
  branchName: z.string().min(1),
  baseRef: z.string().min(1),
  checkout: z.boolean(),
});

export const createBranchResultSchema = z.object({
  branchName: z.string(),
  operation: operationDetailsSchema,
});

export const createWorktreePreviewSchema = z.object({
  projectId: z.string(),
  branchMode: branchModeSchema,
  branchName: z.string(),
  targetPath: z.string(),
  baseRef: z.string().optional(),
  willCreateBranch: z.boolean(),
  destinationExists: z.boolean(),
  branchAlreadyCheckedOut: z.boolean(),
  checkedOutPath: z.string().optional(),
  canCreate: z.boolean(),
  warnings: z.array(z.string()),
  command: z.object({
    executable: z.string(),
    args: z.array(z.string()),
    cwd: z.string(),
  }),
});

export const createWorktreeResultSchema = z.object({
  project: projectDetailsSchema,
  createdPath: z.string(),
  branchName: z.string(),
  operation: operationDetailsSchema,
  copyWarnings: z.array(z.string()),
});

export const switchWorktreeBranchRequestSchema = z.object({
  projectId: z.string().min(1),
  worktreePath: z.string().min(1),
  branchName: z.string().min(1),
});

export const switchWorktreeBranchResultSchema = z.object({
  worktreePath: z.string(),
  branchName: z.string(),
  operation: operationDetailsSchema,
});

export const changedFileSchema = z.object({
  path: z.string(),
  oldPath: z.string().optional(),
  index: z.string(),
  worktree: z.string(),
  untracked: z.boolean(),
  conflict: z.boolean(),
  additions: z.number().int().nonnegative().optional(),
  deletions: z.number().int().nonnegative().optional(),
  binary: z.boolean().optional(),
});

export const remoteInfoSchema = z.object({
  baseUrl: z.string().nullable(),
  host: z.enum(["github", "gitlab", "bitbucket", "other"]),
});

export const editorTargetSchema = z.object({
  id: z.string(),
  label: z.string(),
  app: z.string(),
});

export const openWithRequestSchema = z.object({
  app: z.string().min(1),
  path: z.string().min(1),
});

export const getWorktreeChangesRequestSchema = z.object({
  projectId: z.string().min(1),
  worktreePath: z.string().min(1),
});

export const getCommitChangesRequestSchema = z.object({
  projectId: z.string().min(1),
  hash: z.string().min(1),
});

export const fileDiffRequestSchema = z.object({
  projectId: z.string().min(1),
  kind: z.enum(["worktree", "commit"]),
  path: z.string().min(1),
  oldPath: z.string().optional(),
  worktreePath: z.string().optional(),
  hash: z.string().optional(),
});

export const fileDiffSchema = z.object({
  path: z.string(),
  oldPath: z.string().optional(),
  original: z.string(),
  modified: z.string(),
  language: z.string(),
  binary: z.boolean(),
});

export const configStateSchema = z.object({
  version: z.literal(2),
  projects: z.array(projectDetailsSchema),
  selectedProjectId: z.string().nullable(),
});

export const projectDetailsNullableSchema = projectDetailsSchema.nullable();
export const operationDetailsNullableSchema = operationDetailsSchema.nullable();
