export type WheelGeometry = {
  /** Distance from the page center down to the wheel's pivot (pizza center). */
  radius: number;
  /** Rotation (radians) at which a page is completely off screen. */
  angle: number;
};

/**
 * The pivot sits far below the screen, so a small rotation slides the page
 * sideways along an arc. `angle` is chosen so that at turn = ±1 even the
 * bottom edge of the page is fully outside the screen.
 */
export function getWheelGeometry(width: number, height: number): WheelGeometry {
  const radius = Math.max(height * 2, width * 1.8);
  const nearRadius = radius - height / 2;
  const angle = Math.min(1, Math.asin(Math.min(1, (width * 1.1) / nearRadius)));
  return { radius, angle };
}

/**
 * turn: 0 = page at rest, +1 = swung fully out to the right,
 * -1 = swung fully out to the left. Pure 2D: it rotates around a point
 * `radius` below the page center.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getWheelTransform(
  turn: number,
  radius: number,
  angle: number,
): any {
  'worklet';

  return [
    { translateY: radius },
    { rotate: `${turn * angle}rad` },
    { translateY: -radius },
  ];
}