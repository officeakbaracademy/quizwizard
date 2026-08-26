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

function drawCoverPage(doc, drawWatermark, totalQuestions, totalMarks) {
  startPage(doc, drawWatermark, { isCover: true, addPage: false });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(0, 0, 0);
  doc.text('Physics Examination', A4_W / 2, PAD_Y + 8, { align: 'center' });
  doc.setFontSize(16);
  doc.text('Mark Scheme', A4_W / 2, PAD_Y + 18, { align: 'center' });

  doc.setDrawColor(51, 51, 51);
  doc.setLineWidth(0.6);
  doc.line(PAD_X, PAD_Y + 24, A4_W - PAD_X, PAD_Y + 24);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  const infoY = PAD_Y + 36;
  doc.text(`Total Questions:  ${totalQuestions}`, PAD_X, infoY);
  doc.text(`Total Marks:  ${totalMarks}`, PAD_X, infoY + 8);
  doc.text(`Date:  ${new Date().toLocaleDateString()}`, PAD_X, infoY + 16);

  const boxY = infoY + 28;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.roundedRect(PAD_X, boxY, A4_W - 2 * PAD_X, 22, 2, 2);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Teacher copy only.', PAD_X + 5, boxY + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text('Contains mark scheme points for the generated questions.', PAD_X + 5, boxY + 16);
}

/**
 * Builds the teacher-facing mark scheme booklet for the questions that are
 * currently in the worksheet.
 */
export async function downloadMarkSchemePdf({
  questions,
  getMarkSchemeImages,
  onProgress = () => {},
}) {
  const doc = createDocument();
  const drawWatermark = await createWatermarkPainter(doc);

  onProgress('Rendering cover page...');
  await tick();
  drawCoverPage(doc, drawWatermark, questions.length, totalMarksOf(questions));

  for (let qi = 0; qi < questions.length; qi++) {
    const question = questions[qi];
    const marks = question.marks || 0;
    const title = `Q${qi + 1} — Mark Scheme`;
    const msImages = getMarkSchemeImages(question.id);

    if (msImages.length > 0) {
      for (let mi = 0; mi < msImages.length; mi++) {
        onProgress(`Rendering Q${qi + 1} MS image p${mi + 1}/${msImages.length}...`);
        await tick();

        startPage(doc, drawWatermark);
        const contentTop = mi === 0 ? drawQuestionHeader(doc, title, marks) : PAD_Y;
        await drawFittedImage(
          doc,
          msImages[mi],
          contentTop,
          '[Mark scheme image could not be embedded]',
        );
      }
      continue;
    }

    onProgress(`Rendering Q${qi + 1} mark scheme...`);
    await tick();

    startPage(doc, drawWatermark);
    drawQuestionHeader(doc, title, marks);
    writeMarkSchemeText(doc, question.markScheme, drawWatermark);
  }

  onProgress('Saving PDF...');
  await tick();
  doc.save('physics_markscheme.pdf');
}
