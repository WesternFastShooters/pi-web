import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./ChatWindow.tsx", import.meta.url), "utf8");
const appShellSource = readFileSync(new URL("./AppShell.tsx", import.meta.url), "utf8");

test("exposes pi-btw as a side chat launcher", () => {
  assert.match(source, /slashCommands\.some\(\(command\) => command\.name === "btw"\)/);
  assert.match(source, /handleSend\("\/btw"\)/);
  assert.match(source, /chat\.sideChat/);
  assert.doesNotMatch(source, /codex-side-chat-launcher/);
  assert.match(appShellSource, /renderSideChatToggle/);
  assert.match(appShellSource, /marginLeft: !mobile \? "auto"/);
});

test("docks the pi-btw custom UI without changing generic extension dialogs", () => {
  assert.match(source, /function isBtwCustomRequest/);
  assert.match(source, /codex-side-chat-panel/);
  assert.match(source, /sideDock=\{isBtwCustomRequest\(customUiToRender\)\}/);
  assert.match(source, /aria-modal=\{!sideDock\}/);
  assert.match(source, /onDockClose/);
  assert.match(source, /setBtwSideChatExpanded/);
});
