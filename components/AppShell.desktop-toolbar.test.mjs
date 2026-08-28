import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./AppShell.tsx", import.meta.url), "utf8");

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
