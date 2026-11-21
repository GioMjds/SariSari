import { withProf } from '@/utils/perf';
import { CategoriesTab } from '@/components/inventory/category';

function CategoriesScreen() {
  return <CategoriesTab />;
}

export default withProf(CategoriesScreen, 'inventory/categories');
