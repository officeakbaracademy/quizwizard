/** The cyan "Rendering Q3 page 1 of 2..." box shown while a PDF is being built. */
export default function PdfProgressOverlay({ icon, message }) {
  if (!message) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        background: 'rgba(0, 217, 255, 0.95)',
        color: 'white',
        padding: '30px 50px',
        borderRadius: '10px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        zIndex: 10000,
        fontSize: '16px',
        fontWeight: 600,
        textAlign: 'center',
      }}
    >
      <div style={{ marginBottom: '10px' }}>{icon}</div>
      <div>{message}</div>
    </div>
  );
}
