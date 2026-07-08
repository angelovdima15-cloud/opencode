# BookPC — Mobile Gaming PC Booking App

## Context

Build a complete mobile-first React SPA for booking PC seats at gaming clubs (cybercafes). Target: gamers 16–35, dark gaming aesthetic. The current `App.tsx` is empty; we need to build all 7 screens from scratch using the existing shadcn/ui component library, React Router 7, and lucide-react icons.

---

## Architecture

- **Routing:** React Router 7 (`createBrowserRouter` + `RouterProvider` in `App.tsx`)
- **State:** `AuthContext` (login state) + `BookingContext` (booking flow state) — both React Context + useState
- **Navigation:** Bottom tab bar for Home / Bookings / Profile; stack navigation for Club → Booking → Payment sub-flow
- **Layout:** Mobile shell `max-w-[390px]` centered, dark `#0F0F0F` background, always dark mode

---

## File Structure

### Entry
- `src/app/App.tsx` — replace with `RouterProvider` from `./routes`
- `src/app/routes.ts` — `createBrowserRouter` config

### Contexts & Data
- `src/app/context/AuthContext.tsx`
- `src/app/context/BookingContext.tsx`
- `src/app/data/mockClubs.ts` — 6 clubs with PCs, specs, reviews, photos
- `src/app/data/mockBookings.ts` — booking history
- `src/app/data/mockUser.ts` — user profile + loyalty points

### Layout
- `src/app/components/layout/RootLayout.tsx` — mobile shell, tab bar visibility, context providers, auth redirect
- `src/app/components/shared/BottomTabBar.tsx` — Home/Bookings/Profile with lucide icons, active purple glow

### Shared Primitives
- `src/app/components/shared/ScreenHeader.tsx` — back + title + optional right slot
- `src/app/components/shared/GamingButton.tsx` — shadcn Button wrapper with `glow-purple` and `glow-cyan` variants + motion tap
- `src/app/components/shared/GlowCard.tsx` — shadcn Card + gaming border + optional glow
- `src/app/components/shared/StarRating.tsx`
- `src/app/components/shared/BadgeChip.tsx` — VIP / Standard / Pro / status chips
- `src/app/components/shared/SeatGrid.tsx` — interactive seat grid (motion animations)
- `src/app/components/shared/QRCodePlaceholder.tsx`

### Screens
- `src/app/components/screens/AuthScreen.tsx`
- `src/app/components/screens/HomeScreen.tsx`
- `src/app/components/screens/ClubProfileScreen.tsx`
- `src/app/components/screens/BookingScreen.tsx`
- `src/app/components/screens/PaymentScreen.tsx`
- `src/app/components/screens/MyBookingsScreen.tsx`
- `src/app/components/screens/ProfileScreen.tsx`

### Feature Sub-components
**Auth:** `SplashHero`, `LoginForm`, `RegisterForm`, `SocialAuthButtons`
**Home:** `SearchBar`, `FilterBar`, `ClubCard`, `FeaturedBanner`
**Club:** `PhotoGallery` (embla-carousel-react), `PCSpecCard`, `ReviewCard`, `ZoneTabs`, `OpeningHours`
**Booking:** `DateTimePicker` (date-fns), `ZoneSelector`, `DurationPicker`, `PriceSummary`
**Payment:** `PaymentMethodCard`, `OrderSummary`
**Bookings list:** `BookingCard`, `BookingStatusBadge`
**Profile:** `UserHeader`, `LoyaltyWidget`, `NotificationSettings`, `ProfileMenuList`

---

## Styling Changes

### `src/styles/theme.css`
Override both `:root` and `.dark` blocks:
- `--background`: `oklch(0.059 0 0)` (#0F0F0F)
- `--card`: `oklch(0.108 0.028 264)` (#1A1A2E)
- `--primary`: `oklch(0.491 0.27 295)` (#7C3AED purple)
- `--secondary`: `oklch(0.716 0.143 201)` (#06B6D4 cyan)
- `--muted`: `#2A2A3E`, `--muted-foreground`: `#8888AA`
- `--border`: `rgba(124,58,237,0.2)`, `--radius`: `0.75rem`

Add custom tokens (exposed via `@theme inline`):
```
--gaming-purple: #7C3AED
--gaming-purple-dim: rgba(124,58,237,0.15)
--gaming-cyan: #06B6D4
--gaming-cyan-dim: rgba(6,182,212,0.15)
--gaming-surface: #1A1A2E
--gaming-surface-2: #16213E
--gaming-glow-purple: 0 0 20px rgba(124,58,237,0.4)
--gaming-glow-cyan: 0 0 20px rgba(6,182,212,0.4)
```

Add `font-family: 'Space Grotesk', sans-serif` to `body` in `@layer base`.

### `src/styles/fonts.css`
```css
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap');
```

---

## Route Map

```
/auth                    → AuthScreen (no bottom tab bar)
/                        → HomeScreen (tab: Home)
/club/:clubId            → ClubProfileScreen (no tab bar)
/club/:clubId/book       → BookingScreen (no tab bar)
/club/:clubId/book/payment → PaymentScreen (no tab bar)
/bookings                → MyBookingsScreen (tab: Bookings)
/profile                 → ProfileScreen (tab: Profile)
```

`RootLayout` hides `BottomTabBar` when `pathname` includes `/club/` (sub-flow routes).

---

## Key Patterns

**Mobile shell:**
```tsx
<div className="fixed inset-0 bg-[#0F0F0F] flex justify-center">
  <div className="relative w-full max-w-[390px] h-full flex flex-col overflow-hidden">
    <main className="flex-1 overflow-y-auto pb-[72px]">
      <Outlet />
    </main>
    {showTabBar && <BottomTabBar />}
  </div>
</div>
```

**Page transitions:** `<AnimatePresence>` wrapping `<Outlet>` with `motion.div` slide from right (forward) / left (back) based on navigation direction.

**Booking flow confirm:** On PaymentScreen confirm → navigate to `/bookings` + `toast.success("Booking confirmed!")` via sonner.

**Seat selection:** `SeatGrid` reads `BookingContext` to show selected seat, updates context on click. Available = gray, selected = purple with pulse, occupied = dark red.

---

## External Assets

Use `mcp__plugin_make_unsplash__search_photos` to source club interior photos (gaming room, PC setup, neon lights). Import via `ImageWithFallback` component.

---

## Verification

1. Auth flow: load app → redirected to `/auth` → login → land on HomeScreen with bottom tab bar
2. Home → tap club card → ClubProfileScreen (no tab bar, back arrow works)
3. "Book Now" → BookingScreen → select date/time/seat/duration → price updates
4. "Proceed to Payment" → PaymentScreen → confirm → toast + navigate to Bookings tab
5. Profile tab: loyalty points bar renders, notification switches toggle
6. All screens scroll without content hidden behind tab bar
