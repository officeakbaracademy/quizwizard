import { parseMarkSchemeParts, splitMarkSchemePoints, stripHtml } from '../markScheme';
import { A4_H, A4_W, PAD_X, PAD_Y, startPage } from './pdfCommon';

const LINE_H = 6;
const LABEL_COL_W = 18; // mm reserved for the "(a)(ii)" label column

/**
 * Writes a text mark scheme as bold part labels with bulleted marking points,
 * spilling onto extra pages when it runs past the bottom margin.
 */
export function writeMarkSchemeText(doc, markScheme, drawWatermark, startY = PAD_Y + 10) {
  const bottom = A4_H - PAD_Y;
  const textX = PAD_X + LABEL_COL_W;
  const maxW = A4_W - PAD_X - textX - 4;

  let cy = startY;

  const ensureSpace = () => {
    if (cy <= bottom) return;
    startPage(doc, drawWatermark);
    cy = PAD_Y;
  };

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);

  const parts = parseMarkSchemeParts(stripHtml(markScheme));

  if (parts.length === 0 || parts.every((part) => !part.body)) {
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(120, 120, 120);
    doc.text('No mark scheme available for this question.', PAD_X, cy);
    doc.setTextColor(0, 0, 0);
    return;
  }

  for (const part of parts) {
    const points = splitMarkSchemePoints(part.body);
    if (points.length === 0) continue;

    let firstLineOfPart = true;

    for (const point of points) {
      const wrapped = doc.splitTextToSize(point, maxW);

      wrapped.forEach((line, lineIndex) => {
        ensureSpace();

        if (firstLineOfPart && part.label) {
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(0, 0, 0);
          doc.text(part.label, PAD_X, cy);
          doc.setFont('helvetica', 'normal');
          firstLineOfPart = false;
        }

        if (lineIndex === 0) doc.text('•', textX - 4, cy);
        doc.text(line, textX, cy);
        cy += LINE_H;
      });

      cy += 1;
    }

    cy += 3;
  }
}
