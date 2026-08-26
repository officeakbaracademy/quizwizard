import { DIFFICULTIES } from '../lib/questionBank';

function FilterSelect({ id, label, value, placeholder, options, onChange }) {
  return (
    <div className="filter-group">
      <label htmlFor={id}>{label}</label>
      <select id={id} value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

/**
 * The filter dropdowns are a draft: nothing changes in the table until
 * "Apply Filters" is pressed, matching the original tool's behaviour.
 * Choosing a syllabus does immediately narrow the paper and topic lists.
 */
export default function FilterPanel({
  filters,
  syllabuses,
  papers,
  topics,
  onChange,
  onApply,
  onReset,
}) {
  return (
    <>
      <div className="filter-section">
        <FilterSelect
          id="syllabusFilter"
          label="Syllabus"
          value={filters.syllabus}
          placeholder="All Syllabuses"
          options={syllabuses}
          onChange={(value) => onChange('syllabus', value)}
        />
        <FilterSelect
          id="paperFilter"
          label="Paper"
          value={filters.paper}
          placeholder="All Papers"
          options={papers}
          onChange={(value) => onChange('paper', value)}
        />
        <FilterSelect
          id="topicFilter"
          label="Topic"
          value={filters.topic}
          placeholder="All Topics"
          options={topics}
          onChange={(value) => onChange('topic', value)}
        />
        <FilterSelect
          id="difficultyFilter"
          label="Difficulty"
          value={filters.difficulty}
          placeholder="All Difficulties"
          options={DIFFICULTIES}
          onChange={(value) => onChange('difficulty', value)}
        />
      </div>

      <div className="button-group">
        <button type="button" className="btn-primary" onClick={onApply}>
          Apply Filters
        </button>
        <button
          type="button"
          className="btn-secondary"
          style={{ maxWidth: '300px', width: '100%' }}
          onClick={onReset}
        >
          Reset Filters
        </button>
      </div>
    </>
  );
}
