import React, { useCallback } from 'react';
import { FlatList, ListRenderItemInfo } from 'react-native';
import { MotiView } from 'moti';
import { StockRow } from './StockRow';

interface Props {
  products: any[];
  onPress: (id: number) => void;
  onLongPress?: (id: number) => void;
  onRestock?: (id: number) => void;
}

export function StockList({
  products,
  onPress,
  onLongPress,
  onRestock,
}: Props) {
  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<any>) => (
      <MotiView
        from={{ opacity: 0, translateY: 6 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{
          type: 'timing',
          duration: 180,
          delay: Math.min(index, 8) * 30,
        }}
      >
        <StockRow
          product={item}
          onPress={onPress}
          onLongPress={onLongPress}
          onRestock={onRestock}
        />
      </MotiView>
    ),
    [onPress, onLongPress, onRestock],
  );

  const getItemLayout = useCallback(
    (_data: any, index: number) => ({
      length: 60,
      offset: 60 * index,
      index,
    }),
    [],
  );

  return (
    <FlatList
      data={products}
      keyExtractor={(item) => String(item.id)}
      contentContainerClassName="pt-3 pb-32"
      renderItem={renderItem}
      getItemLayout={getItemLayout}
      initialNumToRender={10}
      maxToRenderPerBatch={10}
      windowSize={5}
      removeClippedSubviews={true}
    />
  );
}
