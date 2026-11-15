import { useEffect, useState } from 'react'

/**
 * Runs `fetcher` (wrap it in useCallback) whenever it changes or reload() is called.
 * Keeps the previous data on screen while the next page loads.
 */
export function useFetch(fetcher) {
  const [state, setState] = useState({ data: null, error: '', loading: true })
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let cancelled = false
    setState((s) => ({ ...s, loading: true, error: '' }))
    fetcher()
      .then((data) => { if (!cancelled) setState({ data, error: '', loading: false }) })
      .catch((err) => { if (!cancelled) setState({ data: null, error: err.message, loading: false }) })
    return () => { cancelled = true }
  }, [fetcher, tick])

  return { ...state, reload: () => setTick((t) => t + 1) }
}
