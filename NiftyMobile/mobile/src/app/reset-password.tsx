import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { authApi } from '../api/authApi';
import { ApiError } from '../api/client';
import { AuthLink, AuthScreen } from '../components/AuthScreen';
import { Alert, Button, TextField } from '../components/ui';

export default function ResetPasswordScreen() {
  const { token } = useLocalSearchParams<{ token?: string }>();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError('');
    if (!token) {
      setError('This reset link is missing its token. Request a new link.');
      return;
    }
    if (!/^(?=.*[A-Za-z])(?=.*\d).{8,72}$/.test(password)) {
      setError('Use 8–72 characters with at least one letter and one number.');
      return;
    }
    if (password !== confirmPassword) {
      setError('The passwords do not match.');
      return;
    }

    setBusy(true);
    try {
      await authApi.resetPassword(token, password);
      router.replace({
        pathname: '/login',
        params: { message: 'Password updated. Log in with your new password.' },
      });
    } catch (requestError) {
      const fieldErrors =
        requestError instanceof ApiError ? requestError.fieldErrors : null;
      setError(
        fieldErrors
          ? Object.values(fieldErrors).join(' ')
          : requestError instanceof Error
            ? requestError.message
            : 'Unable to reset the password.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthScreen
      title="Choose a new password"
      subtitle="Password reset links expire and can only be used once."
    >
      {!token ? (
        <Alert tone="error">This link is missing its reset token.</Alert>
      ) : null}
      {error ? <Alert tone="error">{error}</Alert> : null}
      <TextField
        label="New password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
      />
      <TextField
        label="Confirm new password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
      />
      <Button title="Save new password" onPress={() => void submit()} busy={busy} />
      <AuthLink label="Back to log in" href="/login" />
    </AuthScreen>
  );
}
