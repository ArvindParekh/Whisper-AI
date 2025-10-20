# Whisper AI Frontend

A premium, voice-first AI pair programming interface built with Next.js 15, TypeScript, and shadcn/ui.

## Design Philosophy

This frontend embodies a **warm, confident, product-focused aesthetic** inspired by Payload and Better Auth:

- **Pure black** (#000000) background for clean, serious look
- **Orange as the single accent** (#f97316) - brings warmth to voice-first positioning
- **Subtle effects** - no excessive glows, gradients, or animations
- **Product-focused** - real terminal UI, actual conversations, not abstract shapes
- **Typography does the work** - generous spacing, clear hierarchy
- **Human warmth** through strategic orange usage on voice/audio elements

## Tech Stack

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety
- **shadcn/ui** - Premium component library
- **Tailwind CSS v4** - Styling
- **Lucide Icons** - Icon system
- **Axios** - API requests
- **Cloudflare Realtime Kit** - Voice session infrastructure

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Homepage (hero, features, pricing)
│   ├── dashboard/            # Connection & session management
│   │   └── page.tsx
│   ├── meetings/[id]/        # Voice session interface
│   │   └── page.tsx
│   ├── layout.tsx            # Root layout
│   └── globals.css           # Design system & animations
├── components/
│   ├── home/                 # Homepage components
│   │   ├── hero-section.tsx
│   │   ├── how-it-works.tsx
│   │   ├── pricing-section.tsx
│   │   └── trust-section.tsx
│   ├── dashboard/            # Dashboard components
│   │   ├── welcome-section.tsx
│   │   ├── connection-panel.tsx
│   │   ├── recent-sessions.tsx
│   │   └── meeting.tsx
│   ├── meeting/              # Meeting components
│   │   └── meeting-header.tsx
│   └── ui/                   # shadcn/ui components
├── hooks/
│   └── use-connection.ts     # Connection state management
└── lib/
    └── utils.ts              # Utility functions
```

## Getting Started

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Environment

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Update the backend URL:

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8787
```

### 3. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Key Features

### Homepage

- **Clean Hero** - Large, confident typography with ONE orange accent word
- **Real Terminal** - Actual product UI showing terminal interaction
- **Simple 3-Step** - Text-focused explanation with orange icons for warmth
- **Honest Pricing** - Three clean tiers with orange gradient CTA
- **Trust Signals** - GitHub, Northeastern, stats placed naturally

### Dashboard

- **Connection Flow** - Generate token → wait for CLI → ready to join
- **Real-time Status** - Visual indicators for connection state
- **Session History** - Recent voice sessions with topics
- **Quick Actions** - Copy command, join session

### Meeting Page

- **Minimal Design** - Focus on the voice session
- **Clean Header** - Project info and leave button
- **Realtime Kit Integration** - Voice/video infrastructure

## Design System

### Colors

- **Background**: Pure black (`#000000`)
- **Card**: Very dark (`#0a0a0a`)
- **Primary/Accent**: Orange (`#f97316`) - warm, human, voice-focused
- **Text**: White, grays (`#6b7280`, `#9ca3af`)
- **Borders**: Subtle white opacity (`rgba(255, 255, 255, 0.08)`)
- **NO purple or blue** - orange only for accent

### Effects

- **Subtle hover states**: 2px lift, slight shadow increase
- **No glows or excessive blur**
- **Clean borders**: Simple 1px borders
- **Product-focused**: Terminal windows, code snippets, real UI

### Typography

- **Font**: Inter (sans), JetBrains Mono (mono)
- **Scale**: 3xl-8xl for headers (not oversized)
- **Accent words**: Single orange words in headings ("with", "thinking partner")
- **Line height**: Generous (1.5-1.75 for body)
- Orange used for voice/audio UI elements (AI responses, mic states, etc.)

### Animations

- Minimal: `fadeIn`, `slideUp` only
- No floating blobs, no excessive motion
- Quick transitions (0.2s) for interactions

## Scripts

```bash
pnpm dev      # Start development server
pnpm build    # Build for production
pnpm start    # Start production server
pnpm lint     # Run ESLint
```

## Environment Variables

| Variable                  | Description     | Default                 |
| ------------------------- | --------------- | ----------------------- |
| `NEXT_PUBLIC_BACKEND_URL` | Backend API URL | `http://localhost:8787` |

## Contributing

This is a carefully restrained, product-focused interface. When contributing:

1. **Remove more than you add** - subtract decoration, don't add it
2. **One accent only** - orange (#f97316), never purple or blue
3. **Orange = voice/human** - use for mic states, audio indicators, voice UI
4. **Show product, not concepts** - real UI over abstract shapes
5. **Subtle effects only** - no excessive glows or animations
6. **Warm but professional** - orange brings humanity without losing seriousness

## License

Part of the Whisper AI project - Built at Northeastern University
