import 'react-native-gesture-handler/jestSetup';

// Set environment variables for tests
if (!process.env.NODE_ENV) {
	Object.defineProperty(process.env, 'NODE_ENV', {
		value: 'test',
		writable: false,
	});
}
process.env.JWT_SECRET = 'kgiohqaxca';
process.env.EXPO_PUBLIC_API_URL = 'http://localhost:3000';
process.env.EXPO_PUBLIC_DJANGO_URL = 'http://localhost:8000';

// Mock Expo modules
jest.mock('expo-secure-store', () => ({
	getItemAsync: jest.fn(),
	setItemAsync: jest.fn(),
	deleteItemAsync: jest.fn(),
}));

jest.mock('expo-router', () => ({
	useRouter: () => ({
		push: jest.fn(),
		replace: jest.fn(),
		back: jest.fn(),
		canGoBack: jest.fn(() => true),
	}),
	useLocalSearchParams: () => ({}),
	useGlobalSearchParams: () => ({}),
	usePathname: () => '/',
}));

// Mock React Native Animated helper if available (avoids resolution errors in Node)
try {
	jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');
} catch {
	// Module not found in this environment; ignore
}

// Silence console warnings in tests
global.console = {
	...console,
	error: jest.fn(),
	warn: jest.fn(),
	log: console.log, // Keep log for debugging
};
