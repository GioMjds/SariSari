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

// Mock expo-file-system/legacy — the legacy namespace is a flat object
// of functions. Tests inject per-test implementations via mockFs below.
// Snapshot/restore tests need the real disk semantics, so the default
// stubs are no-ops that tests replace with temp-dir implementations.
const mockFs = {
	documentDirectory: '/tmp/test/',
	cacheDirectory: '/tmp/test/cache/',
	getInfoAsync: jest.fn(async () => ({ exists: true, size: 1024 })),
	copyAsync: jest.fn(async () => undefined),
	deleteAsync: jest.fn(async () => undefined),
	makeDirectoryAsync: jest.fn(async () => undefined),
	readAsStringAsync: jest.fn(async () => 'U1FMaXRlIGZvcm1hdCAzAA=='),
	readDirectoryAsync: jest.fn(async () => [] as string[]),
	getFreeDiskStorageAsync: jest.fn(async () => 1024 * 1024 * 1024),
	EncodingType: { Base64: 'base64' },
};
jest.mock('expo-file-system/legacy', () => mockFs);

// Mock expo-sqlite — the integrity checker opens a SEPARATE read-only
// handle via openDatabaseAsync. Tests inject per-test behavior through
// mockSqlite below.
const mockSqlite = {
	openDatabaseAsync: jest.fn(async () => {
		throw new Error('openDatabaseAsync not stubbed for this test');
	}),
};
jest.mock('expo-sqlite', () => mockSqlite);

// Mock @react-native-async-storage/async-storage — the snapshot manager
// stores `last_backup_at` and the cloud-sync pending flag here. The
// official in-memory mock from the library covers the test surface
// (getItem / setItem / removeItem / multiGet / multiSet / clear /
// getAllKeys / removeMulti).
jest.mock('@react-native-async-storage/async-storage', () =>
	require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// Mock expo-updates — restoreFromLocal calls `reloadAsync` after
// overwriting the live DB. The mock returns immediately; tests inject
// per-case behavior via `jest.spyOn(Updates, 'reloadAsync')`.
jest.mock('expo-updates', () => ({
	reloadAsync: jest.fn(async () => undefined),
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