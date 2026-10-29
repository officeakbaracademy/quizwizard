import Icon from './Icon';
import { getLevel, getSubject } from '../lib/brand';

/** The sticky reminder of which course is open, with the way back to the launcher. */
export default function CourseBar({ course, questionCount, onChange }) {
  const subject = getSubject(course.subject);
  const level = getLevel(course.level);

  if (!subject) return null;

  return (
    <div className="coursebar" style={{ '--accent': subject.accent }}>
      <span className="coursebar-mascot">
        <img src={subject.icon} alt="" width="600" height="600" />
      </span>

      <div className="coursebar-text">
        <div className="course-title">
          {level ? `${level.name} ` : ''}
          {subject.name}
        </div>
        <div className="course-sub">
          {course.board}, {questionCount} questions in this bank
        </div>
      </div>

      {/* On phones the button says just "Change", so it still reads as one. */}
      <button
        type="button"
        className="coursebar-btn"
        onClick={onChange}
        aria-label="Change course"
        title="Change course"
      >
        <Icon name="swap" size={16} />
        <span className="coursebar-btn-label">Change course</span>
        <span className="coursebar-btn-short">Change</span>
      </button>
    </div>
  );
}
