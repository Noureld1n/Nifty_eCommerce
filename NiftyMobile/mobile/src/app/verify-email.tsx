import { useEffect, useRef, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { authApi } from '../api/authApi';
import { ApiError } from '../api/client';
import { AuthLink, AuthScreen } from '../components/AuthScreen';
import { Alert, LoadingState } from '../components/ui';

export default function VerifyEmailScreen() {
  const { token } = useLocalSearchParams<{ token?: string }>();
  const started = useRef<string | null>(null);
  const [status, setStatus] = useState<'waiting' | 'loading' | 'success' | 'error'>(
    'waiting',
  );
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token || started.current === token) {
      return;
    }
    started.current = token;
    setStatus('loading');
    authApi
      .verifyEmail(token)
      .then((response) => {
        setMessage(response.message ?? 'Your email has been verified.');
        setStatus('success');
      })
      .catch((error: unknown) => {
        setMessage(
          error instanceof ApiError
            ? error.message
            : 'Unable to verify this email link.',
        );
        setStatus('error');
      });
  }, [token]);

  return (
    <AuthScreen
      title="Verify your email"
      subtitle="Email verification is handled by the existing Nifty account service."
    >
      {status === 'loading' ? <LoadingState label="Verifying email" /> : null}
      {status === 'success' ? <Alert tone="success">{message}</Alert> : null}
      {status === 'error' ? <Alert tone="error">{message}</Alert> : null}
      {status === 'waiting' ? (
        <Alert tone="info">
          Open the verification link from your email. The link can include a
          token query parameter.
        </Alert>
      ) : null}
      <AuthLink label="Back to log in" href="/login" />
    </AuthScreen>
  );
}
