import { useMemo, type PropsWithChildren } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppShell } from '../AppShell';
import { useAppTheme } from '../../ThemeProvider';

export function AdminFrame({
  title,
  subtitle,
  children,
}: PropsWithChildren<{ title: string; subtitle: string }>) {
  const styles = useStyles();
  return (
    <AppShell title={title}>
      <Text style={styles.subtitle}>{subtitle}</Text>
      {children}
    </AppShell>
  );
}

export function AdminMetric({
  label,
  value,
  note,
  tone = 'leaf',
}: {
  label: string;
  value: string;
  note?: string;
  tone?: 'leaf' | 'blue' | 'ink' | 'mint';
}) {
  const styles = useStyles();
  return (
    <View style={[styles.metric, styles[`metric_${tone}`]]}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      {note ? <Text style={styles.metricNote}>{note}</Text> : null}
    </View>
  );
}

export function AuditValue({
  oldValues,
  newValues,
}: {
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
}) {
  const styles = useStyles();
  const keys = new Set([
    ...Object.keys(oldValues ?? {}),
    ...Object.keys(newValues ?? {}),
  ]);
  if (!keys.size) {
    return <Text style={styles.muted}>No field changes recorded.</Text>;
  }
  return (
    <View style={styles.auditValues}>
      {[...keys].map((key) => (
        <Text key={key} style={styles.muted}>
          {key}: {String(oldValues?.[key] ?? '—')} →{' '}
          {String(newValues?.[key] ?? '—')}
        </Text>
      ))}
    </View>
  );
}

function useStyles() {
  const { theme } = useAppTheme();
  return useMemo(() => createStyles(theme), [theme]);
}

function createStyles(theme: ReturnType<typeof useAppTheme>['theme']) {
  return StyleSheet.create({
  subtitle: {
    color: theme.colors.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  metric: {
    padding: 18,
    gap: 7,
    borderWidth: 1,
    borderColor: theme.colors.line,
    borderTopWidth: 3,
    borderRadius: theme.radius.card,
    backgroundColor: theme.colors.surface,
  },
  metric_leaf: {
    borderTopColor: theme.colors.leafDeep,
  },
  metric_blue: {
    borderTopColor: theme.colors.skyDeep,
  },
  metric_ink: {
    borderTopColor: theme.colors.ink,
  },
  metric_mint: {
    borderTopColor: '#45A875',
  },
  metricLabel: {
    color: theme.colors.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  metricValue: {
    color: theme.colors.ink,
    fontSize: 24,
    fontWeight: '800',
  },
  metricNote: {
    color: theme.colors.muted,
    fontSize: 12,
    lineHeight: 18,
  },
  muted: {
    color: theme.colors.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  auditValues: {
    gap: 4,
  },
  });
}
