import type { ProjectDetails } from "./types";

export function upsertProjectInList(
  projects: ProjectDetails[],
  nextProject: ProjectDetails,
) {
  return [...projects.filter((project) => project.commonGitDir !== nextProject.commonGitDir && project.id !== nextProject.id), nextProject].sort(
    (left, right) => left.displayName.localeCompare(right.displayName),
  );
}
