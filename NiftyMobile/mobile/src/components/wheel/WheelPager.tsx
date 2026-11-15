
import React, { useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';

import Animated, {
  Easing,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { runOnJS } from 'react-native-worklets';

import {
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';

export type WheelPage = {
  id: string;
  title: string;
  description: string;
  backgroundColor: string;
};

type WheelPagerProps = {
  pages: WheelPage[];
};

export default function WheelPager({ pages }: WheelPagerProps) {
  const { width } = useWindowDimensions();

  const [currentIndex, setCurrentIndex] = useState(0);

  const dragX = useSharedValue(0);

  const arcHeight = Math.min(width * 0.14, 65);

  if (pages.length < 2) {
    return null;
  }

  const nextIndex = (currentIndex + 1) % pages.length;

  const previousIndex =
    (currentIndex - 1 + pages.length) % pages.length;

  const currentPage = pages[currentIndex];
  const nextPage = pages[nextIndex];
  const previousPage = pages[previousIndex];

  const currentStyle = useAnimatedStyle(() => {
    const progress = Math.min(
      Math.abs(dragX.value / width),
      1
    );

    const arc = -Math.sin(progress * Math.PI) * arcHeight;

    return {
      transform: [
        { translateX: dragX.value },
        { translateY: arc },
        { scale: 1 - progress * 0.035 },
      ],
    };
  });

  const nextStyle = useAnimatedStyle(() => {
    const progress = Math.min(
      Math.abs(dragX.value / width),
      1
    );

    const arc = -Math.sin(progress * Math.PI) * arcHeight;

    return {
      transform: [
        { translateX: width + dragX.value },
        { translateY: arc },
      ],
    };
  });

  const previousStyle = useAnimatedStyle(() => {
    const progress = Math.min(
      Math.abs(dragX.value / width),
      1
    );

    const arc = -Math.sin(progress * Math.PI) * arcHeight;

    return {
      transform: [
        { translateX: -width + dragX.value },
        { translateY: arc },
      ],
    };
  });

  const panGesture = Gesture.Pan()
    .activeOffsetX([-12, 12])
    .failOffsetY([-15, 15])

    .onUpdate((event) => {
      dragX.value = Math.max(
        -width,
        Math.min(width, event.translationX)
      );
    })

    .onEnd((event) => {
      const distance = event.translationX;

      const shouldNavigate =
        Math.abs(distance) > width * 0.22 ||
        Math.abs(event.velocityX) > 650;

      if (shouldNavigate) {
        const direction =
          Math.abs(distance) > 12
            ? Math.sign(distance)
            : Math.sign(event.velocityX);

        const targetIndex =
          direction < 0
            ? nextIndex
            : previousIndex;

        dragX.value = withTiming(
          direction < 0 ? -width : width,
          {
            duration: 260,
            easing: Easing.out(Easing.cubic),
          },
          (finished) => {
            if (finished) {
              runOnJS(setCurrentIndex)(targetIndex);
              dragX.value = 0;
            }
          }
        );
      } else {
        dragX.value = withSpring(0, {
          damping: 18,
          stiffness: 160,
        });
      }
    });

  return (
    <GestureDetector gesture={panGesture}>
      <View style={styles.container}>

        <Animated.View
          style={[
            styles.page,
            { backgroundColor: currentPage.backgroundColor },
            currentStyle,
          ]}
        >
          <PageContent page={currentPage} />
        </Animated.View>

        <Animated.View
          style={[
            styles.page,
            { backgroundColor: nextPage.backgroundColor },
            nextStyle,
          ]}
          pointerEvents="none"
        >
          <PageContent page={nextPage} />
        </Animated.View>

        <Animated.View
          style={[
            styles.page,
            { backgroundColor: previousPage.backgroundColor },
            previousStyle,
          ]}
          pointerEvents="none"
        >
          <PageContent page={previousPage} />
        </Animated.View>

      </View>
    </GestureDetector>
  );
}

function PageContent({ page }: { page: WheelPage }) {
  return (
    <View style={styles.content}>
      <Text style={styles.pageId}>
        {page.id.toUpperCase()}
      </Text>

      <Text style={styles.title}>
        {page.title}
      </Text>

      <Text style={styles.description}>
        {page.description}
      </Text>

      <Text style={styles.hint}>
        SWIPE LEFT OR RIGHT
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },

  page: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },

  content: {
    alignItems: 'center',
    paddingHorizontal: 28,
  },

  pageId: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 4,
    marginBottom: 18,
  },

  title: {
    color: '#FFFFFF',
    fontSize: 38,
    fontWeight: '800',
    textAlign: 'center',
  },

  description: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 14,
  },

  hint: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    letterSpacing: 3,
    marginTop: 65,
  },
});
