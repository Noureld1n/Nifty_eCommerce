import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Platform, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SessionProvider } from '../auth/SessionProvider';
import { PageWheelTransitionProvider } from '../PageWheelTransition';
import { ThemeProvider, useAppTheme } from '../ThemeProvider';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <ThemeProvider>
          <SessionProvider>
            <PageWheelTransitionProvider>
              <ThemedNavigation />
            </PageWheelTransitionProvider>
          </SessionProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function ThemedNavigation() {
  const { theme } = useAppTheme();
  const background = theme.colors.background;

  // On web the page behind the app (html/body) is white by default. Any gap
  // while a screen mounts shows it as a white flash, so keep it themed.
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') {
      return;
    }
    document.documentElement.style.backgroundColor = background;
    document.body.style.backgroundColor = background;
  }, [background]);

  return (
    <View style={[styles.container, { backgroundColor: background }]}>
      <StatusBar style={theme.scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'none',
          contentStyle: { backgroundColor: background },
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // Pages swing past the screen edges while spinning; never let that scroll.
    overflow: 'hidden',
  },
});