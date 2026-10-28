/** The box shown while a PDF is being built. */
export default function PdfProgressOverlay({ message }) {
  if (!message) return null;

  return (
    <div className="pdf-progress" role="status" aria-live="polite">
      <span className="spinner" />
      <span className="msg">{message}</span>
    </div>
  );
}
