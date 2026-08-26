import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchQuestionBank } from '../api/questions';

const EMPTY = [];

/**
 * Loads the question bank once and exposes it alongside the image lookups.
 * Swapping the static JSON for a live API happens entirely inside
 * `fetchQuestionBank`, so nothing here changes when the backend arrives.
 */
export function useQuestionBank() {
  const [state, setState] = useState({
    questions: EMPTY,
    questionImages: {},
    markSchemeImages: {},
    loading: true,
    error: null,
  });

  const load = useCallback(() => {
    const controller = new AbortController();

    setState((previous) => ({ ...previous, loading: true, error: null }));

    fetchQuestionBank({ signal: controller.signal })
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
  }, []);

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
