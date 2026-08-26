/**
 * One-off migration script.
 *
 * Reads the legacy single-file build ("QW Desktop Version.html") and splits it
 * into the assets this React app consumes:
 *
 *   public/data/questions.json          the questionDatabase array
 *   public/data/question-images.json    questionId -> ["/assets/questions/<id>-1.jpg", ...]
 *   public/data/markscheme-images.json  questionId -> ["/assets/markschemes/<id>-1.jpg", ...]
 *   public/assets/questions/*.jpg       every base64 blob from imageMap, written as a real file
 *   public/assets/markschemes/*.jpg     every base64 blob from markSchemeImageMap
 *   public/assets/watermark-main.jpg    WATERMARK_MAIN (cover page)
 *   public/assets/watermark-all.jpg     WATERMARK_ALL  (every other page)
 *
 * Run with:  npm run extract -- "C:/path/to/QW Desktop Version.html"
 *
 * The legacy file inlines ~79 MB of base64 images. Pulling them out into real
 * files is what lets Vite serve the app instantly and lets a future API hand
 * back plain image URLs without changing any component.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const source = process.argv[2];
if (!source) {
  console.error('Usage: node scripts/extract-from-legacy.mjs "<path to QW Desktop Version.html>"');
  process.exit(1);
}

const OUT = {
  data: path.join(root, 'public', 'data'),
  questionImages: path.join(root, 'public', 'assets', 'questions'),
  markSchemeImages: path.join(root, 'public', 'assets', 'markschemes'),
  assets: path.join(root, 'public', 'assets'),
  styles: path.join(root, 'src', 'styles'),
};
for (const dir of Object.values(OUT)) fs.mkdirSync(dir, { recursive: true });

console.log('Reading', source);
const html = fs.readFileSync(source, 'utf8');
const lines = html.split(/\r?\n/);

/* ------------------------------------------------------------------ */
/* 1. Stylesheet                                                       */
/* ------------------------------------------------------------------ */

const css = [];
let inStyle = false;
for (const line of lines) {
  if (/^\s*<style\b/.test(line)) {
    inStyle = true;
    continue;
  }
  if (/^\s*<\/style>/.test(line)) {
    inStyle = false;
    css.push('');
    continue;
  }
  if (inStyle) css.push(line);
}
fs.writeFileSync(
  path.join(OUT.styles, 'legacy.css'),
  `/* Extracted verbatim from the legacy single-file build. */\n\n${css.join('\n')}\n`,
);
console.log(`  styles/legacy.css        ${css.length} lines`);

/* ------------------------------------------------------------------ */
/* 2. questionDatabase                                                 */
/* ------------------------------------------------------------------ */

function sliceBetween(startMarker, endMarker) {
  const start = html.indexOf(startMarker);
  if (start === -1) throw new Error(`Could not find "${startMarker}" in the source file`);
  const from = start + startMarker.length;
  const end = html.indexOf(endMarker, from);
  if (end === -1) throw new Error(`Could not find the end of "${startMarker}"`);
  return { body: html.slice(from, end), end };
}

const { body: dbBody } = sliceBetween('const questionDatabase = [', '\n        ];');
const questions = JSON.parse(`[${dbBody}]`);
fs.writeFileSync(path.join(OUT.data, 'questions.json'), JSON.stringify(questions, null, 2));
console.log(`  data/questions.json      ${questions.length} questions`);

/* ------------------------------------------------------------------ */
/* 3. Watermarks                                                       */
/* ------------------------------------------------------------------ */

function writeDataUrl(dataUrl, absPath) {
  const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
  fs.writeFileSync(absPath, Buffer.from(base64, 'base64'));
}

for (const [name, file] of [
  ['WATERMARK_MAIN', 'watermark-main.jpg'],
  ['WATERMARK_ALL', 'watermark-all.jpg'],
]) {
  const match = html.match(new RegExp(`const ${name}\\s*=\\s*"(data:image/[^"]+)"`));
  if (!match) throw new Error(`Could not find ${name}`);
  writeDataUrl(match[1], path.join(OUT.assets, file));
  console.log(`  assets/${file}`);
}

/* ------------------------------------------------------------------ */
/* 4. Image maps                                                       */
/* ------------------------------------------------------------------ */

/**
 * The maps are `{ "QUESTION_ID": ["data:image/jpeg;base64,...", ...], ... }`.
 * Entry-per-line does not hold everywhere in the legacy file (some lines carry
 * several entries), so the whole object literal is sliced out and parsed as
 * JSON rather than scanned line by line.
 */
function extractImageMap(varName, outDir, urlPrefix) {
  const marker = `const ${varName} = {`;
  const start = html.indexOf(marker);
  if (start === -1) throw new Error(`Could not find ${varName}`);

  const openBrace = start + marker.length - 1;
  const closer = '\n        };';
  const end = html.indexOf(closer, openBrace);
  if (end === -1) throw new Error(`Could not find the end of ${varName}`);

  const objectLiteral = html
    .slice(openBrace, end + closer.length - 1) // keep the closing brace, drop the ';'
    .replace(/,(\s*)\}$/, '$1}'); // tolerate a trailing comma on the last entry

  const map = JSON.parse(objectLiteral);

  const manifest = {};
  let files = 0;
  let bytes = 0;

  for (const [id, value] of Object.entries(map)) {
    const sources = Array.isArray(value) ? value : [value];
    manifest[id] = sources.map((dataUrl, index) => {
      const fileName = `${id}-${index + 1}.jpg`;
      const buffer = Buffer.from(dataUrl.slice(dataUrl.indexOf(',') + 1), 'base64');
      fs.writeFileSync(path.join(outDir, fileName), buffer);
      files += 1;
      bytes += buffer.length;
      return `${urlPrefix}/${fileName}`;
    });
  }

  return { manifest, files, bytes };
}

const mb = (n) => `${(n / 1024 / 1024).toFixed(1)} MB`;

const ms = extractImageMap('markSchemeImageMap', OUT.markSchemeImages, '/assets/markschemes');
fs.writeFileSync(
  path.join(OUT.data, 'markscheme-images.json'),
  JSON.stringify(ms.manifest, null, 2),
);
console.log(
  `  assets/markschemes/      ${ms.files} images (${mb(ms.bytes)}) for ${Object.keys(ms.manifest).length} questions`,
);

const qi = extractImageMap('imageMap', OUT.questionImages, '/assets/questions');
fs.writeFileSync(
  path.join(OUT.data, 'question-images.json'),
  JSON.stringify(qi.manifest, null, 2),
);
console.log(
  `  assets/questions/        ${qi.files} images (${mb(qi.bytes)}) for ${Object.keys(qi.manifest).length} questions`,
);

console.log('\nDone.');
