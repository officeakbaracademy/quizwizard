import { pluraliseMarks } from '../lib/questionBank';

/** Read-only look at a question's scanned pages, or its text if there are none. */
export default function PreviewModal({ question, images, onClose }) {
  if (!question) return null;

  return (
    <div className="preview-modal" id="previewModal" style={{ display: 'flex' }}>
      <div className="preview-content">
        <span className="preview-close" role="button" tabIndex={0} onClick={onClose}>
          ×
        </span>

        <div className="preview-header">
          <p className="preview-title" id="previewTitle">
            Question Preview – {question.paper} – Q{question.questionNumber}
            {question.part || ''}
          </p>
          <p className="preview-meta" id="previewMeta">
            {question.topic} • {question.difficulty} • {pluraliseMarks(question.marks)}
          </p>
        </div>

        <div className="preview-body" id="previewBody">
          {images.length > 0 ? (
            <div style={{ background: 'white' }}>
              {images.map((src, index) => (
                <div
                  key={src}
                  style={{
                    margin: index === 0 ? '0' : '4px 0 0 0',
                    textAlign: 'center',
                    background: 'white',
                  }}
                >
                  <img
                    src={src}
                    alt={`Question preview image ${index + 1}`}
                    style={{
                      display: 'block',
                      width: '100%',
                      height: 'auto',
                      margin: '0 auto',
                      border: 'none',
                      background: 'white',
                    }}
                  />
                </div>
              ))}
            </div>
          ) : question.questionText ? (
            <div dangerouslySetInnerHTML={{ __html: question.questionText }} />
          ) : (
            <p>
              <em>No question text has been added for this question yet.</em>
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
