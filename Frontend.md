# Frontend.md — Visual & UX Reference for Vedic Sky Observer

> A guide for design agents (and designers) describing **how the application looks and behaves**.
> This is a description of the *current* UI surface, its design language, tokens, layout
> architecture, and reusable patterns — not an implementation to-do list. When proposing
> visual changes, respect the tokens and patterns defined here so the product stays coherent.

---

## 1. What the product is

**Vedic Sky Observer** (internally "SoulBlueprint") is a real-time **Sidereal Vedic astrology
visualizer**. The user sees a live sky/birth chart on one side and a deep data dashboard on the
other. The emotional register is **"observatory instrument meets mystical almanac"**: precise,
dark, jewel-toned, quietly animated — closer to a premium astronomy tool than a playful horoscope app.

**Design adjectives:** celestial, precise, luminous, calm, editorial. Gold-on-deep-purple.
Never neon, never cartoonish, never cluttered.

---

## 2. Color system

Design tokens are defined as CSS custom properties in `src/index.css` under `@theme` (Tailwind v4
CSS-first config). Reference them by their Tailwind class names, e.g. `text-jyotish-gold`,
`bg-mystic-purple`.

### Brand palette

| Token | Hex | Meaning / usage |
|---|---|---|
| `jyotish-gold` | `#d4af37` | **Primary accent.** Active states, key values, icons, primary buttons, highlights. The signature color. |
| `celestial-gold` | `#f9e29b` | Lighter gold. Gradient partner for `jyotish-gold` (logo wordmark, hover), glints. |
| `mystic-purple` | `#1a0b2e` | Primary dark surface / deep background. |
| `cosmic-indigo` | `#0f051d` | Deepest background, radial-gradient endpoint. |

### Working (non-token) colors used throughout

- **Dark theme neutrals:** white at low alpha — `text-white/90` (primary text), `text-white/60`
  (secondary), `text-white/40` (muted/inactive), `text-white/30` (icon idle). Surfaces:
  `bg-white/5`, `bg-white/[0.02]`, `bg-black/20`, `bg-black/40`. Borders: `border-white/5`,
  `border-white/10`, `border-jyotish-gold/10`.
- **Light theme neutrals:** slate scale — `text-slate-900` (primary), `text-slate-600`
  (secondary), `text-slate-400` (muted). Surfaces: `bg-white`, `bg-white/80`, `bg-slate-100`.
  Borders: `border-slate-200`, `border-slate-100`. Light-mode primary accent shifts toward
  `text-orange-600` for the theme toggle and some highlights.
- **Semantic:** destructive = `text-red-400` (dark) / `text-red-500` (light) with `/10` bg wash.
  Occasional planet/nebula accents in violet (`#9333ea`, `bg-orange-500/5`, `bg-blue-500/5`).

### Accent-application rules

- Gold is a **spotlight, not a fill.** Active nav/tab = translucent gold wash
  (`bg-jyotish-gold/10`) + gold text + soft inset glow
  (`shadow-[inset_0_0_10px_rgba(212,175,55,0.1)]`), **not** a solid gold block.
- The one place gold goes **solid** is high-emphasis toggles/CTAs (Natal/Transit mode buttons,
  Login): `bg-jyotish-gold text-black` + outer glow `shadow-[0_0_15px_rgba(212,175,55,0.2)]`.
- Idle interactive elements are low-alpha neutral and **brighten on hover** (e.g.
  `text-white/40 hover:text-white/60`).

---

## 3. Typography

Three variable fonts, loaded via `@fontsource-variable` in `src/index.css`:

| Role | Family | Token | Used for |
|---|---|---|---|
| Body / UI | **Inter Variable** | `font-sans` | Default. Almost all UI text. |
| Display serif | **Cormorant Garamond Variable** | `font-serif` | Expressive headings, the logo wordmark (italic), editorial moments. |
| Mono | **JetBrains Mono Variable** | `font-mono` | Numbers, coordinates, times, labels, "instrument readout" text. Often `uppercase tracking-widest`. |

### Semantic type scale (use these, not ad-hoc px)

Defined as tokens; apply with `text-caption`, `text-label`, etc. 12px floor, fluid clamps on the big end.

