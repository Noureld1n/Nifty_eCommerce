import { AppearanceSettings } from '../AppearanceSettings';
import { AdminFrame } from './AdminCommon';

export function AdminAppearance() {
  return (
    <AdminFrame
      title="Appearance"
      subtitle="Choose how the admin app looks on this device."
    >
      <AppearanceSettings />
    </AdminFrame>
  );
}