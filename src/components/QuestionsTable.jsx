
export default function QuestionsTable({
  questions,
  selectedIds,
  allSelected,
  onToggleQuestion,
  onToggleSelectAll,
  onPreview,
  onViewMarkScheme,
  hasMarkScheme,
}) {
  return (
    <div className="table-container">
      <div className="table-scroll">
        <table id="questionsTable">
          <thead>
            <tr>
              <th className="checkbox-cell">
                <input
                  id="selectAll"
                  type="checkbox"
                  checked={allSelected}
                  onChange={(event) => onToggleSelectAll(event.target.checked)}
                  aria-label="Select all questions"
                />
              </th>
              <th>Paper</th>
              <th>Question</th>
              <th>Topic</th>
              <th>Type</th>
              <th>Difficulty</th>
              <th>Marks</th>
              <th>Question paper</th>
              <th>Mark scheme</th>
            </tr>
          </thead>
          <tbody id="questionsBody">
            {questions.length === 0 ? (
              <tr>
                <td colSpan={9} className="no-results">
                  No questions match these filters. Try widening the topic or difficulty.
                </td>
              </tr>
            ) : (
              questions.map((question) => {
                const selected = selectedIds.has(question.id);
                return (
                  <tr
                    key={question.id}
                    id={`row-${question.id}`}
                    className={selected ? 'selected-row' : ''}
                  >
                    <td className="checkbox-cell">
                      <input
                        type="checkbox"
                        id={`check-${question.id}`}
                        checked={selected}
                        onChange={() => onToggleQuestion(question.id)}
                        aria-label={`Select question ${question.questionNumber}`}
                      />
                    </td>
                    <td className="cell-paper">
                      <span className="paper-line">{question.paper}</span>
                    </td>
                    <td>
                      Q{question.questionNumber}
                      {question.part || ''}
                    </td>
                    <td className="cell-topic">{question.topic}</td>
                    <td>{question.questionType}</td>
                    <td>
                      <span className={`badge badge-${String(question.difficulty).toLowerCase()}`}>
                        {question.difficulty}
                      </span>
                    </td>
                    <td className="cell-marks">
                      <strong>{question.marks}</strong>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="asset-btn"
                        title="View the question"
                        aria-label={`View question ${question.questionNumber}`}
                        onClick={() => onPreview(question)}
                      >
                        View
                      </button>
                    </td>
                    <td>
                      <span className="asset-icons">
                        {hasMarkScheme(question) ? (
                          <button
                            type="button"
                            className="asset-btn is-gold"
                            title="View the mark scheme"
                            aria-label={`View the mark scheme for question ${question.questionNumber}`}
                            onClick={() => onViewMarkScheme(question)}
                          >
                            View
                          </button>
                        ) : (
                          <span className="asset-empty">Not added</span>
                        )}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
