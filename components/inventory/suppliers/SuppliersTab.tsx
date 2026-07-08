import { StyledText } from '@/components/elements';
import { useSuppliers } from '@/hooks';
import { Supplier } from '@/types';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState, memo, useMemo, useCallback } from 'react';
import { SuppliersSkeleton } from './SuppliersSkeleton';
import { FlatList, RefreshControl, TouchableOpacity, View } from 'react-native';
import { MotiView } from 'moti';

interface SuppliersTabProps {
  search: string;
  onMore: (supplier: Supplier) => void;
}

export const SuppliersTab = memo(function SuppliersTab({
  search,
  onMore,
}: SuppliersTabProps) {
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const router = useRouter();

  const { getAllSuppliersQuery } = useSuppliers();
  const { data: suppliers = [], isLoading, refetch } = getAllSuppliersQuery;

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleAddSupplier = () => {
    router.push('/(edit-forms)/add-supplier');
  };

  // Filter suppliers based on search query
  const filteredSuppliers = useMemo(() => {
    const term = search.toLowerCase().trim();
    if (!term) return suppliers;
    return suppliers.filter((supplier) => {
      return (
        supplier.name.toLowerCase().includes(term) ||
        (supplier.contact && supplier.contact.toLowerCase().includes(term))
      );
    });
  }, [suppliers, search]);

  const renderSupplierItem = useCallback(
    ({ item, index }: { item: Supplier; index: number }) => (
      <MotiView
        from={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{
          type: 'timing',
          duration: 320,
          delay: 100 + (index % 5) * 50,
        }}
        className="px-4 py-2"
      >
        <View className="bg-white rounded-2xl p-4 border border-ink-100 flex-row items-center justify-between shadow-sm">
          <View className="flex-1 mr-3">
            <StyledText variant="extrabold" className="text-ink-900 text-base">
              {item.name}
            </StyledText>
            {item.contact ? (
              <View className="flex-row items-center mt-1">
                <FontAwesome
                  name="phone"
                  size={12}
                  color="#7A7165"
                  className="mr-1.5"
                />
                <StyledText
                  variant="regular"
                  className="text-ink-500 text-xs"
                  style={{ fontVariant: ['tabular-nums'] }}
                >
                  {item.contact}
                </StyledText>
              </View>
            ) : null}
            {item.notes ? (
              <StyledText
                variant="regular"
                className="text-ink-400 text-xs mt-1.5 italic"
                numberOfLines={1}
              >
                {item.notes}
              </StyledText>
            ) : null}
          </View>
          <TouchableOpacity
            onPress={() => onMore(item)}
            hitSlop={8}
            className="w-10 h-10 rounded-full bg-paper-100 items-center justify-center border border-ink-100 active:scale-[0.96] transition-transform"
          >
            <FontAwesome name="ellipsis-v" size={16} color="#7A7165" />
          </TouchableOpacity>
        </View>
      </MotiView>
    ),
    [onMore],
  );

  if (isLoading) return <SuppliersSkeleton />;

  return (
    <View className="flex-1">
      {/* Suppliers List */}
      <FlatList
        data={filteredSuppliers}
        keyExtractor={(item) => item.id}
        renderItem={renderSupplierItem}
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#E85A1F"
            colors={['#E85A1F']}
          />
        }
        ListEmptyComponent={
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: 'timing', duration: 400 }}
            className="flex-1 justify-center items-center px-8 mt-24"
          >
            <FontAwesome
              name="address-book-o"
              size={64}
              color="#E85A1F"
              style={{ opacity: 0.3 }}
            />
            <StyledText
              variant="semibold"
              className="text-ink-700 text-lg mt-4 text-center"
            >
              No suppliers found
            </StyledText>
            <StyledText
              variant="regular"
              className="text-ink-500 text-sm mt-2 text-center"
            >
              {search.trim()
                ? "We couldn't find any suppliers matching your search."
                : 'Create suppliers to manage contact details and wholesale costs.'}
            </StyledText>
            {!search.trim() && (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleAddSupplier}
                className="bg-persimmon-500 rounded-pill px-6 py-3 mt-6 shadow-persimmon-glow"
              >
                <StyledText
                  variant="extrabold"
                  className="text-white text-base"
                >
                  Add Supplier
                </StyledText>
              </TouchableOpacity>
            )}
          </MotiView>
        }
      />
    </View>
  );
});
