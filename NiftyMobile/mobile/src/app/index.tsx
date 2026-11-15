import { useEffect, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useSession } from '../auth/useSession';
import { Alert, Button, LoadingState } from '../components/ui';
import { useAppTheme } from '../ThemeProvider';

export default function IndexScreen() {
  const { theme } = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { status, user, bootError, retryRestore } = useSession();
  const role = user?.role;

  useEffect(() => {
    if (status === 'authenticated' && role) {
      router.replace(
        role === 'ROLE_ADMIN' ? '/admin/analytics' : '/shop',
      );
    } else if (status === 'anonymous') {
      router.replace('/shop');
    }
  }, [status, role]);

  if (status === 'error') {
    return (
      <View style={styles.error}>
        <Alert tone="error">{bootError ?? 'Unable to restore your session.'}</Alert>
        <Button title="Try again" onPress={() => void retryRestore()} />
      </View>
    );
  }

  return <LoadingState label="Starting Nifty" />;
}

function makeStyles(theme: ReturnType<typeof useAppTheme>['theme']) {
  return StyleSheet.create({
  error: {
    flex: 1,
    justifyContent: 'center',
    padding: theme.spacing.screen,
    gap: theme.spacing.section,
    backgroundColor: theme.colors.background,
  },
  });
}
