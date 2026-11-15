import { useState } from 'react';
import { authApi } from '../api/authApi';
import { ApiError } from '../api/client';
import { AuthLink, AuthScreen } from '../components/AuthScreen';
import { Alert, Button, TextField } from '../components/ui';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError('');
    setMessage('');
    if (!email.trim().includes('@')) {
      setError('Enter a valid email address.');
      return;
    }
    setBusy(true);
    try {
      const response = await authApi.forgotPassword(email.trim().toLowerCase());
      setMessage(
        response.message ?? 'If the account exists, a reset email was sent.',
      );
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : 'Unable to request a password reset.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthScreen
      title="Reset your password"
      subtitle="Enter your email and we'll send a secure reset link."
    >
      {message ? <Alert tone="success">{message}</Alert> : null}
      {error ? <Alert tone="error">{error}</Alert> : null}
      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoComplete="email"
        textContentType="emailAddress"
      />
      <Button title="Send reset link" onPress={() => void submit()} busy={busy} />
      <AuthLink label="Back to log in" href="/login" />
    </AuthScreen>
  );
}
