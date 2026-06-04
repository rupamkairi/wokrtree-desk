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
  checkedOut: z.boolean(),
  checkedOutPath: z.string().optional(),
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

export const createWorktreeRequestSchema = z.object({
  projectId: z.string().min(1),
  branchMode: branchModeSchema,
  branchName: z.string().min(1),
  targetPath: z.string().min(1),
  baseRef: z.string().optional(),
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
});

export const configStateSchema = z.object({
  version: z.literal(2),
  projects: z.array(projectDetailsSchema),
  selectedProjectId: z.string().nullable(),
});

export const projectDetailsNullableSchema = projectDetailsSchema.nullable();
export const operationDetailsNullableSchema = operationDetailsSchema.nullable();
