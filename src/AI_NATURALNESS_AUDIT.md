# AI Naturalness Audit

## Purpose
Identify visible features, copy, content, and implementation artifacts that may make Generation LightMode feel machine-generated rather than intentionally designed. This is an audit only; no product behavior is changed by this document.

## Explicit AI Features — Keep Transparently Labeled

| Feature | Location | What users see | Recommendation |
|---|---|---|---|
| LightMode Assistant | Assistant page, desktop and mobile | “AI guide to the movement,” generated chat replies, suggestion prompts | Keep the AI label. This is a real AI feature and should not be disguised. Add clear limitations and a human support route later. |
| Assistant training | Admin Center → Assistant Training | Admin-managed approved questions and answers | Keep. Rename internal terms such as “knowledge runtime” only if they ever become user-visible. |
| AI content suggestions | Feed | Suggested content ideas | Keep AI attribution close to generated suggestions so users know what is generated. |
| Story idea generator | Story creation flow | Generated story prompts or ideas | Keep AI attribution and make suggestions editable before publishing. |

## Visible Development Artifacts — Highest Priority

| Finding | Location | Why it feels unfinished or AI-generated | Recommended action |
|---|---|---|---|
| Sample content is live | All Things New | “Welcome to Content Hub (Sample)” explicitly says it is safe to delete | Remove before public launch. |
| Unclear item title | All Things New | A live video is titled “01” with no description or thumbnail | Replace with an approved title, description, and thumbnail. |
| Placeholder vision video | Home, desktop and mobile | The embedded YouTube ID is the well-known placeholder `dQw4w9WgXcQ` | Replace with the approved vision video or remove the play action until ready. |
| “Coming soon” action presented as working | Home vision section and mobile media library | Users can press an action that only reports that content is being produced | Hide unavailable actions or label them as upcoming before interaction. |
| Third-party viewer chrome | All Things New preview | Google Drive controls and branding appear inside the app | Use a first-party media viewer where file type and permissions allow it. |

## Visual Patterns That Can Feel Template-Generated

| Pattern | Main locations | Recommendation |
|---|---|---|
| Repeated cyan–violet gradients | Home, About, Impact, Resources, Assistant, All Things New | Keep the brand gradient for primary moments, but use solid brand colors for secondary headings and controls. |
| Repeated glowing pills and circular badges | Public page heroes, filters, status labels, CTAs | Reduce decorative badges to one meaningful eyebrow per section. |
| Heavy emoji use | Resource cards, share menus, empty states, labels | Replace functional emojis with the existing consistent icon set; reserve emojis for community voice and messages. |
| Similar card grids on every section | Home, About, Impact, Resources, All Things New | Vary information hierarchy based on content instead of repeating identical card structures. |
| Repeated lightning/sparkle language | Public pages and All Things New | Keep the lightning mark as a brand signature, but remove it from routine confirmations and utility text. |
| Generic promotional phrases | Resources and several public CTAs | Replace phrases such as “premium home,” “crafted to inspire,” and “spread the light” with specific user outcomes. |

## Content and Trust Signals

| Finding | Location | Recommendation |
|---|---|---|
| “Live” claims depend on actual data | Impact page | Keep only where the values are truly loaded from the public community snapshot; add “updated” timing if trust becomes important. |
| Generated-image filenames are exposed in source and network requests | Home hero and CTA imagery | Users normally do not see filenames, but rename approved assets to campaign-oriented names when the media library is cleaned. |
| Duplicate desktop/mobile implementations | Home, About, Impact, Assistant, Resources | Consolidate shared content and copy over time so mobile and desktop do not drift or contradict one another. |
| Auto-generated content needs human approval | Admin content scheduling and assistant training | Continue requiring editable metadata and admin review before publishing. |

## Not an AI Indicator

- The animated Generation LightMode logo shown during reload is the branded loading screen while authentication and public app settings are checked. It is not an AI-generation indicator.
- Scheduled content unlocking, engagement counts, filters, downloads, and Google Drive integration are standard application features.
- The dark branded header and page transitions do not disclose or imply AI development.

## Recommended Order

1. Remove sample All Things New records and correct the “01” item metadata.
2. Replace or hide the placeholder vision video.
3. Replace Drive viewer chrome with a first-party viewer where technically possible.
4. Reduce repetitive gradients, emojis, badges, and generic promotional wording.
5. Consolidate duplicated desktop/mobile content to prevent inconsistencies.
6. Keep genuine AI features clearly and honestly labeled.