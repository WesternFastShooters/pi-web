import assert from "node:assert/strict";
import test from "node:test";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url, { tsconfigPaths: true });
const { parseSideChatTranscript } = await jiti.import("./side-chat-transcript.ts");

const visibleTail = [
  "BTW · hidden thread preserved",
  "2 exchanges · idle · ↑8 ↓0",
  "Assistant",
  "    鸡蛋 + 全麦面包 + 牛奶。",
  "────────────────────────────────────────",
  "You 晚餐吃什么是",
  "Assistant",
  "    米饭 + 清炒蔬菜 + 鸡胸肉。",
  "Ready.",
  ">",
  "Enter · Esc",
];

test("uses the complete structured transcript instead of the visible TUI tail", () => {
  const entries = parseSideChatTranscript(visibleTail, [
    { id: 1, turnId: 1, type: "turn-boundary", phase: "start" },
    { id: 2, turnId: 1, type: "user-message", text: "早餐吃什么" },
    { id: 3, turnId: 1, type: "assistant-text", text: "鸡蛋 + 全麦面包 + 牛奶。", streaming: false },
    { id: 4, turnId: 1, type: "turn-boundary", phase: "end" },
    { id: 5, turnId: 2, type: "turn-boundary", phase: "start" },
    { id: 6, turnId: 2, type: "user-message", text: "晚餐吃什么是" },
    { id: 7, turnId: 2, type: "assistant-text", text: "米饭 + 清炒蔬菜 + 鸡胸肉。", streaming: false },
  ]);

  assert.deepEqual(entries, [
    { role: "user", content: "早餐吃什么" },
    { role: "assistant", content: "鸡蛋 + 全麦面包 + 牛奶。" },
    { role: "user", content: "晚餐吃什么是" },
    { role: "assistant", content: "米饭 + 清炒蔬菜 + 鸡胸肉。" },
  ]);
});

test("keeps the visible-text parser as a compatibility fallback", () => {
  assert.deepEqual(parseSideChatTranscript(visibleTail), [
    { role: "assistant", content: "鸡蛋 + 全麦面包 + 牛奶。" },
    { role: "user", content: "晚餐吃什么是" },
    { role: "assistant", content: "米饭 + 清炒蔬菜 + 鸡胸肉。" },
  ]);
});

test("an empty structured transcript clears stale visible lines", () => {
  assert.deepEqual(parseSideChatTranscript(visibleTail, []), []);
});
