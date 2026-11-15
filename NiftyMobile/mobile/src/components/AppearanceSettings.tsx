import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../ThemeProvider';
import type { ThemePreference } from '../theme';
import { Alert, Card, PageTitle } from './ui';

const OPTIONS: {
  value: ThemePreference;
  label: string;
  icon: string;
  hint: string;
}[] = [
  { value: 'system', label: 'Auto', icon: '◐', hint: 'Match your device setting' },
  { value: 'light', label: 'Light', icon: '☀', hint: 'Always use the light look' },
  { value: 'dark', label: 'Night', icon: '☾', hint: 'Always use the dark look' },
];

export function AppearanceSettings() {
  const { theme, preference, ready, error, setPreference } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [saveError, setSaveError] = useState('');

  async function choose(value: ThemePreference) {
    if (value === preference) {
      return;
    }
    try {
      await setPreference(value);
      setSaveError('');
    } catch (requestError) {
      setSaveError(
        requestError instanceof Error
          ? requestError.message
          : 'Appearance preference could not be saved.',
      );
    }
  }

  const message = saveError || error;

  return (
    <Card>
      <PageTitle
        title="Appearance"
        subtitle="Choose how Nifty looks. Auto follows your device."
      />
      {message ? <Alert tone="error">{message}</Alert> : null}
      <View style={styles.list}>
        {OPTIONS.map((option) => {
          const selected = preference === option.value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="button"
              accessibilityLabel={`${option.label}. ${option.hint}`}
              accessibilityState={{ selected, disabled: !ready }}
              disabled={!ready}
              onPress={() => void choose(option.value)}
              style={[
                styles.option,
                selected && styles.optionSelected,
                !ready && styles.optionDisabled,
              ]}
            >
              <Text style={styles.icon}>{option.icon}</Text>
              <View style={styles.copy}>
                <Text style={styles.label}>{option.label}</Text>
                <Text style={styles.hint}>{option.hint}</Text>
              </View>
              <View style={[styles.radio, selected && styles.radioSelected]}>
                {selected ? <View style={styles.radioDot} /> : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </Card>
  );
}

function createStyles(theme: ReturnType<typeof useAppTheme>['theme']) {
  return StyleSheet.create({
    list: {
      gap: 10,
    },
    option: {
      minHeight: 60,
      paddingHorizontal: 14,
      paddingVertical: 10,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      borderWidth: 1,
      borderColor: theme.colors.line,
      borderRadius: theme.radius.control,
      backgroundColor: theme.colors.surface,
    },
    optionSelected: {
      borderColor: theme.colors.leafDeep,
      backgroundColor: theme.colors.surfaceAlt,
    },
    optionDisabled: {
      opacity: 0.5,
    },
    icon: {
      width: 26,
      textAlign: 'center',
      color: theme.colors.text,
      fontSize: 20,
    },
    copy: {
      flex: 1,
      gap: 2,
    },
    label: {
      color: theme.colors.ink,
      fontSize: 14,
      fontWeight: '700',
    },
    hint: {
      color: theme.colors.muted,
      fontSize: 12,
    },
    radio: {
      width: 22,
      height: 22,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: theme.colors.lineStrong,
      borderRadius: 11,
    },
    radioSelected: {
      borderColor: theme.colors.leafDeep,
    },
    radioDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: theme.colors.leafDeep,
    },
  });
}