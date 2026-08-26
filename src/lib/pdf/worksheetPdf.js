import { stripHtml } from '../markScheme';
import { writeMarkSchemeText } from './markSchemeBody';
import {
  A4_W,
  PAD_X,
  PAD_Y,
  createDocument,
  createWatermarkPainter,
  drawFittedImage,
  drawQuestionHeader,
  startPage,
  tick,
} from './pdfCommon';
import { totalMarksOf } from '../questionBank';

function drawCoverPage(doc, drawWatermark, questions, totalMarks) {
  startPage(doc, drawWatermark, { isCover: true, addPage: false });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(0, 0, 0);
  doc.text('Physics Examination', A4_W / 2, PAD_Y + 8, { align: 'center' });

  doc.setDrawColor(51, 51, 51);
  doc.setLineWidth(0.6);
  doc.line(PAD_X, PAD_Y + 14, A4_W - PAD_X, PAD_Y + 14);

  const nameY = PAD_Y + 28;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Candidate Name:', PAD_X, nameY);
  doc.setLineWidth(0.5);
  doc.line(PAD_X + 42, nameY + 0.8, A4_W / 2 - 5, nameY + 0.8);

  const numberY = nameY + 12;
  doc.text('Candidate Number:', PAD_X, numberY);
  doc.line(PAD_X + 42, numberY + 0.8, A4_W / 2 - 5, numberY + 0.8);

  doc.setFont('helvetica', 'normal');
  doc.text(`Total Questions:  ${questions.length}`, A4_W - PAD_X, nameY, { align: 'right' });
  doc.text(`Total Marks:  ${totalMarks}`, A4_W - PAD_X, nameY + 8, { align: 'right' });
  doc.text(`Date:  ${new Date().toLocaleDateString()}`, A4_W - PAD_X, nameY + 16, {
    align: 'right',
  });

  const boxY = 80;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.roundedRect(PAD_X, boxY, A4_W - 2 * PAD_X, 46, 2, 2);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Instructions:', PAD_X + 5, boxY + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  [
    '• Answer all questions in the spaces provided',
    '• Show all your working',
    '• The marks for each question are shown in brackets',
  ].forEach((line, index) => {
    doc.text(line, PAD_X + 8, boxY + 18 + index * 7);
  });
}

/**
 * Builds the student-facing worksheet: cover page, then one A4 page per page of
 * the original paper, optionally followed by each question's mark scheme.
 *
 * @param {object}   options
 * @param {object[]} options.questions
 * @param {(id: string) => string[]} options.getQuestionImages
 * @param {(id: string) => string[]} options.getMarkSchemeImages
 * @param {boolean}  options.includeMarkSchemes
 * @param {(message: string) => void} [options.onProgress]
 */
export async function downloadWorksheetPdf({
  questions,
  getQuestionImages,
  getMarkSchemeImages,
  includeMarkSchemes,
  onProgress = () => {},
}) {
  const doc = createDocument();
  const drawWatermark = await createWatermarkPainter(doc);
  const totalMarks = totalMarksOf(questions);

  onProgress('Rendering cover page...');
  await tick();
  drawCoverPage(doc, drawWatermark, questions, totalMarks);

  for (let qi = 0; qi < questions.length; qi++) {
    const question = questions[qi];
    const label = `Q${qi + 1}`;
    const images = getQuestionImages(question.id);

    if (images.length > 0) {
      for (let pi = 0; pi < images.length; pi++) {
        onProgress(`Rendering ${label} page ${pi + 1} of ${images.length}...`);
        await tick();

        startPage(doc, drawWatermark);
        const contentTop = pi === 0 ? drawQuestionHeader(doc, label, question.marks) : PAD_Y;
        await drawFittedImage(doc, images[pi], contentTop, '[Image could not be embedded]');
      }
    } else {
      // Text-only fallback for questions with no scanned pages.
      onProgress(`Rendering ${label} (text)...`);
      await tick();

      startPage(doc, drawWatermark);
      drawQuestionHeader(doc, label, question.marks);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      const wrapped = doc.splitTextToSize(stripHtml(question.questionText || ''), A4_W - 2 * PAD_X);
      doc.text(wrapped, PAD_X, PAD_Y + 10);
    }

    if (!includeMarkSchemes) continue;

    const msImages = getMarkSchemeImages(question.id);
    const msTitle = `${label} — Mark Scheme`;

    if (msImages.length > 0) {
      for (let mi = 0; mi < msImages.length; mi++) {
        onProgress(`Rendering ${label} MS p${mi + 1}/${msImages.length}...`);
        await tick();

        startPage(doc, drawWatermark);
        const contentTop = mi === 0 ? drawQuestionHeader(doc, msTitle, question.marks) : PAD_Y;
        await drawFittedImage(
          doc,
          msImages[mi],
          contentTop,
          '[Mark scheme image could not be embedded]',
        );
      }
    } else if (String(question.markScheme || '').trim()) {
      onProgress(`Rendering ${label} mark scheme...`);
      await tick();

      startPage(doc, drawWatermark);
      drawQuestionHeader(doc, msTitle, question.marks);
      writeMarkSchemeText(doc, question.markScheme, drawWatermark);
    }
  }

  onProgress('Saving PDF...');
  await tick();
  doc.save('physics_worksheet.pdf');
}
