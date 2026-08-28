import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./AppShell.tsx", import.meta.url), "utf8");
const sidebarSource = readFileSync(new URL("./SessionSidebar.tsx", import.meta.url), "utf8");
const globals = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

test("keeps the Codex panel controls in the desktop top bar", () => {
  assert.doesNotMatch(source, /className="codex-legacy-toolbar"/);
  assert.doesNotMatch(source, /renderSessionStatsButton\(false\)/);
  assert.match(source, /!isMobile && renderTerminalToggle\(\)/);
  assert.match(source, /!isMobile && renderSummaryToggle\(false\)/);
  assert.match(source, /!isMobile && renderMainFileToggle\(false\)/);
});

test("keeps compact controls available on mobile", () => {
  assert.match(source, /renderSessionStatsButton\(true\)/);
  assert.match(source, /renderTerminalToggle\(\)/);
});

test("keeps the account hover pill inset and inside the sidebar layout", () => {
  assert.match(sidebarSource, /className="codex-session-sidebar"[\s\S]*?flex: "1 1 0"[\s\S]*?minHeight: 0/);
  assert.doesNotMatch(sidebarSource, /className="codex-session-sidebar"[^>]*height: "100%"/);
  assert.match(globals, /\.codex-sidebar-footer \{[\s\S]*?width: calc\(var\(--sidebar-width, var\(--spacing-token-sidebar\)\) - 24px\) !important;[\s\S]*?margin: 0 12px 8px;[\s\S]*?overflow: visible;/);
  assert.match(globals, /\.codex-sidebar-footer button \{[\s\S]*?width: 100%;[\s\S]*?box-sizing: border-box;/);
  assert.match(globals, /\.codex-sidebar-footer button:focus-visible \{[\s\S]*?outline-offset: -2px;/);
});
