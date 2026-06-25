import 'react-native-gesture-handler/jestSetup';
import 'react-native/jest/setup';

jest.mock('@/configs/sqlite', () => {
	const setup = require('./tests/__setup__/expo-sqlite-mock');
	return { db: setup.mockDb };
});

const RN = require('react-native');
const React = require('react');

const overrideComponent = (name: string) => {
	const comp = ({ children, ...props }: any) => {
		return React.createElement(name, props, children);
	};
	comp.displayName = name;
	Object.defineProperty(RN, name, {
		value: comp,
		configurable: true,
		enumerable: true,
		writable: true,
	});
};

overrideComponent('View');
overrideComponent('Text');
overrideComponent('TouchableOpacity');
overrideComponent('Pressable');

// Define __DEV__ for React Native environment inside Jest
(global as any).__DEV__ = true;

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