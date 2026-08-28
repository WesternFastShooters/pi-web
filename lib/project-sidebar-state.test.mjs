import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_PROJECT_SIDEBAR_STATE,
  effectiveProjectKey,
  mergeSidebarProjects,
  parseProjectSidebarState,
} from "./project-sidebar-state.ts";

test("project sidebar state rejects malformed persisted data", () => {
  assert.deepEqual(parseProjectSidebarState("not json"), DEFAULT_PROJECT_SIDEBAR_STATE);
  assert.deepEqual(parseProjectSidebarState(JSON.stringify({ version: 99 })), DEFAULT_PROJECT_SIDEBAR_STATE);
});

test("persisted projects keep empty projects and aliases while discovered projects are merged", () => {
  const state = {
    ...DEFAULT_PROJECT_SIDEBAR_STATE,
    projects: [{ key: "a", root: "/a", name: "Alpha" }],
  };
  assert.deepEqual(mergeSidebarProjects(state, [
    { key: "a", root: "/a-new" },
    { key: "b", root: "/b" },
  ]), [
    { key: "a", root: "/a-new", name: "Alpha" },
    { key: "b", root: "/b" },
  ]);
});

test("removed projects stay hidden until explicitly added again", () => {
  const state = {
    ...DEFAULT_PROJECT_SIDEBAR_STATE,
    removedProjectKeys: ["a"],
  };
  assert.deepEqual(mergeSidebarProjects(state, [{ key: "a", root: "/a" }]), []);
});

test("session assignment overrides its filesystem-derived project only in the sidebar", () => {
  assert.equal(effectiveProjectKey("session-1", "original", { "session-1": "target" }), "target");
  assert.equal(effectiveProjectKey("session-2", "original", { "session-1": "target" }), "original");
});
