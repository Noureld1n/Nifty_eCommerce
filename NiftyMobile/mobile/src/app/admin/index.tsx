import { useEffect } from 'react';
import { router } from 'expo-router';
import { RequireRole } from '../../auth/RouteGuards';
import { LoadingState } from '../../components/ui';

export default function AdminIndexScreen() {
  useEffect(() => {
    router.replace('/admin/analytics');
  }, []);

  return (
    <RequireRole role="ROLE_ADMIN">
      <LoadingState label="Opening admin overview" />
    </RequireRole>
  );
}
