import { Slot } from 'expo-router';
import { AppShell } from '../../components/AppShell';

// Every screen inside the (app) folder gets the persistent header, bottom
// navigation and page wheel. Screens outside it (login, register, ...) don't.
export default function AppGroupLayout() {
  return (
    <AppShell>
      <Slot />
    </AppShell>
  );
}