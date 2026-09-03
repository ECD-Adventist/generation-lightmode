# Mobile app design notes — LightMode feed (light canvas + gold)

Scope: the mobile-only shell of the Feed (`src/components/feed/MobileFeed.jsx`,
`MobileDropCard.jsx`, `MobileDropCardSkeleton.jsx`) plus the shared mobile chrome
(`src/components/mobile/MobileBottomNav.jsx`, `PullToRefreshIndicator.jsx`) and the
floating `ReportProblemButton`. Desktop layout and all data/mutation code are untouched.

## Reference: patterns taken from Mobbin

Two sources: the public pattern guides (mobbin.com/glossary) and the **Latest iOS apps**
view at mobbin.com/discover/apps/ios/latest (read through the signed-in Chrome window;
free plan shows the four newest apps: Depop, Tubi, Apple Watch, Zip, plus Instacart,
Genie, Etsy, Hulu in the header row).

What the latest iOS apps have in common, and where it landed:

| Seen on Mobbin (Latest iOS) | Where it landed |
| --- | --- |
| Depop / Zip: greeting ("Hey Sam!", "Hi there,") with a one-line prompt under it | Hero greeting + "Your light is needed today." |
| Zip: row of round brand icons with labels under the hero ("Shop top brands") | Quick-actions row: Daily Drops, Prayer Wall, Live, Challenges |
| Tubi: horizontal "Recommended" rail with section heading and chevron | Trending vibes rail (ranked hashtag chips with counts, "See all") |
| Tubi: content chips at the top, one saturated accent | Sticky filter chips, gold accent |
| Apple Watch: floating segmented bottom bar | Floating glass tab bar |
| Depop / Zip: 5-item tab bar with a centre create action | Tab bar with protruded gold Drop button |
| Instagram-style "Suggested for you" cards injected in-feed | People to connect rail after the second post |

Glossary guidance that was applied:

| Mobbin guidance | Where it landed |
| --- | --- |
| Tab bars: 5 items max, icon + label, **floating tab bar** trend, **protruded centre key action** | `MobileBottomNav` — floating glass pill, 5 tabs, gold protruding "Drop" button, gold active indicator |
| Cards: image-filled containers, large thumbnails outperform small ones, avoid repeating CTA buttons inside every card | `MobileDropCard` — 4:5 media, author row above media, single action capsule, Follow only when relevant |
| Chips: filled chips, selected state uses the app accent, **leading icons help users scan a row of chips** | Feed filter row — filled chips with icons, gold selected chip, sticky under the top bar |
| Bottom sheets / share sheets for contextual actions | Already present via `FeedActionCapsule` + share flow; kept |
| Launch screen: instant, replaced quickly by first screen | `index.html` static logo splash → `SplashScreen.jsx` |
| Skeleton screens for loading states | `MobileDropCardSkeleton` — matches the card footprint |

## Theme rule

The **app stays light** ("LightMode" is the product idea); the marketing **website may use the dark**
navy theme. The mobile shell therefore uses a light canvas with white cards and gold as the single
key-action colour; royal blue carries links, hashtags and the active tab. The launch splash stays
dark navy because it is brand, not content.

Blue is the second brand colour and carries the chrome: the top bar and the hero band (the Home
hero artwork sits behind the greeting under a royal-blue wash), the floating tab bar, section
headings, unselected chips and links. The top-right actions are Search, Dashboard and Notifications.

The stories row has no "Statuses" heading — the rings speak for themselves and the vertical space
is kept for content.

## Design tokens (mobile shell)

| Token | Value | Use |
| --- | --- | --- |
| canvas | `#F6F8FC` | page background |
| surface | `#FFFFFF` | cards, compose prompt, unselected chips, tab bar |
| surface-2 | `#EEF3FF` | avatar wells, secondary chips |
| line | `#E2EAF5` | hairline borders |
| text / ink | `#0B1B3D` | primary text, text on gold |
| muted | `#6B7FA0` | secondary text, inactive tabs |
| gold | `#FFD000` → `#FF9F1A` | the key action: selected chip, Drop button, primary buttons, leader ring, tab indicator |
| gold-deep | `#B88A00` | gold as text or icon on white |
| blue | `#0B3FD9` / `#0A2E9F` | top bar, hero wash, tab bar, headings, unselected chips, links, hashtags, verse text |

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
