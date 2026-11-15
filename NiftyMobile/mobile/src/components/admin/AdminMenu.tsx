import { router } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { Button, PageTitle } from '../ui';
import { AdminFrame } from './AdminCommon';

const TOOLS = [
  ['Promotions', '/admin/promotions'],
  ['Procurement & stock', '/admin/procurement'],
  ['Users', '/admin/users'],
  ['Customer feedback', '/admin/feedback'],
  ['Audit log', '/admin/audit-log'],
] as const;

export function AdminMenu() {
  return (
    <AdminFrame
      title="Admin tools"
      subtitle="Choose an administration workflow."
    >
      <PageTitle title="Operations" />
      <View style={styles.list}>
        {TOOLS.map(([title, href]) => (
          <Button
            key={href}
            title={title}
            variant="secondary"
            onPress={() => router.push(href)}
          />
        ))}
      </View>
      <PageTitle title="Preferences" />
      <View style={styles.list}>
        <Button
          title="Appearance"
          variant="secondary"
          onPress={() => router.push('/admin/appearance')}
        />
      </View>
    </AdminFrame>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 10,
  },
});