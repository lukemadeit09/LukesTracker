# Lukes Tracker — Full UI Redesign: "Hermes" Black & White
Status: DRAFT FOR APPROVAL — no code written against this spec yet.
Author: UI/UX design pass. Scope: presentation layer only (theme, screens, components, App.js tab bar, new art components). Data layer (`useApp()`, `storage.js`, `predict.js`, `milestones.js`) is unchanged except where explicitly flagged.

---

## 0. Design principles

1. **Black is the canvas, not a color.** `#000000` background everywhere. Every visual element is a shade of white/gray, drawn either as a hairline stroke, flat text, or a sparse SVG mark. No accent hue survives — hierarchy comes from **size, weight, position and contrast**, not color.
2. **Type does the work color used to do.** Where the old app used orange to say "this matters," the new one uses scale: huge display numbers for the thing that matters most on a screen, small uppercase mono labels for everything structural.
3. **Editorial, not app-like.** Numbered sections ("#1 TODAY"), generous top/bottom whitespace, left-aligned ragged compositions, hairline rules instead of card fills. The app should feel like a printed report you check in on, not a dashboard of colored widgets.
4. **Terminal-tinged, not terminal-cosplay.** Monospace is reserved for *data* (numbers, dates, percentages, counts) and small system captions (`> `, section numbers). Headings and body copy stay in the system sans font. Never set a full sentence in mono.
5. **One clear action per screen.** Keep the existing minimalism; if anything, cut further. Empty states get exactly one CTA. Forms stay single-column.
6. **Art is atmosphere.** SVG motifs sit behind or beside content at low opacity, never on top of anything tappable, never so busy it competes with numbers. If in doubt, remove a line.
7. **Everything that worked still works.** This is a re-skin + layout rethink, not a rebuild. All existing testIDs, data flows, gating logic, and interaction rules are preserved unless explicitly called out under "Flags for backend-dev" or "Strings that change."

---

## 1. Theme tokens — `src/theme.js` (complete replacement)

### 1.1 Grayscale ramp

Named steps so components never hardcode hex again. Ramp is chosen so text-on-black always clears WCAG AA (4.5:1) at the two "text" steps, while decorative steps can go dimmer.