| Class | Size | Line-height | Typical use |
|---|---|---|---|
| `text-caption` | 0.75rem (12px) | 1.35 | Nav labels, badges, fine print |
| `text-label` | 0.8125rem (13px) | 1.4 | Buttons, section-nav labels, form labels |
| `text-body` | 0.9375rem (15px) | 1.55 | Default reading text |
| `text-body-lg` | 1.0625rem (17px) | 1.6 | Emphasized body |
| `text-title` | clamp 1.125→1.4rem | 1.3 | Card / panel titles |
| `text-heading` | clamp 1.375→1.875rem | 1.25 | Section headings |
| `text-display` | clamp 1.875→2.75rem | 1.1 | Hero / page display |

> **Note:** older components still use raw sizes (`text-[10px]`, `text-xs`) and manual
> `uppercase tracking-widest font-bold` for the "instrument label" look. New work should prefer
> the semantic scale + `font-medium`/`font-semibold`. The mono-uppercase-tracked treatment is the
> established idiom for tiny labels and numeric readouts — keep it for those.

**Signature text treatments**
- `.gold-gradient-text` — gold→celestial-gold gradient clip, serif italic. Used for the **VEDIC SKY**
  wordmark.
- Tiny uppercase mono labels with wide tracking (`tracking-widest` / `tracking-[0.1em]`) =
  the recurring "control panel" label style.
- `.tabular` / `tabular-nums` for aligned numeric columns.

---

## 4. Shape, spacing, elevation

- **Radii:** generous and consistent. Pills/tabs `rounded-lg`/`rounded-xl`; cards `rounded-2xl`;
  bottom sheets `rounded-t-3xl`; avatars & dots fully `rounded-full`. Almost nothing has sharp corners.
- **Borders:** hairline and low-contrast — 1px at low alpha (`border-white/10`, `border-slate-200`).
  Borders define structure; heavy drop-shadows are avoided.
- **Elevation:** conveyed by **backdrop blur + translucency + glow**, not hard shadows.
  `backdrop-blur-xl`/`2xl` on bars and sheets; soft colored glows for emphasis
  (`shadow-[0_0_15px_rgba(212,175,55,0.2)]`). Menus use larger ambient shadows
  (`shadow-2xl`, `shadow-black/50`).
- **Spacing rhythm:** compact but breathable. Common paddings `px-3/4/5/6`, `py-1.5/2/2.5`;
  content stacks use `space-y-1` (menus) up to `space-y-6` (dashboard sections). Gaps `gap-1`→`gap-3`.
- **Motion:** almost every color/surface transition is `transition-colors duration-500`.
  Interactive press feedback is `active:scale-95`. Larger entrances use `motion/react` (Framer
  Motion) with short `easeOut` (0.2–0.25s) fades/slides.
- **Touch targets:** interactive controls carry `min-h-[44px]` on mobile surfaces (bottom bar,
  more-sheet, section nav) — respect this floor.

---

## 5. Theming (dark ↔ light)

- Managed by `src/context/ThemeContext.tsx`; persisted to `localStorage`; toggled from the header
  (desktop) and the More sheet (mobile). **Dark is the default and the "hero" look.**
- **Every** color decision is branched `theme === 'dark' ? … : …`. There is no auto system-pref
  fallback in components — the explicit branch is the pattern; follow it for any new surface.
- Dark = deep purple/indigo space with gold accents. Light = near-white (`#f8f9fa`→`#e9ecef`) with
  slate neutrals and warmer orange-tinted accents; the starfield/nebula background fades out.
- Root wrapper carries `.universe-bg` + `dark`/`light` class driving the radial background gradient.

---

## 6. Global background — `CelestialBackground.tsx`

A fixed, non-interactive `z-0` layer behind everything:

1. **Base gradient** — dark: `from-[#0a051d] via-[#1a0b2e] to-black`; light: fades to ~invisible.
2. **Two drifting nebulae** — huge blurred (`blur-[120px]`/`[150px]`) low-opacity (0.1–0.15) blobs,
   purple + gold in dark, animated on 60s/90s loops.
