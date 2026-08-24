# Dynamic Form Builder - frontend

A React + TypeScript + Vite frontend for the Dynamic Form Builder API.

## Stack

| Requirement | Implementation |
|---|---|
| React.js (Vite) + TypeScript | Vite 8 + React 19 + TypeScript |
| Material UI (MUI) | `@mui/material` v6, themed via `src/theme.ts` (custom "Ledger" design tokens) |
| Axios | `src/lib/api.ts` — single configured instance, JWT interceptor, error normalization |
| React Router | `src/App.tsx` — protected/admin-only routes |
| React Hook Form | Login/Register, form-details editor, per-field editor, user/role admin dialogs |
| Chart.js | `react-chartjs-2` — dashboard trend (Line), reports trend (Bar) |
| Drag-and-drop field ordering | `@dnd-kit` — sortable field list in the form builder |
| date-fns | Date formatting throughout |

## Prerequisites

- Node.js 18+ and npm
- The backend running and reachable (see the backend's own README for setup)

## Setup

```bash
npm install
```

Create a `.env` file in the project root (or edit the one already there):

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

Point this at wherever your backend is actually running. If you're deploying the frontend somewhere other
than `localhost`, update it to the deployed backend URL instead.

Start the dev server:

```bash
npm run dev
```

By default Vite serves on `http://localhost:5173`. Make sure this origin (or wherever you actually run
it) is included in the backend's `CORS_ORIGINS` setting, or requests will be blocked by the browser.

## Build for production

```bash
npm run build
```

Output goes to `dist/`. Preview the production build locally with:

```bash
npm run preview
```

## Design system: "Ledger"

Light, editorial, paper/ink theme built around the form/document vernacular, implemented as an MUI theme
rather than a component library skin:
- **Paper** `#EEEBE2`, **card** `#F8F6EF`, **ink** `#1C1E1A`
- **Accents** — Ledger blue `#28466B` (primary), Moss `#3F6B4A` (active/success), Rust `#9C3B2E` (danger), Ochre `#B8862B` (draft/pending)
- **Type** — Source Serif 4 (headings), Inter (body/UI), IBM Plex Mono (keys, IDs, stamps)
- **Signature** — dashed fill-in underlines on filled response values, status chips styled as rotated rubber ink-stamps

## What's included

- **Auth** — login, register, JWT bearer stored in localStorage, `/auth/me` session restore
- **Dashboard** — summary stats, submission trend chart, most-used forms
- **Forms** — registry (all / created-by-me), create/edit with a **drag-and-drop** field builder (all 9 field types, validation rules, options, conditional logic), activate/deactivate, delete
- **Fill form** — renders fields per type including a real **file upload** control for File-type fields, live conditional visibility, client-side validation matching backend rules, optional anonymous submission for public forms
- **Responses** — my responses, per-form response list (admin), response detail with edit/delete (including replacing a file answer)
- **Admin** — user management, role management, activity log, reports (statistics, per-form response counts, response trend chart, field-level analytics, Excel/PDF export)

## File uploads

File-type fields upload real files, not just a text reference:

1. The frontend posts the selected file as `multipart/form-data` to `POST /api/v1/uploads` (`src/lib/api.ts` → `uploadFile()`)
2. The backend validates extension + size, stores it, and returns a `file_url` like `/uploads/<uuid>.pdf`
3. That URL is stored as the field's value like any other File-field string value
4. Files render back as a clickable chip, served from the backend's `/uploads/...` static mount

This requires the backend's file-upload endpoint and static mount to be in place — see the backend README/patch.

## Notes on backend contract

- Field **options can only be set at field creation** — the backend has no way to modify options after the fact, so the editor locks options on already-saved fields and explains this rather than faking support.
- `client_key` and `field_type` are locked once a field is saved, matching backend validation.
- Admin-only UI is gated on `role === "ADMIN"`, matching the backend's own admin check.
- Drag-and-drop reordering updates field order locally immediately; in edit mode, click **"Save order"** to persist it (one request per moved field, since there's no bulk-reorder endpoint).

## Recent changes

- Rebuilt from an earlier Tailwind CSS version onto MUI, React Hook Form, and Chart.js to match the
  required stack exactly (previously used Tailwind, uncontrolled inputs, and Recharts).
- Added drag-and-drop field reordering in the form builder (previously a plain numeric "display order" input).
- Added real file upload support for File-type fields, both when filling a form and when viewing/editing
  a submitted response (previously a plain text/URL input as a placeholder).
