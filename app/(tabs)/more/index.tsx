import { MoreHomeScreen } from '@/components/more';
import { withFeatureGuard } from '@/components/withFeatureGuard';

function MoreTab() {
  return <MoreHomeScreen />;
}

export default withFeatureGuard(MoreTab, __DEV__);
