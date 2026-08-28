---
repro_schema: 2
repro_id: FE-20260828-footer-devtools-overlap
title: Next.js 开发工具遮挡侧栏账户栏
target_browser: chrome
target_url: http://127.0.0.1:30141/
source_commit: ff0f99b58403a0ea33a0a027d1d7da9d86399372
status: CONFIRMED
requires_existing_login: false
race_sensitive: false
created_at: 2026-08-28T01:25:48.757Z
last_verified_at: 2026-08-28T01:29:14.094Z
---

# 现象

Actual: Next.js 开发工具的黑色圆形 N 按钮固定在左下角，覆盖侧栏账户头像与 Pi 文本。

Expected: 侧栏账户栏完整可见，开发工具浮层不覆盖产品 UI。

## 环境

| Key | Value |
|---|---|
| URL | `http://127.0.0.1:30141/` |
| Browser | Chromium unknown |
| Viewport | 1280x720 |
| Account role | none |
| Data fixture | empty workspace |

## 前置条件

- [x] 本地开发服务器运行于 30141 端口
- [x] 页面没有未保存的重要内容

## Locator Registry

| Name | Locator | Purpose |
|---|---|---|
| sidebar_footer | `css:".codex-sidebar-footer"` | 侧栏账户栏，唯一实例 |
| next_devtools | `role:button[name="Open Next.js Dev Tools"]` | Next.js 开发工具浮动按钮，唯一实例 |

## Reset

| Step | Operation | Locator | Value | Success condition |
|---:|---|---|---|---|
| R1 | goto | — | `http://127.0.0.1:30141/` | `@sidebar_footer visible` |

## Reproduction Steps

| Step | Before | Locator | Action | Value | Wait / Success condition |
|---:|---|---|---|---|---|
| 1 | `@sidebar_footer visible` | `@sidebar_footer` | waitFor | — | `@sidebar_footer visible` |

## Bug Oracle

| Source | Assertion | Expected buggy value |
|---|---|---|
| `@next_devtools` | visible | `true` |

## Healthy Oracle

| Source | Assertion | Expected healthy value |
|---|---|---|
| `@next_devtools` | hidden | `true` |

## Race Stability

| Field | Value |
|---|---|
| Race sensitive | false |
| Completion signal | N/A |
| Stable condition | N/A |
| Basis | N/A |

## Safety

- External side effect: none
- Sensitive input required: no
- Replay limit: 2

## Evidence

- Console: none
- Network: none
- Screenshot: user-provided local crop, not persisted in the repository

## Replay Log

| Time | Commit | Phase | Result | Failed step | Evidence |
|---|---|---|---|---:|---|
| 2026-08-28T01:25:48.757Z | ff0f99b58403a0ea33a0a027d1d7da9d86399372 | EXPLORED | PERSISTED_AND_LOCATORS_UNIQUE | — | 从 Reset 严格执行两次；footer 与 devtools locator 均唯一，Bug Oracle 两次均命中 |
| 2026-08-28T01:27:28.595Z | ff0f99b58403a0ea33a0a027d1d7da9d86399372 | PREFLIGHT_REPLAYED | REPRODUCED | — | 新标签页按文档回放；footer 可见且 devtools locator 唯一，Bug Oracle 命中 |
| 2026-08-28T01:29:14.094Z | ff0f99b58403a0ea33a0a027d1d7da9d86399372 | FIX_VERIFIED | BUG_ABSENT_HEALTHY_PRESENT | — | 新标签页严格回放；devtools locator 数量为 0，footer 与 26px 头像完整位于视口内 |
