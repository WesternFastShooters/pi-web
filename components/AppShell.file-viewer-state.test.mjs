import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("./AppShell.tsx", import.meta.url), "utf8");

function fileContentBlock() {
  const start = source.indexOf("{/* Only the active viewer");
  const end = source.indexOf("</div>\n      </div>\n    </div>", start);
  assert.notEqual(start, -1, "file content comment not found");
  assert.notEqual(end, -1, "end of file content block not found");
  return source.slice(start, end);
}

test("only the active file tab mounts a FileViewer", () => {
  const block = fileContentBlock();
  assert.match(block, /activeFileTab\?\.filePath \? \(/);
  assert.doesNotMatch(block, /fileTabs\.map\(/);
  assert.equal(block.match(/<FileViewer/g)?.length, 1);
});

test("the active viewer restores tab state and saves it with a revision", () => {
  const block = fileContentBlock();
  assert.match(block, /key=\{`\$\{activeFileTab\.id\}:\$\{activeFileTab\.viewerRevision \?\? 0\}`\}/);
  assert.match(block, /initialState=\{activeFileTab\.viewerState\}/);
  assert.match(block, /handleFileViewerStateChange\(\s*activeFileTab\.id,\s*activeFileTab\.viewerRevision \?\? 0,/);
});

test("closing the file panel pauses the active viewer watcher", () => {
  assert.match(fileContentBlock(), /watchEnabled=\{rightPanelOpen\}/);
});

test("renders the summary as a toolbar popover instead of the file side panel", () => {
  assert.match(source, /const \[summaryOpen, setSummaryOpen\] = useState\(false\)/);
  assert.match(source, /aria-controls="summary-panel"/);
  assert.match(source, /className="codex-activity-overview codex-summary-popover"/);
  assert.doesNotMatch(fileContentBlock(), /codex-activity-overview/);
});

test("keeps the side panel available before a file is opened", () => {
  assert.match(source, /const \[rightPanelOpen, setRightPanelOpen\] = useState\(false\)/);
  assert.doesNotMatch(source, /fileTabs\.length > 0 && renderMainFileToggle/);
  assert.match(source, /renderMainFileToggle\(false\)/);
  assert.match(source, /className="codex-side-panel-home"/);
});

test("keeps only the side panel launchers in the empty side panel", () => {
  const block = fileContentBlock();
  assert.match(block, /className="codex-side-panel-launchers"/);
  assert.match(block, /translate\("chat\.sideChat"\)/);
  assert.match(block, /translate\("sidePanel\.browser"\)/);
  assert.match(block, /translate\("terminal\.title"\)/);
  assert.doesNotMatch(block, /codex-side-panel-recommendations/);
  assert.doesNotMatch(block, /sidePanel\.recommended/);
  assert.doesNotMatch(block, /127\.0\.0\.1:30141/);
});

test("renders independent desktop bottom and side panel controls", () => {
  const desktopToolbar = source.slice(
    source.indexOf("{!isMobile && renderSummaryToggle(false)}"),
    source.indexOf("{isMobile && sessionHasBranches"),
  );
  assert.match(desktopToolbar, /renderTerminalToggle\(\)/);
  assert.match(desktopToolbar, /renderMainFileToggle\(false\)/);
  assert.match(source, /aria-controls="terminal-panel"/);
  assert.match(source, /aria-controls="file-panel"/);
});
