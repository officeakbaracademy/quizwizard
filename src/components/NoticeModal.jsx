import { useEffect } from 'react';

// Small pop-up messages in the app's own style, in place of the browser's
// alert boxes. tone: 'warn' (yellow), 'error' (red) or 'info' (blue).

const ICONS = {
  warn: (
    <>
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
    </>
  ),
  error: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="m15 9-6 6M9 9l6 6" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
    </>
  ),
};

export default function NoticeModal({ notice, onClose }) {
  // Esc closes it, like the other pop-ups.
  useEffect(() => {
    if (!notice) return undefined;
    const onKey = (event) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [notice, onClose]);

  if (!notice) return null;
  const tone = notice.tone || 'warn';

  return (
    <div className="notice-backdrop" onClick={onClose}>
      <div
        className={`notice-card notice-${tone}`}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="notice-title"
        onClick={(event) => event.stopPropagation()}
      >
        <span className="notice-icon">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {ICONS[tone]}
          </svg>
        </span>
        <h2 id="notice-title" className="notice-title">
          {notice.title}
        </h2>
        {notice.message ? <p className="notice-message">{notice.message}</p> : null}
        {notice.detail ? <p className="notice-detail">{notice.detail}</p> : null}
        <button type="button" className="notice-btn" onClick={onClose} autoFocus>
          OK
        </button>
      </div>
    </div>
  );
}
