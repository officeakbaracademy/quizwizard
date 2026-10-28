import { pickBackendQuestionsByMarks, sortBackendQuestionsByMarks } from './backendQuestions';

/**
 * Worksheet actions the backend does, through the search API's target_marks
 * and sort_by options. (The worksheet and mark scheme PDFs are made in the
 * frontend from API data, as the backend team asked.)
 */

/**
 * Picks questions for a worksheet that add up to `targetMarks`.
 * filters: the applied { syllabus, paper, topic, difficulty }.
 * questions: the ones loaded for the chosen course.
 * Resolves to { ids, selectedMarks, targetReached }.
 */
export async function pickQuestionsByMarks({ filters, questions, targetMarks }) {
  return pickBackendQuestionsByMarks(filters, questions, targetMarks);
}

/** The filtered questions ordered by marks, highest first. Resolves to question ids. */
export async function sortQuestionsByMarks({ filters, questions }) {
  return sortBackendQuestionsByMarks(filters, questions);
}
