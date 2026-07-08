# cofou — Design Plan for Figma AI

**Project:** cofou — online booking platform for PC/gaming clubs
**Source repo:** `opencode` (angelovdima15-cloud/opencode) — Node.js/Express/TS backend, Vanilla JS + Vite + Leaflet frontend, SQLite, Telegram bot notifications, SENET station integration
**Goal of this document:** give Figma AI (and any human designer) a single source of truth to plan the design system first, then generate screens in a controlled sequence — rather than generating pages one-shot and hoping they stay consistent.

---

## 0. How to use this document

Work in **phases, in order**. Do not jump to screen generation before phases 1–2 are locked, or every subsequent screen will need rework.

1. Brand & design tokens
2. Core components (built once, reused everywhere)
3. Information architecture / sitemap
4. Screen-by-screen specs (in priority order)
5. Prototype flows (connecting screens)
6. QA checklist

Each screen spec below is written so it can be pasted directly into Figma AI / First Draft as its own generation prompt, after the design system exists.

---

## 1. Brand & Design Tokens

### 1.1 Brand personality
- **Name:** cofou
- **Category:** gaming / esports infrastructure, local services marketplace
- **Tone:** fast, confident, slightly technical — think "book a table" simplicity applied to gaming PCs. Not childish, not corporate. Closer to a modern booking/fintech app than a gamer-forum aesthetic.
- **Emotional target:** "I can find and lock in my seat in under 30 seconds."

### 1.2 Color palette
Dark-mode-first product (club/gaming context), with a light mode as secondary.

| Token | Hex (suggested) | Usage |
|---|---|---|
| `bg/base` | #0B0D10 | App background |
| `bg/surface` | #14171C | Cards, sheets, modals |
| `bg/surface-raised` | #1B1F26 | Elevated cards, popovers |
| `border/subtle` | #262B33 | Dividers, card borders |
| `accent/primary` | #5B5BFF | Primary CTA, active states, links |
| `accent/primary-hover` | #4747E0 | Hover/pressed |
| `accent/secondary` | #00E5A0 | Success, "available" seat state, confirmations |
| `status/warning` | #FFB020 | Low balance, expiring session |
| `status/error` | #FF5568 | Errors, "occupied" seat state |
| `text/primary` | #F5F6F7 | Headlines, primary text |
| `text/secondary` | #9AA1AC | Secondary/meta text |
| `text/disabled` | #565C66 | Disabled labels |

Seat-map status colors must be colorblind-safe: pair color with an icon/pattern (e.g., checkmark for available, lock icon for occupied, ring for selected), never color alone.

### 1.3 Typography
- **Primary typeface:** Inter or Manrope (both free, geometric, good at small sizes for data-dense seat maps).
- **Scale:** 12 / 14 / 16 (body) / 20 / 24 / 32 / 40 (display).
- Use tabular numerals for prices, balances, and countdown timers.

### 1.4 Spacing & shape
- 8px base grid.
- Corner radius: 12px for cards, 8px for buttons/inputs, 999px (pill) for chips/tags/status badges.
- Elevation via subtle shadow + border, not heavy drop shadow (dark UI).

### 1.5 Iconography
- Line icons, 1.5px stroke, rounded joins. Consistent set for: seat/monitor, clock, map pin, balance/wallet, telegram, phone, game controller.

### 1.6 Motion
- Micro-interactions only: seat selection pulses, slot confirmation checkmark animates in, balance counts up. Keep under 200ms.

---

## 2. Core Components (build these first, as a Figma component library / page)

1. **Navigation**
   - Mobile: bottom tab bar — Map, Bookings, Wallet, Profile
   - Desktop: left sidebar or top nav with same 4 destinations
