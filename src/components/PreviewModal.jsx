import { useEffect } from 'react';
import Icon from './Icon';
import { pluraliseMarks } from '../lib/questionBank';

/** Read-only look at a question's scanned pages, or its text if there are none. */
export default function PreviewModal({ question, images, onClose }) {
  // Esc closes it, the same as the X.
  useEffect(() => {
    if (!question) return undefined;
    const onKey = (event) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [question, onClose]);

  if (!question) return null;

  return (
    // Clicking the dimmed background closes it; clicks inside the card don't.
    <div className="modal" id="previewModal" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="modal-card" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
          <Icon name="close" size={18} />
        </button>

        <div className="modal-head">
          <div>
            <p className="modal-title">
              {question.paper} Q{question.questionNumber}
              {question.part || ''}
            </p>
            <p className="modal-meta">
              {[question.topic, question.difficulty, pluraliseMarks(question.marks)]
                .filter(Boolean)
                .join(', ')}
            </p>
          </div>
        </div>

        <div className="modal-body">
          {images.length > 0 ? (
            <div className="scan">
              {images.map((src, index) => (
                <img key={src} src={src} alt={`Question page ${index + 1}`} />
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

      </div>
    </div>
  );
}
