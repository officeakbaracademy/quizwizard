import { jsPDF } from 'jspdf';
import { loadImageForPdf, toDataUrl } from '../imageLoader';
import { WATERMARK_ALL_URL, WATERMARK_MAIN_URL } from '../watermarks';

export const A4_W = 210;
export const A4_H = 297;
export const PAD_X = 12;
export const PAD_Y = 14;

export { WATERMARK_ALL_URL, WATERMARK_MAIN_URL };

export function createDocument() {
  return new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true });
}

/** Yields to the event loop so progress text repaints between heavy pages. */
export const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

/**
 * Preloads both Akbar Academy watermarks and returns a painter that lays one
 * down as the bottom-most layer of a page.
 */
export async function createWatermarkPainter(doc) {
  const [cover, standard] = await Promise.all([
    toDataUrl(WATERMARK_MAIN_URL).catch(() => null),
    toDataUrl(WATERMARK_ALL_URL).catch(() => null),
  ]);

  return function drawWatermark(isCover) {
    const watermark = isCover ? cover : standard;
    if (!watermark) return;
    try {
      doc.addImage(watermark, 'JPEG', 0, 0, A4_W, A4_H, undefined, 'FAST');
    } catch (error) {
      console.warn('Watermark draw failed:', error);
    }
  };
}

/** Starts a blank white page with the watermark already painted. */
export function startPage(doc, drawWatermark, { isCover = false, addPage = true } = {}) {
  if (addPage) doc.addPage();
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, A4_W, A4_H, 'F');
  drawWatermark(isCover);
  doc.setTextColor(0, 0, 0);
}

/**
 * Draws the "Q3 ... (5 marks)" heading with its rule.
 * Returns the y coordinate content should start at.
 */
export function drawQuestionHeader(doc, title, marks) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text(title, PAD_X, PAD_Y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(85, 85, 85);
  doc.text(`(${marks} mark${marks === 1 ? '' : 's'})`, A4_W - PAD_X, PAD_Y, { align: 'right' });

  doc.setDrawColor(238, 238, 238);
  doc.setLineWidth(0.5);
  doc.line(PAD_X, PAD_Y + 3, A4_W - PAD_X, PAD_Y + 3);

  doc.setTextColor(0, 0, 0);
  return PAD_Y + 6;
}

/** Scales an image to fit the page below `contentTop` and centres it. */
export async function drawFittedImage(doc, url, contentTop, fallbackMessage) {
  try {
    const { dataUrl, w: naturalW, h: naturalH } = await loadImageForPdf(url);

    const availableW = A4_W - 2 * PAD_X;
    const availableH = A4_H - contentTop - PAD_Y;
    const ratio = naturalH / naturalW;

    let width = availableW;
    let height = width * ratio;
    if (height > availableH) {
      height = availableH;
      width = height / ratio;
    }

    doc.addImage(dataUrl, 'JPEG', (A4_W - width) / 2, contentTop, width, height, undefined, 'FAST');
  } catch (error) {
    console.warn('addImage failed:', error);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(11);
    doc.setTextColor(120, 120, 120);
    doc.text(fallbackMessage, A4_W / 2, contentTop + 10, { align: 'center' });
    doc.setTextColor(0, 0, 0);
  }
}