2. **Club card** — photo, name, distance, price/hr from, rating, open/closed badge, available-seats count
3. **Seat/station icon** — states: available, occupied, selected, disabled/maintenance; variants for PC tier (standard / VIP / console)
4. **Time slot chip** — states: available, unavailable, selected; shows time range + price
5. **Booking summary bar/card** — sticky bottom bar showing seat + time + price + CTA, used across booking flow
6. **Balance widget** — current balance, top-up button, used in header/profile
7. **Buttons** — primary, secondary, ghost, danger; sizes S/M/L; loading state
8. **Input fields** — phone input w/ country code, OTP input (6 boxes), text input, search bar
9. **Modal / bottom sheet** — for filters, confirmations, top-up
10. **Toast/notification** — success, error, info (mirrors what Telegram bot also sends)
11. **Status badge** — pill component for "confirmed," "expired," "in progress," "cancelled"
12. **Empty states** — no clubs nearby, no bookings yet, no notifications

---

## 3. Information Architecture

```
cofou
├── Onboarding
│   ├── Splash / value prop
│   ├── Phone number entry
│   └── OTP verification
├── Home (Map view)
│   ├── Map (Leaflet-style clustering)
│   ├── List view toggle
│   └── Filters (distance, price, game, open now, seat tier)
├── Club Detail
│   ├── Gallery / info / amenities / rating
│   ├── Visual hall map (seat picker)
│   └── Reviews
├── Booking Flow
│   ├── Seat selection
│   ├── Time slot selection (calendar/schedule grid)
│   ├── Package/duration selection (pay-as-you-go vs time package)
│   ├── Payment / balance deduction
│   └── Confirmation (with add-to-calendar + Telegram notify confirmation)
├── Bookings (My Reservations)
│   ├── Upcoming
│   ├── Active (live session / in-club state, ties to SENET station status)
│   └── History
├── Wallet
│   ├── Balance
│   ├── Top-up (amount picker + payment method)
│   └── Transaction history
├── Profile
│   ├── Account details (phone-based identity)
│   ├── Notification settings (Telegram toggle/link)
│   ├── Favorite clubs
│   └── Support/help
└── Club Owner / Admin (if in scope)
    ├── Dashboard (occupancy, revenue)
    ├── Hall layout editor
    └── Bookings management
```

Confirm with stakeholders whether the **Club Owner/Admin** side is in scope for this design pass — the repo's backend clearly supports club/seat/game management, so there is likely an internal admin surface even if v1 design focuses on the end-user app.

---

## 4. Screen-by-Screen Specs (Figma AI generation prompts)

Generate in this order. Paste each block as its own prompt once the design system (Section 1–2) is applied/attached.

