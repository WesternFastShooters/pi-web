import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = [
  await readFile(new URL("./SessionSidebar.tsx", import.meta.url), "utf8"),
  await readFile(new URL("./ProjectSidebarTree.tsx", import.meta.url), "utf8"),
].join("\n");

test("projects expose Codex-style layout, project actions, and drag assignment", () => {
  assert.match(source, /sidebar\.organizeSidebar/);
  assert.match(source, /sidebar\.removeProject/);
  assert.match(source, /sidebar\.revealInFinder/);
  assert.match(source, /onDropSession/);
  assert.match(source, /draggable/);
});
