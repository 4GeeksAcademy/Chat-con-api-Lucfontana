---
name: Groq AI Chat
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#393939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#20201f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353535'
  on-surface: '#e5e2e1'
  on-surface-variant: '#e0c0b1'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#a78b7d'
  outline-variant: '#584237'
  surface-tint: '#ffb690'
  primary: '#ffb690'
  on-primary: '#552100'
  primary-container: '#f97316'
  on-primary-container: '#582200'
  inverse-primary: '#9d4300'
  secondary: '#4cd7f6'
  on-secondary: '#003640'
  secondary-container: '#03b5d3'
  on-secondary-container: '#00424e'
  tertiary: '#4ae176'
  on-tertiary: '#003915'
  tertiary-container: '#00b251'
  on-tertiary-container: '#003b16'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdbca'
  primary-fixed-dim: '#ffb690'
  on-primary-fixed: '#341100'
  on-primary-fixed-variant: '#783200'
  secondary-fixed: '#acedff'
  secondary-fixed-dim: '#4cd7f6'
  on-secondary-fixed: '#001f26'
  on-secondary-fixed-variant: '#004e5c'
  tertiary-fixed: '#6bff8f'
  tertiary-fixed-dim: '#4ae176'
  on-tertiary-fixed: '#002109'
  on-tertiary-fixed-variant: '#005321'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353535'
typography:
  headline-xl:
    fontFamily: Geist
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.02em
  code-sm:
    fontFamily: Geist
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  container-max: 1200px
  gutter: 1.5rem
  margin-mobile: 1rem
  stack-sm: 0.5rem
  stack-md: 1rem
  stack-lg: 2rem
---

## Brand & Style
The brand personality is high-performance, technical, and sophisticated. It targets a dual audience: developers who demand efficiency and students seeking a premium, focused learning environment. The emotional response is one of "calm power"—an interface that stays out of the way until needed, then delivers with precision.

The design style is **Modern / Developer-Centric**, blending elements of minimalism with high-end technical aesthetics. It utilizes a "dark-first" philosophy to reduce eye strain during long sessions, emphasizing high contrast for code snippets and clear structural hierarchy through subtle borders and deep tonal layering.

## Colors
The palette is rooted in a "void" aesthetic, using `#0a0a0a` as the base canvas. 

- **Primary (Groq Orange):** Reserved for high-action items, the "Send" state, and brand markers.
- **Secondary (Tech Cyan):** Used for AI-driven highlights, links, and code-related accents.
- **Success (Green):** Indicates system status and completed operations.
- **Neutrals:** A range of deep grays (`#1a1a1a` for cards, `#262626` for borders) provides structural definition without breaking the dark-mode immersion.

## Typography
The system uses a pairing of **Geist** and **Inter**. Geist provides a technical, mono-inspired feel for headings and labels, while Inter ensures maximum readability for long-form AI responses.

Headlines should use tight letter-spacing for a modern, "locked-in" look. Code snippets and technical metadata should default to a smaller Geist size to maintain the developer-tool aesthetic. All body text maintains a generous line height to prevent visual fatigue in the dark interface.

## Layout & Spacing
This design system utilizes a **Fixed Grid** approach for the chat container to ensure content remains readable and centered on large displays.

- **Desktop:** A centered 800px-1000px column for the chat feed to minimize eye travel. Sidebars for history and settings are collapsible.
- **Mobile:** Transition to a full-width fluid layout with 16px side margins.
- **Rhythm:** An 8px linear scale governs all spacing. Input areas and message bubbles use a 16px internal padding for a spacious, high-end feel.

## Elevation & Depth
Depth is created through **Tonal Layers** and **Low-Contrast Outlines** rather than traditional shadows. 

The background is the lowest layer (`#0a0a0a`). Cards and chat bubbles sit on the second layer (`#1a1a1a`). A thin, 1px border (`#262626`) provides the necessary separation. For high-priority overlays like modals, a subtle background blur (backdrop-filter: blur(10px)) is applied to the layer beneath to maintain context without visual clutter.

## Shapes
The shape language is defined by a refined "2xl" roundedness. 

- **Chat Bubbles & Cards:** 1rem (16px) corner radius to soften the technical nature of the app.
- **Buttons & Inputs:** 0.5rem (8px) for a more precise, functional appearance.
- **Active States:** Subtle 1px inner borders are used to highlight selected cards or active text fields.

## Components
- **Buttons:** Primary buttons use a solid Groq Orange background with white/black text. Secondary buttons are "Ghost" style with a `#262626` border that shifts to `#f97316` on hover.
- **Chat Input:** A fixed bottom container with a wide radius (1.5rem), using a `#1a1a1a` background and a focus ring in Tech Cyan.
- **Message Bubbles:** User messages are outlined in `#262626`; AI messages use a subtle top-border gradient of Tech Cyan to signify "thought" processing.
- **Code Blocks:** A darker background (`#050505`) with a header bar containing the language label and a "Copy" button.
- **Chips:** Used for suggested prompts. Small, rounded-full shapes with `#1a1a1a` background and high-contrast text.