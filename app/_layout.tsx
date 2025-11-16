import '../global.css';
import StyledTab from '@/components/layout/StyledTab';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Tabs } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

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
					<Tabs
						tabBar={(props) => <StyledTab {...props} />}
						screenOptions={{ headerShown: false }}
					>
						<Tabs.Screen name="inventory/index" options={{ href: '/inventory' }} />
						<Tabs.Screen name="sales/index" options={{ href: '/sales' }} />
						<Tabs.Screen name="products/index" options={{ href: '/products' }} />
						<Tabs.Screen name="credits/index" options={{ href: '/credits' }} />
						<Tabs.Screen name="reports/index" options={{ href: '/reports' }} />
						<Tabs.Screen name="credits/add" options={{ href: null }} />
						<Tabs.Screen name="inventory/add" options={{ href: null }} />
						<Tabs.Screen name="sales/add" options={{ href: null }} />
						<Tabs.Screen name="products/add" options={{ href: null }} />
						<Tabs.Screen name="products/edit/[id]" options={{ href: null }} />
					</Tabs>
				</SafeAreaProvider>
			</SQLiteProvider>
		</QueryClientProvider>
	);
}
