import { useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { ApiError } from '../../api/client';
import { authApi } from '../../api/authApi';
import { AuthLink, AuthScreen } from '../../components/AuthScreen';
import { Alert, Button } from '../../components/ui';

export default function CheckEmailScreen() {
  const { email } = useLocalSearchParams<{ email?: string }>();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function resend() {
    if (!email) {
      setError('Return to registration and enter your email address.');
      return;
    }
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const result = await authApi.resendVerification(email);
      setMessage(result.message ?? 'A new verification email was requested.');
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : 'Unable to resend the verification email.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthScreen
      title="Check your email"
      subtitle={
        email
          ? `Follow the verification link sent to ${email}.`
          : 'Follow the verification link sent to your email address.'
      }
    >
      {message ? <Alert tone="success">{message}</Alert> : null}
      {error ? <Alert tone="error">{error}</Alert> : null}
      <Button title="Resend verification email" onPress={() => void resend()} busy={busy} />
      <AuthLink label="Back to log in" href="/login" />
    </AuthScreen>
  );
}
