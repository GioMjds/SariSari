import { withProf } from '@/utils/perf';
import { MoreHomeScreen } from '@/components/more';

function MoreTab() {
  return <MoreHomeScreen />;
}

export default withProf(MoreTab, 'more/index');
