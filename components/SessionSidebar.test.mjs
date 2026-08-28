import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("./SessionSidebar.tsx", import.meta.url), "utf8");
const sessionItemSource = source.slice(source.indexOf("function SessionItem("));

test("does not render inline rename or delete buttons on session rows", () => {
  assert.doesNotMatch(sessionItemSource, /title=\{t\("sidebar\.rename"\)\}/);
  assert.doesNotMatch(sessionItemSource, /title=\{t\("sidebar\.deleteWithShiftClick"\)\}/);
  assert.doesNotMatch(sessionItemSource, /Action buttons — shown on hover/);
});

test("does not register row-level session deletion shortcuts", () => {
  assert.doesNotMatch(sessionItemSource, /const handleKeyDown/);
  assert.doesNotMatch(sessionItemSource, /onKeyDown=\{handleKeyDown\}/);
  assert.doesNotMatch(sessionItemSource, /tabIndex=\{0\}/);
});

test("polls running sessions only while the tab is visible", () => {
  assert.doesNotMatch(source, /new EventSource\("\/api\/agent\/running\/events"\)/);
  assert.match(source, /fetch\("\/api\/agent\/running"/);
  assert.match(source, /document\.visibilityState !== "visible"/);
  assert.match(source, /document\.addEventListener\("visibilitychange", onVisibilityChange\)/);
});

test("exposes the polled running-session set to the shell", () => {
  assert.match(source, /onRunningSessionIdsChange\?: \(ids: Set<string>\) => void/);
  assert.match(source, /onRunningSessionIdsChange\?\.\(runningSessionIds\)/);
});

test("exposes the loaded session catalog to the shell", () => {
  assert.match(source, /onSessionsChange\?: \(sessions: SessionInfo\[\]\) => void/);
  assert.match(source, /onSessionsChange\?\.\(allSessions\)/);
});

test("subagent completion stays silent and never becomes unread", () => {
  assert.match(source, /completionNotificationSuppressedSessionIds\?: string\[\]/);
  assert.match(
    source,
    /completedWithNotifications = completedInBackground\.filter\([\s\S]*?!previousSuppressedCompletionSessionIdsRef\.current\.has\(id\)[\s\S]*?!knownSubagentIds\.has\(id\)/,
  );
  assert.match(source, /completedWithNotifications\.forEach\(\(id\) => next\.add\(id\)\)/);
  assert.match(source, /if \(completedWithNotifications\.length > 0\) \{\s*onBackgroundTaskDone\?\.\(\)/);
  assert.match(
    source,
    /filter\(\(session\) => session\.relation\?\.kind !== "subagent"\)[\s\S]*?unreadEligibleIds\.has\(id\)/,
  );
});

test("includes project activity counts in accessible labels", () => {
  assert.match(
    source,
    /aria-label=\{`\$\{t\("sidebar\.agentRunning"\)\} \(\$\{activity\.running\}\)`\}/,
  );
  assert.match(
    source,
    /aria-label=\{`\$\{t\("sidebar\.newSessionActivity"\)\} \(\$\{activity\.unread\}\)`\}/,
  );
});

test("formats session timestamps with the active locale", () => {
  assert.match(source, /import \{ formatRelativeTime \} from "@\/lib\/i18n\/format"/);
  assert.match(sessionItemSource, /const \{ locale, t \} = useI18n\(\)/);
  assert.match(sessionItemSource, /formatRelativeTime\(session\.modified, locale\)/);
});

test("opens a built-in session context menu with rename and delete actions", () => {
  assert.match(sessionItemSource, /const handleContextMenu[\s\S]*?dispatchSessionRowContextMenu\(\{/);
  assert.match(sessionItemSource, /onContextMenu=\{handleContextMenu\}/);
  assert.match(sessionItemSource, /const \[contextMenu, setContextMenu\] = useState/);
  assert.match(sessionItemSource, /createPortal\(/);
  assert.match(sessionItemSource, /\{t\("sidebar\.rename"\)\}<\/button>/);
  assert.match(sessionItemSource, /\{t\("sidebar\.delete"\)\}<\/button>/);
  assert.match(sessionItemSource, /method: "PATCH"/);
  assert.match(sessionItemSource, /method: "DELETE"/);
});

test("manual and lifecycle refreshes bypass the server session-list cache", () => {
  assert.match(source, /force \? "\/api\/sessions\?force=1" : "\/api\/sessions"/);
  assert.match(source, /cache: "no-store"/);
  assert.match(source, /loadSessions\(isFirst, !isFirst\)/);
  assert.match(source, /onClick=\{\(\) => loadSessions\(false, true\)\}/);
  assert.match(source, /loadSessions\(false, true\);[\s\S]*?onBackgroundTaskDone/);
});

test("project section exposes add-project and per-project new-session actions", () => {
  assert.match(source, /aria-label=\{t\("sidebar\.addProject"\)\}/);
  assert.match(source, /onClick=\{handleCustomPathClick\}/);
  assert.match(source, /const handleNewSessionForCwd = useCallback/);
  assert.match(source, /onClick=\{\(event\) => \{[\s\S]*?handleNewSessionForCwd\(project\.root\)/);
  assert.match(source, /onClick=\{\(event\) => \{[\s\S]*?handleNewSessionForCwd\(selectedProject\?\.root \?\? selectedCwd\)/);
});

test("hides subagent rows and aggregates their state into the main session row", () => {
  assert.match(source, /const sessionFamilies = listSessionFamilies\(filteredSessions\)/);
  assert.match(source, /familySessions\.some\(\(session\) => session\.id === selectedSessionId\)/);
  assert.match(source, /familySessions\.some\(\(session\) => runningSessionIds\.has\(session\.id\)\)/);
  assert.doesNotMatch(source, /function SessionTreeItem/);
});
