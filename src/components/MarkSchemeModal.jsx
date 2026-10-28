import Icon from './Icon';
import { formatMarkScheme } from '../lib/markScheme';
import { pluraliseMarks } from '../lib/questionBank';

/** Shows the cropped mark scheme pages when they exist, otherwise the text version. */
export default function MarkSchemeModal({ question, images, onClose }) {
  if (!question) return null;

  const text = String(question.markScheme || '').trim();

  return (
    <div className="modal" id="markschemeModal" role="dialog" aria-modal="true">
      <div className="modal-card">
        <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
          <Icon name="close" size={18} />
        </button>

        <div className="modal-head">
          <div>
            <p className="modal-title">
              Mark scheme · {question.paper} · Q{question.questionNumber}
              {question.part || ''}
            </p>
            <p className="modal-meta">
              {[question.topic, question.questionType, pluraliseMarks(question.marks)]
                .filter(Boolean)
                .join(' · ')}
            </p>
          </div>
        </div>

        <div className="modal-body">
          {images.length > 0 ? (
            <div className="scan">
              {images.map((src, index) => (
                <img key={src} src={src} alt={`Mark scheme page ${index + 1}`} />
              ))}
            </div>
          ) : text ? (
            <div dangerouslySetInnerHTML={{ __html: formatMarkScheme(text) }} />
          ) : (
            <p>
              <em>No mark scheme has been added for this question yet.</em>
            </p>
          )}
        </div>

        <div className="modal-foot">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
