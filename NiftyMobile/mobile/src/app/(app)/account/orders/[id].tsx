import { RequireRole } from '../../../../auth/RouteGuards';
import { OrderDetailSection } from '../../../../components/account/CustomerSections';

export default function OrderDetailScreen() {
  return (
    <RequireRole role="ROLE_CUSTOMER">
      <OrderDetailSection />
    </RequireRole>
  );
}
