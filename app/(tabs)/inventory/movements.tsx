import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { getInventoryTransactions } from '@/database/inventory';
import {
  MovementList,
  MovementSkeleton,
} from '@/components/inventory/movements';
import { InventoryErrorState } from '@/components/inventory';

export default function MovementsScreen() {
  const [data, setData] = useState<any[] | null>(null);
  const [error, setError] = useState<{ message: string } | null>(null);

  const load = useCallback(() => {
    let alive = true;
    setError(null);
    setData(null);
    getInventoryTransactions()
      .then((tx) => {
        if (alive) setData(tx as any[]);
      })
      .catch((e) => {
        if (alive) {
          setError({
            message:
              e instanceof Error
                ? e.message
                : 'Could not read the local movements database.',
          });
        }
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => load(), [load]);

  if (error) {
    return (
      <InventoryErrorState
        title="Couldn't load movements"
        message={error.message}
        onRetry={load}
      />
    );
  }
  if (!data) return <MovementSkeleton />;
  return (
    <View className="flex-1 bg-paper-200">
      <MovementList movements={data} />
    </View>
  );
}
