import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type LayoutChangeEvent,
} from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useAppTheme } from '../../ThemeProvider';
import type { AppTheme, ThemeColors } from '../../theme';
import {
  getCylinderOffsetMotion,
  getCylinderStepAngle,
  getCylinderTransform,
} from './cylinderMotion';

/* eslint-disable react-hooks/immutability */

export type WheelPage = {
  id: string;
  discountLabel: string;
  title: string;
  description: string;
  scope: string;
  tone: 'leaf' | 'sky';
};

type WheelPagerProps = {
  pages: WheelPage[];
  accessibilityLabel?: string;
};

type Styles = ReturnType<typeof createStyles>;

const STEP_DURATION = 360;
const PERSPECTIVE = 900;

function createStyles(theme: AppTheme) {
  const { colors } = theme;
  return StyleSheet.create({
    container: {
      flex: 1,
      overflow: 'hidden',
      borderRadius: theme.radius.card,
      backgroundColor: colors.surfaceAlt,
    },
    page: {
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      padding: 8,
      borderRadius: theme.radius.card,
    },
    offer: {
      flex: 1,
      padding: 18,
      paddingBottom: 54,
      justifyContent: 'space-between',
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: theme.radius.card - 4,
      backgroundColor: colors.surface,
    },
    offerAccent: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: 0,
      width: 5,
    },
    offerTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    },
    discountTag: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: theme.radius.pill,
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 0.4,
    },
    sequence: {
      color: colors.muted,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 1,
    },
    offerCopy: {
      gap: 6,
      paddingVertical: 10,
    },
    offerTitle: {
      color: colors.ink,
      fontSize: 22,
      fontWeight: '800',
      letterSpacing: -0.5,
    },
    offerDescription: {
      color: colors.muted,
      fontSize: 13,
      lineHeight: 19,
    },
    offerFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 8,
      paddingTop: 10,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.line,
    },
    scope: {
      color: colors.text,
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.7,
    },
    swipeHint: {
      color: colors.muted,
      fontSize: 10,
      fontWeight: '600',
    },
    controlsOverlay: {
      justifyContent: 'flex-end',
      paddingBottom: 8,
    },
    controls: {
      minHeight: 44,
      paddingHorizontal: 4,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    arrow: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: theme.radius.pill,
      backgroundColor: colors.surface,
    },
    arrowText: {
      color: colors.ink,
      fontSize: 20,
      lineHeight: 24,
    },
    pageIndicators: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.lineStrong,
    },
    activeDot: {
      width: 18,
      backgroundColor: colors.leafDeep,
    },
  });
}

export default function WheelPager({
  pages,
  accessibilityLabel = 'Featured offers',
}: WheelPagerProps) {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { width: windowWidth } = useWindowDimensions();
  const [layout, setLayout] = useState({ width: 0, height: 0 });
  const [activeIndex, setActiveIndex] = useState(0);

  // `position` is the single source of truth. It is a continuous page index
  // (0, 1, 2, ... and everything in between while dragging) that is never
  // reset, so a finished swipe never snaps back for a frame.
  const position = useSharedValue(0);
  const startPosition = useSharedValue(0);

  const pageCount = pages.length;
  const width = Math.max(1, layout.width || windowWidth);
  const height = Math.max(1, layout.height || 245);
  const stepAngle = getCylinderStepAngle(pageCount);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const { width: measuredWidth, height: measuredHeight } =
      event.nativeEvent.layout;
    setLayout((previous) =>
      previous.width === measuredWidth && previous.height === measuredHeight
        ? previous
        : { width: measuredWidth, height: measuredHeight },
    );
  }, []);

  // If the number of pages changes, go back to the first one. Only the shared
  // value is reset here; the reaction below keeps `activeIndex` in sync.
  useEffect(() => {
    position.value = 0;
  }, [pageCount, position]);

  // JS state only follows along (dots, accessibility label). The slides
  // themselves never re-render while animating.
  useAnimatedReaction(
    () => {
      const count = Math.max(pageCount, 1);
      return ((Math.round(position.value) % count) + count) % count;
    },
    (current, previous) => {
      if (current !== previous) {
        runOnJS(setActiveIndex)(current);
      }
    },
  );

  const animateStep = useCallback(
    (step: -1 | 1) => {
      position.value = withTiming(Math.round(position.value) + step, {
        duration: STEP_DURATION,
        easing: Easing.out(Easing.cubic),
      });
    },
    [position],
  );

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(pageCount > 1)
        .activeOffsetX([-12, 12])
        .failOffsetY([-15, 15])
        .onBegin(() => {
          startPosition.value = position.value;
        })
        .onUpdate((event) => {
          // Dragging left (negative translation) moves toward the next page.
          position.value =
            startPosition.value +
            Math.max(-1, Math.min(1, -event.translationX / width));
        })
        .onEnd((event) => {
          const base = Math.round(startPosition.value);
          const swipe =
            Math.abs(event.translationX) > 12
              ? Math.sign(event.translationX)
              : Math.sign(event.velocityX);
          const shouldNavigate =
            Math.abs(event.translationX) > width * 0.2 ||
            Math.abs(event.velocityX) > 650;

          if (shouldNavigate && swipe !== 0) {
            position.value = withTiming(base - swipe, {
              duration: STEP_DURATION,
              easing: Easing.out(Easing.cubic),
            });
          } else {
            position.value = withSpring(base, { damping: 18, stiffness: 160 });
          }
        }),
    [pageCount, position, startPosition, width],
  );

  if (pageCount === 0) {
    return null;
  }

  const currentPage = pages[Math.min(activeIndex, pageCount - 1)];

  return (
    <View
      accessibilityLabel={`${accessibilityLabel}: ${currentPage.title}, ${activeIndex + 1} of ${pageCount}`}
      onLayout={onLayout}
      style={styles.container}
    >
      <GestureDetector gesture={panGesture}>
        <View style={styles.container}>
          {pages.map((page, index) => (
            <WheelSlide
              key={page.id}
              page={page}
              index={index}
              count={pageCount}
              position={position}
              stepAngle={stepAngle}
              height={height}
              styles={styles}
              colors={theme.colors}
            />
          ))}
          <View
            pointerEvents="box-none"
            style={[StyleSheet.absoluteFill, styles.controlsOverlay]}
          >
            <View style={styles.controls}>
              {pageCount > 1 ? (
                <>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Previous offer"
                    onPress={() => animateStep(-1)}
                    style={styles.arrow}
                  >
                    <Text style={styles.arrowText}>‹</Text>
                  </Pressable>
                  <View
                    accessibilityLabel={`Offer ${activeIndex + 1} of ${pageCount}`}
                    style={styles.pageIndicators}
                  >
                    {pages.map((page, index) => (
                      <View
                        key={page.id}
                        style={[
                          styles.dot,
                          index === activeIndex && styles.activeDot,
                        ]}
                      />
                    ))}
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Next offer"
                    onPress={() => animateStep(1)}
                    style={styles.arrow}
                  >
                    <Text style={styles.arrowText}>›</Text>
                  </Pressable>
                </>
              ) : null}
            </View>
          </View>
        </View>
      </GestureDetector>
    </View>
  );
}

