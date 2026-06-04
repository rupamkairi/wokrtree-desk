import { z } from "zod";

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

export const projectSnapshotSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  selectedPath: z.string(),
  primaryPath: z.string(),
  commonGitDir: z.string(),
  worktrees: z.array(worktreeSnapshotSchema),
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

export const registerRepositoryRequestSchema = z.object({
  selectedPath: z.string().min(1),
});

export const refreshRepositoryRequestSchema = z.object({
  projectId: z.string().min(1),
});

export const projectSnapshotNullableSchema = projectSnapshotSchema.nullable();
export const operationDetailsNullableSchema = operationDetailsSchema.nullable();
