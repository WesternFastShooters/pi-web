"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import type { SessionInfo } from "@/lib/types";
import { workspaceKeyOf } from "@/lib/workspace-memory";
import type { RecentProject } from "@/lib/project-groups";
import {
  DEFAULT_PROJECT_SIDEBAR_STATE,
  PROJECT_SIDEBAR_STORAGE_KEY,
  effectiveProjectKey,
  mergeSidebarProjects,
  parseProjectSidebarState,
  type ProjectSidebarState,
  type SidebarProject,
} from "@/lib/project-sidebar-state";
import { useI18n } from "@/hooks/useI18n";

function folderIcon(): ReactNode {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 7h6l2 2h10v10H3Z"/><path d="M3 7V5h6l2 2"/></svg>;
}

function loadState(): ProjectSidebarState {
  if (typeof window === "undefined") return DEFAULT_PROJECT_SIDEBAR_STATE;
  try { return parseProjectSidebarState(window.localStorage.getItem(PROJECT_SIDEBAR_STORAGE_KEY)); }
  catch { return DEFAULT_PROJECT_SIDEBAR_STATE; }
}

function projectLabel(project: SidebarProject): string {
  if (project.name) return project.name;
  const normalized = project.root.replace(/[\\/]+$/, "");
  return normalized.split(/[\\/]/).filter(Boolean).at(-1) ?? project.root;
}

interface Props {
  projects: RecentProject[];
  extraProject?: RecentProject | null;
  sessions: SessionInfo[];
  selectedSessionId: string | null;
  selectedProjectKey?: string | null;
  runningSessionIds: ReadonlySet<string>;
  unreadSessionIds: ReadonlySet<string>;
  loading: boolean;
  error: string | null;
  onAddProject: () => void;
  onSelectProject: (project: SidebarProject) => void;
  onNewSession: (root: string) => void;
  onSelectSession: (session: SessionInfo) => void;
  onRefreshSessions: () => void;
  onSessionDeleted?: (id: string) => void;
  renderSession: (session: SessionInfo, options: {
    isSelected: boolean;
    isRunning: boolean;
    isUnread: boolean;
    onClick: () => void;
    onRenamed: () => void;
    onDeleted?: (id: string) => void;
    draggable: boolean;
    onDragStart: (event: DragEvent<HTMLDivElement>) => void;
  }) => ReactNode;
}

