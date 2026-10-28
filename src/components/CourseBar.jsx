import BoardLogo from './BoardLogo';
import Icon from './Icon';
import { getLevel, getSubject } from '../lib/brand';

/** The sticky reminder of which course is open, with the way back to the launcher. */
export default function CourseBar({ course, questionCount, onChange }) {
  const subject = getSubject(course.subject);
  const level = getLevel(course.level);

  if (!subject) return null;

  return (
    <div className="coursebar">
      <span className="coursebar-mascot">
        <img src={subject.icon} alt="" width="600" height="600" />
      </span>

      <div className="coursebar-text">
        <div className="course-title">
          {level ? `${level.name} ` : ''}
          {subject.name}
        </div>
        <div className="course-sub">
          {course.board} · {questionCount} questions in this bank
        </div>
      </div>

      <span className="coursebar-spacer" />

      <BoardLogo board={course.board} small />

      <button type="button" className="btn btn-secondary btn-sm" onClick={onChange}>
        <Icon name="swap" size={16} />
        Change course
      </button>
    </div>
  );
}
