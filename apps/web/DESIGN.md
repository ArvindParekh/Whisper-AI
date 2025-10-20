# Whisper AI - Design System

## Philosophy: Warm Confidence

This is NOT a flashy demo. This is a serious voice-first developer tool. The design reflects **warmth through orange**, **restraint**, and **product focus** - inspired by Payload and Better Auth.

## Core Principles

### 1. Orange Brings Human Warmth

- Orange is THE brand color - like how Linear uses purple
- Voice is human - orange adds warmth to pure black
- Used for action, energy, voice indicators
- Professional but not cold

### 2. Subtraction Over Addition

- Remove decoration, don't add it
- Every element must serve a purpose
- Whitespace is a feature, not empty space

### 3. Product Over Concept

- Show actual terminal windows, not illustrations
- Real conversation examples, not abstract "AI" graphics
- Actual product UI, not generic SaaS mockups

### 4. One Accent Color Family

- Orange to amber (#f97316 to #f59e0b) is our only accent
- Used strategically: CTAs, one word in headings, voice/audio indicators
- NO purple, NO blue, NO rainbow gradients

### 5. Trust Through Restraint

- Pure black background (#000000)
- Clean typography hierarchy
- Subtle hover effects (2px lift max)
- No excessive glows, no blur storms, no floating blobs

## Color Palette

```
Background:     #000000 (pure black)
Card:           #0a0a0a (very dark)
Primary:        #f97316 (orange-600, main brand)
Accent Light:   #fb923c (orange-400, highlights)
Accent Dark:    #ea580c (orange-700, hover states)
Text Primary:   #ffffff (white)
Text Secondary: #9ca3af (gray-400)
Text Muted:     #6b7280 (gray-500)
Border:         rgba(255, 255, 255, 0.08)
```

## Typography

### Font Stack

- **Sans**: Inter (clean, professional)
- **Mono**: JetBrains Mono (for code/terminal)

### Scale (Not Oversized)

```
Hero:    6xl-8xl (72px-96px)
H2:      4xl-5xl (36px-48px)
H3:      xl-2xl (20px-24px)
Body:    base-lg (16px-18px)
Small:   sm-xs (14px-12px)
```

### Accent Usage

ONE word per heading gets the orange accent:

- ✅ "Think **with** AI, not just code" (with = orange)
- ✅ "Not autocomplete. A **thinking partner**" (thinking partner = orange)
- ✅ Use orange for voice/mic indicators, active states
- ❌ Full gradient headings
- ❌ Multiple colored words
- ❌ Purple or blue anywhere

## Components

### Buttons

```tsx
// Primary - orange gradient with subtle shadow
<Button className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 shadow-lg shadow-orange-900/20">
  Start Free
</Button>

// Secondary - outlined, subtle
<Button variant="outline" className="border-white/10 hover:border-white/20">
  Watch Demo
</Button>
```

### Cards

```tsx
// Clean, simple, subtle hover
<div className="card-subtle p-6 rounded-lg">
  // No heavy shadows // No glows // Simple 2px lift on hover
</div>
```

### Terminal Windows

```tsx
<div className="terminal-window">
  <div className="terminal-header">
    <div className="terminal-dot bg-red-500" />
    <div className="terminal-dot bg-yellow-500" />
    <div className="terminal-dot bg-green-500" />
  </div>
  <div className="p-6 font-mono text-sm">// Actual product content</div>
</div>
```

## Animations

### Allowed

- `fadeIn` (0.4s)
- `slideUp` (0.5s)
- Button hover transitions (0.2s)

### NOT Allowed

- Floating blobs
- Excessive blur
- Gradient shifts
- Glow pulses
- Scale transforms >1.02

## Trust Signals

Place these naturally, not as decoration:

- **GitHub badge**: Top of hero
- **University affiliation**: "Built at Northeastern"
- **Stats**: Simple grid, no icons needed
- **Open Source**: Badge in footer

## Voice

When writing copy:

- **Confident but not arrogant**: "Think with AI" not "Revolutionary AI"
- **Clear over clever**: "Voice-first pair programming" not "Sonic code synthesis"
- **Honest**: "Start free" not "Unlock infinite potential"
- **Product-focused**: "Connect your project" not "Experience the future"

## Examples to Follow

### Primary Inspiration

- **Payload**: Orange on black, diagonal elements, confident
- **Better Auth**: Pure black, minimal, product-first
- Think: premium audio interface meets developer CLI

### Secondary

- **Linear**: Spacing, typography (but we use orange not purple)
- **Vercel**: Clean, direct, good hierarchy
- **Cal.com**: Simple cards, clear hierarchy

### The Vibe

Think of this as a premium **audio/studio tool** that happens to be for coding. Voice-first = human = warm orange. But still serious, professional, developer-focused.

### Bad (Avoid)

- Generic SaaS with stock illustrations
- Purple/blue color schemes (that's old direction)
- Crypto sites with excessive gradients
- AI products with brain graphics/sparkles everywhere
- Anything trying to look "futuristic"

## Testing Your Design

Ask yourself:

1. Does this look **serious** and **trustworthy**?
2. Am I showing **product** or **concept**?
3. Can I remove an effect and improve it?
4. Would a YC founder use this aesthetic?
5. Does it feel **confident** (not compensating)?

If you're unsure, **remove** it.

## Maintenance

When updating:

- Remove before you add
- Question every gradient
- Show product, not decoration
- One accent color at a time
- Trust through restraint

---

**Remember**: The goal isn't to impress with effects. It's to build trust through a clean, confident, product-focused design that says "we know what we're doing."