| Token | Hex | Approx luminance | Usage |
|---|---|---|---|
| `gray.0` (`black`) | `#000000` | 0% | App background, purest black. |
| `gray.50` | `#0A0A0A` | ~2% | Elevated-but-still-black surface (e.g. modal sheet, input fill) — barely lighter than background, used only where a fill is structurally needed (inputs, switch tracks). |
| `gray.100` | `#141414` | ~5% | Card fill on the rare occasion a filled block is used (celebration moment background) — see §1.5. |
| `gray.200` | `#232323` | ~11% | Hairline borders at rest (default 1px card/divider stroke). |
| `gray.300` | `#3A3A3A` | ~18% | Hairline borders, emphasized (focused input, active tab underline at rest state). |
| `gray.400` | `#5C5C5C` | ~29% | Decorative art strokes, disabled text, placeholder text (fails AA — decoration/disabled only, see §9). |
| `gray.500` | `#8A8A8A` | ~46% | Secondary/muted text — meets AA for large text (≥18px) only. Used for labels, captions ≥ that size, or paired with bold weight. |
| `gray.600` | `#B3B3B3` | ~63% | Body/secondary text at normal sizes — meets AA (4.5:1) on black. |
| `gray.700` | `#E0E0E0` | ~82% | High-emphasis secondary text, resting icon strokes. |
| `white` (`gray.900`) | `#FFFFFF` | 100% | Primary text, primary strokes, "full" states (100% progress, today's grid square, active tab). |

Danger state (deadline overdue / reset action) keeps **no color** per the brief's "no color anywhere" rule — see §1.6 for how overdue/behind states are now expressed in grayscale + shape instead of red.

```js
export const colors = {
  black: '#000000',
  gray50: '#0A0A0A',
  gray100: '#141414',
  gray200: '#232323',
  gray300: '#3A3A3A',
  gray400: '#5C5C5C',
  gray500: '#8A8A8A',
  gray600: '#B3B3B3',
  gray700: '#E0E0E0',
  white: '#FFFFFF',

  // Semantic aliases — components should prefer these over raw grayXXX where possible.
  background: '#000000',
  surface: '#0A0A0A',       // input fills, switch track "off"
  surfaceRaised: '#141414', // celebration panel fill only
  border: '#232323',        // default hairline
  borderStrong: '#3A3A3A',  // emphasized hairline
  textPrimary: '#FFFFFF',
  textSecondary: '#B3B3B3',
  textMuted: '#8A8A8A',
  textDisabled: '#5C5C5C',
  art: '#5C5C5C',            // default SVG stroke color (opacity varies, see art spec)
};
```

Note: `colors.accent` is **removed**. Any component importing `colors.accent` must be updated (flagged per-component below). `colors.secondary` and `colors.muted` names are retired in favor of the semantic aliases above; keep raw `grayXXX` exports too for one-off needs (e.g. art).

### 1.2 Typography scale

System fonts only. iOS uses San Francisco automatically; Android uses Roboto automatically — just set `fontWeight`. Monospace via `Platform.select`.

```js
export const fontFamily = {
  mono: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'Menlo' }),
  // sans uses the OS default — do not set fontFamily for sans text, only fontWeight.
};
```

| Token | Size | Weight | Letter-spacing | Line height | Usage |
|---|---|---|---|---|---|
| `font.display` | 40 | 800 | -0.5 | 44 | The single biggest number/word on a screen (e.g. streak count on Home, "GOALS" screen title). Used ONCE per screen max. |
| `font.h1` | 34 | 800 | -0.5 | 38 | Screen title (falls back from display on secondary screens like Stats/Settings/Goals list header). |
| `font.h2` | 22 | 700 | -0.2 | 27 | Section/card titles (goal name, "Today's habits"). |
| `font.body` | 15 | 400 | 0 | 21 | Standard body/UI text, inputs, buttons. |
| `font.small` | 13 | 500 | 0 | 18 | Secondary labels, hints. |
| `font.tiny` | 11 | 600 | 0.5 (uppercase tracking) | 14 | Section numbers ("#1 TODAY"), legends, meta captions — almost always uppercase + mono or uppercase sans. |
| `font.monoStat` | 28 | 700 (mono has no true bold on Menlo — use `fontWeight: '700'`, RN will fake-bold) | 0 | 32 | Stat values (streak numbers, percentages, counts) — mono font family applied. |
| `font.monoSmall` | 13 | 500 | 0 | 18 | Inline mono for dates, small numbers, counters next to labels. |

```js
export const font = {
  display: 40,
  h1: 34,
  h2: 22,
  body: 15,
  small: 13,
  tiny: 11,
  monoStat: 28,
  monoSmall: 13,
};

export const weight = {
  display: '800',
  h1: '800',
  h2: '700',
  body: '400',
  semibold: '600',
  bold: '700',
};

export const tracking = {
  display: -0.5,
  h1: -0.5,
  h2: -0.2,
  body: 0,
  label: 1.5,   // uppercase section labels / numbered captions — wide tracking, terminal feel
};
```

**Decision — heading style:** Big numerals and the wordmark use **tight negative tracking (-0.5)** at heavy weight (800) for an editorial, condensed-display feel. Small uppercase labels (`#1 TODAY`, legends, buttons in caps) use **wide positive tracking (+1.5)** — the contrast between "tight huge" and "wide tiny" is itself a design signature, mirroring Hermes' mix of huge serif/grotesk headlines and spaced-out mono captions.

**Mono usage — exact list:**
- Streak count value, day counts, "Xd left"/"Xd overdue" deadline text
- All percentages (goal %, progress %, 14-day avg %, weekday completion %)
- Stat tile values (StatCard's `value` prop) — always mono
- Dates (deadlines, "created" dates, timestamps)
- Section numbers (`#1`, `#2`, `#3`) and the `>` prompt glyph
- Goal current/target counts (`24 / 100 books`)
- Chart axis labels (`M T W T F S S`) — mono, tiny, tracked
- NOT mono: headings, body copy, button labels, empty-state copy, motivational messages, habit/goal titles.

### 1.3 Spacing

Slightly more generous than before to let whitespace carry hierarchy (brief calls for "generous whitespace between sections").

```js
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 28,   // was 24 — bumped for section gaps
  xl: 40,   // was 32 — bumped for hero/section breathing room
  xxl: 64,  // new — top-of-screen hero spacing, celebration moment padding
};
```

### 1.4 Radius

**Decision — sharp, barely-rounded corners.** Filled "card" surfaces are gone in favor of hairline-outlined blocks; a hard 0px radius reads as too brutalist against body text and the pill progress bars needed for the grid legend, so corners get a minimal 2px "de-fillet" — enough to stop hairlines looking laser-cut, not enough to read as "rounded UI."

```js
export const radius = {
  none: 0,
  sm: 2,    // cards, inputs, buttons — the default now
  md: 4,    // rarely used, slightly larger blocks (celebration panel)
  pill: 999, // progress bar tracks/fills, legend dots — pill shape intentionally kept, it's the one "soft" shape in the system and reads as a loading/progress convention users already know
};
```

### 1.5 Borders (replacing filled cards)

New token group — every "card" becomes a hairline-outlined block on black.

```js
export const border = {
  hairline: StyleSheet.hairlineWidth, // ~0.33-0.5px depending on density — used for internal dividers
  thin: 1,     // standard card/input border width
  thick: 1.5,  // emphasized border (focused state, "today" ring, active milestone tick)
};
```

Card convention: `backgroundColor: colors.background` (i.e., no fill — pure black, same as screen), `borderWidth: border.thin`, `borderColor: colors.border`, `borderRadius: radius.sm`, `padding: spacing.md`. On press/focus, border brightens to `colors.borderStrong` or `colors.textPrimary` rather than any fill change — no ripple/shadow, since black-on-black shadows are invisible; use border-brighten + very slight `opacity: 0.85` on press instead.

Exception: the **milestone celebration panel** (§6) is the one place that gets a filled surface (`gray100`), specified as a deliberate one-off to give that moment more visual weight than everything else — see §6.

### 1.6 Status without color

Old app used `colors.accent` for "good" and `#e25c5c` (red) for "behind/overdue." New rule: **status is expressed via weight, glyph, and gray-step, never hue.**

| Old meaning | Old signal | New signal |
|---|---|---|
| On track / done / projection | orange text | `textPrimary` (white) + normal weight; "done" gets a filled circle glyph `●` prefix |
| Behind / overdue | red text | `textPrimary` (white) but **prefixed with `!`** in mono and set in `weight.bold`; the row also gets a `borderStrong` left-edge tick (2px vertical hairline) instead of a red border. Never dimmed — a warning must never be less visible than a neutral state. |
| No data / not started | muted gray text | `textMuted` (gray500), normal weight, no glyph |

This satisfies "no color anywhere" while keeping status legible via typographic emphasis (bold + glyph + micro-icon) rather than removing the signal entirely.

### 1.7 Full token file shape (for frontend-dev)

```js
// src/theme.js
import { Platform, StyleSheet } from 'react-native';

export const colors = { /* §1.1 */ };
export const fontFamily = { /* §1.2 */ };
export const font = { /* §1.2 */ };
export const weight = { /* §1.2 */ };
export const tracking = { /* §1.2 */ };
export const spacing = { /* §1.3 */ };
export const radius = { /* §1.4 */ };
export const border = { /* §1.5 */ };

export default { colors, fontFamily, font, weight, tracking, spacing, radius, border };
```

All existing imports (`import { colors, spacing, radius, font } from '../theme'`) keep working; add `fontFamily`, `weight`, `tracking`, `border` as new named exports components opt into.

---

## 2. App shell & tab bar — `App.js`

### Layout
- `SafeAreaView` background becomes `colors.background` (`#000000`). Update `app.json`'s `backgroundColor` and `splash.backgroundColor` to `#000000` too (flagged in §10 — outside `src/` but required for a consistent boot flash / splash).
- Loading state: replace the colored `ActivityIndicator` (`color={colors.accent}`) with `color={colors.white}`. Loading copy stays "Loading your progress…" in `textMuted`, small, centered. Add a subtle static art mark above it: a single thin circle outline (see `Orbit` motif, §8) pulsing opacity 0.2→0.5→0.2 over 1.2s (Animated API, `useNativeDriver: true`) — a small sign of life while the black screen would otherwise feel broken.

### Tab bar treatment (redesign, not just recolor)
Old: filled slate bar, icon glyphs + label, orange when active.
New: **hairline-top bar on pure black**, text-first, no icon glyphs (glyphs like ◆ ◎ ▤ ⚙ read as "UI chrome" — cut them for the editorial look). Each tab is a small mono index + label stacked, active tab distinguished by a **1px underline the width of the label** (not a filled pill, not color) plus full-white text; inactive tabs sit at `textMuted`.

```
┌──────────────────────────────────────────────┐
│ ─────────────────────────────────────────────│ ← border.thin, colors.border, full width
│                                                │
│   01          02          03          04      │  ← font.tiny mono, tracking.label, gray500/white
│  HOME        GOALS       STATS      SETTINGS  │  ← font.small, weight.semibold, gray500/white
│  ────                                         │  ← 2px underline under active tab only, colors.white
└──────────────────────────────────────────────┘
```

- Bar height: intrinsic (index + label + underline + paddings), roughly 56-60px, `paddingTop: spacing.sm`, `paddingBottom: spacing.sm` (respect safe area below via existing `SafeAreaView`).
- Tab index numbers are **fixed** per tab (01/02/03/04), not renumbered per active state — they're identity labels, matching how Hermes numbers fixed sections.
- Touch target: full tab width × full bar height (flex: 1 column), comfortably >44pt.
- **String preserved:** tab labels stay exactly `"Home"`, `"Goals"`, `"Stats"`, `"Settings"` (rendered as uppercase via `textTransform: 'uppercase'` styling, NOT by changing the string) — the tab-switch regression test does `fireEvent.press(screen.getByText('Goals'))` / `getByText('Home')`, and `textTransform` doesn't change the underlying text node queried by `getByText`, so this is safe. **Do not** change the literal strings to `'HOME'` etc. — use `style={{ textTransform: 'uppercase' }}` on `Text` so the accessible/query text remains `'Home'`.
- Active indicator swaps instantly on press (no slide animation needed — keep it snappy/discrete, consistent with "discrete state" editorial feel rather than a springy modern tab bar).

---

## 3. Shared component redesigns (`src/components/`)

### 3.1 `SectionHeader` (NEW component, `src/components/SectionHeader.js`)
Every screen section gets one of these instead of the old `sectionTitle` Text style. Introduced because 3 of 4 screens need identical "numbered caption + title" header treatment.

Props: `{ index: number, label: string, title: string }`
Layout:
```
> #1  TODAY                     ← font.tiny mono, tracking.label uppercase, textMuted; '>' + '#N' + 2-space gap + LABEL
Your habits                     ← font.h2, weight.h2, textPrimary, marginTop: spacing.xs
```
- `label` is the short mono caption (e.g. `TODAY`, `ACTIVITY`, `HABITS`, `GOALS`, `FORECASTS`).
- `title` is the human-readable sentence-case headline underneath (optional — omit `title` for terse sections like Settings rows).
- Top margin before a `SectionHeader` is always `spacing.xl` (or `spacing.xxl` for the first section after a hero) — this is the primary rhythm-setter for "generous whitespace between sections."

### 3.2 `Card` (NEW wrapper, `src/components/Card.js`)
Replaces ad-hoc `styles.panel` / `styles.card` per screen. Props: `{ children, style, emphasized }`.
- Default: `backgroundColor: colors.background`, `borderWidth: border.thin`, `borderColor: colors.border`, `borderRadius: radius.sm`, `padding: spacing.md`.
- `emphasized`: border becomes `colors.borderStrong` — used for the "today" card on Home and the active/focused goal being edited.
- No shadow, no elevation (would be invisible/muddy on black; skip entirely rather than fake it).

### 3.3 `Checkbox` (`src/components/Checkbox.js`)
Old: filled slate row, orange filled checkbox square with ✓.
New: **row is a hairline-bottom list item, not a bordered card** (list rows inside a single outlined `Card` container feel calmer than N separate boxes). Checkbox itself becomes a 22×22 square, `border.thick` white outline when unchecked; when checked, it **inverts** — fills solid white with a black ✓ glyph (mono, weight 800) — the one moment we use a filled shape, and it reads strongly because everything else is outline-only.

```
┌ Card (habits list) ─────────────────────┐
│  ☐  Read for 20 minutes                 │  ← unchecked: 22x22 white-outline box
│  ─────────────────────────────────────  │  ← hairline divider (border.hairline, colors.border)
│  ■✓ Cold shower                          │  ← checked: solid white box, black check, label strikethrough at textMuted
└──────────────────────────────────────────┘
```
- `label` unchecked: `textPrimary`. Checked: `textMuted` + `textDecorationLine: line-through` (unchanged behavior).
- Row padding: `spacing.md` vertical, `spacing.md` horizontal; touch target full row width × ≥48pt height (bumped slightly from 26px box + padding to guarantee 48pt with the new denser list — verify final row height ≥ 48pt, adjust vertical padding if the hairline-divider list makes rows shorter than before).
- Long-press-to-delete affordance unchanged; add a one-time `hint` Text (already exists as "Long-press a habit to delete it.") — keep as-is, styled `font.tiny`, `textMuted`, mono NOT applied (it's a sentence).
- Press state: entire row opacity 0.6 momentarily (kept from old `pressed` style, values may tune) — no color shift needed.

### 3.4 `StatCard` (`src/components/StatCard.js`)
Old: filled slate rounded tile, big number, tiny label, optional orange accent.
New: **outlined block, no fill.** Value in `font.monoStat` + `fontFamily.mono`, label below in `font.tiny` uppercase tracked mono-caption style (but sans font, per §1.2's mono-usage list — labels are structural, so tiny+tracked+uppercase in **sans**, not mono, to keep the "mono = data" rule clean). Remove the `accent` prop (no color left to apply) — replace with an `emphasized` boolean that instead renders the value in `font.display`-ish larger size (32 vs 28) and adds a `borderStrong` border, for the one "hero" stat in a row (e.g. streak on Home).

```
┌───────────────┐
│      12       │  ← font.monoStat, mono, textPrimary (or larger if emphasized)
│  DAY STREAK   │  ← font.tiny, tracking.label, textMuted, uppercase
└───────────────┘
```
- Three-up row: equal-width outlined blocks with 1px shared/adjacent borders where possible (touching borders between adjacent StatCards look intentional/ledger-like) — implementation: give each card a border on all sides but use `marginLeft: -border.thin` on all but the first so borders collapse into single lines, like a table. This is a nice-to-have; acceptable fallback is `spacing.sm` gaps with full borders on each if border-collapse proves fiddly in RN flexbox — flag to frontend-dev to try collapse first.
- **PROPOSED addition:** small `delta` prop (e.g. `+2` vs last week) rendered as a `font.tiny` mono second line under the label — used by the new Stats additions in §5, not by Home's existing three stats. Marked PROPOSED — see §11.

### 3.5 `ContributionGrid` (`src/components/ContributionGrid.js`)
Functionally unchanged: same 18-week window, same `dayKey`/`scoreFor` contract, same `testID="activity-grid-scroll"` and `testID="grid-square"` on every square, same `scrollToEnd` snap-to-latest-on-content-size-change behavior (do not touch that logic — it's fixing a real regression per the test's comment).

Visual changes only:
- `colorForScore` maps to grayscale steps instead of accent alpha ramps:
  ```js
  function colorForScore(score) {
    if (score <= 0) return colors.gray100;   // faint - almost invisible against black, but present
    if (score < 0.34) return colors.gray400;
    if (score < 0.67) return colors.gray600;
    if (score < 1) return colors.gray700;
    return colors.white;                     // full day = pure white
  }
  ```
- Square size/gap unchanged (14 / 3) — grid density is a feature, not a style choice.
- Squares get `radius.none` or a hairline `borderRadius: 1` (near-square, not old `radius: 3` pill-ish corner) — sharper, more "pixel/terminal grid" than before.
- `todayRing`: keep the ring concept but make it a **1.5px white outline** (`border.thick`) regardless of that day's fill — currently it already uses `colors.text`, so this barely changes; confirm ring is visible against a `gray700`/white fill day (may need ring to render as a subtle inset rather than outline when the square itself is already white — use `borderColor: colors.black` in that one case so the ring is a black gap around a white square rather than invisible white-on-white). **Flag to frontend-dev:** compute ring color as `square fill === white ? colors.black : colors.white` at render time — small new conditional, no new data needed.
- Legend row: replace "Less ... More" gradient dots (previously accent-alpha) with the same 4-step grayscale ramp; legend text becomes `font.tiny` mono, uppercase, tracked (`LESS` / `MORE`).
- **PROPOSED addition:** weekday row labels (S M T W T F S) as a thin mono column to the left of the grid, matching GitHub's own convention — currently absent. See §5.2 (Stats' weekday heat uses letters already; Home's grid doesn't). Marked PROPOSED, low priority, easy to skip.

### 3.6 `BarChart` (`src/components/BarChart.js`)
Old: accent-filled bars over slate track.
New: bars become **white fills** at full opacity for `value > 0`, `gray200` hairline-topped empty track for `value === 0` (i.e., a bar of height 2 in `gray200` rather than accent-alpha) — matches "grayscale ramp for progress" instruction. Bar width/columns/label row unchanged. Axis labels (weekday letters) become mono, `font.tiny`, tracked, `textMuted`.
- **PROPOSED enhancement (§5.1):** overlay a thin horizontal rule at the 14-day average line across the chart height (a single `gray400` dashed-feel hairline — RN can't do dashed borders natively without extra libraries, so approximate with a `View` of height 1 and `opacity: 0.5`, OR compose from a `react-native-svg` `<Line>` with `strokeDasharray="2,3"` since svg is now available — **prefer the SVG line**, it gets real dashing for free). This gives "how am I doing vs my own average" at a glance. Marked PROPOSED.

### 3.7 `GoalCard` (`src/components/GoalCard.js`)
Biggest component rework. Old: filled surface card, orange fill/ticks, orange celebration banner, orange step buttons.

New layout (top to bottom), inside a `Card` (hairline border, no fill):
```
┌──────────────────────────────────────────────┐
│ Read 24 books                             ✕   │  ← font.h2 title, textPrimary; ✕ remove, textMuted, hitSlop 10
│ 24 / 100 books              12d left          │  ← left: mono current/target/unit; right: mono deadline text, textSecondary
│                                                │
│ ▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │  ← progress track, see below
│                                                │
│ NEXT MILESTONE · 50% · 25 BOOKS TO GO         │  ← font.tiny mono caption row (uppercase), textMuted
│                                                │
│ > At this pace, done in ~40 days              │  ← font.small, textSecondary, '>' prompt prefix, sentence case (not mono)
│                                                │
│        −5          25%          +5            │  ← step controls row: mono buttons, center pct in font.monoStat-ish (smaller, ~20)
│                                                │
│ ─────────────────────────────────────────────│  ← hairline divider
│ NOTIFY ON MILESTONES                    ⚪──   │  ← switch row, unchanged logic
└──────────────────────────────────────────────┘
```
- **Progress track:** height 8px, `colors.gray100` background, fill `colors.white`, `radius.pill` kept (progress bars are the one place pill shape survives, per §1.4). Milestone ticks at 25/50/75%: reached ticks render as `gray600` 2px verticals; the "next" tick renders **taller and white** (`textPrimary`, overflowing top/bottom by 3px like today); future/uncrossed ticks beyond "next" render `gray300`. This exactly mirrors old reached/next/future logic, just remapped to gray steps instead of accent+background-alpha — **no logic change needed**, only the three color constants swap.
- **Deadline text status (§1.6 applied):** overdue goals get deadline text prefixed `!` and set `weight.bold`, still `textPrimary` (not dimmed, not colored). "Due today" stays plain bold, no `!`. On-track countdown (`12d left`) is normal weight, `textSecondary`, mono.
- **Prediction line:** prefixed with a mono `>` prompt glyph (terminal touch called out in the brief) followed by the existing sentence-case label text — copy itself is unchanged (still comes from `predict.js`'s `label`). Behind/overdue predictions get the `!` + bold treatment per §1.6 instead of red; "done"/"on track" stay normal weight. Remove the `statusColor(pred.status, colors)` color mapping entirely — `predict.js`'s `statusColor` export becomes presentation-dead code; **flag to frontend-dev**: either stop importing/calling it, or repurpose its return value only to decide bold-vs-normal (i.e., treat any non-`gray.muted` return as "emphasize"). Simplest: GoalCard stops calling `statusColor` and instead does `const emphasize = pred.status === 'behind' || pred.status === 'overdue'` locally.
- **Step controls:** `−N` / `+N` become **outlined square buttons** (border.thin, no fill), text mono, `weight.bold`. Center percentage becomes the visual focal point of the row: bigger (`font.h2`-ish, mono, ~22-24px) between the two buttons, unlike before where pct was small/muted. Buttons keep existing hit targets (`spacing.sm`/`spacing.lg` padding ⇒ comfortably ≥44pt).
- **Milestone caption row** (non-celebrating state): becomes the numbered-caption style — uppercase mono, `NEXT MILESTONE · 50% · 25 BOOKS TO GO` (interpunct separators, terminal-ish). **String change:** old copy was `"Next milestone: 50% · 25 books to go"` (sentence case, colon). New copy is uppercase with a leading label. **This breaks the existing test** `findByText(/Next milestone: 50%/)` in `GoalCard.test.js` and `AppContext.milestones.test.js` doesn't touch this string but `GoalCard.test.js` line 106/127 does. **Decision:** keep the *substring* `Next milestone: 50%` byte-for-byte (i.e., do NOT uppercase or restyle this particular string), OR update it and flag the test for deliberate update. Given the brief explicitly says to list changed strings "so the tester can update tests deliberately" rather than mandating zero changes, I propose changing it for consistency with the new numbered-caption language system — see the consolidated string-change list in §9. `textTransform: 'uppercase'` at the style layer (not literal string change) is the safer middle path and is what I recommend: keep the underlying string exactly `Next milestone: 50% · 25 books to go` / `Next milestone: 50% · 25 books to go` (sentence case, unchanged), and apply *no* uppercase transform to this one row, styling it instead as `font.small` mono, `textMuted` — visually consistent enough with the caption language without touching test-relied-upon text. **Final decision: NO STRING CHANGE for the milestone row** — style only (mono, small, muted), preserving `getByText(/Next milestone: 50%/)` and `getByText(/Next milestone: 50%/)` matches exactly. Same for `"Goal complete — every milestone hit"` — unchanged string, restyled only.
- **Celebration state:** see §6 — full redesign, biggest addition in this spec.
- **Notify row:** unchanged structurally (Switch + label + conditional hint). Switch colors: `trackColor={{ false: colors.gray200, true: colors.white }}`, `thumbColor={colors.black}` when off / `colors.black` when on too (thumb always reads as a black dot on either a dark-gray or white track — test both, may need `thumbColor: colors.white` for off-state on Android where thumb needs contrast against a dark track; **flag to frontend-dev to verify per-platform default thumb rendering**, since RN's `Switch` thumb color defaults vary by OS). Label copy unchanged: `"Notify on milestones"`, hint copy unchanged: `"Turn on Daily reminder in Settings to receive this"`.

---

## 4. Per-screen specs

Section numbering is **per-screen**, restarting at #1 on each screen (matches "Define the numbering per screen" instruction) — Home's #1/#2/#3 are unrelated to Goals' #1/#2.

### 4.1 Home / Dashboard — `src/screens/DashboardScreen.js`

**Purpose:** Daily focus screen — what's due today, current streak, activity history, quick-add habits. First screen on launch (tab `home`, index 01).

**Art motif — "Radiating lines" header decoration.** A sparse burst of thin lines radiating from a point near the top-right of the hero area, suggesting momentum/energy without being literal. Proposed component: `src/components/art/RadiatingLines.js`.
- `viewBox="0 0 200 200"`, absolutely positioned behind the hero text (top: -20, right: -40, width/height ~220, `pointerEvents="none"`, `opacity` container-level 1 but stroke opacities vary per line as below).
- Origin point: `(170, 20)` (near top-right corner, mostly off-canvas so only a fraction of each ray is visible — reads as "light source" cropped by the screen edge).
- Generate 14 `<Line>` elements at angles evenly spaced from 160° to 260° (a 100° arc pointing down-left into the content, i.e., away from the corner) using `angle = 160 + (i / 13) * 100` for `i` in 0..13.
- Each line's length varies pseudo-randomly but deterministically (seeded by `i`, e.g. `length = 60 + (i * 37) % 90`) from the origin outward.
- `stroke={colors.art}` (`gray400`), `strokeWidth={1}`, per-line `opacity` fades with distance from the "core" angle (closest to 210°, the arc's middle) — e.g. `opacity = 0.5 - Math.abs(i - 6.5) * 0.06`, clamped to a `[0.08, 0.5]` range — so the burst is brightest in the middle of the arc and trails off, avoiding a busy uniform sunburst.
- This is the ONLY art on Home; keep it confined to the hero region, never behind the task list or grid.

**Layout, top to bottom:**

1. **Hero block** (no numbered section — this is the masthead, sits above the numbering system):
   - Small mono kicker: `> LUKES TRACKER` (`font.tiny`, mono, tracking.label, `textMuted`) — replaces the old bold "LUKES TRACKER" brand line; keeps the wordmark but demotes it to a system caption so the day's motivational message + streak can be the visual hero instead.
   - `RadiatingLines` art sits behind/around this block per above.
   - Big display line: the motivational message (`messageForScore`) rendered in `font.display` (40pt/800/-0.5 tracking) IF short enough (≤ ~28 chars), else `font.h1` — **decision:** always render at `font.h1` (34pt) for consistency/predictability across all message strings rather than conditionally sizing (some messages are long, e.g. "Discipline is choosing what you want most." — dynamic sizing risks layout jank). `textPrimary`, up to 3 lines, `lineHeight` per §1.2. This is the screen's single biggest visual element, replacing the old small accent-colored subtitle — a deliberate elevation: the motivational line becomes the hero, not the brand name.
   - No copy changes to `messageForScore` — same START/MIDWAY/DONE pools, same deterministic per-day pick.

2. **#1 TODAY** (`SectionHeader index=1 label="TODAY"`, no `title` — the stat row below is self-explanatory):
   - Three-up `StatCard` row: Streak (`emphasized`), Today's tasks (`n/m`), Active days — same three stats, same underlying values (`currentStreak()`, `doneToday/tasks.length`, `activeDays`), just restyled per §3.4. Streak's old `🔥` emoji prefix is **dropped** (no glyph clutter; the number alone in huge mono is stronger) — **string/content change:** `StatCard` value changes from `` `🔥 ${streak}` `` to just `` `${streak}` ``. Flag for tester: any test asserting on the 🔥 emoji text would need updating (none currently found in the read test files, but flagged for safety).
   - Today's progress: thin single-line track (`height: 6`, `gray100` background, white fill, `radius.pill`) directly under the stat row, NO separate percentage label text below it — instead the percentage is folded into the StatCard's "Today's tasks" value as a second mono line (`{doneToday}/{tasks.length}` stays primary, but style allows a tiny `({pct}%)` — **PROPOSED, optional**; simplest safe default is to keep the existing separate `"{pct}% of today complete"` caption, just restyled: `font.tiny` mono, `textMuted`, centered under the bar. Going with the safe default — no new derived value needed.

3. **#2 ACTIVITY** (`SectionHeader index=2 label="ACTIVITY" title="Daily activity"`):
   - `Card` (outlined, no fill) containing `ContributionGrid` exactly as today — same props, same scroll behavior, same testIDs. Legend restyled per §3.5.
   - **Empty state (zero tasks ever completed, i.e., `activeDays === 0`):** grid still renders (it's a calendar of the last 18 weeks regardless of data — this is existing behavior, not new) but every square is `gray100` (the "0" color). Add one line beneath the grid, above the legend: `font.small`, `textMuted`, italic-less sentence: `"Your activity will appear here once you complete a habit."` — **PROPOSED copy, new**, only shown when `activeDays === 0`. No new data needed (`activeDays` already computed in this screen).

4. **#3 HABITS** (`SectionHeader index=3 label="HABITS" title="Today's habits"`):
   - `Card` wrapping the `Checkbox` list (hairline-divided rows per §3.3) when `tasks.length > 0`.
   - **Empty state** (`tasks.length === 0`): replace the current plain muted sentence with a small dedicated empty-state block (see §7 for the shared empty-state pattern): centered-left within the section, a one-line abstract art mark (see below) + heading + body + nothing else (input row still appears below regardless, unchanged — it IS the CTA).
     - Empty-state art: a single **thin square outline** (24×24, `gray300` stroke, `strokeWidth: 1`) to the left of the text block, evoking an unchecked checkbox at larger scale — reuses the checkbox motif rather than inventing new art, keeping it disciplined.
     - Heading: `"No habits yet"` (`font.h2`, textPrimary).
     - Body: `"Add something you want to do every day — reading, training, deep work. Small and repeatable beats big and occasional."` (`font.small`, textSecondary) — copy lightly tightened from the original but same meaning; **string change, flagged in §9** (original: `"No habits yet. Add your first one below — something you want to do every day."`).
   - Hint line `"Long-press a habit to delete it."` — unchanged string, restyled `font.tiny`, `textMuted`, only shown when `tasks.length > 0`.
   - Add-row: text input becomes outlined (`border.thin`, `colors.border`, focus → `colors.borderStrong`), placeholder `"New daily habit…"` unchanged, `placeholderTextColor: colors.textDisabled` (gray400 — dim but present). The `＋` add button becomes an **outlined square** (not filled white, to avoid over-competing with the checked-checkbox's filled-white convention) — `border.thick` white outline, `+` glyph white, transparent fill; on press, briefly inverts to filled-white/black-glyph for tactile feedback (`Pressable`'s `pressed` state swaps `backgroundColor` to `colors.white` and glyph color to `colors.black`).

**States:**
- **Loading:** handled at `App.js` level (§2), not per-screen.
- **Populated:** as above.
- **All tasks done today (`score >= 1`):** DONE-pool message shows automatically via existing `messageForScore`; additionally, the "Today's tasks" StatCard could get a subtle full-white border instead of default border when `doneToday === tasks.length && tasks.length > 0` — **PROPOSED micro-interaction**, purely a `borderColor` swap on that one StatCard (`emphasized`-style border) — no new data.
- **Edge case — many tasks (>10):** list simply grows, `ScrollView` already handles it; no truncation needed (existing behavior).
- **Edge case — very long habit title:** `Checkbox` label currently has no `numberOfLines` — keep unbounded wrap (existing behavior; long titles wrap to 2+ lines, row height grows). No change.

**Interactions:** tap row toggles (existing), long-press deletes (existing, no confirm dialog — unchanged, this is intentionally frictionless per existing design). Add button / submit-on-return (existing). No new gestures proposed for Home.

**Accessibility:**
- Checkbox row: add `accessibilityRole="checkbox"` and `accessibilityState={{ checked }}` (not present today — worth adding since we're touching the component anyway; flag to frontend-dev as a small a11y improvement, not blocking).
- Minimum touch target 44×44pt maintained on checkbox box itself even though visual box is 22×22 — achieved via row-level Pressable already wrapping full-width row (unchanged approach).
- Contrast: body/label text stays `textPrimary`/`textSecondary` (white / gray600) — both clear AA on black. Placeholder text at `gray400` fails AA (2.8:1) — acceptable per WCAG since placeholder text is decorative/supplementary, not conveying required information, but flagged explicitly in §9 accessibility notes.
- `RadiatingLines` art: `pointerEvents="none"`, `accessibilityElementsHidden`, `importantForAccessibility="no-hide-descendants"` on its container — never announced by screen readers.

---

### 4.2 Goals — `src/screens/GoalsScreen.js`

**Purpose:** CRUD list of goals with progress, predictions, milestones. Tab `goals`, index 02.

**Art motif — "Concentric orbits."** Goals are about circling toward a target — concentric rings suggest orbit/approach. Component: `src/components/art/Orbits.js`.
- `viewBox="0 0 240 240"`, positioned behind the screen header, top-right, `width/height ~180`, `opacity` per-ring as below, `pointerEvents="none"`.
- Center point `(200, 40)` (off the top-right corner, similar cropped-source approach as Home's rays, for visual family resemblance without repeating the exact motif).
- 5 concentric `<Circle>` elements, radii `[18, 36, 56, 80, 108]` (increasing gaps = feels like it's expanding outward, not evenly ruled).
- `stroke={colors.art}`, `strokeWidth={1}`, `fill="none"`.
- Opacity decreases with radius: `opacity = 0.45 - index * 0.08` for index 0..4 (innermost ring brightest at 0.45, outermost at ~0.13) — the innermost, smallest ring reads as the "target," outer rings as distance/orbits still to close.
- One extra element: a single small filled `<Circle r="3" fill={colors.white} opacity="0.8">` at the center point — the "goal" itself as a solid dot, the one filled mark in the whole piece.

**Layout, top to bottom:**

1. **Masthead:** `> GOALS` mono kicker (`font.tiny`, tracked, textMuted) then `font.h1` heading **"Goals"** (unchanged word, restyled). Sub-line unchanged copy `"Set a target, pick a deadline, track your pace."` restyled to `font.small`, `textSecondary`. `Orbits` art sits behind this block, top-right, per above.

2. **#1 IN PROGRESS** (`SectionHeader index=1 label="IN PROGRESS"`, no title) — only rendered when `state.goals.length > 0`:
   - List of `GoalCard`s (§3.7), unchanged order (creation order, matching current behavior — no sort added, flag as a possible future enhancement but NOT proposed here to keep scope disciplined).
   - Between cards: `spacing.md` gap (cards are separate outlined blocks, not touching).

3. **Empty state** (`state.goals.length === 0 && !open`) — replaces section #1 entirely when there are no goals yet (no point numbering a section with nothing in it):
   - Centered block, vertically roughly 1/3 down the remaining screen space (not jammed at the very top under the masthead — give it room, per shared empty-state pattern in §7).
   - Art: reuse a static, smaller instance of the `Orbits` motif (e.g. just 3 rings, radii `[16, 32, 52]`, opacity `[0.5, 0.3, 0.15]`) centered above the text, ~120×120, NOT the header's off-canvas cropped version — a clean, symmetric centerpiece since this is the moment's focal art.
   - Heading: `"No goals yet"` (`font.h2`).
   - Body: `"Create your first goal — a number, a unit, and optionally a deadline. Read 24 books. Run 100 km. Save $5,000."` (`font.small`, `textSecondary`) — **string change** from original `"No goals yet. Tap "New goal" to create your first one — read 24 books, run 100 km, save $5,000… anything with a number and a date."` (tightened, and no longer references the exact button label inline since the button is right below it visually). Flagged in §9.

4. **#2 NEW GOAL** (`SectionHeader index=2 label="NEW GOAL"`) — only rendered when `open === true` (form expanded). When `open === false` and goals exist, this section collapses to just the trigger button (see below) — no header shown for a collapsed/absent section, consistent with Home's pattern of only showing headers for sections with visible content.
   - Form fields, restyled as outlined inputs (`border.thin`, focus → `borderStrong`), same fields/order/behavior: title, target+unit row, deadline picker button, Cancel/Create row.
   - Deadline button copy unchanged: `"Deadline: {date}"` / `"Pick a deadline (optional)"`.
   - `DateTimePicker` usage/logic **completely unchanged** (data flow, `themeVariant="dark"` already correct for black theme — no change needed there, native picker chrome is outside our token system).
   - Cancel button: outlined (`border.thin`, `gray400` border, `textSecondary` label) — was filled slate.
   - Create button: **filled white**, black label, `weight.bold` — the one primary-action filled button pattern used consistently across the app (see §7's "primary action" convention). Was filled orange.

5. **Trigger button** (when `open === false`): `"+ New goal"` **string unchanged**, becomes an outlined-then-fills-on-press button matching Home's add-button treatment (§4.1) for consistency — full-width, `border.thick` outline, centered label, `font.body` `weight.bold`. Was a filled-orange full-width button.

**States:**
- **Loading:** N/A (data local/instant after app-level ready).
- **Populated, 1+ goals, form closed:** primary view — goal list + trigger button at bottom.
- **Form open, 0 goals:** empty-state text is suppressed while `open` (existing logic: `state.goals.length === 0 && !open`) — preserved.
- **Validation:** `handleCreate` no-ops on empty title (existing) — unchanged; **no new inline error UI proposed**, keeping scope disciplined (brief says resist clutter; a silent no-op on empty title matches current minimal-friction philosophy, though see §11 proposed addition for a small "required" hint if desired).
- **Goal at 100% / done:** handled entirely inside `GoalCard` (progress bar full white, prediction line reads "Goal reached", milestone row reads "Goal complete — every milestone hit" per existing logic, unchanged).

**Interactions:** unchanged — tap "+ New goal" opens form, Cancel/Create close it, +/- step buttons on each card, remove ✕ per card (no confirm dialog, unchanged/no change proposed — deletion is instant, matching existing app philosophy).

**Accessibility:**
- Date picker button: add `accessibilityRole="button"` and `accessibilityLabel` reflecting current selection (e.g. `"Deadline, {date}"` / `"Pick a deadline, optional"`) — small improvement, not present today, flagged as nice-to-have.
- Remove (✕) buttons: already have `hitSlop={10}`; visual glyph size can shrink slightly (16→14) since it's now on a hairline card rather than needing to stand out against a filled surface — hit area unaffected by visual size shrink.
- Orbits art on masthead: `pointerEvents="none"` + `accessibilityElementsHidden`, same as Home.

---

### 4.3 Stats — `src/screens/StatsScreen.js`

**Purpose:** Analytics — trend chart, headline numbers, per-goal forecasts, streak. Tab `stats`, index 03. This screen gets the richest additions (§5) since it's explicitly called out for "richer stats displays."

**Art motif — "Grid / lattice."** Stats = data = a grid. Component: `src/components/art/Lattice.js`.
- `viewBox="0 0 240 160"`, positioned behind the masthead, full-width band, `height ~140`, low opacity throughout (`opacity: 0.15` container-level, individual lines full alpha within that).
- Generate a grid of horizontal + vertical `<Line>`s at **irregular spacing** (not a uniform graph-paper grid, which would look like a literal chart background and compete with the real `BarChart` below it): x-positions at `[0, 22, 38, 70, 96, 150, 178, 220, 240]`, y-positions at `[0, 30, 55, 100, 130, 160]` (hand-picked irregular sequences — deterministic, no runtime randomness needed for these two arrays; ship as constants).
- All lines `stroke={colors.art}`, `strokeWidth={0.75}` (thinner than other screens' art since it's a denser motif — thin strokes keep total ink low).
- Optionally, 3-4 grid intersections get a small filled `<Circle r="2" fill={colors.white} opacity="0.6">` (deterministic indices, e.g. intersections `[2,3]`, `[5,1]`, `[7,4]` from the arrays above) — reads as "data points" on the lattice without being a literal chart.

**Layout, top to bottom:**

1. **Masthead:** `> STATS` mono kicker, `font.h1` **"Statistics"** (unchanged word). Sub-line unchanged copy `"Your progress over time."` restyled. `Lattice` art behind this band.

2. **#1 OVERVIEW** (`SectionHeader index=1 label="OVERVIEW"`, no title):
   - Existing three-up `StatCard` row: 14-day avg (`emphasized`), Perfect days, Total check-ins — same values, restyled, mono values, `🔥` -free (there wasn't one here anyway). "14-day avg" keeps its `emphasized` treatment (was `accent` before) since it's the headline number for this screen.
   - **PROPOSED addition — second stat row** (see §5.1 for full definition): Longest streak ever, Week-over-week delta, Goal velocity — three more `StatCard`s, same visual treatment, directly below the first row with `spacing.sm` gap (reads as one extended ledger of numbers, not two separate sections) — still under the "#1 OVERVIEW" header, since these are all headline numbers, not yet the detailed chart.

3. **#2 TREND** (`SectionHeader index=2 label="TREND" title="Last 14 days"`):
   - `Card` containing `BarChart` — unchanged data (`dayScore` per day, weekday letters), restyled per §3.6, with the PROPOSED average-line overlay (§3.6, §5.1).
   - Empty state (`state.tasks.length === 0`): unchanged trigger condition, copy restyled: keep string `"Add daily habits to start charting your activity."` (no change — flagged as UNCHANGED explicitly in §9 for clarity) rendered `font.small`, `textSecondary`, centered within the card, no art (keep empty states inside small inline panels text-only; only full-screen empty states get dedicated art per §7).

4. **#3 WEEKDAY HEAT** (`SectionHeader index=3 label="WEEKDAY HEAT" title="Completion by day of week"`) — **PROPOSED new section**, see §5.2 for full data definition. Sits directly after the trend chart since it's a complementary read of the same underlying data (which days you're strongest/weakest on, independent of the last-14-days recency window).

5. **#4 GOAL FORECASTS** (`SectionHeader index=4 label="GOAL FORECASTS" title="Pace toward your targets"`) — was `"Goal forecasts"` section, renumbered to #4 given the two new sections inserted above it:
   - Per-goal forecast rows — **redesigned from the current compact "surface card" list into something with a bit more presence**, since forecasts are one of the app's most differentiated features:
     ```
     ┌────────────────────────────────────────┐
     │ Read 24 books                     62%   │  ← title h2-ish (font.body, weight.bold), pct mono right-aligned
     │ ─────────────────────────────────────  │  ← thin white fill proportional to pct, full-width hairline track (a slim version of GoalCard's own bar — visual echo, not duplication of GoalCard itself)
     │ > On track — projected 105 books        │  ← prompt-prefixed prediction label, font.small, textSecondary (or bold+! if behind/overdue per §1.6)
     └────────────────────────────────────────┘
     ```
   - This adds a thin progress bar to the forecast row (previously text-only) — a small enhancement using data already present (`p.percent`), no new derived value.
   - Empty state (`state.goals.length === 0`): unchanged trigger, copy restyled: keep string `"No goals yet — create one to see a prediction."` (UNCHANGED, flagged in §9).

6. **Streak banner → folded into #1 OVERVIEW, removed as a standalone footer.** The old bottom-of-screen bordered streak banner (`"🔥 Current streak: {n} days"` + `"Keep showing up. Don't break the chain."`) is **redundant with Home's streak StatCard** and, more importantly, the brief explicitly asks for a stronger milestone/celebration moment elsewhere (§6) — duplicating a banner pattern here would dilute that. **Decision: remove this banner from Stats.** Streak is still visible via Home's StatCard and can be added to Stats' new second stat row (§5.1) as a plain `StatCard` if desired instead of a banner. **String removal flagged:** `"Current streak: {n} days"` text (with 🔥) and `"Keep showing up. Don't break the chain."` no longer render on this screen — flagged in §9 since if any test greps for "Current streak" it needs updating (none found in the read test files, but flagging per instructions).

**States:**
- **No tasks AND no goals (fresh install):** both the Trend and Goal Forecasts sections show their existing empty copy simultaneously; Overview stat rows still render but every value is `0` / `0%` — acceptable, matches existing behavior (no special "everything empty" full-screen state needed here since Home is the app's true first-run empty state; Stats naturally degrades to zeros, which is honest and fine per the "discipline" tone — a screen full of confident zeros is itself a kind of motivational honesty).
- **Populated:** as above.

**Interactions:** read-only screen, no new gestures. `ScrollView` unchanged.

**Accessibility:**
- `Lattice` art: `pointerEvents="none"` + accessibility-hidden, same convention as other screens.
- Forecast row's new thin progress bar: purely decorative reinforcement of the `pct` text already present — mark the bar `accessibilityElementsHidden` so screen readers read the existing text value once, not the bar redundantly.
- Second stat row (§5.1 additions): each new `StatCard` needs an `accessibilityLabel` combining value+label (e.g. `"Longest streak, 18 days"`) since mono-styled numbers can read ambiguously to screen readers depending on VoiceOver/TalkBack number handling — flag to frontend-dev to set `accessibilityLabel={`${label}, ${value}`}` explicitly on `StatCard` rather than relying on the two child `Text` nodes concatenating sensibly.

---

### 4.4 Settings — `src/screens/SettingsScreen.js`

**Purpose:** Reminder toggle/time, reset. Tab `settings`, index 04. Deliberately the quietest, least-art screen — settings should feel utilitarian, not decorative (a "no art" screen also gives the other three motifs more distinctiveness by contrast).

**Art motif — none, or minimal.** Per brief's "subtle... never fighting content" and "stay disciplined": Settings gets **no SVG art**. This is itself a considered choice — Hermes-style editorial systems often have one "quiet" utility page. If a mark is wanted for shell consistency, the only concession is a **single 1px horizontal hairline** at the very top of the content (already implied by cards) — not a bespoke art component. **Flag for user approval as part of §11:** confirm it's fine for Settings to be the one art-free screen, or request a minimal shared motif (e.g. a tiny corner tick) be added — my recommendation is to leave it bare.

**Layout, top to bottom:**

1. **Masthead:** `> SETTINGS` mono kicker, `font.h1` **"Settings"** (unchanged word). Sub-line unchanged copy `"Reminders keep your streak alive."`, restyled.

2. **#1 REMINDERS** (`SectionHeader index=1 label="REMINDERS"`, no title):
   - `Card` (outlined) containing:
     - Row: label `"Daily reminder"` (`font.body`, `weight.semibold`, textPrimary) + hint `"A nudge to check in every day"` (`font.small`, textSecondary) on the left; `Switch` on the right. Switch colors: `trackColor={{ false: colors.gray200, true: colors.white }}`, `thumbColor={colors.black}` (on black-track-off, a black thumb needs a visible edge — RN switches typically render a subtle shadow/ring by default on iOS; on Android, verify thumb visibility against `gray200` track, **flag to frontend-dev** same as GoalCard's switch in §3.7).
     - Hairline divider (`border.hairline`, `colors.border`) — replaces the old `secondary + '55'` alpha border.
     - Time row: label `"Reminder time"` left, time value right in **mono** (`font.monoSmall`, textPrimary — was accent-colored, now just white/mono to signal "this is data"), opacity 0.4 applied to the whole row when disabled (unchanged behavior).
     - `DateTimePicker` usage unchanged (`themeVariant="dark"` already correct).

3. **#2 DATA** (`SectionHeader index=2 label="DATA"`, no title):
   - Reset button: **outlined, not filled**, `border.thin`, `colors.borderStrong` border (slightly more visible than a default card border to signal "this one's different," without using red/color) + `!` mono glyph prefix per §1.6's danger convention: `"! Reset all data"` — wait, this changes the literal string. **Decision:** keep the string `"Reset all data"` unchanged (no `!` prefix baked into the text node), and instead render a separate small `Text` glyph (`"!"`) as a sibling element before the label with its own style, OR apply the emphasis purely via `weight.bold` + `borderStrong` without any glyph at all. **Going with: no glyph, just bold text + emphasized border** — simplest, zero string risk, still reads as "the serious one" by weight/border alone. Confirmed **no string change** here.
   - Alert dialog (`Alert.alert`) copy **entirely unchanged** — native alerts aren't themeable via our token system anyway (OS-rendered), so `"Reset all data?"` / `"This permanently clears habits, goals and history."` / `"Cancel"` / `"Reset"` stay exactly as-is.

4. **Footer:** unchanged string `"Lukes Tracker · all data stays on your device"`, restyled `font.tiny`, mono (this is the one footer/system-caption line — appropriate for mono treatment as a "build info" style line), `textDisabled` (gray400 — intentionally the dimmest text in the app, appropriate for a footer nobody needs to read twice), centered.

**States:** Settings has no meaningful empty/loading/error states beyond what's already handled (permission-denied path already shows a native `Alert` — unchanged). This is the simplest screen in the redesign.

**Interactions:** unchanged — toggle, time picker, reset confirm flow.

**Accessibility:**
- Switch already accessible via RN defaults; no change needed beyond color tokens.
- Reset button: consider `accessibilityHint="Permanently deletes all habits, goals, and history"` — not present today, flagged as nice-to-have, matches the "destructive action" a11y best practice.

---

## 5. PROPOSED additions (Stats screen richer displays)

All of the below are marked **PROPOSED** — user should approve/veto individually. Each is grounded in data already in `state` (tasks, completions, goals) or trivially derivable; I've flagged the one new helper needed for `backend-dev`.

### 5.1 Second stat row on Stats — "Longest streak", "Week-over-week delta", "Goal velocity"
- **Longest streak (ever):** the historical max of the same "consecutive days with ≥1 completion" logic `currentStreak()` already uses, but scanning the *entire* completions history rather than stopping at the first gap from today. **Requires a new derived helper** — `AppContext` currently only exposes `currentStreak()` (current, ending today). Propose adding `longestStreak()` to `AppContext.js`: walk all days from the earliest completion date (or task creation date) to today, track the longest run of consecutive days with `completions[day].length > 0`. **Flag for backend-dev**: pure function, no new stored fields, can live in `AppContext` alongside `currentStreak` or as a new `src/utils/streaks.js` pure helper taking `(completions, tasks)` — recommend the latter for testability (mirrors how `predict.js`/`milestones.js` are already pure + unit-tested).
- **Week-over-week delta:** compare `dayScore` average over the last 7 days vs the previous 7 days (days 8-14 back), rendered as `+12%` / `-4%` / `±0%` (mono, no color — a leading `+`/`-` glyph is the only signal, per §1.6's "no color for status" rule extended to deltas). **Fully derivable in `StatsScreen.js` itself** from the existing `dayScore` function and `lastNDays` util — no new AppContext helper needed, just local computation (`lastNDays(14)` already fetched, split into two halves).
- **Goal velocity:** for goals with a deadline, the average of `p.ratePerDay` (already returned by `predictGoal`) across all goals with `daysLeft !== null`, expressed as "avg X%/week toward active goals" or simplest: count of goals currently `status === 'ontrack'` vs total goals with deadlines, e.g. `"2/3 goals on track"`. **Decision — go with the simpler on-track ratio**, not a blended rate-per-day (which would mix incompatible units like books/day + km/day into a meaningless average). **Fully derivable** in `StatsScreen.js` from `state.goals.map(predictGoal)` — no new helper needed.
- Average-line overlay on the `BarChart` (mentioned in §3.6): derived from the same `chartData` already computed in `StatsScreen.js` (`avg` value already exists in the current code) — no new data needed, just pass it through to `BarChart` as a new optional prop `averageValue`.

### 5.2 New section — "#3 Weekday heat" (completion rate by day of week)
- For each weekday (Sun-Sat), average `dayScore` across all historical days that fall on that weekday (or the last N weeks, to keep it recent-weighted — **decision: use the same rolling window as the activity grid, i.e., all days present in `state.completions` capped to a reasonable lookback like 90 days**, to avoid a single early outlier day skewing the average forever).
- Display: 7 vertical mono-labeled bars similar to `BarChart` but only 7 data points, OR a simple horizontal ledger:
  ```
  MON  ████████░░  82%
  TUE  ██████░░░░  61%
  WED  █████████░  90%
  ...
  ```
  **Decision:** horizontal ledger rows (not another bar chart) for visual variety against the Trend section directly above it, using thin horizontal fill bars (`height: 6`, same track/fill treatment as other progress bars) with the day label (mono, 3-letter) on the left and mono percentage on the right.
- **Requires a new derived helper.** Propose `weekdayHeat(state, windowDays = 90)` in a new pure util `src/utils/heat.js`: takes `tasks`/`completions`, returns `[{ weekday: 0-6, label, avgScore }]` for the last `windowDays` days. **Flag for backend-dev**: pure function, same shape/testing pattern as `predictGoal`/`getMilestoneStatus`, no new storage fields required (derives entirely from existing `completions` + `tasks`).

### 5.3 Goal velocity sparkline (per-goal, optional micro-viz)
- A tiny inline sparkline next to each goal's forecast row on Stats, showing the trajectory of `current` over time. **Problem: the data model doesn't currently store a history of `current` over time** — only the latest `current` value is persisted (`updateGoalProgress` overwrites it). A true sparkline would need either (a) a new `progressHistory: [{date, value}]` array persisted per goal, or (b) reconstructing an approximation from `createdAt` → `current` as a straight line (not a real sparkline, just a projection line — which is arguably what the existing prediction text already communicates in words).
- **Decision: DO NOT implement true sparklines in this pass.** It requires a new persisted field (`goal.progressHistory`) and a migration path in `storage.js`'s backfill logic, which is a real data-model change, not just presentation — bigger than this redesign's stated scope ("data layer unchanged... flag if any addition needs a new derived-value helper"). This crosses from "derived helper" into "new stored field," which the brief asks me to flag rather than assume. **Flagging as a possible FUTURE proposal, not part of this redesign's approved scope** — recommend the user explicitly decide whether to greenlight a `progressHistory` field in a separate pass. Not included in §11's approval list as an active proposal; mentioned here for completeness only.

---

## 6. Milestone celebration — full redesign (replacing the small banner)

**Current state:** a small inline banner inside `GoalCard` — orange-tinted background, checkmark, one line of text, ✕ to dismiss, 6s auto-dismiss timer (unless screen reader active).

**Problem with keeping it as-is:** the brief explicitly asks for "more presence... no confetti kitsch, think typographic/geometric," and a small inline banner can't carry that weight while everything else on the card is now quiet hairlines and mono numbers.

**Proposal: the celebration becomes a distinct, larger in-card moment — not a full-screen takeover (that would break the "one clear action, no modal interruptions" discipline and complicate the auto-dismiss/screen-reader logic that already works), but a **structurally different block** that temporarily replaces the card's normal milestone-row + prediction-row region with something bigger:

```
┌ GoalCard (celebration state) ───────────────┐
│ Read 24 books                            ✕   │
│ 25 / 100 books                    12d left   │
│ ▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│                                                │
│ ┌ filled gray100 panel ─────────────────────┐│  ← THE moment: filled surface (the one
│ │                                            ││    deliberate exception to "no fills"
│ │        25%                                ││    from §1.5), full-bleed within the card
│ │        ─────                              ││
│ │        QUARTER WAY                        ││  ← font.display-scale number (but sized
│ │                                            ││    down to fit the card, ~44-56px per
│ │        Read 24 books                      ││    goal.target size — see sizing note),
│ │                                            ││    huge, mono, white, then a short
│ │                                    ✕       ││    horizontal hairline rule, then an
│ └────────────────────────────────────────────┘│  uppercase tracked label ("QUARTER WAY" /
│                                                │  "HALFWAY" / "ALMOST THERE" / "COMPLETE"),
│ > At this pace, done in ~40 days              │  then the goal title in body-sans.
└──────────────────────────────────────────────┘
```

**Specifics:**
- Panel background: `colors.gray100` (the one filled-surface exception, per §1.5) — gives it real visual separation from the hairline world around it without introducing color.
- The **percent number** (`25`/`50`/`75`/`100` + `%`) renders in `fontFamily.mono`, sized responsively but targeting ~48px/weight 800 — bigger than any other number in the app except the Home hero message, making this genuinely feel like a peak moment.
- A short horizontal rule (1px, `colors.borderStrong`, ~40px wide, centered) sits between the number and the label — a small geometric divider, satisfying "typographic/geometric" without literal icons.
- Label text swaps per threshold, reusing **existing copy semantics** but restructured for the bigger layout — **string decision:** the existing `CELEBRATION_COPY` produces one combined sentence (`"Quarter way — 25% of Read 24 books"`). The new layout **splits this into three visual pieces** (big number "25%", uppercase label "QUARTER WAY", goal title "Read 24 books") rather than one sentence — this necessarily changes the literal single-string output. **This breaks the exact-string test assertions** in `GoalCard.test.js` (`findByText('Quarter way — 25% of Read 24 books')` etc.) since that exact concatenated sentence no longer exists as one text node. **This is the most significant string/structure change in the whole spec — flagged prominently in §9**, and I recommend the tester update these three assertions to instead check for the presence of the three separate pieces (e.g. `getByText('25%')`, `getByText('QUARTER WAY')`, `getByText('Read 24 books')` within the celebration panel) once this ships. Percent-to-label mapping stays the same *meaning*, just re-cased/restructured:
  | Percent | New uppercase label |
  |---|---|
  | 25 | `QUARTER WAY` |
  | 50 | `HALFWAY` |
  | 75 | `ALMOST THERE` |
  | 100 | `GOAL COMPLETE` |
- At 100%, the panel gets one extra touch: the percent number `100%` is replaced by a **filled white square** (~16×16, echoing the checked-checkbox convention) positioned where the number was, sized into the layout — no, on reflection this adds inconsistency; **simpler decision: at 100%, keep the same number treatment (`100%`) for layout consistency across all four states** — the "complete" feeling comes from the label text `GOAL COMPLETE` and, as a bonus, the goal's progress bar above the panel is now full-white too, which already reads as completion. Keep it visually consistent rather than inventing a one-off shape.
- Dismiss ✕: moves to the bottom-right of the panel (still `hitSlop={12}`, still `accessibilityLabel="Dismiss milestone celebration"` — **string/label unchanged**, only position changes), same tap target size as before.
- **Auto-dismiss timer (6s) and screen-reader-detection gating: entirely unchanged** — this is interaction logic, not presentation, and the existing implementation (already accessibility-conscious) is preserved as-is. `accessibilityRole="alert"` on the panel — unchanged.
- **Animation:** on entering the celebration state, the panel does a quick opacity+scale-in (`Animated`, ~200ms, `useNativeDriver: true`, scale from 0.96→1, opacity 0→1) — a small moment of delight without confetti. No animation library beyond RN's built-in `Animated` needed (no new dependency).
- **Sizing note:** since this panel lives inside the existing card width, the 48px number must be tested against narrow devices (iPhone SE-class ~375px width, card padding eats ~32px, leaving ~300px — a 48px mono numeral for "100%" (4 characters) at typical Menlo metrics is comfortably under 300px, no wrapping risk, but flag to frontend-dev to verify on the smallest supported width).

This satisfies "more presence" (bigger type, filled panel, dedicated geometry) and "typographic/geometric, no confetti kitsch" directly.

---

## 7. Shared empty-state pattern

Every screen's primary empty state (Home's habit list, Goals' goal list; Stats and Settings degrade to zeros/defaults rather than needing dedicated empty states per §4.3/§4.4) follows the same structural pattern for consistency:

```
        [ small centered/left-aligned monochrome SVG mark, ~80-120px ]

        No {things} yet                    ← font.h2, textPrimary

        {One or two sentences of encouraging,  ← font.small, textSecondary,
         concrete guidance — never guilt-        max ~2 lines, left-aligned
         tripping, always suggests the next
         concrete step}

        [ existing input/CTA below, unchanged position/behavior ]
```

- Art per empty state reuses that screen's existing motif at reduced complexity/count (Home: none dedicated — checkbox-outline glyph instead, since `RadiatingLines` is a header decoration not a centerpiece mark; Goals: reduced 3-ring `Orbits`) rather than inventing a third art system — keeps the art vocabulary disciplined (3 motifs total: rays, orbits, lattice — Settings deliberately opts out).
- Tone: encouraging, never nagging — matches existing `messages.js` philosophy. No new dependency on `messages.js` needed for empty states (their copy is static, not score-driven).
- **"Primary action" button convention** referenced in §4.2: any full-width, single primary action button in the app (Goals' "+ New goal" trigger, GoalsScreen's "Create goal" submit) uses the same visual language — `border.thick` outline at rest, inverts to filled-white/black-text on press, OR (for the truly primary "Create goal" submit specifically, since it's the terminal action of a form rather than a toggle-open trigger) is filled-white at rest with black bold text, no outline-first state. This two-tier distinction (outline-that-inverts vs always-filled) signals "opens something" vs "commits something" — a small but deliberate affordance difference.

---

## 8. Art system summary (`src/components/art/`)

New folder, 3 components + shared conventions:

| File | Screen | Motif | ViewBox | Element count | Stroke width | Opacity range |
|---|---|---|---|---|---|---|
| `RadiatingLines.js` | Home | Radiating burst, cropped top-right | `0 0 200 200` | 14 `Line`s | 1 | 0.08–0.5 |
| `Orbits.js` | Goals | Concentric circles + center dot | `0 0 240 240` (header) / smaller for empty state | 5 `Circle` (+1 filled dot) | 1 (0 for filled dot) | 0.13–0.45 (+0.8 dot) |
| `Lattice.js` | Stats | Irregular grid + data-point dots | `0 0 240 160` | ~15 `Line` + 3-4 `Circle` | 0.75 (lines) | container 0.15, dots 0.6 |

Shared conventions across all three:
- All components accept no required props (self-contained, deterministic — no randomness at runtime, so snapshot tests stay stable if ever added) but accept optional `style` for positioning override.
- All render via `react-native-svg`'s `Svg`, `Line`, `Circle` (no `Path`/`Rect`/`G` needed given the three motifs chosen — simpler is better; if frontend-dev finds `G` useful for grouping transforms, that's an implementation detail, not a design requirement).
- All wrapped in a `View` with `pointerEvents="none"`, `accessibilityElementsHidden`, `importantForAccessibility="no-hide-descendants"`.
- All use `colors.art` (`gray400`) as the base stroke, modulating only `opacity`, never a different hex — keeps the whole art system visually unified as "one gray, many opacities."
- Absolute positioning, always `zIndex: -1` or rendered before content in JSX with content given an explicit background/z so text never sits under a stroke by accident (text areas are opaque enough — pure black bg + white text over a 0.1-0.5 opacity gray4 line is always legible; no z-index fighting expected, but noted for frontend-dev).

Settings intentionally has no `art/` file — confirmed absence, not an oversight.

---

## 9. Consolidated list of string/copy changes (for the tester)

**No change (explicitly confirmed, listed for completeness since they're adjacent to lots of restyling):**
- Tab labels: `"Home"`, `"Goals"`, `"Stats"`, `"Settings"` — restyled via `textTransform`, DOM/query text unchanged.
- `"Quarter way — 25% of {title}"` style banner sentence — **superseded**, see below (this whole banner is restructured, not just restyled).
- `GoalCard` milestone row: `"Next milestone: {n}% · {remaining} {unit} to go"` and `"Goal complete — every milestone hit"` — unchanged, restyled only.
- `"No goals yet — create one to see a prediction."` (Stats empty forecast) — unchanged.
- `"Add daily habits to start charting your activity."` (Stats empty chart) — unchanged.
- `"Long-press a habit to delete it."` — unchanged.
- `"Notify on milestones"` / `"Turn on Daily reminder in Settings to receive this"` — unchanged.
- `"Reset all data"` button + native `Alert` copy (`"Reset all data?"` etc.) — unchanged.
- Footer `"Lukes Tracker · all data stays on your device"` — unchanged.
- `"Deadline: {date}"` / `"Pick a deadline (optional)"` — unchanged.
- `"+ New goal"` — unchanged.
- Accessibility label `"Dismiss milestone celebration"` — unchanged.

**Changed — flagged for deliberate test updates:**
1. **Milestone celebration banner → panel (§6):** the single sentence `"Quarter way — 25% of Read 24 books"` (and its 50/75/100 siblings) is **replaced by three separate text nodes**: big number (`"25%"`), uppercase label (`"QUARTER WAY"` / `"HALFWAY"` / `"ALMOST THERE"` / `"GOAL COMPLETE"`), and the goal title (`"Read 24 books"`, unchanged, already rendered elsewhere on the card too). Any test doing `findByText('Quarter way — 25% of Read 24 books')` **will fail** and needs rewriting to assert on the split pieces. This affects `src/components/__tests__/GoalCard.test.js` (3 occurrences: lines 97, 107 [negative assertion], 115, plus the "Halfway" reference implied by the copy table, and the queryByText(/Quarter way/) check at line 107).
2. **Home StatCard streak value:** `` `🔥 ${streak}` `` → `` `${streak}` `` (emoji dropped, per §4.1 step 1). No current test asserts on this string, but flagged in case of future tests.
3. **Stats streak banner removed entirely (§4.3, step 6):** `"Current streak: {n} days"` (with 🔥 prefix) and `"Keep showing up. Don't break the chain."` no longer render anywhere. No current test found asserting on this, but flagged since it's a full removal.
4. **Home empty-habits copy:** `"No habits yet. Add your first one below — something you want to do every day."` → split into heading `"No habits yet"` + body `"Add something you want to do every day — reading, training, deep work. Small and repeatable beats big and occasional."` (§4.1 step 3). No current test found asserting on this exact sentence, but flagged.
5. **Goals empty-state copy:** original combined sentence → split heading `"No goals yet"` + body `"Create your first goal — a number, a unit, and optionally a deadline. Read 24 books. Run 100 km. Save $5,000."` (§4.2 step 3). No current test found asserting on this exact sentence, but flagged.

**Structurally unchanged, semantically preserved (predict.js / milestones.js output strings are NOT touched by this redesign at all):** `predictGoal`'s `label` field (e.g. `"On track — projected 105 books by deadline"`, `"Goal reached 🎉"`, `"Need ~X to finish in time"` etc.) renders verbatim, just restyled/prefixed with a `>` glyph as a separate sibling `Text`, not concatenated into the string itself — so any test matching on `predictGoal`'s exact label text via regex (e.g. partial matches like `/On track/`) continues to pass since the underlying string is untouched; only a new `> ` prompt character appears as an adjacent (not prepended-in-string) element. **Confirmed safe.**

---

## 10. Non-`src/` files that need touching (flagged, outside strict "presentation layer" but required for a consistent redesign)

- `app.json`: `backgroundColor` (root + `splash.backgroundColor` + `android.adaptiveIcon.backgroundColor`) currently `#253237` → should become `#000000` for a consistent native splash/boot screen. Not a code file this agent edits, but frontend-dev should update it alongside the theme change, otherwise the boot splash will flash the old dark-slate color before JS loads.
- `App.js`: tab bar + loading screen, per §2 — this is presentation code, in scope for frontend-dev, just noting it's root-level not `src/`.

---

## 11. Implementation order (suggested, for backend-dev / frontend-dev handoff)

Recommended sequencing to keep the app in a working, testable state throughout rather than one giant simultaneous rewrite:

1. **`src/theme.js` rewrite** (§1) — foundation everything else depends on. Verify existing components don't crash on the temporarily-mismatched imports (they'll look wrong but shouldn't error, since old semantic names `colors.secondary`/`colors.muted`/`colors.accent` should be kept as deprecated aliases *during the transition* if a fully atomic PR isn't feasible — frontend-dev's call).
2. **New shared components:** `Card`, `SectionHeader`, the three `src/components/art/*` files (§3.1, 3.2, §8) — additive, no existing screens touched yet.
3. **Backend-dev: land the two new pure helpers** (§5.1 `longestStreak`, §5.2 `weekdayHeat`) with unit tests mirroring `predict.test.js`/`milestones.test.js` conventions — these are pure, additive, and unblock Stats' new sections independent of UI work.
4. **Component-by-component restyle** (§3.3–3.7: `Checkbox`, `StatCard`, `ContributionGrid`, `BarChart`, `GoalCard`) — each can be restyled and verified against its own existing test (`GoalCard.test.js`, `ContributionGrid.tabswitch.test.js`) in isolation before screens change layout around them. **`GoalCard`'s celebration panel restructure (§6) should be its own sub-step** with the tester updating the 3 affected assertions in the same change.
5. **Screen layout rebuilds**, simplest-to-riskiest: **Settings** (§4.4, no art, smallest change) → **Home** (§4.1) → **Goals** (§4.2) → **Stats** (§4.3, largest — includes the two new proposed sections, only after step 3's helpers land).
6. **`App.js` tab bar + loading screen** (§2) — do this after all four screens are restyled so the shell matches the content it wraps; run the `ContributionGrid.tabswitch.test.js` regression test explicitly at this step since it renders the full `App`.
7. **`app.json` boot color update** (§10) — low-risk, do anytime, but bundle it with step 6 so a full "cold boot" visual pass happens together.
8. Full test suite run + manual pass on both a small device width (iPhone SE class) and a large one (per §6's sizing note and §3.4's stat-card border-collapse note).

---

## Summary of key decisions

- **Full grayscale token system** replacing the orange-accented palette: 9 named gray steps (`black` → `white`), semantic aliases (`background`, `border`, `textPrimary`, etc.), `colors.accent` removed entirely.
- **Typography:** huge tight-tracked (-0.5) display/h1 headings (40/34pt, weight 800) for hero moments; small wide-tracked (+1.5) uppercase mono captions for numbered section labels; a defined, disciplined list of exactly which elements get `Menlo`/`monospace` (stats, percentages, dates, counts) vs system sans (everything else).
- **Cards become hairline-outlined blocks on black** (1px border, 2px radius), not filled surfaces — the one exception is the milestone celebration panel, which deliberately gets a filled `gray100` surface for weight/contrast.
- **Status (on-track/behind/overdue) expressed via weight + glyph (`!`, bold) instead of color** — red is gone, nothing loses legibility.
- **Tab bar redesigned:** text+number pairs with a white underline for the active tab, no icon glyphs, tab label strings unchanged (`"Home"`/`"Goals"`/`"Stats"`/`"Settings"`) so the tab-switch test keeps working.
- **Three new SVG art motifs** (`RadiatingLines` for Home, `Orbits` for Goals, `Lattice` for Stats), each precisely specified (viewBox, element counts, stroke widths, opacity formulas); Settings deliberately has no art.
- **Milestone celebration is fully redesigned** from a small banner into a filled-panel, huge-mono-number, geometric moment inside the goal card — this is the one part of the spec that changes rendered text structurally (splits one sentence into three text nodes), flagged prominently for test updates.
- **All functional behavior, gating logic, testIDs, and data flow preserved** — this is presentation-only; two new pure derived-value helpers proposed (`longestStreak`, `weekdayHeat`) for backend-dev, no new persisted fields required for anything in the approved scope.

## Proposed additions requiring explicit user approval (veto individually)

1. **Second Stats stat row:** Longest streak (ever), Week-over-week delta, Goal-on-track ratio (§5.1).
2. **Average-line overlay on the 14-day BarChart**, via an SVG dashed line (§3.6, §5.1).
3. **New "#3 Weekday heat" section on Stats** showing completion rate by day-of-week as a horizontal ledger (§5.2) — requires new `weekdayHeat` helper.
4. **Thin progress bar added to each goal's forecast row on Stats** (§4.3 step 5) — visual only, no new data.
5. **Redesigned milestone celebration panel** replacing the small banner (§6) — bigger, filled, typographic/geometric moment; note this is the change most likely to need test rewrites.
6. **Dedicated empty states with art** for Home's habit list and the Goals list (§4.1 step 3, §4.2 step 3, §7).
7. **Home's "all tasks done today" StatCard border emphasis** micro-interaction (§4.1 states) — small polish, easy to skip.
8. **Weekday row labels on the Home activity grid** (§3.5) — minor, easy to skip.
9. **Goal-progress sparklines** — explicitly NOT proposed for this pass since it requires a new persisted `progressHistory` field (§5.3); flagged only as a possible future item, not part of this approval list.
10. **Settings screen stays deliberately art-free** — not an "addition" but a scope decision worth explicit sign-off since every other screen gets a motif.

Everything else in this document (theme tokens, component restyles, screen layouts/numbering, tab bar, art motifs for Home/Goals/Stats, string-preservation decisions) is the core redesign itself, not optional — but naturally still open to your feedback before any code is written.
