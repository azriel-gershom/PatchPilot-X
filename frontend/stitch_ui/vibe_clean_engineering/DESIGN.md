---
name: Vibe Clean Engineering
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#3c4a42'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#6c7a71'
  outline-variant: '#bbcabf'
  surface-tint: '#006c49'
  primary: '#006c49'
  on-primary: '#ffffff'
  primary-container: '#10b981'
  on-primary-container: '#00422b'
  inverse-primary: '#4edea3'
  secondary: '#00687a'
  on-secondary: '#ffffff'
  secondary-container: '#57dffe'
  on-secondary-container: '#006172'
  tertiary: '#0053db'
  on-tertiary: '#ffffff'
  tertiary-container: '#7f9fff'
  on-tertiary-container: '#00328b'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#6ffbbe'
  primary-fixed-dim: '#4edea3'
  on-primary-fixed: '#002113'
  on-primary-fixed-variant: '#005236'
  secondary-fixed: '#acedff'
  secondary-fixed-dim: '#4cd7f6'
  on-secondary-fixed: '#001f26'
  on-secondary-fixed-variant: '#004e5c'
  tertiary-fixed: '#dbe1ff'
  tertiary-fixed-dim: '#b4c5ff'
  on-tertiary-fixed: '#00174b'
  on-tertiary-fixed-variant: '#003ea8'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
  surface-canvas: '#FAFAFA'
  surface-card: '#FFFFFF'
  surface-subtle: '#F3F4F6'
  border-hairline: '#E5E7EB'
  border-active: '#CBD5E1'
  text-primary: '#0F172A'
  text-secondary: '#334155'
  text-muted: '#64748B'
  brand-vibe-green: '#33B288'
typography:
  display-hero:
    fontFamily: Geist
    fontSize: 48px
    fontWeight: '600'
    lineHeight: 56px
    letterSpacing: -0.03em
  headline-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.025em
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 26px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '500'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-sm:
    fontFamily: Geist
    fontSize: 20px
    fontWeight: '500'
    lineHeight: 28px
    letterSpacing: -0.015em
  body-lg:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  body-sm:
    fontFamily: Geist
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0em
  label-mono-md:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: -0.01em
  label-mono-sm:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  caption:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0.01em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.25rem
  gutter-mobile: 0.75rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1.25rem
  space-xl: 2rem
---

## Brand & Style

This design system embodies high-precision developer clarity with a clean, light-mode-first aesthetic. Designed for engineers, technical leads, and spatial computing innovators, the visual narrative balances utility, restraint, and vibrant functional accents. 

Drawing from modern precision minimalism and clean developer-tool interfaces, the layout relies on crisp off-white canvas foundations, translucent hairline boundaries, and sharp slate typography. High-saturation emerald, cyan, and electric blue accents act as targeted status indicators, code execution highlights, and active telemetry cues rather than decorative washes. The emotional posture is analytical, swift, and trustworthy—eliminating visual clutter to prioritize density, legibility, and effortless model verification.

## Colors

The palette is engineered around clean layered neutrals and high-contrast dark slates, energized by precise technological accents.

- **Primary (`#10B981` / `#33B288`)**: Signifies execution success, affirmative actions, verified 3D assets, and primary interactive affordances.
- **Secondary (`#06B6D4`)**: Used for inspect modes, node linkages, mesh overlays, and secondary system telemetry.
- **Tertiary (`#2563EB`)**: Drives focused navigational markers, selection brackets, and deep-link interactive anchors.
- **Neutral (`#64748B`)**: Anchors structural mid-tones, secondary metadata, and structural outlines.

### Surface Architecture
Surfaces transition smoothly across three distinct tiers:
1. `surface-canvas` (`#FAFAFA`): The global backdrop grounding the application.
2. `surface-card` (`#FFFFFF`): Elevated modular workbenches, panels, and modal shells.
3. `surface-subtle` (`#F3F4F6`): Recessed code playgrounds, telemetry strips, and disabled states.

Text hierarchy relies on `#0F172A` for absolute focal clarity, stepping down to `#334155` for body data and `#64748B` for tertiary captions and units.

## Typography

Typography prioritizes information density and code scanning. **Geist** serves as the primary headline and body face, delivering neutral, neo-grotesque structural balance with optimized digital letterforms. For terminal readouts, model matrix data, parameters, tokens, and verification traces, **JetBrains Mono** provides rigid horizontal alignment and instant semantic separation from UI text.

Tight negative letter-spacing on display and headline weights provides an assertive, engineered look without compromising glyph legibility. Technical labels and badges enforce uppercase or title-cased monospaced styling for machine-readable clarity.

## Layout & Spacing

