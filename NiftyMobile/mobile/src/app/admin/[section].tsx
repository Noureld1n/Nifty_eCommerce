import { useLocalSearchParams } from 'expo-router';
import { Text } from 'react-native';
import { RequireRole } from '../../auth/RouteGuards';
import { AppShell } from '../../components/AppShell';
import {
  AdminAuditLog,
  AdminFeedback,
  AdminUsers,
} from '../../components/admin/AdminOperations';
import { AdminAppearance } from '../../components/admin/AdminAppearance';
import { AdminCatalog } from '../../components/admin/AdminCatalog';
import { AdminMenu } from '../../components/admin/AdminMenu';
import { AdminOrders } from '../../components/admin/AdminOrders';
import { AdminOverview } from '../../components/admin/AdminOverview';
import { AdminProcurement } from '../../components/admin/AdminProcurement';
import { AdminPromotions } from '../../components/admin/AdminPromotions';
import { Card } from '../../components/ui';

const SECTIONS = {
  analytics: AdminOverview,
  catalog: AdminCatalog,
  orders: AdminOrders,
  more: AdminMenu,
  promotions: AdminPromotions,
  procurement: AdminProcurement,
  users: AdminUsers,
  feedback: AdminFeedback,
  'audit-log': AdminAuditLog,
  appearance: AdminAppearance,
};

export default function AdminSectionScreen() {
  const { section } = useLocalSearchParams<{ section?: string }>();
  const Screen =
    typeof section === 'string'
      ? SECTIONS[section as keyof typeof SECTIONS]
      : undefined;

  return (
    <RequireRole role="ROLE_ADMIN">
      {Screen ? <Screen /> : <NotFoundSection />}
    </RequireRole>
  );
}

function NotFoundSection() {
  return (
    <AppShell title="Admin">
      <Card>
        <Text>That admin section does not exist.</Text>
      </Card>
    </AppShell>
  );
}