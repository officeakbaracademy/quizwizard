import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchQuestionBank } from '../api/questions';
import { getSubject } from '../lib/brand';

const EMPTY = [];

/**
 * Loads the chosen course's questions (and their image lookups) once the
 * subject, level and board are all picked. Nothing loads before that.
 * course: the app's ids, e.g. { subject: "physics", level: "IGCSE", board: "Cambridge" }.
 */
export function useQuestionBank(course) {
  const [state, setState] = useState({
    questions: EMPTY,
    questionImages: {},
    markSchemeImages: {},
    loading: false,
    error: null,
  });

  // The course in the API's own names, e.g. { subject: "Physics", ... }.
  const subjectName = getSubject(course.subject)?.name;
  const levelName = course.level;
  const boardName = course.board;

  const load = useCallback(() => {
    if (!subjectName || !levelName || !boardName) {
      setState({ questions: EMPTY, questionImages: {}, markSchemeImages: {}, loading: false, error: null });
      return undefined;
    }
    const controller = new AbortController();

    // Clear the last course's questions so they never show under this one.
    setState({ questions: EMPTY, questionImages: {}, markSchemeImages: {}, loading: true, error: null });

    fetchQuestionBank({
      signal: controller.signal,
      course: { subject: subjectName, level: levelName, board: boardName },
    })
      .then(({ questions, questionImages, markSchemeImages }) => {
        setState({
          questions,
          questionImages,
          markSchemeImages,
          loading: false,
          error: null,
        });
      })
      .catch((error) => {
        if (error?.name === 'AbortError') return;
        console.error('Failed to load the question bank:', error);
        setState({
          questions: EMPTY,
          questionImages: {},
          markSchemeImages: {},
          loading: false,
          error,
        });
      });

    return () => controller.abort();
  }, [subjectName, levelName, boardName]);

  useEffect(load, [load]);

  const getQuestionImages = useCallback(
    (questionId) => {
      const value = state.questionImages[questionId];
      if (!value) return EMPTY;
      return Array.isArray(value) ? value : [value];
    },
    [state.questionImages],
  );

  const getMarkSchemeImages = useCallback(
    (questionId) => {
      const value = state.markSchemeImages[questionId];
      if (!value) return EMPTY;
      return Array.isArray(value) ? value : [value];
    },
    [state.markSchemeImages],
  );

  const hasMarkScheme = useCallback(
    (question) =>
      Boolean(String(question.markScheme || '').trim()) ||
      getMarkSchemeImages(question.id).length > 0,
    [getMarkSchemeImages],
  );

  return useMemo(
    () => ({ ...state, reload: load, getQuestionImages, getMarkSchemeImages, hasMarkScheme }),
    [state, load, getQuestionImages, getMarkSchemeImages, hasMarkScheme],
  );
}
