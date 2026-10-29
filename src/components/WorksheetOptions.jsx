import Icon from './Icon';

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
    <section className="panel">
      <div className="panel-head">
        <h3>Build a worksheet</h3>
      </div>

      <div className="panel-body">
        <div className="option-card">
          <label htmlFor="targetMarks">
            By target marks
          </label>
          <div className="option-row">
            <input
              id="targetMarks"
              className="field"
              type="number"
              min="1"
              placeholder="e.g. 40"
              value={targetMarks}
              onChange={(event) => onTargetMarksChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') onGenerateByMarks();
              }}
            />
            <button type="button" className="btn btn-primary" onClick={onGenerateByMarks}>
              Generate
            </button>
          </div>
          <small className="option-hint">
            Picks questions at random from the filtered list until it reaches the target.
          </small>
        </div>

        <div className="option-card">
          <label>
            From the questions you tick
          </label>
          <div className="option-row">
            <div className={`selection-readout${selectedCount > 0 ? ' has-selection' : ''}`}>
              {selectedCount} selected, {selectedMarks} marks
            </div>
            <button type="button" className="btn btn-gold" onClick={onGenerateFromSelection}>
              Create
            </button>
          </div>
          <small className="option-hint">
            Tick rows in the table below to build the worksheet by hand.
          </small>
        </div>
      </div>
    </section>
  );
}
