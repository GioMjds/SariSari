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
// Mock expo-secure-store — bare jest.fn() returns undefined for
// getItemAsync, which breaks OAuth tests that need to round-trip
// tokens. We back the mock with an in-memory Map so set → get works.
const mockSecureStoreMap = new Map<string, string>();
jest.mock('expo-secure-store', () => ({
	getItemAsync: jest.fn(async (key: string) => mockSecureStoreMap.get(key) ?? null),
	setItemAsync: jest.fn(async (key: string, value: string) => {
		mockSecureStoreMap.set(key, value);
	}),
	deleteItemAsync: jest.fn(async (key: string) => {
		mockSecureStoreMap.delete(key);
	}),
	__reset: () => mockSecureStoreMap.clear(),
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

// Mock expo-network — the scheduler's `shouldAttemptCloudUpload` calls
// `Network.getNetworkStateAsync`. Tests override per-case via the mock's
// `mockResolvedValueOnce`. Default is a Wi-Fi-connected state.
jest.mock('expo-network', () => ({
	getNetworkStateAsync: jest.fn(async () => ({
		isConnected: true,
		isInternetReachable: true,
		type: 'WIFI',
	})),
	NetworkStateType: { WIFI: 'WIFI', CELLULAR: 'CELLULAR', NONE: 'NONE' },
}));

// Mock expo-constants — `lib/backup/metadata.ts` reads
// `Constants.expoConfig?.version` for the metadata sidecar. Tests
// override via `jest.requireMock('expo-constants').default`.
jest.mock('expo-constants', () => ({
	__esModule: true,
	default: {
		expoConfig: { version: '1.0.0', extra: { googleClientId: '' } },
		manifest: undefined,
	},
}));

// Mock expo-auth-session — `lib/backup/googleDrive.ts` uses PKCE for
// OAuth. Tests don't exercise the OAuth flow itself; auth tests stub
// the whole module out. The mock provides the surface area
// `googleDrive.ts` imports (`makeRedirectUri`, `ResponseType`, etc.).
jest.mock('expo-auth-session', () => ({
	makeRedirectUri: jest.fn(() => 'sarisari://redirect'),
	ResponseType: { Code: 'code', Token: 'token' },
	CodeChallengeMethod: { S256: 'S256' },
	useAuthRequest: jest.fn(() => [
		null,
		null,
		jest.fn(),
	]),
	useAuthRequestResult: jest.fn(),
	AuthRequest: class {
		promptAsync = jest.fn(async () => ({ type: 'success', params: { code: 'x' } }));
	},
	exchangeCodeAsync: jest.fn(async () => ({
		accessToken: 'a',
		refreshToken: 'r',
		expiresIn: 3600,
		tokenType: 'Bearer',
	})),
	refreshAsync: jest.fn(async () => ({
		accessToken: 'a',
		expiresIn: 3600,
		tokenType: 'Bearer',
	})),
}));

// Mock expo-web-browser — used by the OAuth flow's
// `WebBrowser.openAuthSessionAsync`. Tests stub it.
jest.mock('expo-web-browser', () => ({
	maybeCompleteAuthSession: jest.fn(),
	openAuthSessionAsync: jest.fn(async () => ({ type: 'success', url: '' })),
}));

// Mock expo-crypto — `googleDrive.ts` uses `Crypto.digestStringAsync`
// for PKCE. Tests stub.
jest.mock('expo-crypto', () => ({
	digestStringAsync: jest.fn(async () => 'hashed'),
	randomUUID: jest.fn(() => 'uuid'),
	Random: { getRandomBytesAsync: jest.fn(async () => new Uint8Array(32)) },
	CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
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

// Mock expo-haptics — both `stores/ToastStore.ts` and the new barcode
// scanner code import this module. Tests don't assert haptic side
// effects, so no-op stubs are correct. `ToastStore.hapticFor` calls
// become no-ops in tests (acceptable — no test asserts haptics).
jest.mock('expo-haptics', () => ({
	impactAsync: jest.fn(async () => undefined),
	notificationAsync: jest.fn(async () => undefined),
	selectionAsync: jest.fn(async () => undefined),
	ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
	NotificationFeedbackType: {
		Success: 'success',
		Warning: 'warning',
		Error: 'error',
	},
}));

// Mock expo-camera — `components/ui/BarcodeScannerModal.tsx` imports
// `CameraView`, `useCameraPermissions`, and the permission-status enum.
// Tests don't render the camera surface; default to a granted
// permission so existing UI flows aren't blocked by an "undetermined"
// state. CameraView is stubbed as a plain View (children pass-through).
//
// The `mock*`-prefixed variables (mockReact, mockRN) are exempt from
// Jest's "no out-of-scope refs in mock factories" rule.
const mockReact = require('react');
const mockRN = require('react-native');
jest.mock('expo-camera', () => {
	const CameraViewStub = ({ children, ...rest }: any) =>
		mockReact.createElement(mockRN.View, rest, children);
	CameraViewStub.displayName = 'CameraView';
	return {
		CameraView: CameraViewStub,
		useCameraPermissions: jest.fn(() => [
			{ granted: true, canAskAgain: true, status: 'granted' },
			jest.fn(async () => ({
				granted: true,
				canAskAgain: true,
				status: 'granted',
			})),
			jest.fn(async () => undefined),
		]),
		PermissionStatus: {
			GRANTED: 'granted',
			DENIED: 'denied',
			UNDETERMINED: 'undetermined',
		},
	};
});

// Mock React Native Animated helper if available (avoids resolution errors in Node)
try {
	jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');
} catch {
	// Module not found in this environment; ignore
}

// Mock @expo/vector-icons to prevent EventEmitter/font loading failures in test runner
jest.mock('@expo/vector-icons', () => {
	const mockReact = require('react');
	const mockRN = require('react-native');
	return {
		FontAwesome: (props: any) => mockReact.createElement(mockRN.Text, props, props.name),
		Ionicons: (props: any) => mockReact.createElement(mockRN.Text, props, props.name),
		MaterialIcons: (props: any) => mockReact.createElement(mockRN.Text, props, props.name),
		MaterialCommunityIcons: (props: any) => mockReact.createElement(mockRN.Text, props, props.name),
		Feather: (props: any) => mockReact.createElement(mockRN.Text, props, props.name),
		Entypo: (props: any) => mockReact.createElement(mockRN.Text, props, props.name),
	};
});

// Mock expo-image-picker to prevent EventEmitter failures in Node/Jest
jest.mock('expo-image-picker', () => ({
	requestCameraPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
	requestMediaLibraryPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
	launchCameraAsync: jest.fn(async () => ({ canceled: true, assets: [] })),
	launchImageLibraryAsync: jest.fn(async () => ({ canceled: true, assets: [] })),
}));

// Mock expo-linear-gradient to prevent EventEmitter failures in Node/Jest
jest.mock('expo-linear-gradient', () => {
	const mockReact = require('react');
	const mockRN = require('react-native');
	return {
		LinearGradient: ({ children, ...rest }: any) => mockReact.createElement(mockRN.View, rest, children),
	};
});

// Mock react-native-reanimated using a lightweight mock to bypass react-native's mockComponent constructor errors
jest.mock('react-native-reanimated', () => {
	const mockReact = require('react');
	const mockRN = require('react-native');
	return {
		__esModule: true,
		default: {
			View: mockRN.View,
			Text: mockRN.Text,
			Image: mockRN.View,
			ScrollView: mockRN.ScrollView,
		},
		useSharedValue: (initial: any) => ({ value: initial }),
		useAnimatedStyle: (fn: any) => fn() || {},
		withTiming: (toValue: any) => toValue,
		withRepeat: (animation: any) => animation,
		Easing: {
			inOut: (fn: any) => fn,
			ease: (x: any) => x,
			linear: (x: any) => x,
		},
	};
});

// Mock react-native Modal to avoid importing LogBox and standard Text mock components
jest.mock('react-native/Libraries/Modal/Modal', () => {
	const mockReact = require('react');
	const mockRN = require('react-native');
	const ModalMock = ({ visible, children }: any) => {
		return visible ? mockReact.createElement(mockRN.View, null, children) : null;
	};
	return {
		__esModule: true,
		default: ModalMock,
	};
});