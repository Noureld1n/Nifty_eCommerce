import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from './ui';
import { useAppTheme } from '../ThemeProvider';

export function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  if (totalPages <= 1) {
    return null;
  }

  return (
    <View style={styles.row}>
      <Button
        title="Previous"
        variant="secondary"
        disabled={page <= 0}
        onPress={() => onChange(page - 1)}
      />
      <Text style={styles.label}>
        {page + 1} of {totalPages}
      </Text>
      <Button
        title="Next"
        variant="secondary"
        disabled={page + 1 >= totalPages}
        onPress={() => onChange(page + 1)}
      />
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useAppTheme>['theme']) {
  return StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  label: {
    color: theme.colors.muted,
    fontSize: 13,
  },
  });
}
