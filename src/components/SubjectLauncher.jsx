import BoardLogo from './BoardLogo';
import Icon from './Icon';
import { BOARDS, LEVELS, SUBJECTS } from '../lib/brand';


function StepLabel({ number, title, hint }) {
  return (
    <div className="step-label">
      <span className="step-number">{number}</span>
      <h2>
        {title} {hint ? <span className="hint">{hint}</span> : null}
      </h2>
    </div>
  );
}

function Availability({ count }) {
  return count > 0 ? (
    <span className="tag tag-live">{count} questions</span>
  ) : (
    <span className="tag tag-build">In build</span>
  );
}

/**
 * The way in: subject, then level, then exam board. Everything Akbar Academy
 * teaches is shown, including the banks still being loaded, so the tool never
 * looks like a Physics-only tool.
 */
export default function SubjectLauncher({ course, catalogue, loading, onChange, onOpen }) {
  const { subject, level, board } = course;

  const courseCount =
    subject && level && board ? catalogue.courseCount(subject, level, board) : 0;

  return (
    <section className="launcher">
      <div className="launcher-head">
        <span className="eyebrow">
          <Icon name="sparkle" size={14} /> Akbar Academy Quiz Wizard
        </span>
        <h1>
          Real past paper questions, <span>a worksheet in a minute</span>
        </h1>
        <p>
          Pick a course, filter by topic, difficulty or marks, then generate a worksheet and mark
          scheme ready to set or to sit. Every question comes from a real Cambridge, Edexcel or AQA
          paper.
        </p>
      </div>

      <div className="step">
        <StepLabel number="1" title="Choose a subject" />
        <div className="subject-grid">
          {SUBJECTS.map((item) => {
            const count = catalogue.subjectCount(item.id);
            const locked = !loading && count === 0;
            return (
              <button
                key={item.id}
                type="button"
                className={[
                  'subject-card',
                  subject === item.id ? 'is-active' : '',
                  locked ? 'is-locked' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                style={{ '--accent': item.accent }}
                disabled={locked}
                aria-pressed={subject === item.id}
                onClick={() => onChange('subject', item.id)}
              >
                <span className="subject-mascot">
                  <img src={item.icon} alt="" width="600" height="600" />
                </span>
                <span className="subject-name">{item.name}</span>
                <span className="subject-meta">IGCSE · AS · A2</span>
                <Availability count={count} />
              </button>
            );
          })}
        </div>
      </div>

      {subject ? (
        <div className="step">
          <StepLabel number="2" title="Choose a level" />
          <div className="chip-row">
            {LEVELS.map((item) => {
              const count = catalogue.levelCount(item.id, subject);
              const locked = count === 0;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={[
                    'chip',
                    level === item.id ? 'is-active' : '',
                    locked ? 'is-locked' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  disabled={locked}
                  aria-pressed={level === item.id}
                  onClick={() => onChange('level', item.id)}
                >
                  {locked ? <Icon name="lock" size={14} /> : null}
                  {item.name}
                  <span className="count">{locked ? 'in build' : `${count}`}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {subject && level ? (
        <div className="step">
          <StepLabel number="3" title="Choose an exam board" />
          <div className="board-grid">
            {BOARDS.map((item) => {
              const count = catalogue.boardCount(item.id, subject, level);
              const locked = count === 0;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={[
                    'board-card',
                    board === item.id ? 'is-active' : '',
                    locked ? 'is-locked' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  disabled={locked}
                  aria-pressed={board === item.id}
                  onClick={() => onChange('board', item.id)}
                >
                  <BoardLogo board={item} />
                  <span>
                    <span className="board-name">{item.full}</span>
                    <br />
                    <span className="board-meta">
                      {locked ? 'Question bank in build' : `${count} questions loaded`}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="launcher-go">
        <button
          type="button"
          className="btn btn-primary"
          disabled={courseCount === 0}
          onClick={onOpen}
        >
          Open the question bank
          <Icon name="arrowRight" size={18} />
        </button>
        <span className="note">
          {courseCount > 0
            ? `${courseCount} questions ready in this course`
            : subject && level && board
              ? 'No questions in this course yet'
              : 'Pick a subject, level and board to continue'}
        </span>
      </div>
    </section>
  );
}
