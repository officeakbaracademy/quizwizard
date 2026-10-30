import { useCallback, useEffect, useState } from 'react';
import { fetchCatalog } from '../api/questions';

/**
 * Loads the catalog once: which boards, levels and courses Quiz Wizard
 * offers, with each course's question count, papers and topics.
 */
export function useCatalog() {
  const [state, setState] = useState({ catalog: null, loading: true, error: null });

  const load = useCallback(() => {
    const controller = new AbortController();
    setState((previous) => ({ ...previous, loading: true, error: null }));

    fetchCatalog({ signal: controller.signal })
      .then((catalog) => setState({ catalog, loading: false, error: null }))
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
