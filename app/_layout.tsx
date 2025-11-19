import '../global.css';
import Sonner from '@/components/ui/Sonner';
import ToastContainer from '@/components/ui/Toast';
import GlobalModal from '@/components/ui/GlobalModal';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import StyledTab from '@/components/layout/StyledTab';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

export default function RootLayout() {
	const [fontsLoaded] = useFonts({
		'StackSansText-Regular': require('../assets/fonts/StackSansText-Regular.ttf'),
		'StackSansText-ExtraLight': require('../assets/fonts/StackSansText-ExtraLight.ttf'),
		'StackSansText-Light': require('../assets/fonts/StackSansText-Light.ttf'),
		'StackSansText-Medium': require('../assets/fonts/StackSansText-Medium.ttf'),
		'StackSansText-SemiBold': require('../assets/fonts/StackSansText-SemiBold.ttf'),
		'StackSansText-Bold': require('../assets/fonts/StackSansText-Bold.ttf'),
	});

	useEffect(() => {
		if (!fontsLoaded) return;
	}, [fontsLoaded]);

	useEffect(() => {
		if (fontsLoaded) SplashScreen.hideAsync();
	}, [fontsLoaded]);

	return (
		<QueryClientProvider client={queryClient}>
			<SQLiteProvider databaseName="sarisari.db">
				<SafeAreaProvider>
					<StatusBar style="dark" />
					<Stack
						screenOptions={{
							headerShown: false,
							animation: 'ios_from_right',
							presentation: 'modal'
						}}
					>
						<Stack.Screen name="index" />
						<Stack.Screen name="inventory/index" />
						<Stack.Screen name="sales/index" />
						<Stack.Screen name="products/index" />
						<Stack.Screen name="products/add" />
						<Stack.Screen name="products/edit/[id]" />
						<Stack.Screen name="credits/index" />
						<Stack.Screen name="credits/add" />
						<Stack.Screen name="credits/details/[id]" />
						<Stack.Screen name="credits/add-credit/[id]" />
						<Stack.Screen name="credits/add-payment/[id]" />
						<Stack.Screen name="sales/add" />
						<Stack.Screen name="sales/[id]" />
						<Stack.Screen name="reports/index" />
					</Stack>
					<StyledTab />
					<ToastContainer />
					<Sonner />
					<GlobalModal />
				</SafeAreaProvider>
			</SQLiteProvider>
		</QueryClientProvider>
	);
}
