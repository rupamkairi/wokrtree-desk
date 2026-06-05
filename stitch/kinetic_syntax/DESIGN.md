---
name: Kinetic Syntax
colors:
  surface: '#0b141c'
  surface-dim: '#0b141c'
  surface-bright: '#313a43'
  surface-container-lowest: '#060f16'
  surface-container-low: '#141c24'
  surface-container: '#182028'
  surface-container-high: '#222b33'
  surface-container-highest: '#2d363e'
  on-surface: '#dae3ee'
  on-surface-variant: '#c0c7d4'
  inverse-surface: '#dae3ee'
  inverse-on-surface: '#29313a'
  outline: '#8b919d'
  outline-variant: '#414752'
  surface-tint: '#a2c9ff'
  primary: '#a2c9ff'
  on-primary: '#00315c'
  primary-container: '#58a6ff'
  on-primary-container: '#003a6b'
  inverse-primary: '#0060aa'
  secondary: '#67df70'
  on-secondary: '#00390d'
  secondary-container: '#27a640'
  on-secondary-container: '#00320a'
  tertiary: '#fabc45'
  on-tertiary: '#422c00'
  tertiary-container: '#d29922'
  on-tertiary-container: '#4d3500'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#d3e4ff'
  primary-fixed-dim: '#a2c9ff'
  on-primary-fixed: '#001c38'
  on-primary-fixed-variant: '#004882'
  secondary-fixed: '#83fc89'
  secondary-fixed-dim: '#67df70'
  on-secondary-fixed: '#002105'
  on-secondary-fixed-variant: '#005317'
  tertiary-fixed: '#ffdeaa'
  tertiary-fixed-dim: '#fabc45'
  on-tertiary-fixed: '#271900'
  on-tertiary-fixed-variant: '#5f4100'
  background: '#0b141c'
  on-background: '#dae3ee'
  surface-variant: '#2d363e'
typography:
  ui-sans-bold:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
  ui-sans-reg:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  ui-sans-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  code-mono-reg:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: -0.02em
  code-mono-bold:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 20px
  label-caps:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  container-padding: 12px
  element-gap: 8px
  sidebar-width: 240px
  toolbar-height: 40px
---

## Brand & Style
The design system is engineered for developers who require a high-performance, low-friction environment for complex version control workflows. The brand personality is technical, precise, and unobtrusive, acting as a sophisticated layer over the underlying data. 

The aesthetic follows a **Modern Corporate/Minimalist** approach, prioritizing information density and clarity over decorative elements. It utilizes a "Dark Mode First" philosophy to reduce eye strain during long coding sessions. The UI relies on a strict architectural grid, flat surfaces, and high-contrast status indicators to guide the user's eye toward critical git operations and merge conflicts.

## Colors
This design system utilizes a tiered monochromatic dark palette to establish hierarchy. 
- **Core Surfaces:** The deepest shade (#0D1117) is reserved for the application background and sidebar, while the secondary shade (#161B22) defines active work areas and panels.
- **Accents:** Colors are used functionally rather than decoratively. 
    - **Primary (Blue):** Navigation, active states, and branching.
    - **Success (Green):** Staging, successful commits, and additions in diffs.
    - **Warning (Orange/Yellow):** Merge conflicts and uncommitted changes.
    - **Error (Red):** Deletions in diffs and critical terminal errors.
- **Borders:** Thin, low-contrast borders (#30363D) replace heavy shadows to define UI boundaries without adding visual bulk.

## Typography
The typography system balances UI legibility with technical precision. 
- **Inter** is the primary driver for the interface, utilized at small scales (12px-14px) to maximize information density without sacrificing readability.
- **JetBrains Mono** is mandatory for all code-related content, including diffs, commit hashes, and file paths. It is tuned with a slightly tighter letter-spacing for better vertical alignment in split-pane views.
- **Hierarchy:** Use `label-caps` for sidebar headers and panel titles to create clear section breaks in high-density layouts.

## Layout & Spacing
The layout uses a **Fluid Split-Pane** model. The application is divided into three primary zones: 
1. **Global Sidebar:** Fixed width (240px) for repository navigation and branch switching.
2. **Commit/File List:** Flexible middle column for browsing history or staged files.
3. **Detail View:** The primary workspace for diffs, code editing, and conflict resolution.

A 4px base unit controls all spacing. Gutters between panes are strictly 1px (defined by the border color), while internal container padding is set to 12px to allow for comfortable scanning. Margins are minimized to support a "data-heavy" environment where seeing more lines of code is a priority.

## Elevation & Depth
In this design system, depth is communicated through **Tonal Layering** rather than traditional shadows. 
- **Level 0 (Base):** Navigation sidebars and background panels (#0D1117).
- **Level 1 (Surface):** Main content areas and editor backgrounds (#161B22).
- **Level 2 (Overlay):** Modals, tooltips, and dropdown menus. These use a slightly lighter background (#21262D) and a subtle 8px blur shadow with 20% opacity to distinguish them from the underlying grid.
- **Active State:** Active tabs or selected files are indicated by a 2px vertical "accent bar" on the left edge rather than a change in surface elevation.

## Shapes
The shape language is sharp and disciplined. A standard **4px (Soft)** radius is applied to buttons, input fields, and cards to maintain a modern feel without appearing "bubbly." 
- **Tabs:** Top corners have a 4px radius; bottom corners remain sharp to sit flush against the content pane.
- **Status Badges:** Use a 2px radius for a more "tag-like" appearance.
- **Inputs:** Strictly 4px to align with the density of the grid.

## Components
- **Buttons:** Primary buttons use a solid `#238636` (Success) or `#1F6FEB` (Primary) background. Ghost buttons with a `#30363D` border are used for secondary actions.
- **Diff Views:** Use full-width background tints for line changes. Added lines: `rgba(63, 185, 80, 0.15)`; Removed lines: `rgba(248, 81, 73, 0.15)`. High-contrast text highlights within lines are used for character-level changes.
- **Tabs:** Horizontal tabs with a bottom border-trim. The active tab features a `#F78166` (or primary blue) 2px underline.
- **Compact Status Badges:** Small, rectangular badges for branch names or build statuses. Use monospace font for the text within badges.
- **Splitters:** Draggable 1px dividers. On hover, the splitter changes color to Primary Blue to indicate interactivity.
- **Input Fields:** Dark background (#0D1117) with a subtle border. Focus state is a 1px Primary Blue glow.