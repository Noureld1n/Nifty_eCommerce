import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
  Easing,
  FadeInDown,
  FadeInUp,
  ReduceMotion,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
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

const AppShellTitleContext = createContext<(title: string) => void>(() => {});

// Screens that live outside the shell. Going to one of them fades the shell
// out first, so it never just vanishes in a single frame.
const AUTH_ROUTES: string[] = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
];
const LEAVE_MS = 200;
// If we are still on screen this long after fading out (for example after a
// log out that stays on the shop), fade back in.
const RESTORE_MS = 700;

// Entrance when the shell first appears (after login, or when the app opens).
// The header drops in, the page rises in, then the navigation rises in.
// It does NOT replay when you switch tabs: the shell stays mounted then.
const ENTER_HEADER = FadeInDown.duration(300).reduceMotion(ReduceMotion.System);
const ENTER_PAGE = FadeInDown.duration(340)
  .delay(70)
  .reduceMotion(ReduceMotion.System);
const ENTER_NAV = FadeInUp.duration(300)
  .delay(110)
  .reduceMotion(ReduceMotion.System);

/** Call this inside any page screen to update the persistent shell's title. */
export function useScreenTitle(title: string) {
  const setTitle = useContext(AppShellTitleContext);
  useEffect(() => {
    setTitle(title);
  }, [title, setTitle]);
}

export function AppShell({
  title: initialTitle = '',
  children,
}: PropsWithChildren<{ title?: string }>) {
  const [title, setTitle] = useState(initialTitle);
  const { user, notice, setNotice, logout } = useSession();
  const { theme } = useAppTheme();
  const pathname = usePathname();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const { turn, busy, go } = usePageWheelTransition();
  const styles = makeStyles(theme);
  const [stage, setStage] = useState({ width: 0, height: 0 });
  // Only what we need from the ScrollView, so this compiles whichever way
  // React Native types the ScrollView instance.
  const scrollRef = useRef<{
    scrollTo: (options: { x?: number; y?: number; animated?: boolean }) => void;
  } | null>(null);
  const role = user?.role ?? null;
  const routes = useMemo(
    () => (role ? getRoleNavigationItems(role) : []),
    [role],
  );
  const activeIndex = role ? navigationIndexForPath(pathname, role) : -1;

  // The ScrollView is shared by every page, so start each new page at the
  // top. During a wheel transition the page is parked off screen at this
  // moment, so the jump is never visible.
  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [pathname]);

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

  // 0 = shell fully visible, 1 = faded out.
  const leaving = useSharedValue(0);
  const leaveStyle = useAnimatedStyle(() => ({
    opacity: 1 - leaving.value,
    transform: [{ translateY: 12 * leaving.value }],
  }));

  // Fade the whole shell out, then run `after` (go to an auth screen, log
  // out...). Ignored if a fade is already running.
  const leaveThen = useCallback(
    (after: () => void) => {
      if (leaving.value > 0) {
        return;
      }
      leaving.value = withTiming(
        1,
        { duration: LEAVE_MS, easing: Easing.in(Easing.quad) },
        (finished) => {
          if (finished) {
            runOnJS(after)();
          }
        },
      );
      setTimeout(() => {
        leaving.value = withTiming(0, { duration: 220 });
      }, RESTORE_MS);
    },
    [leaving],
  );

  const navigateToTab = useCallback(
    (target: Href) => {
      if (AUTH_ROUTES.some((route) => String(target).startsWith(route))) {
        leaveThen(() => router.navigate(target));
        return;
      }
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
    [activeIndex, go, leaveThen, role, routes],
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

  // Because AppShell stays permanently mounted, turn.value is ALWAYS valid
  // (never resets to 0 on route change), so we don't need stageOpacity hacks.
  const pageStyle = useAnimatedStyle(() => ({
    transform: getWheelTransform(turn.value, radius, angle),
  }));

  return (
    <AppShellTitleContext.Provider value={setTitle}>
      <Animated.View style={[styles.root, leaveStyle]}>
        <SafeAreaView
          style={styles.safeArea}
          edges={['top', 'left', 'right', 'bottom']}
        >
          <View style={styles.accent}>
            <View style={styles.accentLeaf} />
            <View style={styles.accentSky} />
          </View>
          <Animated.View entering={ENTER_HEADER} style={styles.header}>
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
                  onPress={() => leaveThen(() => void logout())}
                />
              </View>
            ) : null}
          </Animated.View>

          <Animated.View entering={ENTER_PAGE} style={styles.pageEntrance}>
          <GestureDetector gesture={pageGesture}>
            <View style={styles.stageClip} onLayout={onStageLayout}>
              <Animated.View style={[styles.stage, pageStyle]}>
                <ScrollView
                  ref={(instance) => {
                    scrollRef.current = instance;
                  }}
                  style={styles.scroll}
                  contentContainerStyle={styles.content}
                  keyboardShouldPersistTaps="handled"
                >
                  {notice ? (
                    <Alert tone="info" onDismiss={() => setNotice('')}>
                      {notice}
                    </Alert>
                  ) : null}
                  {title ? <Text style={styles.screenTitle}>{title}</Text> : null}
                  {children}
                </ScrollView>
              </Animated.View>
            </View>
          </GestureDetector>
          </Animated.View>

          <Animated.View entering={ENTER_NAV}>
            <RoleNavigation role={role} onNavigate={navigateToTab} />
          </Animated.View>
        </SafeAreaView>
      </Animated.View>
    </AppShellTitleContext.Provider>
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
    pageEntrance: {
      flex: 1,
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