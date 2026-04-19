# Design System

## Overview

This document defines the design tokens and guidelines for the modern frontend application. All components should adhere to these standards for consistency.

---

## Color Palette

### Primary Colors (Cyan/Blue)
Used for primary actions, links, and key UI elements.

```
Primary-50:   #f0f9ff
Primary-100:  #e0f2fe
Primary-200:  #bae6fd
Primary-300:  #7dd3fc
Primary-400:  #38bdf8
Primary-500:  #0ea5e9  (Primary action)
Primary-600:  #0284c7
Primary-700:  #0369a1
Primary-800:  #075985
Primary-900:  #0c3d66
Primary-950:  #0a2a42
```

### Secondary Colors (Purple)
Used for secondary actions, highlights, and accents.

```
Secondary-500:  #8b5cf6
Secondary-600:  #7c3aed
```

### Semantic Colors

#### Success (Green)
Positive actions, confirmations, successful operations.
```
Success-500:  #22c55e  (Success primary)
Success-600:  #16a34a
```

#### Danger (Red)
Destructive actions, errors, warnings.
```
Danger-500:  #ef4444   (Error primary)
Danger-600:  #dc2626
```

#### Warning (Amber)
Alerts, cautions, attention-needed items.
```
Warning-500:  #f59e0b  (Warning primary)
Warning-600:  #d97706
```

#### Info (Blue)
Informational messages, passive notifications.
```
Info-500:  #3b82f6   (Info primary)
Info-600:  #2563eb
```

### Neutral Colors (Slate Grayscale)
Used for text, backgrounds, borders, and structural elements.

**Light Mode:**
```
Neutral-50:   #f8fafc  (Lightest background)
Neutral-100:  #f1f5f9
Neutral-200:  #e2e8f0  (Light borders)
Neutral-300:  #cbd5e1
Neutral-400:  #94a3b8  (Light text)
Neutral-500:  #64748b
Neutral-600:  #475569  (Standard text)
Neutral-700:  #334155  (Dark text)
Neutral-800:  #1e293b
Neutral-900:  #0f172a
Neutral-950:  #020617  (Darkest)
```

**Dark Mode:**
```
Neutral-50:   #0f172a  (Dark background)
Neutral-100:  #1e293b
Neutral-200:  #334155  (Dark borders)
...colors invert...
```

---

## Spacing System

All spacing is based on a 4px grid unit.

```
xs:    0.25rem  (1px)
sm:    0.5rem   (2px)
base:  1rem     (4px) - Base unit
md:    1.5rem   (6px)
lg:    2rem     (8px)
xl:    3rem     (12px)
2xl:   4rem     (16px)
```

### Usage:
- **Micro spacing** (sm, xs): for tight internal spacing (button padding, small gaps)
- **Base spacing** (base): default component padding/margin
- **Medium spacing** (md, lg): section spacing, component gaps
- **Large spacing** (xl, 2xl): page sections, major layout breaks

---

## Typography

### Font Family
- **Primary:** Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif
- **Monospace:** Courier New, monospace (for code/terminal)

### Font Sizes

```
xs:    0.75rem   (12px)  — Small labels, captions
sm:    0.875rem  (14px)  — Secondary text
base:  1rem      (16px)  — Body text, standard
lg:    1.125rem  (18px)  — Subheadings
xl:    1.25rem   (20px)  — Section headings
2xl:   1.5rem    (24px)  — Page titles
3xl:   1.875rem  (30px)  — Hero titles
4xl:   2.25rem   (36px)  — Banner titles
```

### Font Weights

```
thin:       100  (Rare use)
extralight: 200  (Rare use)
light:      300  (Subtle text)
normal:     400  (Default body)
medium:     500  (Emphasized text, labels)
semibold:   600  (Subheadings, highlights)
bold:       700  (Important text, strong emphasis)
extrabold:  800  (Rare use)
black:      900  (Rare use)
```

### Line Heights

- **xs-sm:** 1rem (16px)
- **base:** 1.5rem (24px)
- **lg-xl:** 1.75rem (28px)
- **2xl+:** 2rem (32px)

### Examples

```jsx
// Heading styles
<h1 className="text-4xl font-bold leading-10">Page Title</h1>
<h2 className="text-2xl font-semibold">Section</h2>
<p className="text-base font-normal">Body text</p>
<label className="text-sm font-medium">Label</label>
```

---

## Shadows

```
sm:   0 1px 2px 0 rgba(0, 0, 0, 0.05)
base: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)
md:   0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)
lg:   0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)
xl:   0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)
glass: 0 8px 32px 0 rgba(31, 38, 135, 0.37)
```

---

## Border Radius

```
none:  0
sm:    0.25rem  (2px)
base:  0.375rem (3px)
md:    0.5rem   (4px)  - Standard component
lg:    0.75rem  (6px)
xl:    1rem     (8px)  - Card borders
2xl:   1.5rem   (12px)
3xl:   2rem     (16px)
full:  9999px   - Pill shaped
```

### Usage:
- **sm:** Small elements (buttons, inputs)
- **base/md:** Standard components (cards, dialogs)
- **lg/xl:** Larger containers, cards
- **full:** Pill-shaped buttons, rounded avatars

