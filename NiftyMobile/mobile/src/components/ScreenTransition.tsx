import { useEffect, useState, type PropsWithChildren } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  ReduceMotion,
} from 'react-native-reanimated';

// Set to false to switch the entrance off completely. Handy when testing
// whether this animation is the source of a flicker.
const ENABLED = true;
// An auth screen that appears within this time of another one closing counts
// as "moving between auth screens".
const SAME_FLOW_MS = 400;

let mountedAuthScreens = 0;
let lastAuthScreenClosedAt = 0;

// Animate only when arriving from OUTSIDE the auth screens (from the app, or
// when the app first opens). Moving between login, register and forgot
// password swaps instantly: those screens share the same background and logo,
// so replaying the entrance would only make them flicker.
function shouldAnimate() {
  if (!ENABLED) {
    return false;
  }
  // While a new screen renders, the screen it replaces is still mounted.
  if (mountedAuthScreens > 0) {
    return false;
  }
  return Date.now() - lastAuthScreenClosedAt > SAME_FLOW_MS;
}

const ENTERING = FadeInDown.duration(280)
  .easing(Easing.out(Easing.cubic))
  .reduceMotion(ReduceMotion.System);

/**
 * Wrap the content of an auth screen with this so it fades and rises into
 * place when you arrive from the app. Works on web and native, and is
 * skipped when the device asks for reduced motion.
 */
export function ScreenTransition({ children }: PropsWithChildren) {
  // Decided once, when the screen first renders.
  const [animate] = useState(shouldAnimate);

  useEffect(() => {
    mountedAuthScreens += 1;
    return () => {
      mountedAuthScreens -= 1;
      lastAuthScreenClosedAt = Date.now();
    };
  }, []);

  return (
    <Animated.View
      entering={animate ? ENTERING : undefined}
      style={styles.fill}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
});