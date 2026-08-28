import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const panelSource = await readFile(new URL("./TerminalPanel.tsx", import.meta.url), "utf8");
const chatSource = await readFile(new URL("./ChatWindow.tsx", import.meta.url), "utf8");
const shellSource = await readFile(new URL("./AppShell.tsx", import.meta.url), "utf8");

test("terminal runs commands through the existing Pi bash command path", () => {
  assert.match(chatSource, /onRun=\{\(command\) => \{ void handleSend\(`!\$\{command\}`\); \}\}/);
  assert.match(chatSource, /messages\.filter\(\(message\): message is BashExecutionMessage => message\.role === "bashExecution"\)/);
  assert.doesNotMatch(panelSource, /fetch\(|WebSocket|EventSource/);
});

test("terminal exposes history, stop, close, and accessible panel controls", () => {
  assert.match(panelSource, /event\.key === "ArrowUp"/);
  assert.match(panelSource, /onClick=\{onAbort\}/);
  assert.match(panelSource, /id="terminal-panel"/);
  assert.match(panelSource, /role="separator"/);
  assert.match(panelSource, /pi-terminal-height/);
  assert.match(shellSource, /aria-controls="terminal-panel"/);
  assert.match(shellSource, /onToggleTerminal: \(\) => setTerminalOpen/);
});
