# Servis Yakro — Design System

**Servis Yakro** is a services marketplace for Côte d'Ivoire, built around Yamoussoukro ("Yakro"). Citizens describe a need — a leaking pipe, a braider, a driver, a mason — and the platform connects them to nearby, phone-verified **prestataires**. It ships as one responsive web application used on desktop and on Android phones (the dominant device in the market), so every component here is designed for both a 1440px browser and a 360–412px Android viewport.

**Positioning:** local, warm, and trustworthy — the opposite of the cool blue/purple SaaS look every other marketplace on the web uses. The system is built on Ivorian earth colours, a warm neutral scale (never cold grey), one woven texture, and generous touch targets.

## Sources

No codebase, Figma file, deck, logo, brand fonts or icon set were provided. **Everything in this system was authored from scratch** from the brief: *"une application web qui permettra aux citoyens de chercher des prestataires pour répondre à leur besoin, utilisable sur desktop et Android — nom : Servis Yakro."*

Consequences to be aware of, and to correct when real assets exist:
- **No logo.** There is no mark anywhere in the system. The brand is set as a typographic wordmark (`servisyakro`, Bricolage Grotesque 800, lowercase). See the "Signature typographique" card.
- **Fonts are Google Fonts substitutes** (no brand fonts supplied): Bricolage Grotesque (display), Manrope (text), JetBrains Mono (references). Loaded from `fonts.googleapis.com` in `tokens/fonts.css`.
- **Icons are Lucide** from CDN (`unpkg.com/lucide@0.454.0`) — a substitution, flagged again in ICONOGRAPHY below.
- **No photography** is bundled. Screens use neutral placeholder blocks where product photography belongs.

---

## CONTENT FUNDAMENTALS

**Language.** French is the product language, the Ivorian register — plain, direct, no Parisian formality and no anglicisms (`demande`, not "request"; `prestataire`, not "provider"; `Rechercher`, not "Search"). Local nouns are kept: *commune*, *quartier*, *maquis*, *pagne*, *F CFA*.

**Person.** The product speaks to the citizen with **vous** and speaks about itself sparingly as **nous**. Never *tu*. Never a first-person singular voice.
- ✅ « Décrivez votre besoin, nous prévenons les prestataires disponibles. »
- ❌ « Je vais chercher pour toi les meilleurs professionnels ! »

**Casing.** Sentence case everywhere — buttons, labels, headings, tabs. **No ALL CAPS** except the 11px overline (`COMMENT ÇA MARCHE`). Accents are always typed, including on capitals (`À`, `É`).

**Buttons are verbs.** `Trouver un prestataire`, `Envoyer la demande`, `Contacter`, `Voir le profil`, `Annuler`. Never `OK`, `Soumettre`, or a bare noun.

**Length.** Headlines ≤ 6 words. Body sentences ≤ 20 words. Helper text is one line and answers "and then what?" — « Nous vous appelons uniquement pour cette demande. »

**Numbers & money.** CFA francs, space thousands separator, trailing `F`: `8 000 F`, `à partir de 12 000 F`. Phone numbers in pairs: `07 00 00 00 00`. Distance in km with one decimal: `2,3 km` (French decimal comma). Dates spelled out: `mardi 14 avril`.

**Trust language is factual, never boastful.** `Vérifié` (identity checked by phone), `128 avis`, `Depuis 2024`. Never `Le meilleur`, `#1`, `Premium`.

**Errors are a plain problem plus a plain fix**, no apology theatre: « Adresse email incomplète. » / « Aucun prestataire dans cette commune. Élargissez la zone ? » Never « Oups ! Quelque chose s'est mal passé. »

**Emoji: never.** Not in UI, not in copy, not in notifications. Status is carried by a coloured dot, a Badge or a Lucide glyph.

**Vibe:** a competent neighbour who knows every artisan in town. Confident, concrete, unhurried. It names places (`Kokrenou`, `Habitat`, `N'Zuessy`), not abstractions.

---

## VISUAL FOUNDATIONS

