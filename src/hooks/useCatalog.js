import { useCallback, useEffect, useState } from 'react';
import { fetchCatalog } from '../api/questions';
import { fetchStudentCourses } from '../api/student';

/**
 * Loads the catalog once: which boards, levels and courses Quiz Wizard
 * offers, with each course's question count, papers and topics. At the same
 * time it asks the school's server which courses this student has
 * (catalog.student; null when there is no student to check).
 */
export function useCatalog() {
  const [state, setState] = useState({ catalog: null, loading: true, error: null });

  const load = useCallback(() => {
    const controller = new AbortController();
    setState((previous) => ({ ...previous, loading: true, error: null }));

    const student = fetchStudentCourses({ signal: controller.signal }).catch((error) => {
      // Marked so the page can say it was the student check that failed.
      error.studentCheck = true;
      throw error;
    });

    Promise.all([fetchCatalog({ signal: controller.signal }), student])
      .then(([catalog, courses]) => setState({ catalog: { ...catalog, student: courses }, loading: false, error: null }))
      .catch((error) => {
        if (error?.name === 'AbortError') return;
        console.error('Failed to load the catalog:', error);
        setState({ catalog: null, loading: false, error });
      });

    return () => controller.abort();
  }, []);

  useEffect(load, [load]);

  return { ...state, reload: load };
}
