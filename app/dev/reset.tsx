import { useRouter } from 'expo-router';
import * as SQLite from 'expo-sqlite';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Dev-only reset screen. Accessible at /dev/reset when running the app in development.
export default function DevResetScreen() {
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  if (!__DEV__) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>This screen is only available in development.</Text>
      </SafeAreaView>
    );
  }

  const db = SQLite.openDatabaseSync('sarisari.db');

  const runReset = async () => {
    const ok = await new Promise<boolean>((res) =>
      Alert.alert(
        'Reset local DB',
        'This will DELETE all local data in the app. Are you sure?',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => res(false) },
          { text: 'Yes, delete', style: 'destructive', onPress: () => res(true) },
        ]
      )
    );

    if (!ok) return;

    setRunning(true);
    setMessage('Resetting database...');

    try {
      await db.execAsync('PRAGMA foreign_keys = OFF;');

      const tables = [
        'products',
        'inventory_transactions',
        'sales',
        'sale_items',
        'customers',
        'credit_transactions',
        'payments',
      ];

      for (const t of tables) {
        try {
          await db.execAsync(`DROP TABLE IF EXISTS ${t};`);
        } catch (e) {
          console.warn('Failed to drop table', t, e);
        }
      }

      const indexes = [
        'idx_customer_id',
        'idx_payment_customer_id',
        'idx_credit_status',
        'idx_customer_name',
      ];

      for (const idx of indexes) {
        try {
          await db.execAsync(`DROP INDEX IF EXISTS ${idx};`);
        } catch (e) {
          console.warn('Failed to drop index', idx, e);
        }
      }

      await db.execAsync('PRAGMA foreign_keys = ON;');
      await db.execAsync('VACUUM;');

      setMessage('Database reset complete. Restarting app...');

      // Small delay to let user read message, then reload
      setTimeout(() => {
        // navigate to root which often triggers reload in dev; otherwise user can reload manually
        try {
          router.replace('/');
        } catch (_e) {
          // ignore
        }
      }, 800);
    } catch (err: any) {
      setMessage(`Reset failed: ${err?.message || String(err)}`);
    } finally {
      setRunning(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, padding: 20 }}>
      <View style={{ marginTop: 8 }}>
        <Text style={{ fontSize: 20, fontWeight: '700', marginBottom: 12 }}>Development DB Reset</Text>

        <Text style={{ marginBottom: 16 }}>
          Use this screen to drop local tables and vacuum the Expo SQLite database used by the app.
          This is only available in development.
        </Text>

        <Pressable
          onPress={runReset}
          style={({ pressed }) => ({
            backgroundColor: '#6b21a8',
            padding: 14,
            borderRadius: 8,
            opacity: pressed ? 0.8 : 1,
            alignItems: 'center',
          })}
        >
          {running ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={{ color: 'black', fontWeight: '700' }}>Reset Local Database</Text>
          )}
        </Pressable>

        {message ? (
          <Text style={{ marginTop: 16, color: '#374151' }}>{message}</Text>
        ) : null}
      </View>
    </SafeAreaView>
  );
}
