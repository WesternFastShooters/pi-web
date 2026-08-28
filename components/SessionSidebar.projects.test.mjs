import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = [
  await readFile(new URL("./SessionSidebar.tsx", import.meta.url), "utf8"),
  await readFile(new URL("./ProjectSidebarTree.tsx", import.meta.url), "utf8"),
  await readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
].join("\n");

test("projects expose Codex-style layout, project actions, and drag assignment", () => {
  assert.match(source, /sidebar\.organizeSidebar/);
  assert.match(source, /sidebar\.removeProject/);
  assert.match(source, /sidebar\.revealInFinder/);
  assert.match(source, /onDropSession/);
  assert.match(source, /draggable/);
});

test("project and recent section headings expose working collapse controls", () => {
  assert.match(source, /aria-expanded=\{projectsExpanded\}/);
  assert.match(source, /aria-expanded=\{recentsExpanded\}/);
  assert.match(source, /hidden=\{!projectsExpanded\}/);
  assert.match(source, /hidden=\{!recentsExpanded\}/);
});

test("project and recent collapse chevrons appear only while their heading is hovered or focused", () => {
  assert.match(source, /\.codex-project-collapse-chevron\s*\{[^}]*opacity:\s*0/s);
  assert.match(source, /\.codex-project-tree-heading:hover\s+\.codex-project-collapse-chevron/);
  assert.match(source, /\.codex-project-recents-label:hover\s+\.codex-project-collapse-chevron/);
  assert.match(source, /\.codex-project-section-toggle:focus-visible\s+\.codex-project-collapse-chevron/);
});
