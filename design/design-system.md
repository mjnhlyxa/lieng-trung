# Lieng — Design System

## 1. Colors

```css
/* Backgrounds */
--bg-page:        #0d1117;   /* Deep dark — page background */
--bg-surface:    #161b22;   /* Card, panel, modal backgrounds */
--bg-elevated:    #21262d;   /* Hover states, slightly elevated surfaces */
--bg-overlay:     #0d1117cc; /* Modal backdrop */

/* Game-specific */
--bg-table:       #1a3320;   /* Felt green — game table surface */
--bg-card:        #1e2a3a;   /* Playing card background when face-down */

/* Accent — Emerald green (Lucky money / Vietnamese festive) */
--accent-primary:    #10b981;  /* Emerald-500 — main CTA, active */
--accent-primary-h:  #059669;  /* Emerald-600 — hover */
--accent-glow:       #10b98133; /* Emerald with 20% alpha for glow */

/* Secondary accent — Gold (gold bar / luck) */
--accent-gold:    #f59e0b;   /* Amber-500 */
--accent-gold-h:  #d97706;   /* Amber-600 */

/* Danger */
--danger:         #ef4444;   /* Red-500 — fold, errors */
--danger-h:       #dc2626;   /* Red-600 */

/* Text */
--text-primary:   #f0f6fc;
--text-secondary: #8b949e;
--text-muted:     #484f58;

/* Card suits (high contrast for accessibility) */
--suit-clubs:     #6b7280;   /* Gray */
--suit-diamonds:  #ef4444;   /* Red */
--suit-hearts:    #ef4444;   /* Red */
--suit-spades:    #1f2937;   /* Near black */
--suits-highest:  #f59e0b;   /* Gold for best hand highlight */

/* Status */
--status-active:  #10b981;
--status-waiting:  #f59e0b;
--status-folded:  #6b7280;
--status-winner:  #f59e0b;
```

## 2. Typography

```css
/* Google Fonts: Outfit (headings) + Inter (body) */
--font-display: 'Outfit', sans-serif;
--font-body:    'Inter', sans-serif;
--font-mono:    'JetBrains Mono', monospace;

/* Sizes */
--text-xs:   0.75rem;   /* 12px — labels, badges */
--text-sm:   0.875rem;  /* 14px — secondary text */
--text-base: 1rem;      /* 16px — body */
--text-lg:   1.125rem;  /* 18px — emphasized body */
--text-xl:   1.25rem;   /* 20px — card rank */
--text-2xl:  1.5rem;    /* 24px — section heads */
--text-3xl:  1.875rem;  /* 30px — page headings */
--text-4xl:  2.25rem;   /* 36px — hero heading */

/* Weights */
--font-normal:  400;
--font-medium:  500;
--font-semibold: 600;
--font-bold:    700;
```

## 3. Spacing

```css
--space-1:  0.25rem;   /* 4px */
--space-2:  0.5rem;    /* 8px */
--space-3:  0.75rem;   /* 12px */
--space-4:  1rem;      /* 16px */
--space-5:  1.25rem;   /* 20px */
--space-6:  1.5rem;    /* 24px */
--space-8:  2rem;      /* 32px */
--space-10: 2.5rem;    /* 40px */
--space-12: 3rem;      /* 48px */
--space-16: 4rem;      /* 64px */
```

## 4. Border Radius

```css
--radius-sm:   4px;    /* chips, badges */
--radius-md:    8px;    /* inputs, cards */
--radius-lg:   12px;   /* modals, large cards */
--radius-xl:   16px;   /* game panels */
--radius-full: 9999px;  /* avatars, toggles */
```

## 5. Shadows

```css
--shadow-card:  0 2px 8px rgba(0,0,0,0.4);
--shadow-panel:  0 4px 16px rgba(0,0,0,0.4);
--shadow-modal:  0 8px 40px rgba(0,0,0,0.6);
--shadow-glow:   0 0 16px var(--accent-glow);
--shadow-chip:   0 1px 3px rgba(0,0,0,0.3);
```

## 6. Breakpoints

```css
--breakpoint-sm:  640px;   /* Large phones */
--breakpoint-md:  768px;   /* Tablets */
--breakpoint-lg: 1024px;   /* Desktop */
```

## 7. Card Design

### Playing Cards
- Size: 64px × 96px (desktop), 52px × 78px (mobile)
- Border-radius: 8px
- Background: #ffffff (face-up), #1e2a3a with pattern (face-down)
- Rank corner: 16px Outfit Bold
- Suit center: 24px Unicode
- Corner radius: 8px

### Card Back Pattern
Navy blue (#1e3a5f) with diamond repeating pattern (SVG data URI)

## 8. Animations

| Animation | Duration | Easing | Use |
|----------|----------|--------|-----|
| card-flip | 400ms | ease-out | Showdown reveal |
| chip-slide | 300ms | ease-out | Pot animation |
| slide-up | 300ms | ease-out | Modal appearance |
| pulse-glow | 1.5s | ease-in-out | Active turn indicator (infinite) |
| fade-in | 200ms | ease-out | Toast notifications |
| scale-in | 200ms | ease-out | Button press feedback |
| shake | 400ms | ease-out | Invalid action |

## 9. Touch Targets

- Minimum: 44×44px for all interactive elements (WCAG compliance)
- Card hand scroll: swipe-enabled
- Betting buttons: 48px height minimum
- All modals: close button in top-right corner

## 10. Responsive Strategy

```
Mobile (375px):
  ┌────────────────────┐
  │  Room code + share │
  ├────────────────────┤
  │  My cards (row)    │
  ├────────────────────┤
  │  Pot display       │
  ├────────────────────┤
  │  4 player panels   │
  │  (1 above, 3 below)│
  ├────────────────────┤
  │  Betting controls  │
  └────────────────────┘

Desktop (1024px):
  ┌──────────────────────────────────────────────┐
  │  Room code + players        │   Pot display  │
  ├──────────────────────────────────────────────┤
  │      Player panels (top/bottom)              │
  │  ┌──────────────────────────────────────┐   │
  │  │                                        │   │
  │  │         My cards + others hand        │   │
  │  │                                        │   │
  │  └──────────────────────────────────────┘   │
  ├──────────────────────────────────────────────┤
  │  Betting controls                           │
  └──────────────────────────────────────────────┘
```
