# Codex Desktop Design Tokens

Source: locally installed `/Applications/ChatGPT.app/Contents/Resources/app.asar`, inspected from bundled CSS without copying application source into this repository.

## Geometry

- Base spacing: `4px`
- Toolbar: `46px`; compact toolbar: `36px`; pane toolbar: `40px`
- Sidebar: `clamp(240px, 275px, min(520px, calc(100vw - 320px)))`
- Panel padding: `20px` for browser/electron surfaces
- Content column: generally `42rem`–`48rem`; use `48rem` for the Pi thread
- Radius scale: `6, 8, 10, 12, 16, 20, 24px`
- Composer multiline radius: `20px`

## Typography

- UI: `-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
- Mono: `ui-monospace, "SFMono-Regular", "SF Mono", Menlo, Consolas, monospace`
- Main chat: `16px`; controls: `12–14px`
- Weights: `400, 500, 600, 700`

## Light

- Main surface: `#ffffff`
- Sidebar: `#f9f9f9`
- Foreground: `#1a1c1f`
- Secondary text: 70% foreground
- Tertiary text: 50% foreground
- Border: 8% foreground; strong border: 12% foreground

## Dark

- Main surface: `#181818`
- Sidebar: `#212121`
- Foreground: `#ededed`
- Secondary text: 70% white
- Tertiary text: 50% white
- Border: 8% white; strong border: 16% white

## Motion and elevation

- Basic transition: `150ms ease`
- Relaxed panel transition: `300ms ease`
- Enter easing: `cubic-bezier(.19, 1, .22, 1)`
- Composer: hairline stroke plus low, wide shadow

