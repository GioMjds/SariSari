import { withProf } from '@/utils/perf';
import { SuppliersTab } from '@/components/inventory/suppliers';

function SuppliersScreen() {
  return <SuppliersTab />;
}

export default withProf(SuppliersScreen, 'inventory/suppliers');