3. **150 twinkling stars** — random positions/sizes; mostly white, ~10% gold or violet; larger stars
   glow and twinkle (`star-twinkle`, 2–5s). Light theme dims them to slate.
4. **3 slow drift particles** for depth.
5. **Vignette** — subtle radial darkening at the edges.

The effect: content floats over a living, calm night sky. Keep foreground surfaces translucent so
this reads through (that's why panels use `/40`–`/80` alpha + blur).

---

## 7. Layout architecture

The app shell is a **fixed-height (`h-[100dvh]`), non-scrolling flex column**; scrolling happens
*inside* panels, not the page. Stacking, top to bottom:

```
┌──────────────────────────────────────────────────────────────┐
│ HEADER  (row 1, sticky, z-40)                                 │
│  [◈ VEDIC SKY]   Observer · Epoch │ [Natal|Transit] │ ☀/☾ [◗▾]│
├──────────────────────────────────────────────────────────────┤
│ SECTION NAV (row 2, desktop ≥md only, z-30)                   │
│        [ Sky ] [ Overview ] [ Data ] [ Journal ] …            │
├──────────────────────────────────────────────────────────────┤
│ MAIN  (z-10, flex-1)                                          │
│   ┌────────────────────────┬───────────────────────────┐     │
│   │  SKY MAP / CHART panel  │   DATA DASHBOARD panel     │     │
│   │  (left, lg:col-span-7)  │   (right, lg:col-span-5)   │     │
│   └────────────────────────┴───────────────────────────┘     │
├──────────────────────────────────────────────────────────────┤
│ MOBILE BOTTOM BAR (mobile <md only, fixed, z-50)  + More sheet│
└──────────────────────────────────────────────────────────────┘
```

### Breakpoints (important nuance)

- **Navigation** switches at **`md` (768px)**: the desktop **Section Nav** row is `hidden md:flex`;
  the **Mobile bottom bar** is `md:hidden`.
- **The two-panel split** switches at **`lg` (1024px)**: `grid-cols-1 lg:grid-cols-12`. Below `lg`
  the two panels stack / show one at a time.
- So on tablets (md–lg) you get the desktop top nav but a single-column body.
- A few very-small-phone refinements use arbitrary breakpoints (`min-[361px]:`, `min-[420px]:`).

### Row 1 — Header (`Header.tsx`)

Sticky, `z-40`, translucent + `backdrop-blur-xl`, hairline bottom border.
- **Left:** compass-in-rounded-square logo mark (gold, gently pulsing) + **VEDIC SKY** serif-italic
  gold-gradient wordmark, with a tiny "SIDEREAL ENGINE" mono sublabel.
- **Center-right (desktop):** live **Observer** (geolocated city, click to relocate) and **Epoch**
  (HH:mm:ss) readouts in mono, separated by vertical hairlines.
- **Natal / Transit toggle** — a pill pair; the active mode is **solid gold on black** with glow.
  This is the app's most important mode switch (natal birth chart vs. current transiting sky).
- **Right:** theme toggle (sun/moon in a bordered square) and the **account chip** (avatar +
  chevron) opening a dropdown menu (People, AI Chat, Full Report, Settings, Admin, Sign Out).
- Header holds **no section navigation** — that lives in row 2.

### Row 2 — Section Nav (`SectionNav.tsx`, desktop ≥md)

A dedicated full-width row under the header, centered, `hidden md:flex`, horizontally scrollable if
needed (`overflow-x-auto no-scrollbar`). Renders the `desktopNav` items from the nav registry:
**Sky · Overview · Data · Journal · AI Chat · Sudarshana Chakra · Full Report**. Each is an
icon+label pill; active = gold wash + gold text + inset glow; idle = muted, brightens on hover.

### Main — two-panel workspace

- **Left panel — Sky Map / Chart** (`SkyMap.tsx`): `lg:col-span-7` in split view, else full width.
- **Right panel — Data Dashboard** (`DataDashboard.tsx` wrapper): `lg:col-span-5` in split view.
- **View states** are driven by one `activeTab` value (see §8). `Overview` = both panels side by
  side (the default). `Sky` = chart full width. `Data` = dashboard full width. `Journal` and
  `Settings` replace the whole main area with their own full-bleed views.

### Mobile bottom bar (`MobileNavigation.tsx`, <md) + More sheet (`MoreSheet.tsx`)

- Fixed bottom bar, `md:hidden`, `z-50`, blurred translucent, `h-[calc(60px+safe-area)]`, honoring
  iOS safe-area insets. Shows the `mobileBar` items — **Sky · Data · Journal · AI Chat** — plus a
  **More (•••)** button. Larger 24px icons + tiny caption labels; active item is gold and scales up
  slightly.
- **More** opens a bottom **sheet** that slides up (`y:100%→0`, 0.25s ease-out) with a dark scrim,
  rounded top, drag-handle affordance, the signed-in user block, the overflow destinations
  (Sudarshana, Full Report, People, Settings, Admin) with full labels, plus **theme toggle** and
  **Sign Out**.

---

## 8. Information architecture — single source of truth

`src/lib/navigation.ts` is the **canonical nav registry** (`NAV_ITEMS`). Every destination declares
which *surfaces* it appears on (`desktopNav`, `mobileBar`, `moreSheet`, `accountMenu`) so all nav
bars stay in sync. **Add/rename/reassign destinations here**, not per-component.

Top-level destinations (`NavId`): `sky`, `overview` (default), `stats` (Data), `archives` (Journal),
`chat` (AI Chat), `sudarshana`, `report`, `profiles` (People), `profile` (Settings), `admin`.
Each maps to a route (`/sky`, `/overview`, …) via helpers `navIdToPath` / `pathToNavId`.

The **Sky panel owns its own chart-type switch** (Circle sky-map ↔ North-Indian square chart) via an
in-panel toggle — it is **not** a top-level nav item. Don't reintroduce a separate "Chart" nav entry.

---

## 9. Left panel — Sky Map / Chart (`SkyMap.tsx`)

- Large square viewport (`max-w-[400px]` mobile, `lg:max-w-[700px]`, `aspect-square`), centered.
- **Two chart modes**, toggled in-panel:
  - **Circle** — a circular sidereal sky map with zodiac ring, planet glyphs, nakshatra ring;
    pannable/zoomable (drag = grab cursor). Rendered inside a `rounded-full` bordered disc.
  - **North Indian** — the traditional diamond/square house chart (`NorthIndianChart.tsx`), with
    interactive nakshatra hover tooltips (name, lord, deity, symbol, traits).
- **In-panel controls:** a mobile controls bar (Circle / N.Indian pills + zoom) at top on small
  screens; a desktop toolbar with the same chart toggle + zoom/pan/reset alongside the chart.
- Planets/houses/signs are hoverable & selectable; selection cross-highlights into the dashboard.

## 10. Right panel — Data Dashboard (`DataDashboard.tsx`)

Structured top-to-bottom:
1. **(Transit mode) time controls** — live toggle, date pickers, ±1 day steppers (mono, pill buttons).
2. **Grouped tab bar** (`TabGroup`) — horizontally scrollable, `no-scrollbar`, with **fade affordances
   at the edges** and auto-scroll of the active tab into view. Tabs come from
   `src/lib/dashboardTabs.ts`, grouped **Now · Birth Chart · Timing · Analysis**. Off-mode tabs stay
   visible but carry a small badge (✧ = needs Natal, ⊛ = needs Transit) and **auto-switch mode on
   click** instead of disappearing.
3. **Mode banner** — one muted line stating the current context ("Natal mode — birth chart for …" /
   "Transit mode — the current sky").
4. **Scrollable content** (`overflow-y-auto custom-scrollbar p-4`) — the active tab's panels.

Dashboard tab set: Overview, Panchang, Transits, Upcoming, Muhurta, Blueprint, Birth, Vargas,
Ashtaka(varga), Dashas, Yogas, Impacts, Rectify.

---

## 11. Reusable UI patterns / primitives

These recur everywhere — reuse them rather than inventing new ones:

- **Card / panel:** `rounded-2xl` + hairline border + translucent surface (`bg-white/5` dark /
  `bg-white` light) + `p-3/4`. Optional soft inner shadow.
- **StatTile:** compact labeled metric — tiny muted uppercase label above a larger value; key values
  in `text-jyotish-gold`. Laid out in `grid-cols-2 gap-3` rows.
- **Pill / segmented toggle:** bordered rounded container holding 2+ buttons; active = solid gold (for
  modes) or gold wash (for tabs); idle muted.
- **Tab (nav/dashboard):** icon + label, `rounded-lg`, active = `bg-jyotish-gold/10` + gold text +
  inset glow.
- **Icon buttons:** bordered rounded-lg square, `p-2`, `active:scale-95`.
- **Dropdown / sheet menu row:** `min-h-[44px]`, `rounded-xl`, icon + label, active gold wash, hover
  neutral wash; destructive rows in red.
- **Badges:** tiny translucent chips / small opacity-50 icons signaling mode requirements.
- **Empty/error:** `APIErrorMessage.tsx` — inline card with title, message, Retry + dismiss;
  positioned as a floating toast near top-center when global.

**Iconography:** [lucide-react](https://lucide.dev) throughout, `w-3.5`–`w-6`. Signature mappings:
Compass = Sky/Blueprint, LayoutDashboard = Overview, LayoutGrid = Data, BookOpen = Journal,
MessageSquare = AI Chat, CircleDot = Sudarshana, Sparkles = Natal/Yogas, Zap = Dashas, Activity =
Transits/Impacts, Clock = Panchang.

---

## 12. Notable full-page views

- **Journal / Archives** (`Archives.tsx`) — saved interpretations & charts, replaces main area.
- **Settings / UserProfile** (`UserProfile.tsx`) — birth-data & account form.
- **AI Chat** (`AIChatPage.tsx`) — conversational Gemini interpreter; supports a clean **print/PDF**
  export (via the `#chat-print-root` print stylesheet in `index.css`) and public **shared chat**
  pages (`SharedChatPage.tsx`).
- **People / Profiles** (`ProfilesPage.tsx`) — multiple saved birth charts (e.g. family members).
- **Sudarshana Chakra** (`SudarshanaChakraPage.tsx`) — a specialized tri-wheel chart view.
- **Admin** (`AdminPage.tsx`) — admin-only; gated by `userProfile.role === 'admin'`.
- **Onboarding** (`Onboarding.tsx`) and **PendingApprovalBanner** for first-run / access states.
- A floating **AI Assistant** (`AIAssistant.tsx`) is available app-wide.

---

## 13. Design do / don't (quick reference)

**Do**
- Keep gold as an accent + use the translucent-wash-with-inset-glow active state.
- Branch every color on `theme`; design dark-first, then verify light.
- Use the semantic type scale and lucide icons; keep tiny labels uppercase-mono-tracked.
- Keep surfaces translucent + blurred so the celestial background reads through.
- Respect `min-h-[44px]` touch targets and iOS safe-area insets on mobile bars/sheets.
- Route all navigation-item changes through `src/lib/navigation.ts`.

**Don't**
- Fill large areas with solid gold, or introduce loud/neon secondary colors.
- Add hard drop-shadows for elevation (use blur + glow).
- Reintroduce a separate top-level "Chart" nav item (chart type lives inside the Sky panel).
- Let the page body scroll — scrolling belongs inside panels.
- Crowd the header row with section navigation (that's row 2's job on desktop).

---

### Key files at a glance

| Concern | File |
|---|---|
| Design tokens, fonts, type scale, background CSS | `src/index.css` |
| Theme state (dark/light) | `src/context/ThemeContext.tsx` |
| Nav registry (all destinations & surfaces) | `src/lib/navigation.ts` |
| Dashboard tab registry & groups | `src/lib/dashboardTabs.ts` |
| Shell / layout orchestration | `src/App.tsx` |
| Header (row 1) | `src/components/Header.tsx` |
| Desktop section nav (row 2) | `src/components/SectionNav.tsx` |
| Mobile bottom bar / More sheet | `src/components/MobileNavigation.tsx`, `src/components/MoreSheet.tsx` |
| Left chart panel | `src/components/SkyMap.tsx`, `src/components/NorthIndianChart.tsx` |
| Right data panel | `src/components/DataDashboard.tsx` |
| Ambient background | `src/components/CelestialBackground.tsx` |
