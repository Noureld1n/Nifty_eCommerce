import { useCallback, useEffect, useId, useState } from 'react';
import { AccessibilityInfo, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, {
  Circle,
  ClipPath,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Line,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';
import { useAppTheme } from '../ThemeProvider';

/* eslint-disable react-hooks/immutability */

/*
 * How this animates (and why):
 * - Only plain numeric SVG props are animated (line endpoints, circle
 *   centers, path `d`). Those work the same on web and in Expo Go.
 * - The apple and the walker are separate layers moved with normal view
 *   transforms, which are reliable everywhere.
 * - The run is ONE continuous loop (`cycle` goes 0 -> 1 and restarts, it
 *   never reverses). Each leg is a full stride: it goes forward, pushes back
 *   on the ground with a straight knee, then lifts with a bent knee and
 *   swings forward again. The other leg is half a cycle behind, and each arm
 *   swings opposite to the leg on its side.
 */

const APPLE =
  'M60 30 C52 22 36 22 25 32 C12 44 12 68 24 86 C33 99 44 108 53 106 C57 105 63 105 67 106 C76 108 87 99 96 86 C108 68 108 44 95 32 C84 22 68 22 60 30 Z';

const TWO_PI = Math.PI * 2;
// Time for one full stride (both legs), in ms.
const CYCLE_MS = 720;
// Pose shown when the device asks for reduced motion.
const REST_CYCLE = 0.1;
// The SVG is redrawn only when the pose changes, so the run is drawn in
// this many steps per stride (18 steps in 720 ms is about 25 drawings a
// second). Far cheaper than redrawing on every frame, and still smooth.
const STEPS_PER_CYCLE = 18;
// Set to false to switch the logo animation off (handy for performance tests).
const ANIMATE_LOGO = true;

// Shoe outline (absolute points): start, two lines, curve, line, curve.
const SHOE: readonly (readonly [number, number])[] = [
  [54.2, 98],
  [60.6, 98],
  [66.4, 101.4],
  [68.6, 102.8],
  [67, 104.6],
  [54.4, 104.6],
  [52.4, 104.6],
  [52.4, 102.6],
];

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);
const AnimatedLine = Animated.createAnimatedComponent(Line);

function rotate(
  x: number,
  y: number,
  cx: number,
  cy: number,
  degrees: number,
): [number, number] {
  'worklet';

  const radians = (degrees * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const dx = x - cx;
  const dy = y - cy;
  return [cx + dx * cos - dy * sin, cy + dx * sin + dy * cos];
}

// ---- One stride, as a function of its phase (0..1, repeating) ----
// phase 0    : leg fully forward
// phase 0..0.5: leg on the ground, moving back, knee nearly straight
// phase 0.5  : leg fully back, about to leave the ground
// phase 0.5..1: leg in the air, knee bent, swinging forward
// (positive angles swing a limb backwards, negative forwards)

function hipAngle(phase: number) {
  'worklet';

  return -38 * Math.cos(TWO_PI * phase);
}

function kneeAngle(phase: number) {
  'worklet';

  const s = Math.sin(TWO_PI * phase);
  // Slight bend on the ground, a big bend while the leg is in the air.
  const bend = s >= 0 ? 0.2 * s : -s;
  return 10 + 70 * bend;
}

function armAngle(phase: number) {
  'worklet';

  // Opposite to the leg on the same side.
  return 40 * Math.cos(TWO_PI * phase);
}

function legPose(hip: number, knee: number) {
  'worklet';

  const place = (x: number, y: number): [number, number] => {
    const [sx, sy] = rotate(x, y, 58, 87, knee);
    return rotate(sx, sy, 58, 74, hip);
  };
  const [kx, ky] = rotate(58, 87, 58, 74, hip);
  const [ax, ay] = place(58, 99);
  const s = SHOE.map(([x, y]) => place(x, y));
  const shoe =
    `M${s[0][0]} ${s[0][1]} L${s[1][0]} ${s[1][1]} L${s[2][0]} ${s[2][1]} ` +
    `Q${s[3][0]} ${s[3][1]} ${s[4][0]} ${s[4][1]} L${s[5][0]} ${s[5][1]} ` +
    `Q${s[6][0]} ${s[6][1]} ${s[7][0]} ${s[7][1]} Z`;
  const [hx1, hy1] = place(54.2, 103.6);
  const [hx2, hy2] = place(66.8, 103.6);
  return { kx, ky, ax, ay, shoe, hx1, hy1, hx2, hy2 };
}

function armPose(angle: number) {
  'worklet';

  const [ex, ey] = rotate(63, 64, 63, 54, angle);
  const place = (x: number, y: number): [number, number] => {
    const [fx, fy] = rotate(x, y, 63, 64, -72);
    return rotate(fx, fy, 63, 54, angle);
  };
  const [wx, wy] = place(63, 74);
  const [hx, hy] = place(63, 77);
  return { ex, ey, wx, wy, hx, hy };
}

// Body rises while both feet are off the ground, and dips on each footfall:
// two bounces per full stride.
function bodyLift(cycle: number) {
  'worklet';

  return (1 + Math.cos(2 * TWO_PI * cycle)) / 2;
}

// A wind streak: starts near the runner, slides backwards (left) while
// fading in and out, then restarts. `offset` staggers the three streaks.
function windStreak(cycle: number, offset: number, x1: number, x2: number) {
  'worklet';

  const t = (cycle + offset) % 1;
  const shift = 6 - 18 * t;
  return {
    x1: x1 + shift,
    x2: x2 + shift,
    opacity: 0.55 * Math.sin(Math.PI * t),
  };
}

// The eyebrows are static, so their tilt is worked out once.
const tilt = (x: number, y: number) => rotate(x, y, 60, 37.6, -7);
const EYEBROW_TOP = (() => {
  const [x0, y0] = tilt(60, 37.6);
  const [x1, y1] = tilt(54, 35.4);
  const [x2, y2] = tilt(47, 37.6);
  return `M${x0} ${y0} Q${x1} ${y1} ${x2} ${y2}`;
})();
const EYEBROW_BOTTOM = (() => {
  const [x0, y0] = tilt(60, 38);
  const [x1, y1] = tilt(54.6, 40.2);
  const [x2, y2] = tilt(49, 44.4);
  return `M${x0} ${y0} Q${x1} ${y1} ${x2} ${y2}`;
})();

export function BrandLogo({ size = 42 }: { size?: number }) {
  const { theme } = useAppTheme();
  const [reduceMotion, setReduceMotion] = useState(false);
  const uid = useId().replace(/:/g, '');
  const id = (name: string) => `${name}-${uid}`;
  const scale = size / 120;

  const spin = useSharedValue(0);
  const cycle = useSharedValue(REST_CYCLE);
  const appleBob = useSharedValue(0);
  const twinkle = useSharedValue(1);

  // A logo on a screen that is not on top is invisible: don't animate it.
  const [focused, setFocused] = useState(true);
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, []),
  );

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) {
        setReduceMotion(enabled);
      }
    });
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotion,
    );
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    const stop = () => {
      cancelAnimation(spin);
      cancelAnimation(cycle);
      cancelAnimation(appleBob);
      cancelAnimation(twinkle);
    };

    if (reduceMotion || !ANIMATE_LOGO) {
      // Calm, frozen mid-stride pose with no movement.
      stop();
      spin.value = 0;
      cycle.value = REST_CYCLE;
      appleBob.value = 0;
      twinkle.value = 1;
      return;
    }

    if (!focused) {
      // Another screen is on top, so nobody can see this logo.
      stop();
      return;
    }

    spin.value = withRepeat(
      withTiming(360, { duration: 12000, easing: Easing.linear }),
      -1,
      false,
    );
    // Restart from 0 so every loop is the same full stride (phase 1 == 0).
    cycle.value = 0;
    cycle.value = withRepeat(
      withTiming(1, { duration: CYCLE_MS, easing: Easing.linear }),
      -1,
      false,
    );
    appleBob.value = withRepeat(
      withTiming(1, { duration: 720, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    twinkle.value = withRepeat(
      withTiming(0, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    return stop;
  }, [appleBob, cycle, focused, reduceMotion, spin, twinkle]);

  // Stepped copies of the clocks: dependents only recompute (and the SVG is
  // only redrawn) when a step changes, not on every single frame.
  const steppedCycle = useDerivedValue(
    () => Math.round(cycle.value * STEPS_PER_CYCLE) / STEPS_PER_CYCLE,
  );
  const steppedSpin = useDerivedValue(() => Math.round(spin.value / 3) * 3);
  const steppedTwinkle = useDerivedValue(
    () => Math.round(twinkle.value * 12) / 12,
  );

  // ---- Poses, all computed from the stepped values ----
  const yin = useDerivedValue(() => {
    const radians = (steppedSpin.value * Math.PI) / 180;
    const s = Math.sin(radians);
    const c = Math.cos(radians);
    const tx = 60 + 54 * s;
    const ty = 65 - 54 * c;
    const bx = 60 - 54 * s;
    const by = 65 + 54 * c;
    return {
      d: `M${tx} ${ty} A27 27 0 0 1 60 65 A27 27 0 0 0 ${bx} ${by} A54 54 0 0 1 ${tx} ${ty} Z`,
      blueX: 60 + 27 * s,
      blueY: 65 - 27 * c,
      greenX: 60 - 27 * s,
      greenY: 65 + 27 * c,
    };
  });

  const pose = useDerivedValue(() => {
    const p = steppedCycle.value;
    const farPhase = p + 0.5;
    return {
      frontLeg: legPose(hipAngle(p), kneeAngle(p)),
      backLeg: legPose(hipAngle(farPhase), kneeAngle(farPhase)),
      frontArm: armPose(armAngle(p)),
      backArm: armPose(armAngle(farPhase)),
    };
  });

  // ---- Layer transforms (normal view transforms) ----
  const appleStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: -1.5 * appleBob.value * scale },
      { translateY: 48 * scale },
      { rotate: `${-appleBob.value}deg` },
      { translateY: -48 * scale },
    ],
  }));
  const walkerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -2.5 * bodyLift(steppedCycle.value) * scale }],
  }));

  // ---- Animated SVG props (numbers and path strings only) ----
  const shadowProps = useAnimatedProps(() => {
    // The shadow shrinks while the runner is in the air.
    const grounded = 1 - 0.14 * bodyLift(steppedCycle.value);
    return { rx: 32 * grounded, opacity: grounded };
  });
  const yinPathProps = useAnimatedProps(() => ({ d: yin.value.d }));
  const blueDotProps = useAnimatedProps(() => ({
    cx: yin.value.blueX,
    cy: yin.value.blueY,
  }));
  const greenDotProps = useAnimatedProps(() => ({
    cx: yin.value.greenX,
    cy: yin.value.greenY,
  }));
  const twinkleProps = useAnimatedProps(() => {
    const t = 1 - steppedTwinkle.value;
    const k = 5 * (0.6 + t * 0.55);
    return {
      d:
        `M33 ${53 - k} Q33 53 ${33 + k} 53 Q33 53 33 ${53 + k} ` +
        `Q33 53 ${33 - k} 53 Q33 53 33 ${53 - k} Z`,
      opacity: t,
    };
  });

  // With reduced motion the streaks stay still, as faint fixed lines.
  const windTopProps = useAnimatedProps(() =>
    reduceMotion
      ? { x1: 18, x2: 34, opacity: 0.45 }
      : windStreak(steppedCycle.value, 0, 18, 34),
  );
  const windMiddleProps = useAnimatedProps(() =>
    reduceMotion
      ? { x1: 14, x2: 34, opacity: 0.45 }
      : windStreak(steppedCycle.value, 0.35, 14, 34),
  );
  const windBottomProps = useAnimatedProps(() =>
    reduceMotion
      ? { x1: 20, x2: 36, opacity: 0.45 }
      : windStreak(steppedCycle.value, 0.7, 20, 36),
  );

  const backUpperArmProps = useAnimatedProps(() => ({
    x2: pose.value.backArm.ex,
    y2: pose.value.backArm.ey,
  }));
  const backForearmProps = useAnimatedProps(() => ({
    x1: pose.value.backArm.ex,
    y1: pose.value.backArm.ey,
    x2: pose.value.backArm.wx,
    y2: pose.value.backArm.wy,
  }));
  const backHandProps = useAnimatedProps(() => ({
    cx: pose.value.backArm.hx,
    cy: pose.value.backArm.hy,
  }));
  const backThighProps = useAnimatedProps(() => ({
    x2: pose.value.backLeg.kx,
    y2: pose.value.backLeg.ky,
  }));
  const backShinProps = useAnimatedProps(() => ({
    x1: pose.value.backLeg.kx,
    y1: pose.value.backLeg.ky,
    x2: pose.value.backLeg.ax,
    y2: pose.value.backLeg.ay,
  }));
  const backShoeProps = useAnimatedProps(() => ({ d: pose.value.backLeg.shoe }));

  const frontUpperArmProps = useAnimatedProps(() => ({
    x2: pose.value.frontArm.ex,
    y2: pose.value.frontArm.ey,
  }));
  const frontForearmProps = useAnimatedProps(() => ({
    x1: pose.value.frontArm.ex,
    y1: pose.value.frontArm.ey,
    x2: pose.value.frontArm.wx,
    y2: pose.value.frontArm.wy,
  }));
  const frontHandProps = useAnimatedProps(() => ({
    cx: pose.value.frontArm.hx,
    cy: pose.value.frontArm.hy,
  }));
  const frontThighProps = useAnimatedProps(() => ({
    x2: pose.value.frontLeg.kx,
    y2: pose.value.frontLeg.ky,
  }));
  const frontShinProps = useAnimatedProps(() => ({
    x1: pose.value.frontLeg.kx,
    y1: pose.value.frontLeg.ky,
    x2: pose.value.frontLeg.ax,
    y2: pose.value.frontLeg.ay,
  }));
  const frontShoeProps = useAnimatedProps(() => ({ d: pose.value.frontLeg.shoe }));
  const frontShoeLineProps = useAnimatedProps(() => ({
    x1: pose.value.frontLeg.hx1,
    y1: pose.value.frontLeg.hy1,
    x2: pose.value.frontLeg.hx2,
    y2: pose.value.frontLeg.hy2,
  }));

  return (
    <View
      accessible
      accessibilityLabel="Nifty"
      accessibilityRole="image"
      style={styles.brand}
    >
      <View style={{ width: size, height: size }}>
        {/* Layer 1: ground shadow */}
        <Svg
          style={StyleSheet.absoluteFill}
          width={size}
          height={size}
          viewBox="0 0 120 120"
        >
          <AnimatedEllipse
            animatedProps={shadowProps}
            cx="60"
            cy="116"
            rx="32"
            ry="3.4"
            fill="rgba(18,22,28,0.16)"
          />
        </Svg>

        {/* Layer 2: the apple (bobs and tilts) */}
        <Animated.View style={[StyleSheet.absoluteFill, appleStyle]}>
          <Svg
            style={StyleSheet.absoluteFill}
            width={size}
            height={size}
            viewBox="0 0 120 120"
          >
            <Defs>
              <ClipPath id={id('clip')}>
                <Path d={APPLE} />
              </ClipPath>
              <LinearGradient
                id={id('green')}
                gradientUnits="userSpaceOnUse"
                x1="6"
                y1="11"
                x2="114"
                y2="119"
              >
                <Stop offset="0" stopColor="#BDF3D4" />
                <Stop offset="1" stopColor="#47C98C" />
              </LinearGradient>
              <LinearGradient
                id={id('blue')}
                gradientUnits="userSpaceOnUse"
                x1="6"
                y1="11"
                x2="114"
                y2="119"
              >
                <Stop offset="0" stopColor="#C6E6FF" />
                <Stop offset="1" stopColor="#4AA6EC" />
              </LinearGradient>
              <RadialGradient id={id('shade')} cx="0.33" cy="0.27" r="0.95">
                <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.42" />
                <Stop offset="0.45" stopColor="#FFFFFF" stopOpacity="0" />
                <Stop offset="1" stopColor="#0B1A24" stopOpacity="0.28" />
              </RadialGradient>
              <LinearGradient id={id('leaf')} x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor="#D6F9E4" />
                <Stop offset="1" stopColor="#4CC487" />
              </LinearGradient>
            </Defs>

            <G clipPath={`url(#${id('clip')})`}>
              <Circle cx="60" cy="65" r="54" fill={`url(#${id('blue')})`} />
              <AnimatedPath
                animatedProps={yinPathProps}
                d="M60 11 A27 27 0 0 1 60 65 A27 27 0 0 0 60 119 A54 54 0 0 1 60 11 Z"
                fill={`url(#${id('green')})`}
              />
              <AnimatedCircle
                animatedProps={blueDotProps}
                cx="60"
                cy="38"
                r="8"
                fill={`url(#${id('blue')})`}
              />
              <AnimatedCircle
                animatedProps={greenDotProps}
                cx="60"
                cy="92"
                r="8"
                fill={`url(#${id('green')})`}
              />
              <Rect
                x="8"
                y="16"
                width="104"
                height="100"
                fill={`url(#${id('shade')})`}
              />
            </G>
            <Path
              d={APPLE}
              fill="none"
              stroke="#12161C"
              strokeWidth="3"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            <Path
              d="M26 44 C27 36 33 31 41 29"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="3.2"
              strokeLinecap="round"
              opacity="0.8"
            />
            <Path
              d="M60 30 C60 22 62 15 69 10"
              fill="none"
              stroke="#12161C"
              strokeWidth="3.6"
              strokeLinecap="round"
            />
            <Path
              d="M67 15 C71 5 85 5 92 10 C88 19 76 21 67 15 Z"
              fill={`url(#${id('leaf')})`}
              stroke="#12161C"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <Path
              d="M69 14 C76 11 83 10 90 10.5"
              fill="none"
              stroke="#12161C"
              strokeWidth="1.2"
              strokeLinecap="round"
              opacity="0.55"
            />
            <AnimatedPath
              animatedProps={twinkleProps}
              d="M33 48 Q33 53 38 53 Q33 53 33 58 Q33 53 28 53 Q33 53 33 48 Z"
              fill="#FFFFFF"
            />
          </Svg>
        </Animated.View>

        {/* Layer 3: speed lines */}
        <Svg
          style={StyleSheet.absoluteFill}
          width={size}
          height={size}
          viewBox="0 0 120 120"
        >
          <AnimatedLine
            animatedProps={windTopProps}
            x1="18"
            y1="50"
            x2="34"
            y2="50"
            stroke="#12161C"
            strokeWidth="2.2"
            strokeLinecap="round"
            opacity="0"
          />
          <AnimatedLine
            animatedProps={windMiddleProps}
            x1="14"
            y1="64"
            x2="34"
            y2="64"
            stroke="#12161C"
            strokeWidth="2.2"
            strokeLinecap="round"
            opacity="0"
          />
          <AnimatedLine
            animatedProps={windBottomProps}
            x1="20"
            y1="78"
            x2="36"
            y2="78"
            stroke="#12161C"
            strokeWidth="2.2"
            strokeLinecap="round"
            opacity="0"
          />
        </Svg>

        {/* Layer 4: the runner (bounces, limbs swing) */}
        <Animated.View style={[StyleSheet.absoluteFill, walkerStyle]}>
          <Svg
            style={StyleSheet.absoluteFill}
            width={size}
            height={size}
            viewBox="0 0 120 120"
          >
            {/* Far arm */}
            <G opacity="0.76">
              <AnimatedLine
                animatedProps={backUpperArmProps}
                x1="63"
                y1="54"
                x2="63"
                y2="64"
                stroke="#3A444F"
                strokeWidth="4.8"
                strokeLinecap="round"
              />
              <AnimatedLine
                animatedProps={backForearmProps}
                x1="63"
                y1="64"
                x2="63"
                y2="74"
                stroke="#3A444F"
                strokeWidth="4.8"
                strokeLinecap="round"
              />
              <AnimatedCircle
                animatedProps={backHandProps}
                cx="63"
                cy="77"
                r="3.2"
                fill="#3A444F"
              />
            </G>
            {/* Far leg */}
            <G opacity="0.76">
              <AnimatedLine
                animatedProps={backThighProps}
                x1="58"
                y1="74"
                x2="58"
                y2="87"
                stroke="#3A444F"
                strokeWidth="4.8"
                strokeLinecap="round"
              />
              <AnimatedLine
                animatedProps={backShinProps}
                x1="58"
                y1="87"
                x2="58"
                y2="99"
                stroke="#3A444F"
                strokeWidth="4.8"
                strokeLinecap="round"
              />
              <AnimatedPath
                animatedProps={backShoeProps}
                d="M54.2 98 h6.4 l5.8 3.4 q2.2 1.4 .6 3.2 h-12.6 q-2 0-2-2 z"
                fill="#3A444F"
              />
            </G>

            {/* Torso and head */}
            <Path
              d="M57 49.5 Q63.5 46.5 69.5 50 L63.6 74 Q58.6 76 54.4 73.6 Z"
              fill="#12161C"
              stroke="#12161C"
              strokeWidth="3"
              strokeLinejoin="round"
            />
            <Path
              d="M52.8 70 L64.4 68.4 L65.2 78 L51.8 79 Z"
              fill="#12161C"
              stroke="#12161C"
              strokeWidth="3"
              strokeLinejoin="round"
            />
            <Path
              d="M53 71.2 L64.6 69.8"
              stroke="#FFFFFF"
              strokeWidth="1.2"
              strokeLinecap="round"
              opacity="0.9"
            />
            <Circle cx="66.5" cy="39.5" r="7.4" fill="#12161C" />
            <Circle cx="69.4" cy="38.8" r="1.25" fill="#FFFFFF" />
            <Path
              d="M59.6 37.6 Q66 33.4 73.4 37.4"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <Path
              d={EYEBROW_TOP}
              fill="none"
              stroke="#12161C"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
            <Path
              d={EYEBROW_BOTTOM}
              fill="none"
              stroke="#12161C"
              strokeWidth="2.4"
              strokeLinecap="round"
            />

            {/* Near leg */}
            <AnimatedLine
              animatedProps={frontThighProps}
              x1="58"
              y1="74"
              x2="58"
              y2="87"
              stroke="#12161C"
              strokeWidth="4.8"
              strokeLinecap="round"
            />
            <AnimatedLine
              animatedProps={frontShinProps}
              x1="58"
              y1="87"
              x2="58"
              y2="99"
              stroke="#12161C"
              strokeWidth="4.8"
              strokeLinecap="round"
            />
            <AnimatedPath
              animatedProps={frontShoeProps}
              d="M54.2 98 h6.4 l5.8 3.4 q2.2 1.4 .6 3.2 h-12.6 q-2 0-2-2 z"
              fill="#12161C"
            />
            <AnimatedLine
              animatedProps={frontShoeLineProps}
              x1="54.2"
              y1="103.6"
              x2="66.8"
              y2="103.6"
              stroke="#FFFFFF"
              strokeWidth="1.1"
              strokeLinecap="round"
              opacity="0.9"
            />

            {/* Near arm */}
            <AnimatedLine
              animatedProps={frontUpperArmProps}
              x1="63"
              y1="54"
              x2="63"
              y2="64"
              stroke="#12161C"
              strokeWidth="4.8"
              strokeLinecap="round"
            />
            <AnimatedLine
              animatedProps={frontForearmProps}
              x1="63"
              y1="64"
              x2="63"
              y2="74"
              stroke="#12161C"
              strokeWidth="4.8"
              strokeLinecap="round"
            />
            <AnimatedCircle
              animatedProps={frontHandProps}
              cx="63"
              cy="77"
              r="3.2"
              fill="#12161C"
            />
          </Svg>
        </Animated.View>
      </View>
      <Text style={[styles.wordmark, { color: theme.colors.ink, fontSize: Math.max(18, size * 0.46) }]}>
        Nifty
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  wordmark: {
    fontWeight: '800',
    letterSpacing: -0.8,
  },
});