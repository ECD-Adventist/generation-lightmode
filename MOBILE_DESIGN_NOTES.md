# Mobile app design notes — LightMode feed (dark navy + gold)

Scope: the mobile-only shell of the Feed (`src/components/feed/MobileFeed.jsx`,
`MobileDropCard.jsx`, `MobileDropCardSkeleton.jsx`) plus the shared mobile chrome
(`src/components/mobile/MobileBottomNav.jsx`, `PullToRefreshIndicator.jsx`) and the
floating `ReportProblemButton`. Desktop layout and all data/mutation code are untouched.

## Reference: patterns taken from Mobbin

Mobbin's screen library needs a login, so the public pattern guides were used
(mobbin.com/glossary). What was applied:

| Mobbin guidance | Where it landed |
| --- | --- |
| Tab bars: 5 items max, icon + label, **floating tab bar** trend, **protruded centre key action** | `MobileBottomNav` — floating glass pill, 5 tabs, gold protruding "Drop" button, gold active indicator |
| Cards: image-filled containers, large thumbnails outperform small ones, avoid repeating CTA buttons inside every card | `MobileDropCard` — 4:5 media, author row above media, single action capsule, Follow only when relevant |
| Chips: filled chips, selected state uses the app accent, **leading icons help users scan a row of chips** | Feed filter row — filled chips with icons, gold selected chip, sticky under the top bar |
| Bottom sheets / share sheets for contextual actions | Already present via `FeedActionCapsule` + share flow; kept |
| Launch screen: instant, replaced quickly by first screen | `index.html` static logo splash → `SplashScreen.jsx` |
| Skeleton screens for loading states | `MobileDropCardSkeleton` — matches the card footprint on the dark canvas |

## Design tokens (mobile shell)

| Token | Value | Use |
| --- | --- | --- |
| canvas | `#0B0F1A` | page background, tab bar ring |
| surface | `#121A2B` | cards, compose prompt, unselected chips |
| surface-2 | `#18223A` | skeleton shimmer, avatar wells |
| line | `rgba(255,255,255,0.08)` | hairline borders |
| text | `#F4F7FB` | primary text |
| muted | `#8A9BB0` | secondary text, inactive tabs |
| gold | `#FFD000` → `#FF9F1A` | the single accent: selected chip, active tab, primary buttons, leader ring |
| cyan / violet | `#00CFFF` / `#8A5CFF` | hashtags, non-leader avatar ring |

Type: Space Grotesk for headings and verse text, Inter for everything else.
Radii: 22px cards, full pills for chips, buttons and the tab bar.
Tap targets: 40–44pt minimum on every icon button.

## Interaction details

- Double-tap on a post's media likes it and shows a gold heart burst (single tap opens the post).
- Pull-to-refresh shows a gold lightning bolt that fills as you pull and spins while refreshing.
- The greeting hero adapts to the time of day and shows the first name; guests see a sign-in compose prompt.
- Empty and error states are cards with one primary action, not bare text.

## Local testing notes

- `npm run dev` needs `VITE_BASE44_APP_ID` and `VITE_BASE44_APP_BASE_URL=https://lightmode.ecd.adventist.org`
  so `/api` is proxied to the live backend; the Feed is guest-viewable.
- iOS Safari applies the page's `upgrade-insecure-requests` CSP directive to `127.0.0.1`, so a plain
  `http://` local server will fail to load its own assets in the Simulator. Strip that directive in the
  local test server only (production over HTTPS is unaffected).
