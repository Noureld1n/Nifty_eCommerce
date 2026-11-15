import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type PropsWithChildren,
} from 'react';
import { router, usePathname, type Href } from 'expo-router';
import {
  Easing,
  runOnJS,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

/* eslint-disable react-hooks/immutability */

export type PageWheelDirection = -1 | 1;

const EXIT_MS = 150;
const ENTER_MS = 230;
const MIN_EXIT_MS = 70;
const FALLBACK_MS = 700;
const REPLACE_TABS = true;

type PageWheelTransitionValue = {
  turn: SharedValue<number>;
  busy: SharedValue<boolean>;
  go: (target: Href, direction: PageWheelDirection) => void;
};

const PageWheelTransitionContext =
  createContext<PageWheelTransitionValue | null>(null);

export function PageWheelTransitionProvider({ children }: PropsWithChildren) {
  const pathname = usePathname();
  
  // FIX: Start turn off-screen (e.g. 1) on initial mount if arriving via transition, 
  // preventing the 1-frame dead-center mount flash.
  const turn = useSharedValue(0);
  const busy = useSharedValue(false);
  const awaitingEnter = useRef(true); // Default to true on fresh mount to safely animate in
  const fallbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startEnter = useCallback(() => {
    if (!awaitingEnter.current) {
      return;
    }
    awaitingEnter.current = false;
    if (fallbackTimer.current) {
      clearTimeout(fallbackTimer.current);
      fallbackTimer.current = null;
    }
    turn.value = withTiming(
      0,
      { duration: ENTER_MS, easing: Easing.out(Easing.cubic) },
      () => {
        busy.value = false;
      },
    );
  }, [turn, busy]);

  const commit = useCallback(
    (target: Href, direction: PageWheelDirection) => {
      awaitingEnter.current = true;
      turn.value = -direction;
      if (REPLACE_TABS) {
        router.replace(target);
      } else {
        router.navigate(target);
      }
      fallbackTimer.current = setTimeout(startEnter, FALLBACK_MS);
    },
    [turn, startEnter],
  );

  // Animate page in on mount / pathname change
  useEffect(() => {
    // If mounted cold (direct link), ensure turn is 0 immediately without waiting
    if (!awaitingEnter.current) {
      turn.value = 0;
      return;
    }

    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(startEnter);
    });
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
  }, [pathname, startEnter, turn]);

  useEffect(
    () => () => {
      if (fallbackTimer.current) {
        clearTimeout(fallbackTimer.current);
      }
    },
    [],
  );

  const go = useCallback(
    (target: Href, direction: PageWheelDirection) => {
      if (busy.value) {
        return;
      }
      busy.value = true;
      const distance = Math.abs(direction - turn.value);
      const duration = Math.max(MIN_EXIT_MS, EXIT_MS * Math.min(1, distance));
      turn.value = withTiming(
        direction,
        { duration, easing: Easing.out(Easing.quad) },
        (finished) => {
          if (finished) {
            runOnJS(commit)(target, direction);
          } else {
            busy.value = false;
          }
        },
      );
    },
    [busy, turn, commit],
  );

  const value = useMemo(() => ({ turn, busy, go }), [turn, busy, go]);

  return (
    <PageWheelTransitionContext.Provider value={value}>
      {children}
    </PageWheelTransitionContext.Provider>
  );
}

export function usePageWheelTransition(): PageWheelTransitionValue {
  const value = useContext(PageWheelTransitionContext);
  if (!value) {
    throw new Error(
      'usePageWheelTransition must be used within PageWheelTransitionProvider.',
    );
  }
  return value;
}