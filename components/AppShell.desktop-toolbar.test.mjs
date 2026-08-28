import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./AppShell.tsx", import.meta.url), "utf8");

test("hides legacy session actions from the desktop top bar", () => {
  assert.doesNotMatch(source, /className="codex-legacy-toolbar"/);
  assert.doesNotMatch(source, /renderSessionStatsButton\(false\)/);
  assert.doesNotMatch(source, /!isMobile && renderTerminalToggle\(\)/);
  assert.match(source, /!isMobile && renderSummaryToggle\(false\)/);
});

test("keeps compact controls available on mobile", () => {
  assert.match(source, /renderSessionStatsButton\(true\)/);
  assert.match(source, /renderTerminalToggle\(\)/);
});