export function ProjectSidebarTree(props: Props) {
  const { t } = useI18n();
  const [state, setState] = useState<ProjectSidebarState>(loadState);
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const [projectMenu, setProjectMenu] = useState<{ project: SidebarProject; x: number; y: number } | null>(null);
  const [hoveredProject, setHoveredProject] = useState<string | null>(null);
  const [dragTarget, setDragTarget] = useState<string | null>(null);
  const headerMenuRef = useRef<HTMLDivElement>(null);

  const updateState = useCallback((change: (current: ProjectSidebarState) => ProjectSidebarState) => {
    setState((current) => {
      const next = change(current);
      try { window.localStorage.setItem(PROJECT_SIDEBAR_STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  useEffect(() => {
    if (!props.extraProject) return;
    updateState((current) => {
      if (current.projects.some((project) => project.key === props.extraProject!.key)) return current;
      return {
        ...current,
        projects: [...current.projects, props.extraProject!],
        removedProjectKeys: current.removedProjectKeys.filter((key) => key !== props.extraProject!.key),
      };
    });
  }, [props.extraProject, updateState]);

  useEffect(() => {
    if (!headerMenuOpen && !projectMenu) return;
    const close = (event: PointerEvent) => {
      if (headerMenuRef.current?.contains(event.target as Node)) return;
      setHeaderMenuOpen(false);
      setProjectMenu(null);
    };
    const key = (event: KeyboardEvent) => { if (event.key === "Escape") { setHeaderMenuOpen(false); setProjectMenu(null); } };
    window.addEventListener("pointerdown", close);
    window.addEventListener("keydown", key);
    return () => { window.removeEventListener("pointerdown", close); window.removeEventListener("keydown", key); };
  }, [headerMenuOpen, projectMenu]);

  // Codex keeps an explicit project shelf. Historical sessions do not
  // automatically turn every cwd ever used into a pinned project.
  const allDiscovered = useMemo(
    () => props.extraProject ? [props.extraProject] : [],
    [props.extraProject],
  );

  const projects = useMemo(() => {
    return mergeSidebarProjects(state, allDiscovered);
  }, [allDiscovered, state]);

  const sortSessions = useCallback((sessions: SessionInfo[]) => {
    if (state.sort === "manual") return sessions;
    return [...sessions].sort((a, b) => {
      if (state.sort === "priority") {
        const score = (session: SessionInfo) => (props.runningSessionIds.has(session.id) ? 2 : 0) + (props.unreadSessionIds.has(session.id) ? 1 : 0);
        const priorityDifference = score(b) - score(a);
        if (priorityDifference !== 0) return priorityDifference;
      }
      return b.modified.localeCompare(a.modified);
    });
  }, [props.runningSessionIds, props.unreadSessionIds, state.sort]);

  const sessionsFor = useCallback((key: string) => props.sessions.filter((session) => (
    effectiveProjectKey(session.id, workspaceKeyOf(session), state.sessionProjectKeys) === key
  )), [props.sessions, state.sessionProjectKeys]);

  const renameProject = useCallback((project: SidebarProject) => {
    setProjectMenu(null);
    const nextName = window.prompt(t("sidebar.renameProject"), projectLabel(project))?.trim();
    if (!nextName) return;
    updateState((current) => ({
      ...current,
      projects: mergeSidebarProjects(current, allDiscovered).map((item) => item.key === project.key ? { ...item, name: nextName } : item),
    }));
  }, [allDiscovered, t, updateState]);

  const removeProject = useCallback((project: SidebarProject) => {
    setProjectMenu(null);
    updateState((current) => ({
      ...current,
      projects: current.projects.filter((item) => item.key !== project.key),
      removedProjectKeys: [...new Set([...current.removedProjectKeys, project.key])],
    }));
  }, [updateState]);

  const revealProject = useCallback(async (project: SidebarProject) => {
    setProjectMenu(null);
    await fetch("/api/cwd/reveal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cwd: project.root }),
    }).catch(() => {});
  }, []);

  const openProjectMenu = useCallback((project: SidebarProject, x: number, y: number) => {
    setHeaderMenuOpen(false);
    setProjectMenu({ project, x: Math.min(x, window.innerWidth - 210), y: Math.min(y, window.innerHeight - 128) });
  }, []);

  const onDropSession = useCallback((projectKey: string, event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const sessionId = event.dataTransfer.getData("application/x-pi-session") || event.dataTransfer.getData("text/plain");
    setDragTarget(null);
    if (!sessionId || !props.sessions.some((session) => session.id === sessionId)) return;
    updateState((current) => ({ ...current, sessionProjectKeys: { ...current.sessionProjectKeys, [sessionId]: projectKey } }));
  }, [props.sessions, updateState]);

  const renderSessions = (sessions: SessionInfo[]) => sessions.map((session) => props.renderSession(session, {
    isSelected: session.id === props.selectedSessionId,
    isRunning: props.runningSessionIds.has(session.id),
    isUnread: props.unreadSessionIds.has(session.id),
    onClick: () => props.onSelectSession(session),
    onRenamed: props.onRefreshSessions,
    onDeleted: props.onSessionDeleted,
    draggable: true,
    onDragStart: (event) => {
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("application/x-pi-session", session.id);
      event.dataTransfer.setData("text/plain", session.id);
    },
  }));

  return <section className="codex-project-tree" aria-label={t("sidebar.projects")}>
    <div className="codex-project-tree-heading">
      <span>{t("sidebar.projects")}</span>
      <div ref={headerMenuRef} className="codex-project-tree-heading-actions">
        <button type="button" onClick={() => setHeaderMenuOpen((open) => !open)} aria-label={t("sidebar.projectOptions")}>•••</button>
        <button type="button" onClick={() => { setProjectMenu(null); setHeaderMenuOpen(false); props.onAddProject(); }} aria-label={t("sidebar.addProject")}>＋</button>
        {headerMenuOpen && <div className="codex-project-menu codex-project-layout-menu" role="menu">
          <div className="codex-project-menu-label">{t("sidebar.organizeSidebar")}</div>
          <button role="menuitemradio" aria-checked={state.layout === "projects"} onClick={() => updateState((current) => ({ ...current, layout: "projects" }))}><span>{state.layout === "projects" ? "✓" : ""}</span>{t("sidebar.byProject")}</button>
          <button role="menuitemradio" aria-checked={state.layout === "list"} onClick={() => updateState((current) => ({ ...current, layout: "list" }))}><span>{state.layout === "list" ? "✓" : ""}</span>{t("sidebar.inOneList")}</button>
          <div className="codex-project-menu-label">{t("sidebar.chatSort")}</div>
          {(["priority", "recent", "manual"] as const).map((sort) => <button key={sort} role="menuitemradio" aria-checked={state.sort === sort} onClick={() => updateState((current) => ({ ...current, sort }))}><span>{state.sort === sort ? "✓" : ""}</span>{t(`sidebar.sort.${sort}`)}</button>)}
        </div>}
      </div>
    </div>

    {props.loading && <div className="codex-project-empty">{t("sidebar.loading")}</div>}
    {props.error && <div className="codex-project-empty codex-project-error">{props.error}</div>}
    {!props.loading && !props.error && state.layout === "projects" && projects.map((project) => {
      const projectSessions = sortSessions(sessionsFor(project.key));
      const active = props.selectedProjectKey === project.key;
      return <div key={project.key} className="codex-project-group">
        <div
          className="codex-project-row"
          data-active={active || undefined}
          data-drop-target={dragTarget === project.key || undefined}
          onMouseEnter={() => setHoveredProject(project.key)}
          onMouseLeave={() => setHoveredProject(null)}
          onClick={() => props.onSelectProject(project)}
          onContextMenu={(event) => { event.preventDefault(); openProjectMenu(project, event.clientX, event.clientY); }}
          onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = "move"; setDragTarget(project.key); }}
          onDragLeave={() => setDragTarget(null)}
          onDrop={(event) => onDropSession(project.key, event)}
          title={project.root}
        >
          {folderIcon()}<span className="codex-project-name">{projectLabel(project)}</span>
          <span className="codex-project-row-actions" data-visible={hoveredProject === project.key || undefined}>
            <button type="button" onClick={(event) => { event.stopPropagation(); openProjectMenu(project, event.clientX, event.clientY); }} aria-label={t("sidebar.projectOptions")}>•••</button>
            <button type="button" onClick={(event) => { event.stopPropagation(); props.onNewSession(project.root); }} aria-label={t("sidebar.newSessionInProject", { path: project.root })}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/></svg>
            </button>
          </span>
        </div>
        <div className="codex-project-sessions">{renderSessions(projectSessions)}</div>
      </div>;
    })}
    {!props.loading && !props.error && state.layout === "list" && <div className="codex-project-flat-list">{renderSessions(sortSessions(props.sessions))}</div>}
    {!props.loading && !props.error && state.layout === "projects" && props.sessions.length > 0 && <>
      <div className="codex-project-recents-label">{t("sidebar.recent")}</div>
      <div className="codex-project-flat-list">{renderSessions(sortSessions(props.sessions))}</div>
    </>}

    {projectMenu && createPortal(<div className="codex-project-menu codex-project-context-menu" role="menu" style={{ left: projectMenu.x, top: projectMenu.y }} onPointerDown={(event) => event.stopPropagation()}>
      <button role="menuitem" onClick={() => removeProject(projectMenu.project)}>{t("sidebar.removeProject")}</button>
      <button role="menuitem" onClick={() => void revealProject(projectMenu.project)}>{t("sidebar.revealInFinder")}</button>
      <button role="menuitem" onClick={() => renameProject(projectMenu.project)}>{t("sidebar.rename")}</button>
    </div>, document.body)}
  </section>;
}
