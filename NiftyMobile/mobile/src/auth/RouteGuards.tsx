import { useEffect, type PropsWithChildren } from 'react';
import { router } from 'expo-router';
import type { UserRole } from '../api/types';
import { ErrorState, LoadingState } from '../components/ui';
import { useSession } from './useSession';

export function RequireRole({
  role,
  children,
}: PropsWithChildren<{ role: UserRole }>) {
  const { user, status, bootError, retryRestore } = useSession();

  useEffect(() => {
    if (status === 'anonymous') {
      router.replace('/login');
    } else if (status === 'authenticated' && user?.role !== role) {
      router.replace(user?.role === 'ROLE_ADMIN' ? '/admin/analytics' : '/shop');
    }
  }, [role, status, user?.role]);

  if (status === 'loading') {
    return <LoadingState label="Restoring your session" />;
  }

  if (status === 'error') {
    return (
      <ErrorState
        message={bootError ?? 'Unable to restore the session.'}
        onRetry={() => void retryRestore()}
      />
    );
  }

  if (status !== 'authenticated' || user?.role !== role) {
    return null;
  }

  return children;
}

export function GuestOnly({ children }: PropsWithChildren) {
  const { user, status, bootError, retryRestore } = useSession();

  useEffect(() => {
    if (status === 'authenticated' && user) {
      router.replace(
        user.role === 'ROLE_ADMIN' ? '/admin/analytics' : '/shop',
      );
    }
  }, [status, user]);

  if (status === 'loading') {
    return <LoadingState label="Restoring your session" />;
  }

  if (status === 'error') {
    return (
      <ErrorState
        message={bootError ?? 'Unable to restore the session.'}
        onRetry={() => void retryRestore()}
      />
    );
  }

  return status === 'anonymous' ? children : null;
}
