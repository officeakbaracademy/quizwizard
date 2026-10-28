# Quiz Wizard

Akbar Academy's past paper question bank and worksheet generator, rebuilt in React
and carrying the academy's own branding.

The tool covers the full academy catalogue: Physics, Chemistry, Biology, Maths and
English at IGCSE, AS and A2 across Cambridge, Edexcel and AQA. Which of those are
live is worked out at runtime from the loaded questions, so a subject, level or
board appears the moment its papers are imported, with no code change. Anything
with no questions yet shows as "in build" rather than being hidden.

This is a port of the original single-file build (`QW Desktop Version.html`), which
carried its questions and scans inside one 79 MB HTML file. All questions, page
images and mark schemes now come from the Akbar Academy backend (the question bank
API), so there is no data bundled with the app.

## Getting started

```bash
npm install
```

Create `.env.local` (it is git-ignored, never commit it):

```bash
VITE_API_BASE_URL=/api/v1
VITE_API_TARGET=https://<backend-address>
API_TOKEN=<question bank token>
```

```bash
npm run dev
```

The app runs at http://localhost:5173. Restart it after changing `.env.local`.

| Script            | What it does                         |
| ----------------- | ------------------------------------ |
| `npm run dev`     | Vite dev server with hot reload       |
| `npm run build`   | Production build into `dist/`         |
| `npm run preview` | Serve the production build locally    |

## The backend

Everything comes from the question bank's search API,
`GET /api/v1/admin/question-papers/questions/search`:

| In Quiz Wizard            | Search API options                         |
| ------------------------- | ------------------------------------------ |
| Loading the bank          | no filters, read page by page              |
| Apply filters             | `syllabus`, `subject`, `paper`, `topic`, `difficulty` |
| Generate by target marks  | `target_marks` (and `seed` across pages)   |
| Sort by marks             | `sort_by=marks&sort_order=desc`            |

`src/api/backendQuestions.js` is the only file that knows the backend's field
names; it turns each result into the question record the rest of the app uses.
Question and mark scheme page images come from each question's `snapshots`.
The worksheet and mark scheme PDFs are built in the browser from that data.

In development, `vite.config.js` proxies `/api` to `VITE_API_TARGET` and adds the
`Authorization` header from `API_TOKEN`, so the token never reaches the browser,
and the `ngrok-skip-browser-warning` header while the backend runs on ngrok.

## Project layout

```
public/
  brand/                   academy logos, subject mascots, exam board logos
  assets/watermark-*.jpg   Akbar Academy page underlays for the PDFs
src/
  api/                     HTTP client and the backend calls
  components/              UI, one file per panel or modal
  hooks/useTheme.js        dark and light theme, remembered per browser
  hooks/useQuestionBank.js loads the bank once, exposes the image lookups
  lib/brand.js             subjects, levels, boards and the brand asset paths
  lib/                     course and filter helpers, mark scheme parsing, image loading
  lib/pdf/                 jsPDF worksheet and mark scheme writers
  styles/theme.css         design tokens: brand colours, dark and light themes
  styles/app.css           component styles built on those tokens
```

## Branding

Colours, type and assets all come from the Akbar Academy brand sheet.

| Token | Value | Used for |
| ----- | ----- | -------- |
| Electric | `#02BAFD` | primary actions, active states, accents |
| Mandarin | `#F9B602` | marks, secondary actions, step numbers |
| Midnight | `#000000` | dark theme ground |
| White | `#FFFFFF` | light theme ground |

Poppins is bundled through `@fontsource/poppins` rather than loaded from Google, so
the tool renders correctly offline and never flashes a fallback face.

Both themes are real: dark is true black, light is true white. The choice lives in
`localStorage` under `aa-theme` and is applied to `<html>` by a small inline script
in `index.html` before first paint.

Exam board logos always sit on a white chip (`.board-chip`). Edexcel is navy and AQA
is purple on transparent, so neither survives a black background on its own.

Subject mascots, academy logos and board logos live in `public/brand/`. Replacing a
file there updates every place it appears.

## Notes on the port

- **Images come from the backend.** The originals were inlined as data URLs,
  which is what made the source file 79 MB. Now each question's page images are
  served by the backend and referenced by URL.
- **jsPDF loads on demand.** It is only imported when a download starts, so it
  stays out of the initial bundle.
- **The watermark now shows in the preview.** In the old build,
  `.pdf-page { background: #ffffff !important; }` is a shorthand, so it reset
  `background-image` with `!important` priority and beat the inline style the
  worksheet set. The watermark was therefore missing on screen even though jsPDF
  always drew it into the PDF. `src/styles/app.css` routes it through a custom
  property so the preview matches the download.
