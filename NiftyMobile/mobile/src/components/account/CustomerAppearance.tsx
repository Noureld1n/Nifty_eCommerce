import { AppShell } from '../AppShell';
import { AppearanceSettings } from '../AppearanceSettings';

export function CustomerAppearance() {
  return (
    <AppShell title="Appearance">
      <AppearanceSettings />
    </AppShell>
  );
}