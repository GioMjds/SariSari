import { StyledTab } from '@/components/layout';
import { Tabs, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { BackHandler, View, Image } from 'react-native';
import { useDialogStore } from '@/stores';
import { Modal as CustomModal } from '@/components/ui';

const sariExitImage = require('@/assets/images/sari-emotions/sari-exit-state.png');

export default function ScreensLayout() {
  const pathname = usePathname();
  const { visible: dialogVisible, showDialog, hideDialog } = useDialogStore();

  const handleExitApp = () => {
    hideDialog();
    BackHandler.exitApp();
  };

  const handleCancelExit = () => {
    hideDialog();
  };

  useEffect(() => {
    const backAction = () => {
      // Check if current route is a top-level tab
      const isTopLevelTab = ['/', '/sell', '/inventory', '/utang', '/reports'].includes(pathname);
      if (isTopLevelTab) {
        showDialog({
          title: 'Exit App',
          message: 'Are you sure you want to exit the app?',
          showCloseButton: false,
        });
        return true; // Prevent default back behavior
      }
      return false; // Allow default back behavior
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

    return () => backHandler.remove();
  }, [pathname, showDialog]);

  return (
    <>
      <StatusBar style="light" backgroundColor="#623418" />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: 'none' },
        }}
      />
      <StyledTab />

      <CustomModal
        visible={dialogVisible}
        onClose={handleCancelExit}
        title="Exit App"
        description="Are you sure you want to exit the app?"
        variant="warning"
        buttons={[
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: handleCancelExit,
          },
          {
            text: 'Exit',
            style: 'destructive',
            onPress: handleExitApp,
          },
        ]}
      >
        <View className="items-center mt-2 mb-1">
          <Image
            source={sariExitImage}
            style={{ width: 140, height: 140 }}
            resizeMode="contain"
          />
        </View>
      </CustomModal>
    </>
  );
}
