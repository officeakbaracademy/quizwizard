import { useEffect } from 'react';
import { formatMarkScheme } from '../lib/markScheme';
import { totalMarksOf } from '../lib/questionBank';
import { WATERMARK_ALL_URL, WATERMARK_MAIN_URL } from '../lib/watermarks';

/** Splits "... A) 5 B) 10 ..." into a stem plus tick boxes. */
function formatMCQ(text) {
  if (!(text.includes('A)') && text.includes('B)'))) {
    return `<p style="margin-bottom: 15px;">${text}</p>`;
  }

  const parts = text.split(/(?=[A-D]\))/);
  const stem = parts[0].trim();
  const options = parts
    .slice(1)
    .map((option) => option.trim())
    .filter(Boolean);

  return `
    <p style="margin-bottom: 15px;">${stem}</p>
    <div style="margin-left: 20px;">
      ${options
        .map(
          (option) => `
            <div style="margin-bottom: 8px;">
              <span style="display: inline-block; width: 20px; height: 20px; border: 2px solid #333; margin-right: 10px; vertical-align: middle;"></span>
              <span>${option}</span>
            </div>
          `,
        )
        .join('')}
    </div>
  `;
}

/** Roughly three ruled lines per mark, with a floor of three. */
function AnswerSpace({ marks, questionType }) {
  if (questionType === 'MCQ' || questionType === 'Matching') return null;

  const lineCount = Math.max(3, marks * 3);

  return (
    <div style={{ marginTop: '20px', marginBottom: '10px' }}>
      {Array.from({ length: lineCount }, (_, index) => (
        <div
          key={index}
          style={{ height: '25px', borderBottom: '1px solid #ddd', marginBottom: 0 }}
        />
      ))}
    </div>
  );
}

function A4Page({ isCover = false, children }) {
  return (
    <section
      className={isCover ? 'pdf-page pdf-page-cover' : 'pdf-page'}
      style={{ '--page-watermark': `url(${isCover ? WATERMARK_MAIN_URL : WATERMARK_ALL_URL})` }}
    >
      {children}
    </section>
  );
}

function PageHeader({ title, marks }) {
  return (
    <div className="pdf-page-question-header">
      <p style={{ margin: 0, color: 'black', fontWeight: 700, fontSize: '14pt' }}>{title}</p>
      <p style={{ margin: 0, color: '#555', fontSize: '11pt' }}>
        ({marks} mark{marks === 1 ? '' : 's'})
      </p>
    </div>
  );
}

function CoverPage({ questionCount, totalMarks }) {
  return (
    <A4Page isCover>
      <div style={{ borderBottom: '2px solid #333', paddingBottom: '20px', marginBottom: '30px' }}>
        <h2
          style={{
            textAlign: 'center',
            margin: '0 0 20px 0',
            color: 'black',
            fontSize: '20pt',
            fontWeight: 'bold',
          }}
        >
          Physics Examination
        </h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ width: '50%', verticalAlign: 'top', padding: '5px' }}>
                {['Candidate Name:', 'Candidate Number:'].map((label, index) => (
                  <div
                    key={label}
                    style={{
                      color: 'black',
                      margin: index === 0 ? '0 0 14px 0' : 0,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                    }}
                  >
                    <span style={{ minWidth: '190px', fontWeight: 700 }}>{label}</span>
                    <span
                      style={{
                        display: 'block',
                        flex: 1,
                        minWidth: '220px',
                        borderBottom: '2px solid #333',
                        height: 0,
                      }}
                    />
                  </div>
                ))}
              </td>
              <td
                style={{ width: '50%', verticalAlign: 'top', padding: '5px', textAlign: 'right' }}
              >
                <p style={{ color: 'black', margin: '0 0 10px 0' }}>
                  <strong>Total Questions:</strong> {questionCount}
                </p>
                <p style={{ color: 'black', margin: '0 0 10px 0' }}>
                  <strong>Total Marks:</strong> {totalMarks}
                </p>
                <p style={{ color: 'black', margin: 0 }}>
                  <strong>Date:</strong> {new Date().toLocaleDateString()}
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div
        style={{
          marginBottom: '20px',
          padding: '15px',
          border: '2px solid #ddd',
          borderRadius: '5px',
        }}
      >
        <p style={{ margin: '0 0 10px 0', color: 'black' }}>
          <strong>Instructions:</strong>
        </p>
        <ul style={{ margin: 0, paddingLeft: '25px', color: 'black' }}>
          <li style={{ marginBottom: '5px' }}>Answer all questions in the spaces provided</li>
          <li style={{ marginBottom: '5px' }}>Show all your working</li>
          <li>The marks for each question are shown in brackets</li>
        </ul>
      </div>
    </A4Page>
  );
}

