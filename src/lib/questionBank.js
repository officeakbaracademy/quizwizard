/** Pure helpers over the question bank. No React, no DOM. */

import { boardOf, levelOf, subjectOf } from './brand';

export const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

export const EMPTY_FILTERS = {
  syllabus: '',
  paper: '',
  topic: '',
  difficulty: '',
};

export const EMPTY_COURSE = {
  subject: '',
  level: '',
  board: '',
};

/**
 * Papers are counted per uploaded paper, not per paper label, so two
 * uploads both called "Paper 2" count as two.
 */
export function getPaperInstanceKey(question) {
  // Each question carries the id of the paper it was uploaded with.
  return question.paperSetId;
}

export function summariseBank(questions) {
  return {
    totalQuestions: questions.length,
    totalMarks: questions.reduce((sum, q) => sum + (q.marks || 0), 0),
    papers: new Set(questions.map(getPaperInstanceKey)).size,
    topics: new Set(questions.map((q) => q.topic).filter(Boolean)).size,
  };
}

export function totalMarksOf(questions) {
  return questions.reduce((sum, q) => sum + (q.marks || 0), 0);
}

/* -------------------------------------------------------------------------- */
/* Course selection: subject, board and level                                 */
/* -------------------------------------------------------------------------- */

/**
 * The course picker's view of the catalog API: which subject, level and board
 * combinations exist, how many questions each has, and each course's paper
 * labels and topics (for the filter drop-downs). Anything with no questions
 * is shown as "in build".
 * catalog: what fetchCatalog returns, or null while it loads.
 */
export function buildCatalogue(catalog) {
  const courses = (catalog?.courses || []).map((course) => ({
    subject: subjectOf({ subject: course.name }),
    level: levelOf({ level: course.level }),
    board: boardOf({ board: course.board }),
    total: course.total || 0,
    papers: course.papers || [],
    topics: (course.topics || []).filter((t) => t.active !== false).map((t) => t.name),
  }));
  const count = (match) => courses.filter(match).reduce((sum, c) => sum + c.total, 0);

  return {
    subjectCount: (subject) => count((c) => c.subject === subject),
    courseCount: (subject, level, board) =>
      count((c) => c.subject === subject && c.level === level && c.board === board),
    course: (subject, level, board) =>
      courses.find((c) => c.subject === subject && c.level === level && c.board === board) || null,
  };
}

export function questionsForCourse(questions, { subject, level, board }) {
  if (!subject || !level || !board) return [];
  return questions.filter(
    (question) =>
      subjectOf(question) === subject &&
      levelOf(question) === level &&
      boardOf(question) === board,
  );
}

/* -------------------------------------------------------------------------- */
/* Filtering                                                                  */
/* -------------------------------------------------------------------------- */

export function uniqueSyllabuses(questions) {
  return [...new Set(questions.map((q) => q.syllabus).filter(Boolean))];
}

export function pluraliseMarks(marks) {
  return `${marks} mark${marks === 1 ? '' : 's'}`;
}
