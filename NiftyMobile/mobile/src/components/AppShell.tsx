import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type LayoutChangeEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, usePathname, type Href } from 'expo-router';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSession } from '../auth/useSession';
import { useAppTheme } from '../ThemeProvider';
import {
  usePageWheelTransition,
  type PageWheelDirection,
} from '../PageWheelTransition';
import { BrandLogo } from './BrandLogo';
import {
  getRoleNavigationItems,
  navigationIndexForPath,
  RoleNavigation,
} from './RoleNavigation';
import { getWheelGeometry, getWheelTransform } from './wheel/wheelMotion';
import { Alert, Button } from './ui';

/* eslint-disable react-hooks/immutability */

let liveShells = 0;

export function AppShell({
  title,
  children,
}: PropsWithChildren<{ title: string }>) {
  const { user, notice, setNotice, logout } = useSession();
  const { theme } = useAppTheme();
  const pathname = usePathname();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const { turn, busy, go } = usePageWheelTransition();
  const styles = makeStyles(theme);
  const [stage, setStage] = useState({ width: 0, height: 0 });
  const role = user?.role ?? null;
  const routes = useMemo(
    () => (role ? getRoleNavigationItems(role) : []),
    [role],
  );
  const activeIndex = role ? navigationIndexForPath(pathname, role) : -1;

  const stageWidth = Math.max(1, stage.width || windowWidth);
  const stageHeight = Math.max(1, stage.height || windowHeight);
  const { radius, angle } = useMemo(
    () => getWheelGeometry(stageWidth, stageHeight),
    [stageWidth, stageHeight],
  );

  const onStageLayout = useCallback((event: LayoutChangeEvent) => {
    const { width: measuredWidth, height: measuredHeight } =
      event.nativeEvent.layout;
    setStage((previous) =>
      previous.width === measuredWidth && previous.height === measuredHeight
        ? previous
        : { width: measuredWidth, height: measuredHeight },
    );
  }, []);

  const navigateToTab = useCallback(
    (target: Href) => {
      const targetIndex = routes.findIndex((item) => item.href === target);
      if (
        !role ||
        activeIndex < 0 ||
        targetIndex < 0 ||
        targetIndex === activeIndex
      ) {
        router.navigate(target);
        return;
      }
      go(target, targetIndex > activeIndex ? -1 : 1);
    },
    [activeIndex, go, role, routes],
  );

  const nextRoute =
    activeIndex >= 0 && routes.length > 1
      ? routes[(activeIndex + 1) % routes.length]?.href
      : undefined;
  const previousRoute =
    activeIndex >= 0 && routes.length > 1
      ? routes[(activeIndex - 1 + routes.length) % routes.length]?.href
      : undefined;

  const pageGesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(Boolean(role && activeIndex >= 0 && routes.length > 1))
        .activeOffsetX([-14, 14])
        .failOffsetY([-14, 14])
        .onUpdate((event) => {
          if (busy.value) {
            return;
          }
          turn.value = Math.max(
            -1,
            Math.min(1, event.translationX / (stageWidth * 0.85)),
          );
        })
        .onEnd((event) => {
          if (busy.value) {
            return;
          }
          const direction: PageWheelDirection =
            event.translationX < 0 || event.velocityX < -650 ? -1 : 1;
          const target = direction < 0 ? nextRoute : previousRoute;
          const shouldNavigate =
            Math.abs(event.translationX) >= stageWidth * 0.2 ||
            Math.abs(event.velocityX) >= 650;

          if (!shouldNavigate || !target) {
            turn.value = withSpring(0, { damping: 18, stiffness: 160 });
            return;
          }

          runOnJS(go)(target, direction);
        }),
    [
      activeIndex,
      busy,
      go,
      nextRoute,
      previousRoute,
      role,
      routes.length,
      stageWidth,
      turn,
    ],
  );

  // FIX: Keep stageOpacity starting at 0 so freshly mounted screens stay invisible
  // for the 1st native layout frame until the wheel transform positions them off-screen.
  const stageOpacity = useSharedValue(0);
  useEffect(() => {
    stageOpacity.value = 1;
  }, [stageOpacity]);

  useEffect(() => {
    liveShells += 1;
    console.log(`[AppShell] mounted. Live screens: ${liveShells}`);
    return () => {
      liveShells -= 1;
      console.log(`[AppShell] unmounted. Live screens: ${liveShells}`);
    };
  }, []);

  const pageStyle = useAnimatedStyle(() => ({
    opacity: stageOpacity.value,
    transform: getWheelTransform(turn.value, radius, angle),
  }));

  return (
    <View style={styles.root}>
      <SafeAreaView
        style={styles.safeArea}
        edges={['top', 'left', 'right', 'bottom']}
      >
        <View style={styles.accent}>
          <View style={styles.accentLeaf} />
          <View style={styles.accentSky} />
        </View>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="link"
            accessibilityLabel="Nifty home"
            onPress={() => navigateToTab('/shop')}
          >
            <BrandLogo size={40} />
          </Pressable>
          {user ? (
            <View style={styles.userActions}>
              <View style={styles.identityWrap}>
                <Text style={styles.identity} numberOfLines={1}>
                  {user.firstName} {user.lastName}
                </Text>
                <Text style={styles.role}>
                  {user.role === 'ROLE_ADMIN' ? 'ADMIN' : 'CUSTOMER'}
                </Text>
              </View>
              <Button
                title="Log out"
                variant="ghost"
                onPress={() => void logout()}
              />
            </View>
          ) : null}
        </View>

        <GestureDetector gesture={pageGesture}>
          <View style={styles.stageClip} onLayout={onStageLayout}>
            <Animated.View style={[styles.stage, pageStyle]}>
              <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
              >
                {notice ? (
                  <Alert tone="info" onDismiss={() => setNotice('')}>
                    {notice}
                  </Alert>
                ) : null}
                <Text style={styles.screenTitle}>{title}</Text>
                {children}
              </ScrollView>
            </Animated.View>
          </View>
        </GestureDetector>

        <RoleNavigation role={role} onNavigate={navigateToTab} />
      </SafeAreaView>
    </View>
  );
}

function makeStyles(theme: ReturnType<typeof useAppTheme>['theme']) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    safeArea: {
      flex: 1,
    },
    accent: {
      height: 3,
      flexDirection: 'row',
    },
    accentLeaf: {
      flex: 1,
      backgroundColor: theme.colors.leafDeep,
    },
    accentSky: {
      flex: 1,
      backgroundColor: theme.colors.skyDeep,
    },
    header: {
      minHeight: 62,
      paddingHorizontal: theme.spacing.screen,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.line,
      backgroundColor: theme.colors.surface,
    },
    userActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    identityWrap: {
      maxWidth: 112,
      alignItems: 'flex-end',
    },
    identity: {
      color: theme.colors.ink,
      fontSize: 12,
      fontWeight: '700',
    },
    role: {
      marginTop: 2,
      color: theme.colors.leafDeep,
      fontSize: 9,
      fontWeight: '800',
      letterSpacing: 1,
    },
    stageClip: {
      flex: 1,
      overflow: 'hidden',
      backgroundColor: theme.colors.background,
    },
    stage: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scroll: {
      flex: 1,
    },
    content: {
      padding: theme.spacing.screen,
      gap: theme.spacing.section,
    },
    screenTitle: {
      color: theme.colors.ink,
      fontSize: 27,
      fontWeight: '800',
      letterSpacing: -0.6,
    },
  });
}