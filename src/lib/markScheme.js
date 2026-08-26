/** Mark scheme text formatting, shared by the on-screen modals and the PDF writers. */

export function escapeHTML(str) {
  return String(str).replace(
    /[&<>"']/g,
    (m) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[m],
  );
}

/** Renders a mark scheme as an HTML string: a bullet list when it has multiple lines. */
export function formatMarkScheme(markScheme) {
  if (!markScheme) return '';

  if (Array.isArray(markScheme)) {
    return `<ul>${markScheme.map((p) => `<li>${escapeHTML(String(p))}</li>`).join('')}</ul>`;
  }

  const text = String(markScheme).trim();
  if (!text) return '';

  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length > 1) {
    return `<ul>${lines.map((l) => `<li>${escapeHTML(l)}</li>`).join('')}</ul>`;
  }

  return `<p>${escapeHTML(text)}</p>`;
}

export function stripHtml(value) {
  if (!value) return '';
  const tmp = document.createElement('div');
  tmp.innerHTML = String(value);
  return (tmp.textContent || tmp.innerText || '').replace(/\s+\n/g, '\n').trim();
}

/**
 * Splits a mark scheme into its labelled parts, e.g. "(a)", "(b)(ii)".
 * Text before the first label becomes an unlabelled leading part.
 */
export function parseMarkSchemeParts(text) {
  if (!text) return [];

  const labelPattern = /\(([a-z])\)(\([ivxlcdm]+\))?/gi;
  const labels = [];
  let match;
  while ((match = labelPattern.exec(text)) !== null) {
    labels.push({ idx: match.index, len: match[0].length, label: match[0] });
  }

  if (labels.length === 0) return [{ label: '', body: text.trim() }];

  const parts = [];
  if (labels[0].idx > 0) {
    const lead = text.slice(0, labels[0].idx).trim();
    if (lead) parts.push({ label: '', body: lead });
  }

  for (let i = 0; i < labels.length; i++) {
    const start = labels[i].idx + labels[i].len;
    const end = i + 1 < labels.length ? labels[i + 1].idx : text.length;
    const body = text
      .slice(start, end)
      .trim()
      .replace(/^[\s.,:;]+/, '')
      .trim();
    parts.push({ label: labels[i].label, body });
  }

  return parts;
}

/** Semicolons separate individual marking points within a part. */
export function splitMarkSchemePoints(body) {
  return body
    .split(/\s*;\s*/)
    .map((s) => s.trim())
    .filter(Boolean);
}
