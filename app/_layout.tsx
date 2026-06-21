import { GlobalModal, Sonner, ToastContainer } from '@/components/ui';
import { initCategoriesTable, initCreditsTable, initInventoryTable, initProductsTable, initSalesTables } from '@/db';
import { seedDatabase } from '@/db/seed';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import '../global.css';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

let databaseInitialized = false;

const executeWithRetry = async <T,>(
	fn: () => Promise<T>,
	maxRetries = 3,
	delayMs = 500
): Promise<T> => {
	for (let i = 0; i < maxRetries; i++) {
		try {
			return await fn();
		} catch (error) {
			console.warn(`Attempt ${i + 1} failed:`, error);
			if (i === maxRetries - 1) {
				console.error('Max retries exceeded for database operation');
				throw error;
			}
			await new Promise(resolve => setTimeout(resolve, delayMs * (i + 1)));
		}
	}
	throw new Error('Max retries exceeded');
};

const initializeDatabases = async () => {
	if (databaseInitialized) {
		console.log('Database already initialized, skipping...');
		return;
	}

	try {
		await seedDatabase(); // comment out if building and testing apps from other devices to avoid wiping existing data
		await executeWithRetry(async () => {
			await Promise.all([
				initProductsTable(),
				initCreditsTable(),
				initInventoryTable(),
				initSalesTables(),
				initCategoriesTable(),
			]);
		});

		databaseInitialized = true;
	} catch (error) {
		databaseInitialized = false;
		console.error('✗ Database initialization failed:', error);
		throw error;
	}
};

export default function RootLayout() {
	const [fontsLoaded] = useFonts({
		'StackSansText-Regular': require('../assets/fonts/StackSansText-Regular.ttf'),
		'StackSansText-ExtraLight': require('../assets/fonts/StackSansText-ExtraLight.ttf'),
		'StackSansText-Light': require('../assets/fonts/StackSansText-Light.ttf'),
		'StackSansText-Medium': require('../assets/fonts/StackSansText-Medium.ttf'),
		'StackSansText-SemiBold': require('../assets/fonts/StackSansText-SemiBold.ttf'),
		'StackSansText-Bold': require('../assets/fonts/StackSansText-Bold.ttf'),
	});

	const [dbInitError, setDbInitError] = useState<string | null>(null);

	useEffect(() => {
		if (!fontsLoaded) return;
	}, [fontsLoaded]);

	useEffect(() => {
		if (!fontsLoaded) return;

		(async () => {
			try {
				await initializeDatabases();
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : 'Unknown error';
				setDbInitError(errorMessage);
				console.error('Failed to initialize database:', errorMessage);
			}
		})();
	}, [fontsLoaded]);

	useEffect(() => {
		if (fontsLoaded && !dbInitError) {
			SplashScreen.hideAsync();
		}
	}, [fontsLoaded, dbInitError]);

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
					/>
					<ToastContainer />
					<Sonner />
					<GlobalModal />
				</SafeAreaProvider>
			</SQLiteProvider>
		</QueryClientProvider>
	);
}
