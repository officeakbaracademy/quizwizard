/** Pure helpers over the question bank. No React, no DOM. */

export const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

export const EMPTY_FILTERS = {
  syllabus: '',
  paper: '',
  topic: '',
  difficulty: '',
};

/**
 * Papers are counted per loaded paper file, not per paper label, so
 * "Paper 4 2021" and "Paper 4 2022" count as two.
 */
export function getPaperInstanceKey(question) {
  const tokenMatch = String(question.id || '').match(/_(\d{4}[A-Z]*)_Q\d+$/);
  const token = tokenMatch ? tokenMatch[1] : '';
  return `${question.paper}${token ? ` ${token}` : ''}`;
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

export function filterQuestions(questions, { syllabus, paper, topic, difficulty }) {
  return questions.filter(
    (q) =>
      (!syllabus || q.syllabus === syllabus) &&
      (!paper || q.paper === paper) &&
      (!topic || q.topic === topic) &&
      (!difficulty || q.difficulty === difficulty),
  );
}

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
    papers: [...new Set(source.map((q) => q.paper).filter(Boolean))],
    topics: [...new Set(source.map((q) => q.topic).filter(Boolean))].sort(),
  };
}

/**
 * Picks a random subset of `questions` whose marks add up to at most
 * `targetMarks`, stopping early on an exact hit.
 */
export function selectQuestionsForMarks(questions, targetMarks) {
  const shuffled = [...questions].sort(() => Math.random() - 0.5);
  const selected = [];
  let marks = 0;

  for (const question of shuffled) {
    if (marks + question.marks <= targetMarks) {
      selected.push(question);
      marks += question.marks;
    }
    if (marks === targetMarks) break;
  }

  return selected;
}

export function pluraliseMarks(marks) {
  return `${marks} mark${marks === 1 ? '' : 's'}`;
}
