import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, TouchableOpacity, FlatList, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';
import { StatusPill } from '@/components/ui';
import { useProducts } from '@/hooks';
import { useInventoryTransactionsByProduct } from '@/hooks/useInventory';
import { InventoryTransaction, InventoryEventType } from '@/types/inventory.types';

const sariImage = require('@/assets/images/sari-emotions/sari-inventory-state.png');

export default function InventoryLedger() {
  const router = useRouter();
  const { productId } = useLocalSearchParams<{ productId: string }>();
  const parsedProductId = parseInt(productId ?? '', 10);

  const { useGetProduct } = useProducts();
  const productQuery = useGetProduct(parsedProductId);
  const transactionsQuery = useInventoryTransactionsByProduct(parsedProductId);

  const product = productQuery.data;
  const isLoading = productQuery.isLoading || transactionsQuery.isLoading;
  const transactions = transactionsQuery.data || [];

  const handleBack = () => {
    router.back();
  };

  const formatDateTime = (timestampStr: string) => {
    try {
      const d = new Date(timestampStr);
      if (isNaN(d.getTime())) {
        const normalized = timestampStr.replace(' ', 'T') + 'Z';
        const dNorm = new Date(normalized);
        if (!isNaN(dNorm.getTime())) {
          return dNorm.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
        }
        return timestampStr;
      }
      return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
    } catch {
      return timestampStr;
    }
  };

  const getEventBadge = (type: InventoryEventType, sign?: 'positive' | 'negative' | null) => {
    switch (type) {
      case 'restock':
        return <StatusPill variant="success" size="sm">Restock</StatusPill>;
      case 'sale':
        return <StatusPill variant="info" size="sm">Sale</StatusPill>;
      case 'damaged':
        return <StatusPill variant="danger" size="sm">Damaged</StatusPill>;
      case 'adjustment':
        return (
          <StatusPill variant="warning" size="sm">
            {sign === 'positive' ? 'Adjust (+)' : 'Adjust (-)'}
          </StatusPill>
        );
      default:
        return <StatusPill variant="neutral" size="sm">Event</StatusPill>;
    }
  };

  const getQuantityDisplay = (type: InventoryEventType, qty: number, sign?: 'positive' | 'negative' | null) => {
    if (type === 'restock') {
      return { text: `+${qty}`, color: 'text-sage-700' };
    }
    if (type === 'sale' || type === 'damaged') {
      return { text: `-${qty}`, color: 'text-semantic-danger' };
    }
    if (type === 'adjustment') {
      return sign === 'positive'
        ? { text: `+${qty}`, color: 'text-sage-700' }
        : { text: `-${qty}`, color: 'text-semantic-danger' };
    }
    return { text: `${qty}`, color: 'text-ink-700' };
  };

  const getEventIcon = (type: InventoryEventType, sign?: 'positive' | 'negative' | null) => {
    switch (type) {
      case 'restock':
        return <Ionicons name="arrow-up-circle" size={24} color="#2F5C3E" />;
      case 'sale':
        return <Ionicons name="cart" size={24} color="#1F4E5B" />;
      case 'damaged':
        return <Ionicons name="close-circle" size={24} color="#C22D2D" />;
      case 'adjustment':
        return sign === 'positive'
          ? <Ionicons name="trending-up" size={24} color="#C77B0E" />
          : <Ionicons name="trending-down" size={24} color="#C77B0E" />;
      default:
        return <Ionicons name="cube" size={24} color="#7A7165" />;
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header */}
      <View className="bg-cinnamon-500 px-4 py-5 flex-row items-center border-b border-cinnamon-600">
        <TouchableOpacity
          hitSlop={20}
          activeOpacity={0.2}
          onPress={handleBack}
          className="mr-3 p-1 rounded-full bg-cinnamon-600/35"
        >
          <FontAwesome name="arrow-left" size={18} color="#fff" />
        </TouchableOpacity>
        <View className="flex-1">
          <StyledText variant="extrabold" className="text-white text-lg">
            Inventory Ledger
          </StyledText>
          {product && (
            <StyledText variant="regular" className="text-paper-200 text-xs mt-0.5" numberOfLines={1}>
              {product.name}
            </StyledText>
          )}
        </View>
      </View>

      {/* Main Content */}
      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#E85A1F" />
        </View>
      ) : transactions.length === 0 ? (
        <View className="flex-1 justify-center items-center p-6 bg-paper-100">
          <Image
            source={sariImage}
            style={{ width: 180, height: 180, marginBottom: 16 }}
            resizeMode="contain"
          />
          <StyledText variant="extrabold" className="text-ink-900 text-xl text-center mb-2">
            No ledger entries yet
          </StyledText>
          <StyledText variant="regular" className="text-ink-500 text-sm text-center px-4 leading-5">
            Transactions like restocking, sales, and damage adjustments will show up here as they occur.
          </StyledText>
        </View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          renderItem={({ item }: { item: InventoryTransaction }) => {
            const qtyDisplay = getQuantityDisplay(item.type, item.quantity, item.adjustment_sign);
            return (
              <View className="bg-paper-50 border border-ink-100 rounded-2xl p-4 mb-3 shadow-sm flex-row justify-between items-center">
                {/* Event Info */}
                <View className="flex-row items-center flex-1 mr-4">
                  <View className="mr-3 bg-paper-100 p-2 rounded-full">
                    {getEventIcon(item.type, item.adjustment_sign)}
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2 mb-1.5 flex-wrap">
                      {getEventBadge(item.type, item.adjustment_sign)}
                      <StyledText variant="regular" className="text-ink-400 text-[10px]">
                        {formatDateTime(item.timestamp)}
                      </StyledText>
                    </View>
                    {item.note ? (
                      <StyledText variant="regular" className="text-ink-700 text-xs leading-4">
                        {item.note}
                      </StyledText>
                    ) : (
                      <StyledText variant="regular" className="text-ink-400 text-xs italic">
                        No description provided
                      </StyledText>
                    )}
                  </View>
                </View>

                {/* Qty change */}
                <View className="items-end">
                  <StyledText variant="extrabold" className={`text-base ${qtyDisplay.color}`}>
                    {qtyDisplay.text}
                  </StyledText>
                  <StyledText variant="medium" className="text-ink-400 text-[10px] uppercase mt-0.5">
                    pieces
                  </StyledText>
                </View>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}