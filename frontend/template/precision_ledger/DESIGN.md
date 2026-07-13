---
name: Precision Ledger
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#45464d'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#0058be'
  on-secondary: '#ffffff'
  secondary-container: '#2170e4'
  on-secondary-container: '#fefcff'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#0b1c30'
  on-tertiary-container: '#75859d'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#d8e2ff'
  secondary-fixed-dim: '#adc6ff'
  on-secondary-fixed: '#001a42'
  on-secondary-fixed-variant: '#004395'
  tertiary-fixed: '#d3e4fe'
  tertiary-fixed-dim: '#b7c8e1'
  on-tertiary-fixed: '#0b1c30'
  on-tertiary-fixed-variant: '#38485d'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-mono:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
  headline-md-mobile:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  grid-margin: 24px
  grid-gutter: 16px
---

## Brand & Style
The brand personality is authoritative, precise, and high-performance. This design system is engineered for financial professionals who require instant clarity in complex data environments. The visual language balances **Modern Corporate** professionalism with a **Minimalist** focus on data hierarchy. 

The emotional response should be one of absolute reliability and technical sophistication. Every element is designed to minimize cognitive load, using generous whitespace and a "content-first" philosophy. The aesthetic avoids decorative flourishes, favoring a utilitarian elegance where the data itself provides the visual interest.

## Colors
The palette is anchored by a deep Slate primary (`#0F172A`), providing a grounded, trustworthy foundation. A vibrant "Electric Blue" serves as the secondary color for primary actions and interactive states, ensuring high visibility against the neutral backdrop.

- **Primary (Slate 900):** Used for headlines, primary navigation, and high-emphasis icons.
- **Secondary (Blue 500):** Used for call-to-actions, selection states, and active focus indicators.
- **Data Status:** Success (Emerald) and Danger (Rose) are calibrated for high legibility on both white and slate backgrounds, specifically for ticker symbols and performance indicators.
- **Neutral:** A range of cool grays (Slate 50-400) manages the UI skeleton, borders, and secondary text.

The system is light-mode first but uses a "tonal swap" logic for dark mode, where Slate 900 backgrounds replace White, and text scales up the Slate ramp toward White.

## Typography
The system utilizes **Inter** for all primary interface elements due to its exceptional tall x-height and legibility in dense grids. To distinguish technical data and numerical values, **Geist** (a technical, developer-friendly face) is used for labels, timestamps, and mono-spaced data points.

- **Weight Strategy:** Use Semibold (600) for headers to maintain authority. Use Regular (400) for body text to ensure readability in long-form reports.
- **Numerical Data:** All currency and ticker values must use `font-variant-numeric: tabular-nums` to ensure alignment in vertical columns.
- **Hierarchy:** High contrast is maintained by using Slate 900 for titles and Slate 500 for secondary metadata.

## Layout & Spacing
This design system employs a **Fluid Grid** model optimized for high-density dashboards. It uses an 8px base unit, but allows for 4px increments ("sub-steps") for tight data components like data tables and KPI widgets.

- **Desktop (1440px+):** 12-column grid, 24px margins, 16px gutters.
- **Tablet (768px-1439px):** 8-column grid, 16px margins, 12px gutters.
- **Mobile (Up to 767px):** 4-column grid, 16px margins, 12px gutters. Content stacks vertically; sidebars convert to bottom navigation or hamburger overlays.

**Density Toggles:** For data tables, the design system supports a "Compact" mode where vertical cell padding is reduced from 12px to 6px, allowing more rows to be visible above the fold.

## Elevation & Depth
Depth is communicated through **Tonal Layering** and **Low-Contrast Outlines** rather than heavy shadows, maintaining a crisp, "flat" professional look.

- **Level 0 (Background):** Slate 50. The canvas for all dashboard elements.
- **Level 1 (Cards/Widgets):** Pure White background with a 1px border of Slate 200. No shadow.
- **Level 2 (Dropdowns/Modals):** Pure White background with a soft, 12% opacity Slate shadow (0px 10px 15px -3px) and a Slate 200 border.
- **Interactive State:** Hovering over an interactive element (like a row or card) triggers a subtle background shift to Slate 100 rather than an elevation lift.

## Shapes
The shape language is **Soft** and geometric. A radius of 4px (`0.25rem`) is the default for most elements, providing a modern touch without sacrificing the "serious" nature of a financial tool.

- **Buttons & Inputs:** 4px radius.
- **KPI Cards:** 8px radius (`rounded-lg`) to differentiate structural modules from interactive components.
- **Status Chips:** 100px (Pill) to create a distinct visual shape that stands out from rectangular data cells.

## Components
Consistent component styling ensures the platform feels like a single, integrated tool.

- **Buttons:** 
  - *Primary:* Solid Slate 900 background, White text. 
  - *Secondary:* Ghost style with 1px Slate 200 border. 
  - *Small:* Used exclusively within data tables for row-level actions.
- **KPI Widgets:** Features a `headline-md` value, a `label-mono` title, and a small sparkline chart. Background is Level 1 elevation.
- **Data Tables:**
  - Header row: Slate 50 background, uppercase `label-mono` text.
  - Borders: 1px horizontal lines only (Slate 100) to emphasize the row-scanning flow.
- **Input Fields:** 
  - Focus state: 2px Blue 500 ring with 0px offset.
  - Labels: `label-mono` positioned above the input.
- **Status Chips:** 
  - Use a 10% opacity version of the status color for the background and 100% opacity for the text (e.g., Light Green bg with Dark Green text).
- **Charts:** 
  - Use a specialized 6-color categorical palette (Blue, Indigo, Violet, Teal, Amber, Rose) optimized for color-blind accessibility.