import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { AuthScreen, AuthLink } from '../components/AuthScreen';
import { Alert, Button, TextField } from '../components/ui';
import { GuestOnly } from '../auth/RouteGuards';
import { useSession } from '../auth/useSession';
import { ApiError } from '../api/client';

export default function LoginScreen() {
  const { login, notice, setNotice } = useSession();
  const params = useLocalSearchParams<{ message?: string }>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError('');
    setNotice('');
    if (!email.trim() || !email.includes('@')) {
      setError('Enter the email you registered with.');
      return;
    }
    if (!password) {
      setError('Enter your password.');
      return;
    }

    setBusy(true);
    try {
      const user = await login(email.trim().toLowerCase(), password);
      router.replace(user.role === 'ROLE_ADMIN' ? '/admin/analytics' : '/shop');
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : 'Unable to log in. Please try again.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <GuestOnly>
      <AuthScreen
        title="Welcome back"
        subtitle="Log in to manage your account and orders."
      >
        {params.message ? <Alert tone="success">{params.message}</Alert> : null}
        {notice ? <Alert tone="info">{notice}</Alert> : null}
        {error ? <Alert tone="error">{error}</Alert> : null}
        <TextField
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="next"
        />
        <TextField
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="current-password"
          textContentType="password"
          onSubmitEditing={() => void submit()}
        />
        <Button title="Log in" onPress={() => void submit()} busy={busy} />
        <AuthLink label="Forgot password?" href="/forgot-password" />
        <AuthLink label="Create an account" href="/register" />
      </AuthScreen>
    </GuestOnly>
  );
}
