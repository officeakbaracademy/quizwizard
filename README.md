# Quiz Wizard

Akbar Academy's physics question bank and worksheet generator, rebuilt in React.

This is a port of the original single-file build (`QW Desktop Version.html`), which
carried 337 questions, ~79 MB of base64-inlined scans and the whole application in
one 4,300-line HTML file. The behaviour is the same; the code is now split into
components, the images are real files, and the data comes through an API layer.

## Getting started

```bash
npm install
```

```bash
npm run dev
```

The app runs at http://localhost:5173.

| Script            | What it does                                        |
| ----------------- | --------------------------------------------------- |
| `npm run dev`     | Vite dev server with hot reload                      |
| `npm run build`   | Production build into `dist/`                        |
| `npm run preview` | Serve the production build locally                   |
| `npm run extract` | Re-import data from a legacy HTML build (see below)  |

## Connecting a backend

Nothing in the components knows where the data comes from. Every request goes
through `src/api/client.js`, which reads the static snapshots in `public/data`
when no API base URL is configured:

```bash
# .env.local
VITE_API_BASE_URL=https://api.akbaracademy.co.uk
```

Set that and the same three calls hit the live service instead:

| Function                  | API path                          | Static fallback                     |
| ------------------------- | --------------------------------- | ----------------------------------- |
| `fetchQuestions`          | `GET /questions`                  | `/data/questions.json`              |
| `fetchQuestionImages`     | `GET /questions/images`           | `/data/question-images.json`        |
| `fetchMarkSchemeImages`   | `GET /questions/markscheme-images`| `/data/markscheme-images.json`      |

Expected shapes:

```jsonc
// GET /questions
[
  {
    "id": "CAM_IGCSE_P4_2021_Q1",
    "board": "Cambridge",
    "level": "IGCSE",
    "syllabus": "Cambridge IGCSE Physics",
    "paper": "Paper 4",
    "topic": "Motion, forces and energy",
    "questionNumber": "1",
    "part": "",
    "questionType": "Mixed",
    "ao": "AO2",
    "difficulty": "Hard",
    "marks": 10,
    "questionText": "<p>...</p>",
    "markScheme": "(a)(i) deceleration = ..."
  }
]

// GET /questions/images  and  GET /questions/markscheme-images
{
  "CAM_IGCSE_P4_2021_Q1": ["/assets/questions/CAM_IGCSE_P4_2021_Q1-1.jpg"]
}
```

Image values may be absolute URLs once a CDN is involved; they are passed
straight to `<img src>` and to the PDF writer, so no component changes are
needed.

If the API is served from the same origin under `/api`, set
`VITE_API_TARGET=http://localhost:4000` and Vite will proxy it in development.

## Project layout

```
public/
  data/                    question and image manifests (the static API snapshot)
  assets/questions/        464 question page scans
  assets/markschemes/      86 mark scheme scans
  assets/watermark-*.jpg   Akbar Academy page underlays
src/
  api/                     HTTP client and the question bank endpoints
  components/              UI, one file per panel or modal
  hooks/useQuestionBank.js loads the bank once, exposes the image lookups
  lib/                     filtering, mark scheme parsing, image loading
  lib/pdf/                 jsPDF worksheet and mark scheme writers
  styles/legacy.css        stylesheet extracted verbatim from the old build
  styles/app.css           the few overrides layered on top
scripts/
  extract-from-legacy.mjs  one-off migration from the old HTML file
```

## Re-importing from a legacy HTML build

When a new paper is added to the old single-file tool, pull the data across:

```bash
npm run extract -- "C:/Users/hp/Downloads/QW Desktop Version.html"
```

It rewrites `public/data`, `public/assets` and `src/styles/legacy.css`. Local
edits belong in `src/styles/app.css`, which the script never touches.

## Notes on the port

- **Images are files, not base64.** The originals were inlined as data URLs,
  which is what made the source file 79 MB. They are now written out as JPEGs
  and referenced by URL, so the browser caches them and the API can serve them
  later.
- **jsPDF loads on demand.** It is only imported when a download starts, so it
  stays out of the initial bundle.
- **The watermark now shows in the preview.** In the old build,
  `.pdf-page { background: #ffffff !important; }` is a shorthand, so it reset
  `background-image` with `!important` priority and beat the inline style the
  worksheet set. The watermark was therefore missing on screen even though jsPDF
  always drew it into the PDF. `src/styles/app.css` routes it through a custom
  property so the preview matches the download.