The layout is built upon an 8pt base grid optimized for dense technical consoles, side-by-side viewports, and multi-pane inspection docks.

- **Desktop (>= 1280px)**: A 12-column dynamic grid container with `margin: 2rem` and `gutter: 1.25rem`. Complex tooling sidebars maintain fixed widths (e.g., 280px navigation, 340px inspector) while central 3D viewports and verification streams scale fluidly.
- **Tablet (768px - 1279px)**: 8-column layout. Left tool rails collapse into iconized action columns, shifting secondary inspectors into sheet overlays.
- **Mobile (< 768px)**: 4-column flow with condensed gutters (`gutter-mobile: 0.75rem`) and edge margins (`margin-mobile: 1rem`). Complex dual-pane inspector tables stack vertically with horizontally scrollable code containers.

## Elevation & Depth

Visual hierarchy combines low-contrast hairline outlines with soft ambient diffusion shadows, avoiding muddy blurs or aggressive skeuomorphism.

- **Level 0 (Flat / Canvas)**: Sits on `#FAFAFA` with no elevation. Borderless or demarcated via direct surface changes.
- **Level 1 (Card & Modular Panel)**: Layered with `#FFFFFF` resting on a 1px border (`#E5E7EB`). Elevated by an ambient diffused shadow: `0 1px 3px rgba(15, 23, 42, 0.04), 0 4px 12px rgba(15, 23, 42, 0.02)`.
- **Level 2 (Dropdowns, Tooltips, Floating Controls)**: `#FFFFFF` paired with `#E2E8F0` border and elevated via `0 4px 6px -1px rgba(15, 23, 42, 0.06), 0 10px 24px -3px rgba(15, 23, 42, 0.06)`.
- **Level 3 (Modals, Overlaid 3D Viewport Panels)**: Crisp hairline highlight combined with a wide spatial spread: `0 20px 35px -5px rgba(15, 23, 42, 0.08), 0 10px 15px -5px rgba(15, 23, 42, 0.03)`. Backdrops use `rgba(15, 23, 42, 0.2)` with a 4px blur (`backdrop-filter: blur(4px)`).

## Shapes

The design system standardizes on calibrated rounded corners that soften technical density without appearing playful. Primary structural cards, modals, and container shells adopt a 12px to 14px boundary (`rounded-lg` to `rounded-xl`). Interactive inputs and standard buttons sit uniformly at 8px (`rounded-md`), while telemetry badges, operational status tags, and pill chips utilize full pill contours (`rounded-full`) for high-contrast tag recognition.

## Components

### Buttons
- **Primary**: Solid Emerald (`#10B981`) text in pure white (`#FFFFFF`), with an inset top-edge highlight (`box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2)`). Height: 36px (compact) or 42px (regular). Hover shifts to `#059669`.
- **Secondary / Ghost**: Pure white surface (`#FFFFFF`) with 1px border (`#E5E7EB`) and dark slate text (`#0F172A`). Hover transitions border to `#CBD5E1` with background `#F9FAFB`.
- **Destructive**: Hairline `#FEE2E2` background, `#DC2626` text, transitioning to solid red hover states.

### Chips & Badges
- Constructed with pill geometry (`rounded-full`), `space-xs` vertical and `space-sm` horizontal padding.
- Employs light tints with crisp monospaced labels: Emerald status badges utilize `#ECFDF5` fill with `#065F46` text and `#A7F3D0` hairline border; Cyan model nodes utilize `#ECFEFF` fill with `#155E75` text.

### Code Blocks & Monospace Terminals
- High-clarity light substrate (`#F8FAFC`) framed by a 1px `#E2E8F0` border.
- Monospaced typography with syntax tokenization: keywords in `#2563EB`, strings in `#059669`, properties in `#0F172A`. Includes floating copy actions and line-number column dividers.

### Form Inputs & Fields
- Surface: `#FFFFFF` with 1px border `#E5E7EB`. Height: 38px. Font: `body-md` (`14px`).
- Focus state: Border transforms to `#2563EB` with an ambient focus ring: `0 0 0 3px rgba(37, 99, 235, 0.12)`.
- Placeholder text: `#94A3B8`.

### Checkboxes & Radios
- Size: 16x16px with 4px border-radius (checkbox) or circular (radio).
- Default: Border 1px `#CBD5E1` on `#FFFFFF`. Checked: Solid `#10B981` background with white check icon.

### Cards & Panels
- Layered `#FFFFFF` surface with 12px border radius, 1px `#E5E7EB` border, and Level 1 diffusion shadow.
- Header bands are segregated using a bottom hairline border (`#F1F5F9`) and `space-md` inner padding.