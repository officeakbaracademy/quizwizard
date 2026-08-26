/** The two worksheet-generation cards: by target marks, and from ticked rows. */
export default function WorksheetOptions({
  targetMarks,
  onTargetMarksChange,
  onGenerateByMarks,
  selectedCount,
  selectedMarks,
  onGenerateFromSelection,
}) {
  return (
    <div className="selection-panel">
      <h3>📋 Worksheet Generation</h3>

      <div className="worksheet-options">
        <div className="option-card">
          <label htmlFor="targetMarks">🎯 Generate by Target Marks</label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              id="targetMarks"
              type="number"
              min="1"
              placeholder="Enter marks (e.g., 10)"
              value={targetMarks}
              onChange={(event) => onTargetMarksChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') onGenerateByMarks();
              }}
            />
            <button type="button" className="btn-success" onClick={onGenerateByMarks}>
              Generate
            </button>
          </div>
          <small style={{ color: '#888888', marginTop: '5px', display: 'block' }}>
            Randomly selects questions to reach target marks
          </small>
        </div>

        <div className="option-card">
          <label>✅ Create from Selected Questions</label>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div
              style={{
                flex: 1,
                padding: '10px',
                background: '#1a1a1a',
                borderRadius: '5px',
                textAlign: 'center',
                border: '1px solid #00d9ff',
              }}
            >
              <strong id="selectionInfo" style={{ color: '#00d9ff' }}>
                {selectedCount} questions ({selectedMarks} marks)
              </strong>
            </div>
            <button type="button" className="btn-success" onClick={onGenerateFromSelection}>
              Create
            </button>
          </div>
          <small style={{ color: '#888888', marginTop: '5px', display: 'block' }}>
            Select questions using checkboxes below
          </small>
        </div>
      </div>
    </div>
  );
}
