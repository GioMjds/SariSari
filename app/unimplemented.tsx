import { FeatureUnimplemented } from '@/components/FeatureUnimplemented';
import { StatusBar } from 'expo-status-bar';

export default function UnimplementedScreen() {
  return (
    <>
      <StatusBar style="light" backgroundColor="#623418" />
      <FeatureUnimplemented />
    </>
  );
}
