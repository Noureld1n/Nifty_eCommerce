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

type PageWheelTransitionValue = {
  /** 0 = at rest, ±1 = swung fully off screen. Shared by every screen. */
  turn: SharedValue<number>;
  /** True while a spin out / spin in is running. */
  busy: SharedValue<boolean>;
  /** Spin the current page out, navigate, then spin the next page in. */
  go: (target: Href, direction: PageWheelDirection) => void;
};

const PageWheelTransitionContext =
  createContext<PageWheelTransitionValue | null>(null);

export function PageWheelTransitionProvider({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const turn = useSharedValue(0);
  const busy = useSharedValue(false);
  const awaitingEnter = useRef(false);
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

  // The old page has finished spinning out: park the incoming page off screen
  // on the opposite side, then change the route.
  const commit = useCallback(
    (target: Href, direction: PageWheelDirection) => {
      awaitingEnter.current = true;
      turn.value = -direction;
      // Replace, don't push: switching tabs must not build up history.
      router.replace(target);
      // Safety net in case the pathname never changes.
      fallbackTimer.current = setTimeout(startEnter, FALLBACK_MS);
    },
    [turn, startEnter],
  );

  // The new route is active: spin its page in.
  useEffect(() => {
    if (!awaitingEnter.current) {
      return;
    }
    // Wait two frames so the new screen has been laid out and painted
    // (parked off screen) before it starts spinning in.
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(startEnter);
    });
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
  }, [pathname, startEnter]);

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