**Colour.** Two brand hues and one accent, over a warm neutral ramp.
- **Kola** (`#E25B1A`, `--brand`) — terracotta orange from Ivorian laterite earth and the kola nut. Primary CTAs, active tab rule, links, category icons. Roughly one Kola element per view.
- **Lagune** (`#1F7A57`, `--secondary`) — deep lagoon green. Confirmation, verified badges, ON switches. Green means "validated", not "primary".
- **Soleil** (`#F2B705`) — accent, and *only* rating stars plus rare highlights. Never a button, never text on white.
- **Argile** — warm neutrals, brown-leaning. `#FDFBF8` page, `#FFFFFF` card, `#1A1613` text. **Pure grey and cold grey are forbidden**; a #F5F5F5 in this product is a bug.
- Semantic: success `#1F7A57`, warning `#C87A00`, danger `#C0362C`, info `#1E6E8C`, each with a soft tint background.
- Never a multi-hue gradient. The only gradients allowed are the woven texture (below) and an ink scrim.

**Type.** Bricolage Grotesque for display and headings (700/800, tight −2 to −2.8% tracking, line-height 1.02–1.3); Manrope for everything read at length (15px base, 1.6 line-height); JetBrains Mono for request references, phone numbers and money in tables. Overlines are 11px, 700, +12% tracking, always Kola. Never mix a third family into a screen.

**Spacing & layout.** 4px base scale with 2 and 6 for micro-adjustments. Gutters 16px mobile / 32px desktop; content container 1200px, prose 720px. Header 72px, mobile bottom nav 64px, every field and touch target ≥ 44px. Desktop search results: 8-column list + 4-column sticky filter rail. Mobile: single column, filters in a bottom sheet. Fixed elements: desktop header (sticky, gains `--shadow-sm` on scroll), mobile bottom nav and, on a provider profile, a fixed bottom action bar with the primary CTA.

**Backgrounds.** Flat warm surfaces, no full-bleed hero photography by default. Sections alternate `--surface-page` and `--surface-sunken`. The one decorative device is the **woven texture** (`--weave`, `.sy-weave`): two 135°/45° repeating 2px diagonal rules at 6–7% opacity, a nod to loom-woven pagne — used behind the hero, empty states and CTA bands, always over `--kola-50` or `--argile-50`, never behind body text.

**Cards.** White, radius 16px, 1px `--border-subtle` hairline, `--shadow-sm`. Interactive cards lift `translateY(-2px)` to `--shadow-md` on hover and settle to `scale(.995)` on press. Never nest two shadowed cards. Media inside a card is flush to the edges (no inner margin), radius inherited by `overflow:hidden`.

**Borders & radii.** 1px hairlines at rest, 1.5px for inputs and the search pill so focus reads on a phone. Radii: 4 / 8 / 12 / 16 / 24 / pill. Buttons and chips are always pills; fields are 12px; sheets and dialogs 24px.

**Shadows.** Warm brown-tinted, low opacity, two layers (`0 2px 4px` + `0 8px 20px` at 5–7%). Never blue-black, never above 12% opacity. The one coloured shadow is `--shadow-brand` under the primary button. No inner shadows except a `--shadow-inset` top highlight on solid dark bars.

**Hover.** Solid buttons go one step darker (500→600). Outline buttons gain a Kola border, Kola text and a `--kola-50` fill. Ghost gets `--kola-50`. Cards lift. Icon buttons take a warm `--argile-50` wash. **Opacity is never used for hover.**

**Press.** `scale(.97)` for controls, `translateY(0) scale(.995)` for cards, plus one further colour step (600→700). 80ms.

**Focus.** 3px `rgba(226,91,26,.28)` ring plus a Kola border. Always visible — this product is used on cheap keyboards and screen readers as well as touch.

**Motion.** Fast and functional: 140ms for state, 220ms for entrances, 360ms only for sheets. `cubic-bezier(.2,.8,.2,1)` standard, `cubic-bezier(0,.7,.3,1)` for entrances. Toasts and dialogs rise 12px while fading in. **No bounce, no spring, no parallax, no looping decorative animation** — connections are slow here and motion must never gate content.

