import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { useColorScheme } from 'react-native';
import {
  themeFor,
  type AppTheme,
  type ColorScheme,
  type ThemePreference,
} from './theme';

const PREFERENCE_KEY = 'nifty.appearance';

type ThemeContextValue = {
  theme: AppTheme;
  preference: ThemePreference;
  ready: boolean;
  error: string;
  setPreference: (preference: ThemePreference) => Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function isThemePreference(value: string | null): value is ThemePreference {
  return value === 'system' || value === 'light' || value === 'dark';
}

export function ThemeProvider({ children }: PropsWithChildren) {
  const systemScheme = useColorScheme() ?? 'light';
  const [preference, setPreferenceState] =
    useState<ThemePreference>('system');
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(PREFERENCE_KEY)
      .then((storedPreference) => {
        if (active && isThemePreference(storedPreference)) {
          setPreferenceState(storedPreference);
        }
      })
      .catch((storageError: unknown) => {
        if (active) {
          const detail =
            storageError instanceof Error
              ? storageError.message
              : 'Unknown storage error';
          setError(`Appearance preference could not be loaded: ${detail}`);
        }
      })
      .finally(() => {
        if (active) {
          setReady(true);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const setPreference = useCallback(
    async (nextPreference: ThemePreference) => {
      try {
        await AsyncStorage.setItem(PREFERENCE_KEY, nextPreference);
        setPreferenceState(nextPreference);
        setError('');
      } catch (storageError) {
        const detail =
          storageError instanceof Error
            ? storageError.message
            : 'Unknown storage error';
        const message = `Appearance preference could not be saved: ${detail}`;
        setError(message);
        throw new Error(message);
      }
    },
    [],
  );

  // Until the saved preference has been read, always resolve to light so the
  // server-rendered HTML and the first client render match (no hydration
  // mismatch). Once `ready` flips to true, the real scheme is applied.
  const scheme: ColorScheme = !ready
    ? 'light'
    : preference === 'system'
      ? systemScheme
      : preference;
  const value = useMemo(
    () => ({
      theme: themeFor(scheme),
      preference,
      ready,
      error,
      setPreference,
    }),
    [scheme, preference, ready, error, setPreference],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme(): ThemeContextValue {
  const value = useContext(ThemeContext);
  if (!value) {
    throw new Error('useAppTheme must be used within ThemeProvider.');
  }
  return value;
}