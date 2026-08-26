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
            <th>Preview</th>
            <th>Topic</th>
            <th>Difficulty</th>
            <th>Marks</th>
            <th>Marking Scheme</th>
          </tr>
        </thead>
        <tbody id="questionsBody">
          {questions.length === 0 ? (
            <tr>
              <td colSpan={7} className="no-results">
                No questions match your filters
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
                  <td>{question.paper}</td>
                  <td>
                    <button
                      type="button"
                      className="asset-btn"
                      title="Question Preview"
                      onClick={() => onPreview(question)}
                    >
                      📄
                    </button>
                  </td>
                  <td>{question.topic}</td>
                  <td>
                    <span className={`badge badge-${String(question.difficulty).toLowerCase()}`}>
                      {question.difficulty}
                    </span>
                  </td>
                  <td>
                    <strong>{question.marks}</strong>
                  </td>
                  <td>
                    <span className="asset-icons">
                      {hasMarkScheme(question) ? (
                        <button
                          type="button"
                          className="asset-btn"
                          title="View marking scheme"
                          onClick={() => onViewMarkScheme(question)}
                        >
                          📝
                        </button>
                      ) : null}
                    </span>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
