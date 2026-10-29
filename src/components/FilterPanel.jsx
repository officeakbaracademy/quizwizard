import Icon from './Icon';
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
 * "Apply filters" is pressed, matching the original tool's behaviour.
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
    <section className="panel">
      <div className="panel-head">
        <h3>Narrow the question bank</h3>
      </div>

      <div className="panel-body">
        <div className="filter-section">
          {syllabuses.length > 1 ? (
            <FilterSelect
              id="syllabusFilter"
              label="Syllabus"
              value={filters.syllabus}
              placeholder="All syllabuses"
              options={syllabuses}
              onChange={(value) => onChange('syllabus', value)}
            />
          ) : null}
          <FilterSelect
            id="paperFilter"
            label="Paper"
            value={filters.paper}
            placeholder="All papers"
            options={papers}
            onChange={(value) => onChange('paper', value)}
          />
          <FilterSelect
            id="topicFilter"
            label="Topic"
            value={filters.topic}
            placeholder="All topics"
            options={topics}
            onChange={(value) => onChange('topic', value)}
          />
          <FilterSelect
            id="difficultyFilter"
            label="Difficulty"
            value={filters.difficulty}
            placeholder="All difficulties"
            options={DIFFICULTIES}
            onChange={(value) => onChange('difficulty', value)}
          />
        </div>

        <div className="button-group">
          <button type="button" className="btn btn-primary" onClick={onApply}>
            <Icon name="filter" size={17} />
            Apply filters
          </button>
          <button type="button" className="btn btn-secondary" onClick={onReset}>
            <Icon name="reset" size={17} />
            Reset
          </button>
        </div>
      </div>
    </section>
  );
}
