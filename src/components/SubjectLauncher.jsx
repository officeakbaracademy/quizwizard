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
 * The way in: subject, then exam board, then level, the same as the AI Tutor. Everything Akbar Academy
 * teaches is shown, including the banks still being loaded, so the tool never
 * looks like a Physics-only tool.
 */
export default function SubjectLauncher({ course, catalogue, loading, onChange, onOpen }) {
  const { subject, level, board } = course;

  const courseCount =
    subject && level && board ? catalogue.courseCount(subject, level, board) : 0;
  const picked = {
    subject: SUBJECTS.find((s) => s.id === subject),
    level: LEVELS.find((l) => l.id === level),
    board: BOARDS.find((b) => b.id === board),
  };

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
                <Availability count={count} />
              </button>
            );
          })}
        </div>
      </div>

      {subject ? (
        <div className="step">
          <StepLabel number="2" title="Choose an exam board" />
          <div className="chip-row">
            {BOARDS.map((item) => {
              // A board is open if any level of this subject has questions for it.
              const locked = LEVELS.every(
                (l) => catalogue.courseCount(subject, l.id, item.id) === 0,
              );
              return (
                <button
                  key={item.id}
                  type="button"
                  className={[
                    'chip',
                    board === item.id ? 'is-active' : '',
                    locked ? 'is-locked' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  disabled={locked}
                  aria-pressed={board === item.id}
                  onClick={() => onChange('board', item.id)}
                >
                  {item.full}
                  {locked ? <span className="chip-note">In build</span> : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {subject && board ? (
        <div className="step">
          <StepLabel number="3" title="Choose a level" />
          <div className="chip-row">
            {LEVELS.map((item) => {
              const locked = catalogue.courseCount(subject, item.id, board) === 0;
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
                  {item.name}
                  {locked ? <span className="chip-note">In build</span> : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Once the whole course is picked: a card for it, like the AI Tutor's
          book card, with the button on the right. */}
      {courseCount > 0 ? (
        <div className="launcher-go" style={{ '--accent': picked.subject?.accent }}>
          <span className="go-mascot">
            <img src={picked.subject?.icon} alt="" />
          </span>
          <span className="go-text">
            <span className="go-title">
              {picked.board?.name} {picked.level?.name} {picked.subject?.name}
            </span>
            <span className="go-meta">{picked.board?.full}</span>
          </span>
          <button type="button" className="go-btn" onClick={onOpen}>
            Open the question bank
          </button>
        </div>
      ) : null}
    </section>
  );
}
