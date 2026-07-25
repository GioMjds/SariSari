import React from 'react';
import { View, Text } from 'react-native';

export const LegacyCashSessionBanner: React.FC = () => (
  <View className="bg-gray-100 dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700 mb-3">
    <Text className="text-xs text-gray-600 dark:text-gray-400 font-medium">
      Legacy Cash Sessions (Read-Only). Use Gastos & Kaha Ledger for recording operating expenses and owner drawings.
    </Text>
  </View>
);
