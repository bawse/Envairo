# Chrome AI Assistant - Design System

**Version:** 1.0.0  
**Last Updated:** October 4, 2025  
**Design Language:** iOS Liquid Glass

---

## Table of Contents

1. [Design Philosophy](#design-philosophy)
2. [Color System](#color-system)
3. [Typography](#typography)
4. [Glass Morphism](#glass-morphism)
5. [Components](#components)
6. [Layout & Spacing](#layout--spacing)
7. [Interactive States](#interactive-states)
8. [Positioning System](#positioning-system)
9. [Animations & Transitions](#animations--transitions)
10. [Accessibility](#accessibility)

---

## Design Philosophy

The Chrome AI Assistant uses a **neutral, premium iOS-inspired glass morphism design** that feels modern, lightweight, and professional. The design prioritizes:

- **Clarity**: Clean hierarchy and readable content
- **Consistency**: Unified visual language across popup and overlay
- **Performance**: Hardware-accelerated effects and smooth interactions
- **Adaptability**: Responsive sizing and flexible positioning

### Key Principles

1. **Glass > Solid**: Use translucent, blurred surfaces instead of opaque backgrounds
2. **Subtle > Bold**: Prefer gentle gradients and soft shadows over harsh contrasts
3. **Centered Interaction**: Focus on the overlay for main tasks, popup for settings
4. **Smooth Motion**: All interactions should feel fluid and responsive

---

## Color System

### CSS Variables

```css
:root {
  --glass-bg: rgba(255,255,255,0.18);
  --glass-stroke: rgba(255,255,255,0.50);
  --glass-shadow: 0 22px 60px rgba(0,0,0,0.22);
  --glass-radius: 22px;
  --text-strong: #0b0f13;
  --text-weak: rgba(11,15,19,0.64);
}
```

### Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| `--glass-bg` | `rgba(255,255,255,0.18)` | Primary glass surface background |
| `--glass-stroke` | `rgba(255,255,255,0.50)` | Border color for glass elements |
| `--text-strong` | `#0b0f13` | Primary text, headings |
| `--text-weak` | `rgba(11,15,19,0.64)` | Secondary text, placeholders |

### Accent Colors

```css
/* Blue - Primary actions */
--accent-blue: rgba(60,130,255,0.55);
--accent-blue-shadow: rgba(60,130,255,0.18);

/* Green - Success, confirmation */
--accent-green: rgba(46,184,76,0.50);
--accent-green-shadow: rgba(46,184,76,0.18);

/* Red - Errors, warnings */
--accent-red: rgba(255,59,48,0.5);
--accent-red-bg: rgba(255,235,235,0.40);
```

### Background System

**Popup Background:**
```css
background: linear-gradient(145deg, #e5e7f0 0%, #d8dce8 100%);
```

**Overlay:** Relies on page content showing through the glass

---

## Typography

### Font Stack

```css
font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, 
             "Helvetica Neue", Arial, "Apple Color Emoji", "Segoe UI Emoji";
```

### Type Scale

| Element | Size | Weight | Line Height | Letter Spacing |
|---------|------|--------|-------------|----------------|
| H1 | 19px | 800 | 1.4 | -0.01em |
| H2 | 17px | 800 | 1.4 | -0.01em |
| H3 | 15px | 700 | 1.4 | 0 |
| Body | 14px | 500 | 1.45 | 0 |
| Small | 13px | 500 | 1.6 | 0 |
| Tiny | 12px | 600 | 1.5 | 0 |

### Text Styling

**Headings:**
```css
font-weight: 800;
letter-spacing: -0.01em;
color: var(--text-strong);
text-shadow: 0 1px 0 rgba(255,255,255,0.35);
```

**Body Text:**
```css
font-weight: 500;
color: var(--text-strong);
```

**Secondary Text:**
```css
color: var(--text-weak);
font-weight: 500;
```

---

## Glass Morphism

### Core Glass Effect

```css
background: rgba(255,255,255,0.18);
backdrop-filter: blur(24px) saturate(180%);
-webkit-backdrop-filter: blur(24px) saturate(180%);
border: 1px solid rgba(255,255,255,0.5);
border-radius: 22px;
box-shadow: 0 22px 60px rgba(0,0,0,0.22);
```

### Variants

**Heavy Glass (Panel):**
- Blur: 24px
- Saturation: 180%
- Border: 1px solid white 50%

**Medium Glass (Inputs, Buttons):**
- Blur: 18px
- Saturation: 170%
- Border: 1px solid white 55%

**Light Glass (Pills, Labels):**
- Blur: 16px
- Saturation: 140%
- Border: 1px solid white 50%

### Inner Glow

```css
.glass-panel::before {
  content: "";
  position: absolute;
  inset: -1px;
  border-radius: inherit;
  box-shadow: 0 0 0 1px rgba(255,255,255,0.24) inset;
  pointer-events: none;
}
```

### Fallback (No Backdrop Support)

```css
@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .glass-panel, .glass-input, .glass-button, .glass-output, .glass-pill {
    background: rgba(255,255,255,0.88);
  }
}
```

---

## Components

### 1. Glass Panel

**Usage:** Main container for popup and overlay content

```css
.glass-panel {
  position: relative;
  background: rgba(255,255,255,0.18);
  backdrop-filter: blur(24px) saturate(180%);
  border-radius: 22px;
  border: 1px solid rgba(255,255,255,0.5);
  box-shadow: 0 22px 60px rgba(0,0,0,0.22);
  outline: 1px solid rgba(255,255,255,0.18);
  outline-offset: -1px;
  padding: 22px;
}
```

### 2. Glass Input

**Usage:** Text areas, input fields

```css
.glass-input {
  padding: 14px 16px;
  border-radius: 18px;
  border: 1px solid rgba(255,255,255,0.55);
  background: rgba(255,255,255,0.18);
  backdrop-filter: blur(18px) saturate(170%);
  box-shadow: 0 2px 6px rgba(0,0,0,0.05) inset;
  color: var(--text-strong);
  font-size: 14px;
  line-height: 1.5;
  outline: none;
  transition: box-shadow .25s ease, border-color .25s ease;
}

.glass-input:focus {
  border-color: rgba(60,130,255,0.65);
  box-shadow: 0 0 0 6px rgba(60,130,255,0.18), 
              0 10px 28px rgba(60,130,255,0.22);
}

.glass-input::placeholder {
  color: var(--text-weak);
  font-weight: 500;
}
```

### 3. Glass Button

**Usage:** Primary, secondary, and accent buttons

```css
.glass-button {
  padding: 12px 16px;
  font-weight: 700;
  font-size: 16px;
  border-radius: 16px;
  border: 1px solid rgba(255,255,255,0.55);
  background: rgba(255,255,255,0.18);
  backdrop-filter: blur(16px) saturate(170%);
  color: var(--text-strong);
  box-shadow: 0 10px 28px rgba(0,0,0,0.12), 
              0 1px 0 rgba(255,255,255,0.6) inset;
  cursor: pointer;
  transition: transform .08s ease, box-shadow .25s ease;
}

.glass-button:hover {
  transform: translateY(-1px);
  background: rgba(255,255,255,0.24);
}

.glass-button:active {
  transform: translateY(0);
}

.glass-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

**Accent Variants:**

```css
.glass-button.is-blue {
  border-color: rgba(60,130,255,0.55);
  box-shadow: 0 10px 28px rgba(60,130,255,0.20);
}

.glass-button.is-green {
  border-color: rgba(46,184,76,0.55);
  box-shadow: 0 10px 28px rgba(46,184,76,0.20);
}
```

### 4. Glass Pill (Status Indicator)

**Usage:** Status messages, info badges

```css
.glass-pill {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 16px;
  background: rgba(230,255,235,0.35);
  backdrop-filter: blur(16px) saturate(140%);
  border: 1px solid rgba(255,255,255,0.5);
  box-shadow: 0 6px 20px rgba(46,184,76,0.18) inset;
  font-size: 14px;
  font-weight: 600;
}

.glass-pill.error {
  background: rgba(255,235,235,0.40);
  box-shadow: 0 6px 20px rgba(255,59,48,0.18) inset;
  border-color: rgba(255,100,100,0.5);
  color: #c81e1e;
}
```

### 5. Glass Output (Response Area)

**Usage:** AI response display area

```css
.glass-output {
  min-height: 120px;
  padding: 16px;
  border-radius: 18px;
  border: 1px solid rgba(255,255,255,0.55);
  background: rgba(255,255,255,0.16);
  backdrop-filter: blur(16px) saturate(170%);
  box-shadow: 0 6px 22px rgba(0,0,0,0.10) inset, 
              0 10px 28px rgba(0,0,0,0.10);
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-wrap: break-word;
  overflow-y: auto;
}
```

### 6. Drag Handle

**Usage:** Visual indicator for draggable overlay

```css
.ai-drag-handle {
  position: absolute;
  top: 20px;
  left: 20px;
  width: 24px;
  height: 24px;
  cursor: grab;
  color: rgba(11, 15, 19, 0.4);
  border-radius: 6px;
  transition: background 0.2s ease, color 0.2s ease;
  user-select: none;
}

.ai-drag-handle:hover {
  background: rgba(255, 255, 255, 0.35);
  color: rgba(11, 15, 19, 0.7);
}

.ai-drag-handle:active {
  cursor: grabbing;
  background: rgba(255, 255, 255, 0.45);
}
```

**Icon:** 6-dot grip (3x2 grid of circles)

```svg
<svg viewBox="0 0 20 20">
  <circle cx="7" cy="5" r="1.5" fill="currentColor"/>
  <circle cx="13" cy="5" r="1.5" fill="currentColor"/>
  <circle cx="7" cy="10" r="1.5" fill="currentColor"/>
  <circle cx="13" cy="10" r="1.5" fill="currentColor"/>
  <circle cx="7" cy="15" r="1.5" fill="currentColor"/>
  <circle cx="13" cy="15" r="1.5" fill="currentColor"/>
</svg>
```

### 7. Settings Controls

**Toggle Switch:**
```css
.toggle-checkbox {
  width: 44px;
  height: 24px;
  appearance: none;
  background: rgba(120,120,128,0.3);
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.3s ease;
  border: 1px solid rgba(255,255,255,0.4);
}

.toggle-checkbox:checked {
  background: rgba(46,184,76,0.6);
}

.toggle-checkbox::before {
  content: '';
  position: absolute;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: white;
  top: 1px;
  left: 1px;
  transition: transform 0.3s ease;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.toggle-checkbox:checked::before {
  transform: translateX(20px);
}
```

**Dropdown Select:**
```css
.glass-select {
  padding: 8px 12px;
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.6);
  background: rgba(255,255,255,0.2);
  backdrop-filter: blur(16px) saturate(170%);
  color: var(--text-strong);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  outline: none;
}

.glass-select:focus {
  border-color: rgba(60,130,255,0.65);
  box-shadow: 0 0 0 4px rgba(60,130,255,0.15);
}
```

**Range Slider:**
```css
.slider {
  height: 6px;
  border-radius: 3px;
  background: rgba(255,255,255,0.3);
  outline: none;
  appearance: none;
  -webkit-appearance: none;
}

.slider::-webkit-slider-thumb {
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: rgba(60,130,255,0.9);
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0,0,0,0.2);
}
```

### 8. Scrollbars

**Styled Glass Scrollbar:**
```css
.glass-panel::-webkit-scrollbar,
.glass-output::-webkit-scrollbar {
  width: 10px;
}

.glass-panel::-webkit-scrollbar-track,
.glass-output::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  margin: 6px;
}

.glass-panel::-webkit-scrollbar-thumb,
.glass-output::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, 
    rgba(0, 122, 255, 0.3) 0%, 
    rgba(0, 122, 255, 0.25) 100%
  );
  border-radius: 12px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  background-clip: padding-box;
}

.glass-panel::-webkit-scrollbar-thumb:hover,
.glass-output::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, 
    rgba(0, 122, 255, 0.45) 0%, 
    rgba(0, 122, 255, 0.4) 100%
  );
}
```

**Hidden Scrollbar (Overlay):**
```css
.ai-input::-webkit-scrollbar,
.ai-output::-webkit-scrollbar {
  display: none;
}

.ai-input,
.ai-output {
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE/Edge */
}
```

---

## Layout & Spacing

### Container Sizes

**Popup:**
```css
body {
  width: 440px;
  min-height: 540px;
  max-height: 600px;
}
```

**Overlay:**
```css
.ai-glass-container {
  width: clamp(340px, 42vw, 520px);
  max-height: 80vh;
}
```

### Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| xs | 8px | Tight spacing |
| sm | 12px | Component gaps |
| md | 16px | Standard spacing |
| lg | 20px | Section padding |
| xl | 22px | Panel padding |

**Utility Classes:**
```css
.mt-12 { margin-top: 12px; }
.mt-16 { margin-top: 16px; }
```

### Grid Layouts

**Button Groups:**
```css
.glass-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}
```

**Settings Labels:**
```css
.settings-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
```

### Sections

```css
.glass-section {
  padding-top: 16px;
  border-top: 1px solid rgba(255,255,255,0.2);
  margin-top: 14px;
}

.glass-section:first-of-type {
  border-top: none;
}
```

---

## Interactive States

### Hover States

**Buttons:**
```css
transform: translateY(-1px);
background: rgba(255,255,255,0.24);
```

**Inputs:**
```css
border-color: rgba(60,130,255,0.65);
box-shadow: 0 0 0 6px rgba(60,130,255,0.18);
```

**Drag Handle:**
```css
background: rgba(255, 255, 255, 0.35);
color: rgba(11, 15, 19, 0.7);
```

### Focus States

**Inputs/Textareas:**
```css
border-color: rgba(60,130,255,0.65);
box-shadow: 0 0 0 6px rgba(60,130,255,0.18), 
            0 10px 28px rgba(60,130,255,0.22);
transform: translateY(-1px);
```

**Buttons:**
```css
outline: 0;
box-shadow: 0 0 0 6px rgba(60,130,255,0.18);
```

### Active States

**Buttons:**
```css
transform: translateY(0);
```

**Drag Handle:**
```css
cursor: grabbing;
background: rgba(255, 255, 255, 0.45);
```

### Disabled States

```css
opacity: 0.5;
cursor: not-allowed;
background: rgba(180,180,180,0.18);
color: rgba(60,60,67,0.4);
```

### Loading States

```css
.loading {
  font-style: italic;
  color: var(--text-weak);
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
```

---

## Positioning System

### Overlay Position Classes

**Top Right (Default):**
```css
.ai-glass-container.pos-top-right {
  top: 6vh;
  right: 4vw;
}
```

**Top Left:**
```css
.ai-glass-container.pos-top-left {
  top: 6vh;
  left: 4vw;
}
```

**Bottom Right:**
```css
.ai-glass-container.pos-bottom-right {
  bottom: 6vh;
  right: 4vw;
}
```

**Bottom Left:**
```css
.ai-glass-container.pos-bottom-left {
  bottom: 6vh;
  left: 4vw;
}
```

**Center:**
```css
.ai-glass-container.pos-center {
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
```

### Drag Implementation

**Hardware-Accelerated Movement:**
```css
.ai-glass-container {
  will-change: transform;
  transition: top 0.3s ease, right 0.3s ease, 
              bottom 0.3s ease, left 0.3s ease;
}

.ai-glass-container.is-dragging {
  transition: none;
}
```

**JavaScript Drag Logic:**
```javascript
// Use transform for smooth, hardware-accelerated movement
container.style.transform = `translate(${currentX}px, ${currentY}px)`;

// Constrain to viewport with padding
currentX = Math.max(8, Math.min(currentX, maxX));
currentY = Math.max(8, Math.min(currentY, maxY));
```

---

## Animations & Transitions

### Standard Timing

| Property | Duration | Easing |
|----------|----------|--------|
| Background | 0.25s | ease |
| Border | 0.25s | ease |
| Box Shadow | 0.25s | ease |
| Transform | 0.08s | ease |
| Color | 0.2s | ease |
| Position | 0.3s | ease |

### Hover Animations

```css
transition: transform .08s ease, 
            box-shadow .25s ease, 
            background .25s ease, 
            border-color .25s ease;
```

### Focus Animations

```css
transition: box-shadow .25s ease, 
            background .25s ease, 
            border-color .25s ease, 
            transform .12s ease;
```

### Loading Animation

```css
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
```

---

## Accessibility

### Cursor Indicators

| Element | Cursor | Purpose |
|---------|--------|---------|
| Buttons | `pointer` | Clickable |
| Inputs | `text` | Editable |
| Drag Handle | `grab` | Draggable |
| Dragging | `grabbing` | Active drag |
| Disabled | `not-allowed` | Cannot interact |

### Keyboard Support

- **Tab Navigation**: All interactive elements are keyboard accessible
- **Enter/Space**: Activates buttons
- **Escape**: Closes overlay
- **Focus Indicators**: Blue ring at 6px radius

### Tooltips

```html
<div class="ai-drag-handle" title="Drag to move">
```

### ARIA Labels

Ensure all interactive elements have appropriate labels:
```html
<button aria-label="Stream AI response">Stream Response</button>
```

### Color Contrast

- Text on glass: Minimum 4.5:1 contrast ratio
- Strong text: `#0b0f13` on white backgrounds
- Error text: `#c81e1e` on light red backgrounds

### User Preferences

```css
/* Respect reduced motion preference */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Implementation Notes

### Browser Compatibility

**Backdrop Filter:**
- Chrome/Edge: ✅ Supported
- Safari: ✅ Supported (with `-webkit-` prefix)
- Firefox: ⚠️ Limited support (provide fallback)

**Fallback Strategy:**
```css
@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  background: rgba(255,255,255,0.88);
}
```

### Performance Considerations

1. **Use `will-change: transform`** for draggable elements
2. **Use `transform` instead of `top/left`** for animations
3. **Disable transitions during drag** with `.is-dragging` class
4. **Minimize repaints** by batching style changes
5. **Use CSS containment** where appropriate

### Shadow DOM

Overlay uses Shadow DOM to prevent page CSS interference:
```javascript
const shadow = host.attachShadow({mode:'open'});
```

---

## Design Tokens Reference

### Complete Token List

```css
/* Colors */
--glass-bg: rgba(255,255,255,0.18);
--glass-stroke: rgba(255,255,255,0.50);
--text-strong: #0b0f13;
--text-weak: rgba(11,15,19,0.64);
--accent-blue: rgba(60,130,255,0.55);
--accent-green: rgba(46,184,76,0.50);
--accent-red: rgba(255,59,48,0.5);

/* Shadows */
--glass-shadow: 0 22px 60px rgba(0,0,0,0.22);
--button-shadow: 0 10px 28px rgba(0,0,0,0.12);
--input-shadow-inset: 0 2px 6px rgba(0,0,0,0.05) inset;

/* Radii */
--glass-radius: 22px;
--button-radius: 16px;
--input-radius: 18px;
--pill-radius: 16px;

/* Spacing */
--space-xs: 8px;
--space-sm: 12px;
--space-md: 16px;
--space-lg: 20px;
--space-xl: 22px;

/* Typography */
--font-size-h1: 19px;
--font-size-body: 14px;
--font-size-small: 13px;
--font-weight-bold: 800;
--font-weight-medium: 500;
```

---

## Maintenance Guidelines

### Adding New Components

1. Follow the glass morphism pattern
2. Use design tokens for consistency
3. Include hover, focus, active, and disabled states
4. Test with and without backdrop-filter support
5. Ensure keyboard accessibility

### Modifying Colors

1. Update CSS variables in `:root`
2. Maintain minimum 4.5:1 contrast ratio
3. Test with different backgrounds
4. Update this documentation

### Updating Animations

1. Keep timing consistent with existing patterns
2. Add `prefers-reduced-motion` support
3. Use hardware-accelerated properties
4. Test on lower-end devices

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | Oct 4, 2025 | Initial design system documentation |

---

**Questions or suggestions?** File an issue or submit a pull request.


