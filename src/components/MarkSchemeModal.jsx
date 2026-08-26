import { formatMarkScheme } from '../lib/markScheme';
import { pluraliseMarks } from '../lib/questionBank';

/** Shows the cropped mark scheme pages when they exist, otherwise the text version. */
export default function MarkSchemeModal({ question, images, onClose }) {
  if (!question) return null;

  const text = String(question.markScheme || '').trim();

  return (
    <div className="markscheme-modal" id="markschemeModal" style={{ display: 'flex' }}>
      <div className="markscheme-content">
        <span className="markscheme-close" role="button" tabIndex={0} onClick={onClose}>
          ×
        </span>

        <div className="markscheme-header">
          <p className="markscheme-title" id="markschemeTitle">
            Mark Scheme – {question.paper} – Q{question.questionNumber}
            {question.part || ''}
          </p>
          <p className="markscheme-meta" id="markschemeMeta">
            {question.topic} • {question.questionType} • {pluraliseMarks(question.marks)}
          </p>
        </div>

        <div className="markscheme-body" id="markschemeBody">
          {images.length > 0 ? (
            images.map((src, index) => (
              <img
                key={src}
                src={src}
                alt={`Mark scheme page ${index + 1}`}
                style={{
                  display: 'block',
                  maxWidth: '100%',
                  margin: '0 auto 16px auto',
                  background: 'white',
                }}
              />
            ))
          ) : text ? (
            <div dangerouslySetInnerHTML={{ __html: formatMarkScheme(text) }} />
          ) : (
            <p>
              <em>No mark scheme has been added for this question yet.</em>
            </p>
          )}
        </div>

        <div style={{ marginTop: '20px', textAlign: 'center' }}>
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
  );
}
