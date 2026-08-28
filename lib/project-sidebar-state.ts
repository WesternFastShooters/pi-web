import type { RecentProject } from "./project-groups";

export type ProjectLayout = "projects" | "list";
export type ProjectSort = "priority" | "recent" | "manual";

export interface SidebarProject extends RecentProject {
  name?: string;
}

export interface ProjectSidebarState {
  version: 1;
  layout: ProjectLayout;
  sort: ProjectSort;
  projects: SidebarProject[];
  removedProjectKeys: string[];
  sessionProjectKeys: Record<string, string>;
}

export const PROJECT_SIDEBAR_STORAGE_KEY = "pi-web:project-sidebar:v1";

export const DEFAULT_PROJECT_SIDEBAR_STATE: ProjectSidebarState = {
  version: 1,
  layout: "projects",
  sort: "recent",
  projects: [],
  removedProjectKeys: [],
  sessionProjectKeys: {},
};

export function parseProjectSidebarState(raw: string | null): ProjectSidebarState {
  if (!raw) return DEFAULT_PROJECT_SIDEBAR_STATE;
  try {
    const value = JSON.parse(raw) as Partial<ProjectSidebarState>;
    if (value.version !== 1) return DEFAULT_PROJECT_SIDEBAR_STATE;
    return {
      version: 1,
      layout: value.layout === "list" ? "list" : "projects",
      sort: value.sort === "priority" || value.sort === "manual" ? value.sort : "recent",
      projects: Array.isArray(value.projects)
        ? value.projects.filter((project): project is SidebarProject => Boolean(
            project && typeof project.key === "string" && typeof project.root === "string",
          ))
        : [],
      removedProjectKeys: Array.isArray(value.removedProjectKeys)
        ? value.removedProjectKeys.filter((key): key is string => typeof key === "string")
        : [],
      sessionProjectKeys: value.sessionProjectKeys && typeof value.sessionProjectKeys === "object"
        ? Object.fromEntries(Object.entries(value.sessionProjectKeys).filter(
            (entry): entry is [string, string] => typeof entry[1] === "string",
          ))
        : {},
    };
  } catch {
    return DEFAULT_PROJECT_SIDEBAR_STATE;
  }
}

export function mergeSidebarProjects(
  state: ProjectSidebarState,
  discovered: readonly RecentProject[],
): SidebarProject[] {
  const removed = new Set(state.removedProjectKeys);
  const discoveredByKey = new Map(discovered.map((project) => [project.key, project]));
  const merged: SidebarProject[] = [];
  for (const saved of state.projects) {
    if (removed.has(saved.key)) continue;
    const current = discoveredByKey.get(saved.key);
    merged.push({ ...saved, root: current?.root ?? saved.root });
    discoveredByKey.delete(saved.key);
  }
  for (const project of discovered) {
    if (!removed.has(project.key) && discoveredByKey.has(project.key)) merged.push(project);
  }
  return merged;
}

export function effectiveProjectKey(
  sessionId: string,
  derivedProjectKey: string,
  assignments: Readonly<Record<string, string>>,
): string {
  return assignments[sessionId] ?? derivedProjectKey;
}