function QuestionPages({ question, index, images, markSchemeImages, includeMarkSchemes }) {
  const label = `Q${index + 1}`;
  const pages = [];

  if (images.length > 0) {
    images.forEach((src, pageIndex) => {
      pages.push(
        <A4Page key={src}>
          {pageIndex === 0 ? <PageHeader title={label} marks={question.marks} /> : null}
          <img
            className="pdf-page-image"
            src={src}
            alt={`Question ${index + 1} page ${pageIndex + 1}`}
          />
        </A4Page>,
      );
    });
  } else {
    // Text-only question: render the stem and ruled answer space instead.
    pages.push(
      <A4Page key={`${question.id}-text`}>
        <PageHeader title={label} marks={question.marks} />
        <div style={{ color: 'black' }}>
          <div dangerouslySetInnerHTML={{ __html: formatMCQ(question.questionText || '') }} />
          <AnswerSpace marks={question.marks} questionType={question.questionType} />
        </div>
      </A4Page>,
    );
  }

  if (includeMarkSchemes) {
    const msTitle = `${label} — Mark Scheme`;
    const text = String(question.markScheme || '').trim();

    if (markSchemeImages.length > 0) {
      markSchemeImages.forEach((src, msIndex) => {
        pages.push(
          <A4Page key={src}>
            {msIndex === 0 ? <PageHeader title={msTitle} marks={question.marks} /> : null}
            <img
              className="pdf-page-image"
              src={src}
              alt={`${label} mark scheme page ${msIndex + 1}`}
            />
          </A4Page>,
        );
      });
    } else if (text) {
      pages.push(
        <A4Page key={`${question.id}-ms-text`}>
          <PageHeader title={msTitle} marks={question.marks} />
          <div style={{ color: '#000' }} dangerouslySetInnerHTML={{ __html: formatMarkScheme(text) }} />
        </A4Page>,
      );
    }
  }

  return pages;
}

/**
 * Full-screen worksheet preview. Each section is a real A4 page so what a
 * teacher sees on screen matches the generated PDF page for page.
 */
export default function WorksheetModal({
  questions,
  includeMarkSchemes,
  onIncludeMarkSchemesChange,
  getQuestionImages,
  getMarkSchemeImages,
  onDownloadWorksheet,
  onDownloadMarkScheme,
  onClose,
}) {
  const open = questions.length > 0;

  // The modal is the only scroll container while it is open, otherwise Chrome
  // paints a second scrollbar for the page underneath.
  useEffect(() => {
    if (!open) return undefined;

    const { body, documentElement } = document;
    body.style.overflow = 'hidden';
    documentElement.style.overflow = 'hidden';

    return () => {
      body.style.overflow = '';
      documentElement.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="worksheet-modal" id="worksheetModal" data-open="true">
      <div className="worksheet-content" id="worksheetContentWrapper">
        <span className="close-modal" role="button" tabIndex={0} onClick={onClose}>
          ×
        </span>

        <div className="worksheetTopBar">
          <label className="markschemeToggle">
            <input
              id="includeMarkSchemes"
              type="checkbox"
              checked={includeMarkSchemes}
              onChange={(event) => onIncludeMarkSchemesChange(event.target.checked)}
            />
            Show Answers (Mark Scheme)
          </label>
        </div>

        <div id="worksheetContent">
          <div style={{ width: '100%', padding: 0, margin: 0 }}>
            <CoverPage questionCount={questions.length} totalMarks={totalMarksOf(questions)} />
            {questions.map((question, index) => (
              <QuestionPages
                key={question.id}
                question={question}
                index={index}
                images={getQuestionImages(question.id)}
                markSchemeImages={getMarkSchemeImages(question.id)}
                includeMarkSchemes={includeMarkSchemes}
              />
            ))}
          </div>
        </div>

        <div className="worksheetActions">
          <div className="row primaryRow">
            <button type="button" className="btn-primary" onClick={onDownloadWorksheet}>
              📥 Download Worksheet (PDF)
            </button>
            <button type="button" className="btn-primary" onClick={onDownloadMarkScheme}>
              📝 Download Markscheme (PDF)
            </button>
          </div>
          <div className="row secondaryRow" style={{ display: 'flex', justifyContent: 'center' }}>
            <button
              type="button"
              className="btn-secondary"
              style={{ maxWidth: '300px', width: '100%' }}
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
