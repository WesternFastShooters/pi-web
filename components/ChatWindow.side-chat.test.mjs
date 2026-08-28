import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./ChatWindow.tsx", import.meta.url), "utf8");
const appShellSource = readFileSync(new URL("./AppShell.tsx", import.meta.url), "utf8");
const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

test("exposes pi-btw as a side chat launcher", () => {
  assert.match(source, /slashCommands\.some\(\(command\) => command\.name === "btw"\)/);
  assert.match(source, /handleSend\("\/btw"\)/);
  assert.doesNotMatch(source, /codex-side-chat-launcher/);
  assert.doesNotMatch(appShellSource, /renderSideChatToggle/);
  assert.match(appShellSource, /className="codex-side-panel-launcher"/);
  assert.match(appShellSource, /translate\("chat\.sideChat"\)/);
});

test("exposes pi-btw state without portaling its view out of the chat tree", () => {
  assert.match(source, /function isBtwCustomRequest/);
  assert.match(source, /codex-side-chat-panel/);
  assert.doesNotMatch(source, /createPortal/);
  assert.doesNotMatch(source, /sideChatHost/);
  assert.match(source, /onSideChatControllerChange/);
  assert.match(source, /aria-modal=\{!sideDock\}/);
  assert.match(source, /onDockClose/);
  assert.match(source, /setBtwSideChatExpanded/);
  assert.doesNotMatch(source, /paddingRight: btwSideChatOpen/);
});

test("renders side chat directly as responsive right-panel content", () => {
  assert.match(appShellSource, /const SIDE_CHAT_TAB_ID = "side-chat"/);
  assert.match(appShellSource, /label: translate\("chat\.sideChat"\)/);
  assert.match(appShellSource, /onSideChatOpenChange=\{handleSideChatOpenChange\}/);
  assert.match(appShellSource, /onSideChatControllerChange=\{setSideChatController\}/);
  assert.match(appShellSource, /<ExtensionCustomPanel[\s\S]*?sideDock/);
  assert.doesNotMatch(appShellSource, /setSideChatHost/);
  assert.match(appShellSource, /tabs=\{rightPanelTabs\}/);
  assert.match(appShellSource, /setRightPanelOpen\(true\)/);
});

test("side chat owns a visible sender instead of an invisible terminal input", () => {
  assert.match(source, /className="codex-side-chat-composer"/);
  assert.match(source, /className="codex-side-chat-sender"/);
  assert.match(source, /asBracketedPaste\(draft\)/);
  assert.match(source, /parseSideChatTranscript/);
  assert.match(source, /\[─━-\]\{8,\}/);
  assert.match(source, /codex-side-chat-message-\$\{entry\.role\}/);
  assert.match(source, /normalized\.slice\(2, -3\)/);
});

test("hides the extension status footer below the primary sender", () => {
  assert.doesNotMatch(source, /<ExtensionStatusBar/);
});

test("aligns the primary and side-chat sender cards", () => {
  const composerRule = css.match(/\.codex-side-chat-composer\s*\{([^}]*)\}/)?.[1] ?? "";
  const senderRule = css.match(/\.codex-side-chat-sender\s*\{([^}]*)\}/)?.[1] ?? "";

  assert.match(composerRule, /margin:\s*12px 12px 16px/);
  assert.match(senderRule, /min-height:\s*106px/);
});
