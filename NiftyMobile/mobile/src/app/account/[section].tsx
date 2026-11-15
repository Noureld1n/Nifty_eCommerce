import { useLocalSearchParams } from 'expo-router';
import { Text } from 'react-native';
import { RequireRole } from '../../auth/RouteGuards';
import { CustomerAppearance } from '../../components/account/CustomerAppearance';
import { CUSTOMER_SECTIONS } from '../../components/account/CustomerSections';
import { useScreenTitle } from '../../components/AppShell';
import { Card } from '../../components/ui';

const SECTIONS = {
  ...CUSTOMER_SECTIONS,
  appearance: CustomerAppearance,
};

export default function AccountSectionScreen() {
  const { section } = useLocalSearchParams<{ section?: string }>();
  const Screen =
    typeof section === 'string'
      ? SECTIONS[section as keyof typeof SECTIONS]
      : undefined;

  return (
    <RequireRole role="ROLE_CUSTOMER">
      {Screen ? <Screen /> : <NotFoundSection />}
    </RequireRole>
  );
}

function NotFoundSection() {
  useScreenTitle('Account');
  return (
    <Card>
      <Text>That account section does not exist.</Text>
    </Card>
  );
}