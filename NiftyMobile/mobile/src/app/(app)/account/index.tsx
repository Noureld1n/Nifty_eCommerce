import { useEffect } from 'react';
import { router } from 'expo-router';
import { RequireRole } from '../../../auth/RouteGuards';
import { LoadingState } from '../../../components/ui';

export default function AccountIndexScreen() {
  useEffect(() => {
    router.replace('/account/profile');
  }, []);

  return (
    <RequireRole role="ROLE_CUSTOMER">
      <LoadingState label="Opening your account" />
    </RequireRole>
  );
}
