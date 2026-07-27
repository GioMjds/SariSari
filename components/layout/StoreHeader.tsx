import React, { useCallback, useState } from 'react';
import { Pressable, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { FontAwesome5 } from '@expo/vector-icons';
import { Href, useRouter } from 'expo-router';
import { StyledText } from '@/components/elements';
import { NotificationSheet } from './NotificationSheet';
import { useProfile } from '@/hooks/useProfile';
import { useHomeDashboardData } from '@/hooks/useHomeDashboardData';

export interface StoreHeaderProps {
  isOnline?: boolean;
}

export function StoreHeader({ isOnline = true }: StoreHeaderProps) {
  const router = useRouter();
  const { profile } = useProfile();
  const { alertCount, alerts } = useHomeDashboardData();

  const [isSheetVisible, setSheetVisible] = useState(false);

  const storeName = profile?.storeName || "Juan's Store";
  const ownerName = profile?.ownerName || 'Maria';
  const ownerInitials =
    ownerName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'AN';

  const handleNotificationSelect = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setSheetVisible(true);
  }, []);

  const handleSheetClose = useCallback(() => {
    setSheetVisible(false);
  }, []);

  const handleAlertAction = useCallback(
    (alert: { targetPath: string }) => {
      setSheetVisible(false);
      router.push(alert.targetPath as Href);
    },
    [router],
  );

  const handleSeeAll = useCallback(() => {
    setSheetVisible(false);
    router.push('/(tabs)/home/alerts' as Href);
  }, [router]);

  return (
    <View className="bg-paper-200 px-4 pt-3 pb-2">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1 mr-2">
          <View className="w-10 h-10 rounded-full bg-cinnamon-500 items-center justify-center mr-3 shadow-sm">
            <StyledText variant="extrabold" className="text-paper-50 text-base">
              {ownerInitials}
            </StyledText>
          </View>
          <View className="flex-1">
            <StyledText
              variant="extrabold"
              className="text-ink-900 text-lg leading-tight"
              numberOfLines={1}
            >
              {storeName}
            </StyledText>
            <StyledText
              variant="regular"
              className="text-ink-500 text-xs"
              numberOfLines={1}
            >
              {ownerName}
            </StyledText>
          </View>
        </View>

        <View className="flex-row items-center gap-2">
          <View className="bg-emerald-100/80 px-2.5 py-1 rounded-full flex-row items-center border border-emerald-200">
            <View className="w-2 h-2 rounded-full bg-emerald-600 mr-1.5" />
            <StyledText
              variant="extrabold"
              className="text-emerald-800 text-[10px] tracking-wider uppercase"
            >
              {isOnline ? 'ONLINE' : 'OFFLINE'}
            </StyledText>
          </View>

          <Pressable
            onPress={handleNotificationSelect}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`Notifications, ${alertCount} active alerts`}
            className="w-11 h-11 rounded-full bg-paper-50 items-center justify-center border border-ink-100 relative shadow-sm"
          >
            <FontAwesome5 name="bell" size={16} color="#44403C" />
            {alertCount > 0 ? (
              <View className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-cinnamon-500 border border-paper-50" />
            ) : null}
          </Pressable>
        </View>
      </View>

      <NotificationSheet
        visible={isSheetVisible}
        alerts={alerts}
        onClose={handleSheetClose}
        onAlertAction={handleAlertAction}
        onSeeAll={handleSeeAll}
      />
    </View>
  );
}
