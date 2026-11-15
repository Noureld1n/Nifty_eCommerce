import { Platform } from 'react-native';

export type CylinderMotion = {
  rotateX: string;
  translateY: number;
  translateZ: number;
};

const IS_WEB = Platform.OS === 'web';

export function getCylinderStepAngle(pageCount: number): number {
  return Math.min(Math.PI / 2, (Math.PI * 2) / Math.max(pageCount, 4));
}

/**
 * Motion of a slide sitting `offset` steps away from the front of the drum.
 * offset 0 = facing the viewer, ±1 = one full step around the cylinder.
 */
export function getCylinderOffsetMotion(
  offset: number,
  stepAngle: number,
  height: number,
): CylinderMotion {
  'worklet';

  const angle = offset * stepAngle;
  const radius = height / (2 * Math.sin(stepAngle / 2));

  return {
    rotateX: `${(angle * 180) / Math.PI}deg`,
    translateY: radius * Math.sin(angle),
    translateZ: radius * (Math.cos(angle) - 1),
  };
}

export function getCylinderMotion(
  progress: number,
  direction: number,
  stepAngle: number,
  height: number,
  entering: boolean,
): CylinderMotion {
  'worklet';

  const clampedProgress = Math.max(0, Math.min(1, progress));
  const angleProgress = entering ? 1 - clampedProgress : clampedProgress;
  const orientation = entering ? -direction : direction;
  return getCylinderOffsetMotion(
    orientation * angleProgress,
    stepAngle,
    height,
  );
}

/**
 * Builds the transform array for a cylinder motion.
 *
 * React Native (iOS/Android) does not support `translateZ` in `transform`,
 * only react-native-web does. On native, the depth is approximated with a
 * scale that matches what `translateZ` would do under the given perspective.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getCylinderTransform(
  motion: CylinderMotion,
  perspective: number,
): any {
  'worklet';

  if (IS_WEB) {
    return [
      { perspective },
      { translateY: motion.translateY },
      { translateZ: motion.translateZ },
      { rotateX: motion.rotateX },
    ];
  }

  const scale = perspective / (perspective - motion.translateZ);
  return [
    { perspective },
    { translateY: motion.translateY },
    { scale },
    { rotateX: motion.rotateX },
  ];
}