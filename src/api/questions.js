/**
 * The question bank, loaded from the backend's search API.
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
  searchBackendQuestions,
} from './backendQuestions';
