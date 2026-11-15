import { useState } from 'react';
import { router } from 'expo-router';
import { GuestOnly } from '../auth/RouteGuards';
import { authApi } from '../api/authApi';
import { ApiError } from '../api/client';
import { AuthLink, AuthScreen } from '../components/AuthScreen';
import { Alert, Button, TextField } from '../components/ui';

export default function RegisterScreen() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError('');
    if (!firstName.trim() || !lastName.trim()) {
      setError('Enter your first and last name.');
      return;
    }
    if (!email.trim().includes('@')) {
      setError('Enter a valid email address.');
      return;
    }
    if (!/^(?:\+?[0-9]{7,20})?$/.test(phone.trim())) {
      setError('Enter a valid phone number, or leave it blank.');
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
      const normalizedEmail = email.trim().toLowerCase();
      await authApi.register({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: normalizedEmail,
        phone: phone.trim(),
        password,
      });
      router.replace({
        pathname: '/check-email',
        params: { email: normalizedEmail },
      });
    } catch (requestError) {
      const fieldErrors =
        requestError instanceof ApiError ? requestError.fieldErrors : null;
      setError(
        fieldErrors
          ? Object.values(fieldErrors).join(' ')
          : requestError instanceof Error
            ? requestError.message
            : 'Unable to create your account.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <GuestOnly>
      <AuthScreen
        title="Create your account"
        subtitle="We'll email a link to verify your address before you log in."
      >
        {error ? <Alert tone="error">{error}</Alert> : null}
        <TextField
          label="First name"
          value={firstName}
          onChangeText={setFirstName}
          autoComplete="given-name"
          textContentType="givenName"
          autoCapitalize="words"
        />
        <TextField
          label="Last name"
          value={lastName}
          onChangeText={setLastName}
          autoComplete="family-name"
          textContentType="familyName"
          autoCapitalize="words"
        />
        <TextField
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoComplete="email"
          textContentType="emailAddress"
        />
        <TextField
          label="Phone (optional)"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          autoComplete="tel"
          textContentType="telephoneNumber"
        />
        <TextField
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="new-password"
          textContentType="newPassword"
        />
        <TextField
          label="Confirm password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          autoComplete="new-password"
          textContentType="newPassword"
        />
        <Button
          title="Create account"
          onPress={() => void submit()}
          busy={busy}
        />
        <AuthLink label="Already have an account? Log in" href="/login" />
      </AuthScreen>
    </GuestOnly>
  );
}