---

## Animations & Transitions

### Duration

```
100ms:  Quick feedback (hover, small interactions)
200ms:  Standard (modal open, fade)
300ms:  Moderate (slide, scale)
500ms:  Deliberate (page enter, complex animations)
1s+:    Looping (pulse, loading indicators)
```

### Ease Functions

```
ease-in-out:    Standard, default
ease-out:       Enter animations, emphasis exit
ease-in:        Exit animations
cubic-bezier(...): Custom fine-tuned motions
```

### Available Animations

```
animation-fade-in:     Opacity 0→1
animation-fade-in-up:  Opacity & slide from below
animation-slide-in:    Slide from left
animation-scale-in:    Scale 0.95→1 with fade
animation-pulse-glow:  Pulsing shadow glow (2s loop)
```

### Usage

```jsx
// Enter animation
<div className="animate-fade-in-up">Welcome</div>

// Transition for interactive elements
<button className="transition-all duration-300 hover:scale-105">
  Click me
</button>

// Continuous animation
<div className="animate-pulse-glow">Loading</div>
```

---

## Dark Mode

Dark mode is implemented using Tailwind's class-based strategy.

### Activation
- Add `dark` class to `<html>` or parent element
- CSS variables automatically invert

### Usage in Components

```jsx
// Tailwind dark prefix
<div className="bg-white dark:bg-slate-900">
  <p className="text-slate-900 dark:text-slate-100">Text</p>
</div>

// CSS variables (auto-inverts)
.component {
  background: var(--color-neutral-50);  /* light: white, dark: dark */
  color: var(--color-neutral-900);      /* light: dark, dark: light */
}
```

---

## Breakpoints

Mobile-first responsive design.

```
xs:   default (mobile)
sm:   640px   (small tablets)
md:   768px   (tablets)
lg:   1024px  (small desktops)
xl:   1280px  (desktops)
2xl:  1536px  (large screens)
```

### Layout Guidance

```jsx
// Mobile-first: start with mobile, escalate
<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
  {/* 1 col mobile, 2 sm+, 3 md+, 4 lg+ */}
</div>

// Hide/show based on screen
<div className="hidden md:block">Desktop only</div>
<div className="md:hidden">Mobile only</div>

// Responsive padding
<div className="px-3 sm:px-6 lg:px-8">Content</div>
```

---

## Accessibility Guidelines

- **Color Contrast:** Minimum 4.5:1 for normal text, 3:1 for large text
- **Focus States:** All interactive elements must have visible focus (`:focus-visible`)
- **Labels:** All inputs must have associated `<label>` elements
- **ARIA:** Use `aria-label`, `aria-describedby`, `role` for complex components
- **Keyboard Navigation:** All features must be keyboard accessible
- **Motion:** Respect `prefers-reduced-motion` for animations

---

## Component Sizing

### Button Sizes

```
sm:    px-2.5 py-1.5 text-sm
md:    px-4 py-2 text-base    (default)
lg:    px-6 py-3 text-lg
```

### Input Heights

```
sm:    h-8   (input, select)
md:    h-10  (default)
lg:    h-12
```

### Card Widths

```
sm:    w-80   (320px)
md:    w-96   (384px)
lg:    w-full sm:w-96  md:w-full
```

---

## Best Practices

✅ **Do:**
- Use utility classes for layout (Tailwind first)
- Keep components semantic (`<button>`, `<label>`, `<main>`)
- Ensure sufficient color contrast
- Provide visual feedback on interaction (hover, focus, active states)
- Use consistent spacing throughout
- Test responsive layout on multiple screen sizes
- Support dark mode in all components
- Keep animations short and purposeful

❌ **Don't:**
- Use hardcoded colors (use CSS variables instead)
- Override Tailwind defaults unnecessarily
- Ignore accessibility requirements
- Create non-standard component sizes
- Mix styling approaches (e.g., Tailwind + inline styles)
- Animate `top`, `left`, `right`, `bottom` (use `transform` instead)
- Add unnecessary animations or transitions

---

## Quick Reference

### Color Class Examples

```jsx
// Primary
className="bg-primary-50 dark:bg-primary-950 text-primary-600"

// Success
className="bg-success-100 text-success-600"

// Danger
className="bg-danger-100 text-danger-600"

// Neutral backgrounds
className="bg-neutral-50 dark:bg-neutral-900"

// Text
className="text-neutral-700 dark:text-neutral-300"
```

### Common Component Patterns

```jsx
// Card
<div className="bg-white dark:bg-slate-900 rounded-lg border border-neutral-200 dark:border-neutral-800 shadow-sm p-6">

// Button
<button className="bg-primary-500 hover:bg-primary-600 text-white rounded-md px-4 py-2 transition-colors">

// Input
<input className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-md bg-white dark:bg-slate-900 text-neutral-900 dark:text-neutral-100" />

// Badge
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200">
```

---

## Tailwind Config Reference

All tokens are defined in `tailwind.config.js` and can be extended as needed. Import from CSS variables for custom styles:

```css
.custom-element {
  color: var(--color-primary-500);
  background: var(--color-neutral-50);
}
```