**Transparency & blur.** Used in exactly three places: the modal scrim (`rgba(26,22,19,.52)` + 2px blur), the sticky mobile header when content scrolls under it (`--blur-sheet`), and a bottom protection gradient over any image that carries text. Everything else is opaque — blur is expensive on low-end Android.

**Protection.** Text over imagery uses a bottom-up ink gradient (`transparent → rgba(26,22,19,.72)`), never a capsule chip. Chips/capsules are for metadata, not for legibility rescue.

**Imagery.** When photography is added it should be warm-toned, natural daylight, real people at work in real Ivorian settings — no stock-studio white backgrounds, no cool colour grading, no heavy filters or grain. Images are always `object-fit: cover`, radius from the container.

**Empty & loading states.** Warm, textual, no illustration: a one-line statement, a one-line fix, one button. Loading is a 700ms skeleton in `--argile-100`, never a spinner over the whole page (the button spinner is the exception).

---

## ICONOGRAPHY

- **Set: Lucide** (`https://unpkg.com/lucide@0.454.0/dist/umd/lucide.min.js`), 24px nominal (22px in tiles, 18px in buttons, 16px inline), **stroke 1.75**, round caps and joins, `currentColor`, **never filled** — with one exception: rating stars are filled Soleil.
- **Substitution flagged:** no icon set was supplied. Lucide was chosen for its rounded, medium-weight strokes, which sit correctly next to Manrope. If a real set exists, drop it into `assets/icons/` and replace the CDN link.
- **No emoji, ever.** No unicode glyphs used as icons (no ★, ✓, →). Arrows, checks and stars all come from Lucide or from a component's own inline SVG.
- **Icon fonts are not used.** Lucide renders inline SVG via `<i data-lucide="…"></i>` + `lucide.createIcons()`.
- Category glyphs used across the product: `wrench` (plomberie), `zap` (électricité), `paint-roller` (peinture), `scissors` (coiffure/beauté), `truck` (transport), `hammer` (maçonnerie), `sparkles`→ **not used**, `brush` (ménage), `laptop` (informatique), `graduation-cap` (cours). UI glyphs: `search`, `map-pin`, `star`, `shield-check`, `phone`, `message-circle`, `calendar`, `user`, `heart`, `bell`, `settings`, `chevron-down`, `arrow-left`, `sliders-horizontal`.
- Icons never appear alone as the only label of a destructive action; they pair with text or carry a Tooltip on desktop and an `aria-label` always.

---

## Intentional additions

No source defined a component inventory, so a standard set was authored, plus four marketplace-specific primitives the product cannot be built without: **SearchBar** (the signature service+commune pill), **ProviderCard** (the listing unit), **CategoryTile** (métier entry point) and **Rating** (score display).

---

## Index

**Root**
- `styles.css` — the single entry point consumers link. Import lines only.
- `thumbnail.html` — homepage tile.
- `SKILL.md` — Agent-Skill wrapper.
- `readme.md` — this file.

**Tokens** (`tokens/`) — `fonts.css`, `colors.css`, `typography.css`, `spacing.css`, `radius.css`, `elevation.css`, `motion.css`, `base.css`, `components.css` (the `sy-*` classes the React components use).

**Components** (`components/`) — each with `.jsx`, `.d.ts`, `.prompt.md`, plus one card HTML per folder.
- `core/` — **Button**, **IconButton**, **Card**, **Badge**, **Tag**, **Avatar**
- `forms/` — **Input**, **Textarea**, **Select**, **Checkbox**, **Radio**, **Switch**
- `feedback/` — **Dialog**, **Toast**, **Tooltip**
- `navigation/` — **Tabs**
- `marketplace/` — **SearchBar**, **ProviderCard**, **CategoryTile**, **Rating**

**Guidelines** (`guidelines/`) — 17 specimen cards: colour ramps (Kola, Lagune, Argile, semantic, Soleil), type (display, headings, body, mono/overline), spacing (scale, layout), brand (radii, elevation, motion, woven texture, wordmark, iconography).

**UI kits** (`ui_kits/`)
- `web/` — desktop web app: home, search results, provider profile, request flow.
- `android/` — Android phone app: home, results, profile, request confirmation.

**Assets** (`assets/`) — empty by design: no logo, no photography, no icon binaries were provided.
