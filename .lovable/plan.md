
## Mémoire — Prospecting Agent Dashboard

A single-page dashboard for Centrale Nantes Études with 4 tabs, dark navy + gold aesthetic, French UI, and rich mock data. Demo-ready, pixel-focused. No backend yet.

### Design system
- **Colors**: bg `#0A0E1A`, gold accent `#C9A84C`, text `#F5F5F0`, sage success `#7A8B6F`. Wired through `src/styles.css` as semantic tokens (background, primary=gold, foreground, sidebar, success, warning, destructive). Force dark theme on `<html>`.
- **Fonts**: Playfair Display (headings/logo, italic for "Mémoire") + DM Sans (body/UI), loaded via Google Fonts `<link>` in `__root.tsx` head. Tokenized as `font-display` and `font-sans`.
- **Cards**: glass — `bg-white/4`, `backdrop-blur-md`, `border-white/8`, `rounded-xl`, hover lift `-translate-y-0.5` + shadow.
- **Buttons**: `rounded-lg` (8px). Primary = gold bg, dark text, hover brightness.
- **Status badges**: amber/green/red/gray with soft glow via `shadow-[0_0_12px_rgba(...)]`.
- **Sidebar**: 280px fixed, gradient navy → dark indigo, gold left-border (3px) on active link.
- **Animations**: staggered `fade-in` on tab switch (200ms intervals via inline `animation-delay`), card hover lift, button hover.

### Layout (single page, no scroll on shell)
`src/routes/index.tsx` renders the full app:
- **Sidebar (left, 280px)**: Logo "Mémoire" (Playfair italic 28px gold) + subtitle + thin gold `<hr>`. Nav links (Nouvelle Campagne, Pipeline, Mémoire, Paramètres) with Lucide icons (FilePlus, BarChart3, Brain, Settings). Recent campaigns list. Bottom team card + "Propulsé par AWS Bedrock + Lovable".
- **Main (right, flex-1)**: Pill tabs at top (gold active state) + tab content area with internal scroll where needed.

State: `useState` for active tab, campaign data, prospects, memories, settings, modal. No routing, no localStorage. Tab switching via local state — clicking sidebar nav or tab pills both update it. Recent campaign click → switch to Pipeline tab and load that campaign's prospects.

### Tab 1 — Nouvelle Campagne (default)
Centered glass card (max-w-560px) with form: Secteur, Zone, Nombre prospects (default 20, 5–50), Pitch textarea (4 rows), Ton dropdown (3 options, default "amical"). Full-width gold "🚀 Lancer la Prospection" button. Helper text below. On submit: button shows spinner + "Prospection en cours...", 2s later → switch to Pipeline tab populated with the 8 mock prospects and campaign name `{Secteur} × {Zone} — {date}`.

### Tab 2 — Pipeline
- Campaign header: auto-generated name + 3 metric cards (Prospects trouvés, Emails envoyés, Taux d'ouverture with Target/Mail/LineChart icons).
- shadcn Table with columns Prénom / Nom / Poste / Entreprise / Email / Statut / Actions, populated with the 8 specified French prospects (Daher, Manitou, Lacroix, Eurofins, Armor, MAN ES, Naval Group, Airbus Atlantic).
- Status badges with glow.
- Actions: Eye → opens shadcn Dialog with email preview (To, Subject "Collaboration avec Centrale Nantes Études — {Secteur}", ~150-word French body varying opening lines per prospect, Modifier/Approuver buttons). Send icon → flips status to "Envoyé" + increments emails-sent metric.

### Tab 3 — Mémoire
- Search input (filters cards live by company/contact/note text).
- 5 mock memory cards (Manitou, Daher, Naval, Lacroix, Airbus) with company+contact heading, outcome badge (signé/relance/pas intéressé), 2-3 line note, "Ajouté par" footer.
- Floating gold "+" FAB bottom-right opens a Dialog to add a new memory (writes to local state).

### Tab 4 — Paramètres
3 stacked glass cards:
1. Google Sheets — green dot "Connecté", URL field (placeholder URL), "Reconnecter" outline button.
2. Amazon Bedrock — green dot "Actif", model dropdown (Sonnet default), region dropdown (Paris default).
3. JE Profile — Nom, Pitch textarea, Email d'envoi, Signature (all pre-filled CNE values).

Bottom: gold "Sauvegarder les paramètres" (toast on click via sonner).

### Files to create/modify
- `src/styles.css` — add color tokens, font families, glow utilities, fade-in keyframes, force dark.
- `src/routes/__root.tsx` — add Google Fonts `<link>` in head, set `<html class="dark">`, title "Mémoire — Prospecting Intelligence".
- `src/routes/index.tsx` — replace placeholder, render `<MemoireApp />`.
- `src/components/memoire/MemoireApp.tsx` — top-level shell with state, sidebar + main.
- `src/components/memoire/Sidebar.tsx`
- `src/components/memoire/TabNav.tsx`
- `src/components/memoire/tabs/NewCampaignTab.tsx`
- `src/components/memoire/tabs/PipelineTab.tsx`
- `src/components/memoire/tabs/MemoryTab.tsx`
- `src/components/memoire/tabs/SettingsTab.tsx`
- `src/components/memoire/EmailPreviewDialog.tsx`
- `src/components/memoire/AddMemoryDialog.tsx`
- `src/components/memoire/data.ts` — mock prospects, memories, recent campaigns, email body generator.
- `src/components/memoire/types.ts` — Prospect, Memory, Campaign, Settings types.

Reuses shadcn: button, input, textarea, select, table, badge, dialog, card, tabs (for pill nav style), sonner.

### Out of scope (per spec)
No real APIs (Bedrock/Sheets/Sirene), no auth, no actual sending, no Edge Functions, no mobile.
