import { useCallback, useEffect, useState } from 'react';

export type ApiResource<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
};

function messageFrom(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'Something went wrong. Please try again.';
}

export function useApiResource<T>(
  loader: () => Promise<T>,
): ApiResource<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let active = true;
    void Promise.resolve()
      .then(() => {
        if (active) {
          setLoading(true);
          setError(null);
        }
        return loader();
      })
      .then((result) => {
        if (active) {
          setData(result);
          setError(null);
          setLoading(false);
        }
      })
      .catch((loadError: unknown) => {
        if (active) {
          setError(messageFrom(loadError));
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [loader, revision]);

  const reload = useCallback(() => {
    setLoading(true);
    setError(null);
    setRevision((value) => value + 1);
  }, []);

  return { data, loading, error, reload };
}
