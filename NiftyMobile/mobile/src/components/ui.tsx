import { useMemo, type PropsWithChildren } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { useAppTheme } from '../ThemeProvider';

type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  busy?: boolean;
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  busy = false,
}: ButtonProps) {
  const { styles, theme } = useStyles();
  const unavailable = disabled || busy;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: unavailable, busy }}
      disabled={unavailable}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        styles[`button_${variant}`],
        pressed && !unavailable && styles.buttonPressed,
        unavailable && styles.buttonDisabled,
      ]}
    >
      {busy ? (
        <ActivityIndicator
          color={variant === 'primary' ? theme.colors.ink : theme.colors.skyDeep}
        />
      ) : (
        <Text style={[styles.buttonText, styles[`buttonText_${variant}`]]}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}

type TextFieldProps = Omit<TextInputProps, 'style'> & {
  label: string;
  error?: string;
  hint?: string;
};

export function TextField({ label, error, hint, ...inputProps }: TextFieldProps) {
  const { styles, theme } = useStyles();
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        autoCapitalize="none"
        placeholderTextColor={theme.colors.muted}
        textAlignVertical={inputProps.multiline ? 'top' : 'center'}
        style={[
          styles.input,
          inputProps.multiline && styles.multilineInput,
          error && styles.inputError,
        ]}
        {...inputProps}
      />
      {hint ? <Text style={styles.fieldHint}>{hint}</Text> : null}
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

type AlertProps = PropsWithChildren<{
  tone?: 'info' | 'success' | 'error';
  onDismiss?: () => void;
}>;

export function Alert({ tone = 'info', children, onDismiss }: AlertProps) {
  const { styles } = useStyles();
  return (
    <View
      accessibilityRole="alert"
      style={[styles.alert, styles[`alert_${tone}`]]}
    >
      <Text style={[styles.alertText, styles[`alertText_${tone}`], styles.alertContent]}>
        {children}
      </Text>
      {onDismiss ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dismiss message"
          onPress={onDismiss}
          hitSlop={8}
        >
          <Text style={[styles.alertText, styles[`alertText_${tone}`], styles.dismiss]}>
            Dismiss
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Card({ children }: PropsWithChildren) {
  const { styles } = useStyles();
  return <View style={styles.card}>{children}</View>;
}

export function PageTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  const { styles } = useStyles();
  return (
    <View style={styles.pageTitle}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export function LoadingState({ label = 'Loading' }: { label?: string }) {
  const { styles, theme } = useStyles();
  return (
    <View style={styles.state}>
      <ActivityIndicator size="large" color={theme.colors.leafDeep} />
      <Text style={styles.subtitle}>{label}…</Text>
    </View>
  );
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  const { styles } = useStyles();
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.subtitle}>{description}</Text>
    </View>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  const { styles } = useStyles();
  return (
    <View style={styles.errorState}>
      <Alert tone="error">{message}</Alert>
      {onRetry ? (
        <Button title="Try again" onPress={onRetry} variant="secondary" />
      ) : null}
    </View>
  );
}

function useStyles() {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return { styles, theme };
}

function createStyles(theme: ReturnType<typeof useAppTheme>['theme']) {
  return StyleSheet.create({
  button: {
    minHeight: 50,
    paddingHorizontal: 18,
    borderRadius: theme.radius.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button_primary: {
    backgroundColor: theme.colors.leaf,
  },
  button_secondary: {
    borderWidth: 1,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.surface,
  },
  button_ghost: {
    backgroundColor: 'transparent',
  },
  buttonPressed: {
    opacity: 0.78,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  buttonText_primary: {
    color: theme.colors.ink,
  },
  buttonText_secondary: {
    color: theme.colors.ink,
  },
  buttonText_ghost: {
    color: theme.colors.skyDeep,
  },
  field: {
    gap: 7,
  },
  label: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    minHeight: 50,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: theme.colors.lineStrong,
    borderRadius: theme.radius.control,
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
    fontSize: 16,
  },
  inputError: {
    borderColor: theme.colors.danger,
  },
  multilineInput: {
    minHeight: 120,
    paddingTop: 12,
  },
  fieldHint: {
    color: theme.colors.muted,
    fontSize: 13,
  },
  fieldError: {
    color: theme.colors.danger,
    fontSize: 13,
  },
  alert: {
    padding: 14,
    borderRadius: theme.radius.control,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  alert_info: {
    backgroundColor: theme.colors.infoBackground,
  },
  alert_success: {
    backgroundColor: theme.colors.successBackground,
  },
  alert_error: {
    backgroundColor: theme.colors.dangerBackground,
  },
  alertText: {
    fontSize: 14,
    lineHeight: 20,
  },
  alertContent: {
    flex: 1,
  },
  dismiss: {
    fontWeight: '700',
  },
  alertText_info: {
    color: theme.colors.info,
  },
  alertText_success: {
    color: theme.colors.success,
  },
  alertText_error: {
    color: theme.colors.danger,
  },
  card: {
    padding: 18,
    gap: 12,
    borderWidth: 1,
    borderColor: theme.colors.line,
    borderRadius: theme.radius.card,
    backgroundColor: theme.colors.surface,
  },
  pageTitle: {
    gap: 6,
  },
  title: {
    color: theme.colors.ink,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: theme.colors.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  state: {
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyState: {
    minHeight: 150,
    padding: 22,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: theme.colors.line,
    borderRadius: theme.radius.card,
    backgroundColor: theme.colors.surface,
  },
  emptyTitle: {
    color: theme.colors.ink,
    fontSize: 17,
    fontWeight: '700',
  },
  errorState: {
    gap: 12,
  },
  });
}
