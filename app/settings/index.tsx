import { SettingsScreen } from '@/components/settings/SettingsScreen';
import { StatusBar } from 'expo-status-bar';

export default function SettingsModal() {
  return (
    <>
      <StatusBar style="light" backgroundColor="#623418" />
      <SettingsScreen />
    </>
  );
}