type WheelSlideProps = {
  page: WheelPage;
  index: number;
  count: number;
  position: SharedValue<number>;
  stepAngle: number;
  height: number;
  styles: Styles;
  colors: ThemeColors;
};

// Each slide positions itself from its distance to `position`. Memoized, so
// it only re-renders when its own props change, never during a swipe.
const WheelSlide = memo(function WheelSlide({
  page,
  index,
  count,
  position,
  stepAngle,
  height,
  styles,
  colors,
}: WheelSlideProps) {
  const animatedStyle = useAnimatedStyle(() => {
    // Shortest signed distance around the loop, in steps.
    let offset = (index - position.value) % count;
    if (offset > count / 2) {
      offset -= count;
    } else if (offset < -count / 2) {
      offset += count;
    }
    const distance = Math.abs(offset);
    const motion = getCylinderOffsetMotion(offset, stepAngle, height);
    return {
      opacity: distance < 1 ? 1 : 0,
      zIndex: Math.round((1 - Math.min(1, distance)) * 100),
      transform: getCylinderTransform(motion, PERSPECTIVE),
    };
  });

  const accentColor = page.tone === 'sky' ? colors.skyDeep : colors.leafDeep;
  const tagBackground =
    page.tone === 'sky' ? colors.infoBackground : colors.successBackground;

  return (
    <Animated.View pointerEvents="none" style={[styles.page, animatedStyle]}>
      <OfferContent
        page={page}
        index={index}
        count={count}
        accentColor={accentColor}
        tagBackground={tagBackground}
        styles={styles}
      />
    </Animated.View>
  );
});

function OfferContent({
  page,
  index,
  count,
  accentColor,
  tagBackground,
  styles,
}: {
  page: WheelPage;
  index: number;
  count: number;
  accentColor: string;
  tagBackground: string;
  styles: Styles;
}) {
  return (
    <View style={styles.offer}>
      <View style={[styles.offerAccent, { backgroundColor: accentColor }]} />
      <View style={styles.offerTop}>
        <Text
          style={[
            styles.discountTag,
            { color: accentColor, backgroundColor: tagBackground },
          ]}
        >
          {page.discountLabel}
        </Text>
        <Text style={styles.sequence}>
          {String(index + 1).padStart(2, '0')} / {String(count).padStart(2, '0')}
        </Text>
      </View>
      <View style={styles.offerCopy}>
        <Text numberOfLines={2} style={styles.offerTitle}>
          {page.title}
        </Text>
        <Text numberOfLines={3} style={styles.offerDescription}>
          {page.description}
        </Text>
      </View>
      <View style={styles.offerFooter}>
        <Text style={styles.scope}>{page.scope}</Text>
        <Text style={styles.swipeHint}>
          {count > 1 ? 'SWIPE TO EXPLORE' : 'CURRENT STORE OFFER'}
        </Text>
      </View>
    </View>
  );
}