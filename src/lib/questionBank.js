/** Pure helpers over the question bank. No React, no DOM. */

import { BOARDS, LEVELS, SUBJECTS, boardOf, levelOf, subjectOf } from './brand';

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
 * Counts what the loaded bank actually holds for every subject, level and
 * board in the academy catalogue. Combinations with a count of zero are the
 * ones still being built, and the launcher shows them as such.
 */
export function buildCatalogue(questions) {
  const bySubject = {};
  const byLevel = {};
  const byBoard = {};
  const byCourse = {};

  SUBJECTS.forEach((s) => {
    bySubject[s.id] = 0;
  });
  LEVELS.forEach((l) => {
    byLevel[l.id] = {};
  });
  BOARDS.forEach((b) => {
    byBoard[b.id] = {};
  });

  questions.forEach((question) => {
    const subject = subjectOf(question);
    const level = levelOf(question);
    const board = boardOf(question);

    bySubject[subject] = (bySubject[subject] || 0) + 1;

    byLevel[level] = byLevel[level] || {};
    byLevel[level][subject] = (byLevel[level][subject] || 0) + 1;

    byBoard[board] = byBoard[board] || {};
    const boardKey = `${subject}|${level}`;
    byBoard[board][boardKey] = (byBoard[board][boardKey] || 0) + 1;

    const courseKey = `${subject}|${level}|${board}`;
    byCourse[courseKey] = (byCourse[courseKey] || 0) + 1;
  });

  return {
    subjectCount: (subject) => bySubject[subject] || 0,
    levelCount: (level, subject) => (byLevel[level] && byLevel[level][subject]) || 0,
    boardCount: (board, subject, level) =>
      (byBoard[board] && byBoard[board][`${subject}|${level}`]) || 0,
    courseCount: (subject, level, board) => byCourse[`${subject}|${level}|${board}`] || 0,
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

/**
 * Paper and topic options depend on the selected syllabus: picking a syllabus
 * narrows both lists to what that syllabus actually contains.
 */
export function dependentOptions(questions, syllabus) {
  const source = syllabus ? questions.filter((q) => q.syllabus === syllabus) : questions;
  return {
    papers: [...new Set(source.map((q) => q.paper).filter(Boolean))].sort(),
    topics: [...new Set(source.map((q) => q.topic).filter(Boolean))].sort(),
  };
}

export function pluraliseMarks(marks) {
  return `${marks} mark${marks === 1 ? '' : 's'}`;
}
