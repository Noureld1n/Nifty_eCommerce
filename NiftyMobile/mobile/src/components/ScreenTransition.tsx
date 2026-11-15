import type { PropsWithChildren } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  ReduceMotion,
} from 'react-native-reanimated';

/**
 * Wrap the root content of a login / register / auth screen with this so the
 * screen fades and rises into place instead of popping in. Works on web and
 * native, and is skipped when the device asks for reduced motion.
 */
export function ScreenTransition({ children }: PropsWithChildren) {
  return (
    <Animated.View
      entering={FadeInDown.duration(280)
        .easing(Easing.out(Easing.cubic))
        .reduceMotion(ReduceMotion.System)}
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