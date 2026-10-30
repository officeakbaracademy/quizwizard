/**
 * The question bank: the catalog (what courses exist) and each course's
 * questions, from the backend's catalog and search APIs.
 *
 * A question record:
 *
 *   {
 *     id, board, level, syllabus, subject, paper, paperSetId,
 *     topic, questionNumber, part, questionType, ao, difficulty,
 *     marks, questionText, markScheme
 *   }
 */
export {
  fetchBackendQuestionBank as fetchQuestionBank,
  fetchCatalog,
  searchBackendQuestions,
} from './backendQuestions';
