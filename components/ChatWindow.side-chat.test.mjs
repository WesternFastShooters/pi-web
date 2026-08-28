import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./ChatWindow.tsx", import.meta.url), "utf8");
const appShellSource = readFileSync(new URL("./AppShell.tsx", import.meta.url), "utf8");

test("exposes pi-btw as a side chat launcher", () => {
  assert.match(source, /slashCommands\.some\(\(command\) => command\.name === "btw"\)/);
  assert.match(source, /handleSend\("\/btw"\)/);
  assert.doesNotMatch(source, /codex-side-chat-launcher/);
  assert.doesNotMatch(appShellSource, /renderSideChatToggle/);
  assert.match(appShellSource, /className="codex-side-panel-launcher"/);
  assert.match(appShellSource, /translate\("chat\.sideChat"\)/);
});

test("docks the pi-btw custom UI without changing generic extension dialogs", () => {
  assert.match(source, /function isBtwCustomRequest/);
  assert.match(source, /codex-side-chat-panel/);
  assert.match(source, /isBtwCustomRequest\(customUiToRender\) \? \(/);
  assert.match(source, /<ExtensionCustomPanel[\s\S]*?sideDock/);
  assert.match(source, /createPortal/);
  assert.match(source, /sideChatHost/);
  assert.match(source, /aria-modal=\{!sideDock\}/);
  assert.match(source, /onDockClose/);
  assert.match(source, /setBtwSideChatExpanded/);
  assert.doesNotMatch(source, /paddingRight: btwSideChatOpen/);
});

test("mounts side chat as a right-panel tab instead of a third column", () => {
  assert.match(appShellSource, /const SIDE_CHAT_TAB_ID = "side-chat"/);
  assert.match(appShellSource, /label: translate\("chat\.sideChat"\)/);
  assert.match(appShellSource, /onSideChatOpenChange=\{handleSideChatOpenChange\}/);
  assert.match(appShellSource, /sideChatHost=\{sideChatHost\}/);
  assert.match(appShellSource, /ref=\{setSideChatHost\}/);
  assert.match(appShellSource, /tabs=\{rightPanelTabs\}/);
  assert.match(appShellSource, /setRightPanelOpen\(true\)/);
});
