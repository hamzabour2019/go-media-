# Animated Background

The app uses a CSS-only animated gradient via `.go-animated-bg` in `app/globals.css`.

## Key Settings

- Animation: `goGradientShift 22s ease-in-out infinite`
- Background size: `300% 300%`
- Motion reduction:
  - `@media (prefers-reduced-motion: reduce)` disables animation
- Readability overlay:
  - `.go-animated-bg::before` uses dark translucent layer

## Tweaks

- Speed: change `22s` (recommended 15s-30s)
- Colors: update `--go-bg-navy`, `--go-bg-purple`, `--go-bg-blue` variables
- Overlay strength: adjust alpha in `.go-animated-bg::before`

## Where Applied

- Root body class in `app/layout.tsx`:
  - `<body className="go-animated-bg ...">`
