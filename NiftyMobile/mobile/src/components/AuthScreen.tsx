import { useMemo, type PropsWithChildren } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAppTheme } from '../ThemeProvider';
import { BrandLogo } from './BrandLogo';
import { ScreenTransition } from './ScreenTransition';

export function AuthScreen({
  title,
  subtitle,
  children,
}: PropsWithChildren<{ title: string; subtitle: string }>) {
  const styles = useStyles();
  return (
    // The themed background stays put; only the content inside it animates.
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScreenTransition>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Pressable
            accessibilityRole="link"
            accessibilityLabel="Nifty home"
            onPress={() => router.replace('/shop')}
          >
            <BrandLogo size={52} />
          </Pressable>
          <View style={styles.intro}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>
          {children}
        </ScrollView>
      </ScreenTransition>
    </SafeAreaView>
  );
}

export function AuthLink({
  label,
  href,
}: {
  label: string;
  href: '/login' | '/register' | '/forgot-password' | '/shop';
}) {
  const styles = useStyles();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push(href)}
      style={styles.link}
    >
      <Text style={styles.linkText}>{label}</Text>
    </Pressable>
  );
}

function useStyles() {
  const { theme } = useAppTheme();
  return useMemo(
    () => createStyles(theme),
    [theme],
  );
}

function createStyles(theme: ReturnType<typeof useAppTheme>['theme']) {
  return StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flexGrow: 1,
    padding: theme.spacing.screen,
    paddingTop: 32,
    gap: 22,
  },
  intro: {
    gap: 6,
  },
  title: {
    color: theme.colors.ink,
    fontSize: 29,
    fontWeight: '800',
  },
  subtitle: {
    color: theme.colors.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  link: {
    minHeight: 42,
    justifyContent: 'center',
  },
  linkText: {
    color: theme.colors.skyDeep,
    fontSize: 15,
    fontWeight: '600',
  },
  });
}