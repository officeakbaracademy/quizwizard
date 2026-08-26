import { request } from './client';

/**
 * A question record, as returned by both the static snapshot and the API:
 *
 *   {
 *     id, board, level, syllabus, paper, topic,
 *     questionNumber, part, questionType, ao, difficulty,
 *     marks, questionText, markScheme
 *   }
 */
export function fetchQuestions({ signal } = {}) {
  return request('/questions', {
    staticPath: '/data/questions.json',
    signal,
  });
}

/** questionId -> array of image URLs (one per page of the original paper). */
export function fetchQuestionImages({ signal } = {}) {
  return request('/questions/images', {
    staticPath: '/data/question-images.json',
    signal,
  });
}

/** questionId -> array of mark scheme image URLs. Only some questions have them. */
export function fetchMarkSchemeImages({ signal } = {}) {
  return request('/questions/markscheme-images', {
    staticPath: '/data/markscheme-images.json',
    signal,
  });
}

/** Loads everything the question bank needs in one go. */
export async function fetchQuestionBank({ signal } = {}) {
  const [questions, questionImages, markSchemeImages] = await Promise.all([
    fetchQuestions({ signal }),
    fetchQuestionImages({ signal }),
    fetchMarkSchemeImages({ signal }),
  ]);

  return { questions, questionImages, markSchemeImages };
}
