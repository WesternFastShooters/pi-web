# Codex Desktop App Shell Topology

## Layout

1. Left sidebar: project selector, new task, task history, explorer, settings footer.
2. Main surface: 46px floating toolbar, scrollable thread, bottom composer.
3. Optional detail panel: file, diff, review, source, or artifact tabs.
4. Optional bottom panel: terminal and command output.

## Interaction model

- Sidebar and detail panel: click-driven visibility, drag-driven resizing, 300ms width transition.
- Thread: scroll-driven; content is centered in a 48rem column.
- Composer: multiline auto-grow, command/file suggestion trays, run/stop state transitions.
- Tool calls: progressive status states; details expand on click.
- Responsive: sidebar becomes a drawer and detail panel becomes full-screen on narrow screens.

## Backend boundary

The Pi SDK, session persistence, SSE reconciliation, Git/worktree APIs, file access boundary, models, skills, and plugins remain unchanged. Only presentation and client-side interaction composition are replaced.

