import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import { ApiError, refreshSession, setAccessToken, setSessionHandlers } from '../api/client';
import { authApi } from '../api/authApi';
import type { AuthResponse, SessionUser } from '../api/types';

export type SessionStatus =
  | 'loading'
  | 'anonymous'
  | 'authenticated'
  | 'error';

export type SessionContextValue = {
  user: SessionUser | null;
  status: SessionStatus;
  bootError: string | null;
  notice: string;
  setNotice: (notice: string) => void;
  updateUser: (user: SessionUser) => void;
  login: (email: string, password: string) => Promise<SessionUser>;
  logout: () => Promise<void>;
  retryRestore: () => Promise<void>;
};

export const SessionContext = createContext<SessionContextValue | null>(null);

function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'Something went wrong. Please try again.';
}

function isUnauthorized(error: unknown): boolean {
  return error instanceof ApiError && (error.status === 401 || error.status === 403);
}

export function SessionProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [status, setStatus] = useState<SessionStatus>('loading');
  const [bootError, setBootError] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearSession = useCallback(() => {
    if (refreshTimer.current) {
      clearTimeout(refreshTimer.current);
      refreshTimer.current = null;
    }
    setAccessToken(null);
    setUser(null);
    setStatus('anonymous');
  }, []);

  const applySession = useCallback(
    (data: AuthResponse) => {
      if (refreshTimer.current) {
        clearTimeout(refreshTimer.current);
      }
      setAccessToken(data.token);
      setUser(data.user);
      setStatus('authenticated');
      setBootError(null);

      const delay = Math.max((data.expiresIn - 30) * 1000, 5000);
      refreshTimer.current = setTimeout(() => {
        refreshSession().catch((error: unknown) => {
          if (isUnauthorized(error)) {
            clearSession();
            setNotice('Your session ended. Please log in again.');
          } else {
            setNotice(errorMessage(error));
          }
        });
      }, delay);
    },
    [clearSession],
  );

  const restoreSession = useCallback(async (): Promise<unknown | null> => {
    try {
      await refreshSession();
      return null;
    } catch (error) {
      return error;
    }
  }, []);

  const handleRestoreError = useCallback(
    (error: unknown | null) => {
      if (!error) {
        return;
      }
      if (isUnauthorized(error)) {
        clearSession();
        return;
      }
      setBootError(errorMessage(error));
      setStatus('error');
    },
    [clearSession],
  );

  const retryRestore = useCallback(async () => {
    setStatus('loading');
    setBootError(null);
    handleRestoreError(await restoreSession());
  }, [handleRestoreError, restoreSession]);

  useEffect(() => {
    setSessionHandlers({
      refreshed: applySession,
      expired: () => {
        clearSession();
        setNotice('Your session ended. Please log in again.');
      },
    });
    void restoreSession().then(handleRestoreError);
    return () => {
      if (refreshTimer.current) {
        clearTimeout(refreshTimer.current);
      }
    };
  }, [applySession, clearSession, handleRestoreError, restoreSession]);

  const login = useCallback(
    async (email: string, password: string) => {
      setNotice('');
      const data = await authApi.login(email, password);
      applySession(data);
      return data.user;
    },
    [applySession],
  );

  const updateUser = useCallback((updatedUser: SessionUser) => {
    setUser(updatedUser);
  }, []);

  const logout = useCallback(async () => {
    let logoutError: string | null = null;
    try {
      await authApi.logout();
    } catch (error) {
      logoutError = errorMessage(error);
    } finally {
      clearSession();
    }

    if (logoutError) {
      setNotice(`Signed out on this device, but server logout failed: ${logoutError}`);
    } else {
      setNotice('');
    }
  }, [clearSession]);

  const value = useMemo(
    () => ({
      user,
      status,
      bootError,
      notice,
      setNotice,
      updateUser,
      login,
      logout,
      retryRestore,
    }),
    [user, status, bootError, notice, updateUser, login, logout, retryRestore],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}