### 4.1 Onboarding — Phone auth
> Design a dark-mode mobile onboarding flow for "cofou," a PC club booking app. Screen 1: full-bleed hero with app name, one-line value prop ("Find a seat. Book a time. Walk in and play."), and a "Get started" primary button. Screen 2: phone number entry with country code selector and a large numeric-friendly input. Screen 3: 6-digit OTP verification with auto-advance boxes and a resend-code timer. Use the cofou dark palette (near-black background, indigo/violet accent #5B5BFF), Inter/Manrope typography, 12px corner radius on inputs, 8px grid spacing.

### 4.2 Home / Map
> Design a mobile home screen for "cofou" showing a full-screen dark-themed map (Leaflet-style) with clustered pins representing nearby PC clubs. Include a floating search bar at top with filter chips below it (Distance, Price, Open now, Game). Include a draggable bottom sheet showing a scrollable list of club cards (photo, name, distance, price/hr, live available-seats count, open/closed badge). Include a segmented control to toggle Map/List view. Dark UI, violet accent for active pins and CTAs.

### 4.3 Club Detail
> Design a club detail page for "cofou." Top: image gallery carousel, club name, rating, address, distance, open hours badge. Middle: amenities row (icons: headset, drinks, streaming setup, VIP room). Below: a visual seat map of the gaming hall — rows of PC station icons color-coded available/occupied/selected, grouped by zone (Standard, VIP, Console). Sticky bottom bar shows "X seats available" and a "Book a seat" primary button. Dark theme, violet accent, green for available seats, red/muted for occupied.

### 4.4 Seat + Time Slot Booking Flow
> Design a 3-step booking flow for "cofou," a PC club app, as a single scrollable mobile screen with a progress indicator. Step 1: seat map with one selected seat highlighted. Step 2: a horizontal time-slot picker/calendar grid showing available hourly slots (e.g. 17:00–18:00, 18:00–19:00) with a duration selector (1hr/2hr/4hr/custom). Step 3: price summary card showing seat tier, duration, subtotal, and balance-vs-card payment toggle. Sticky bottom bar with total price and "Confirm booking" CTA. Dark theme, violet accent, tabular numerals for price/time.

### 4.5 Booking Confirmation
> Design a booking confirmation screen for "cofou" with a large success checkmark animation state, booking details card (club name, seat number, date, time range, total paid), a QR/code block for check-in at the club, "Add to calendar" and "Get directions" secondary buttons, and a note confirming a Telegram notification has been sent. Dark theme with a green (#00E5A0) success accent against the violet brand color.

### 4.6 My Bookings
> Design a "My Bookings" screen for "cofou" with three tabs: Upcoming, Active, History. Upcoming tab shows booking cards with countdown to start time and a cancel option. Active tab shows a live session card with elapsed time, remaining time, and station status synced from the club's system. History tab shows past bookings with a "book again" quick action. Dark theme, status badges (confirmed/active/cancelled/completed) as pill components.

### 4.7 Wallet / Top-up
> Design a wallet screen for "cofou" showing current balance in large tabular-numeral type, a "Top up" primary button, quick-select top-up amount chips, a payment method selector, and a transaction history list below (top-ups in green, bookings/spend in neutral gray, each with date and amount). Dark theme, violet accent for the top-up CTA.

### 4.8 Profile & Notification Settings
> Design a profile screen for "cofou" showing phone-number-based identity, favorite clubs list, a Telegram notifications toggle with a "Connect Telegram" button state and a connected state, language/region setting, and a help/support link. Dark theme, minimal, consistent with prior screens.

### 4.9 (Optional, if in scope) Club Owner Dashboard
> Design a desktop web dashboard for club owners on "cofou" showing today's occupancy heatmap of the hall (seat grid colored by utilization), revenue summary cards, upcoming bookings table, and a hall-layout editor entry point. Dark theme, data-dense but scannable, using the same violet accent and status colors as the consumer app.

---

## 5. Prototype Flows to Wire Up

1. **First-time booking:** Onboarding → Home map → Club detail → Seat+time booking → Confirmation → My Bookings (Upcoming)
2. **Returning user quick rebook:** My Bookings (History) → "Book again" → Seat+time booking (pre-filled) → Confirmation
3. **Low balance interrupt:** Booking flow payment step → insufficient balance state → Wallet top-up → return to booking flow with balance restored
4. **Live session:** My Bookings (Active) → session countdown → session-ending push/toast → extend or end session

---

## 6. QA / Consistency Checklist Before Handoff

- [ ] All seat-status and booking-status colors are paired with icons/shapes, not color alone
- [ ] Every screen uses only tokens from Section 1.2–1.4 (no one-off colors or fonts)
- [ ] Every primary action has a clear disabled and loading state
- [ ] Empty states designed for: no clubs nearby, no bookings, empty wallet history
- [ ] Mobile-first frames done first; desktop/tablet adaptations derived from the same components
- [ ] Confirmation copy matches what the Telegram bot will actually send (avoid promising notifications the backend doesn't support)
- [ ] Payment/balance flows reflect real states from `CLUB_BOOKING_API_SPEC.md` / `CLUB_BOOKING_DB_SCHEMA.md` in the repo (booking status enums, seat tiers, etc.) — cross-check before finalizing copy and states

---

## 7. Open Questions to Resolve Before Full Build-Out

- Is the **Club Owner/Admin** surface in scope for this design phase, or end-user app only?
- What payment methods are actually supported (card, SBP, balance-only)? This affects the wallet/payment screens.
- Is there a loyalty/rating system for users or clubs beyond the star rating on cards?
- Should light mode be designed now or deferred?
