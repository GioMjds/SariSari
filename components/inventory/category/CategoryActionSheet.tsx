import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';
import { Sheet } from '@/components/ui/Sheet';
import {
  SheetActionGroup,
  SheetActionRow,
  SheetDeleteAction,
} from '@/components/ui/SheetActions';
import type { CategoryWithCount } from '@/types';
import { CATEGORY_TINTS } from './CategoryCard';

interface CategoryActionSheetProps {
  visible: boolean;
  category: CategoryWithCount | null;
  /** All products across categories, for the share line. */
  totalProducts: number;
  deleting: boolean;
  onClose: () => void;
  onViewProducts: (category: CategoryWithCount) => void;
  onRename: (category: CategoryWithCount) => void;
  onDelete: (category: CategoryWithCount) => void;
}

export function CategoryActionSheet({
  visible,
  category,
  totalProducts,
  deleting,
  onClose,
  onViewProducts,
  onRename,
  onDelete,
}: CategoryActionSheetProps) {
  // Keep the last category so the sheet still has content while it slides out.
  const [shown, setShown] = useState(category);
  useEffect(() => {
    if (category) setShown(category);
  }, [category]);

  if (!shown) return null;

  const tint = CATEGORY_TINTS[shown.id % CATEGORY_TINTS.length]!;
  const count = shown.product_count;
  const share = totalProducts > 0 ? Math.round((count / totalProducts) * 100) : 0;
  const countLabel = `${count} ${count === 1 ? 'product' : 'products'}`;

  return (
    <Sheet visible={visible} onClose={onClose}>
      <View className="flex-row items-center gap-x-3 pb-4 border-b border-dashed border-paper-400">
        <View
          className={`w-14 h-14 rounded-xl items-center justify-center ${tint.tile}`}
        >
          <StyledText variant="black" className={`text-h2 ${tint.text}`}>
            {shown.name.trim().charAt(0).toUpperCase()}
          </StyledText>
        </View>
        <View className="flex-1 min-w-0">
          <StyledText
            variant="extrabold"
            accessibilityRole="header"
            numberOfLines={2}
            className="text-h3 text-ink-900"
          >
            {shown.name}
          </StyledText>
          <StyledText
            variant="medium"
            className="text-caption text-ink-500 mt-0.5"
            style={{ fontVariant: ['tabular-nums'] }}
          >
            {count === 0
              ? 'No products yet'
              : `${countLabel} · ${share}% of your catalog`}
          </StyledText>
        </View>
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={`Close actions for ${shown.name}`}
          hitSlop={4}
          className="w-10 h-10 -mr-2 rounded-pill items-center justify-center active:bg-paper-100"
        >
          <FontAwesome name="times" size={16} color="#564E45" />
        </Pressable>
      </View>

      <SheetActionGroup>
        <SheetActionRow
          icon="th-list"
          label="View products"
          hint={count === 0 ? 'Nothing here yet' : `Browse ${countLabel}`}
          iconColor="#E85A1F"
          onPress={() => onViewProducts(shown)}
        />
        <SheetActionRow
          icon="pencil"
          label="Rename"
          hint="Change how this shelf is labeled"
          onPress={() => onRename(shown)}
        />
      </SheetActionGroup>

      <SheetDeleteAction
        label="Delete category"
        prompt={`Delete ${shown.name}?`}
        {...(count > 0
          ? {
              detail: `${countLabel} will lose this category. The products themselves stay.`,
            }
          : {})}
        busy={deleting}
        onConfirm={() => onDelete(shown)}
      />
    </Sheet>
  );
}
