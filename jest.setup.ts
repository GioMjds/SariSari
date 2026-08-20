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
overrideComponent('Image');

// Define __DEV__ for React Native environment inside Jest
(global as any).__DEV__ = true;

// Set environment variables for tests
if (!process.env.NODE_ENV) {
  Object.defineProperty(process.env, 'NODE_ENV', {
    value: 'test',
    writable: false,
  });
}
process.env['JWT_SECRET'] = 'kgiohqaxca';
process.env['EXPO_PUBLIC_API_URL'] = 'http://localhost:3000';
process.env['EXPO_PUBLIC_DJANGO_URL'] = 'http://localhost:8000';

// Mock Expo modules
// Mock expo-secure-store — bare jest.fn() returns undefined for
// getItemAsync, which breaks OAuth tests that need to round-trip
// tokens. We back the mock with an in-memory Map so set → get works.
const mockSecureStoreMap = new Map<string, string>();
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(
    async (key: string) => mockSecureStoreMap.get(key) ?? null,
  ),
  setItemAsync: jest.fn(async (key: string, value: string) => {
    mockSecureStoreMap.set(key, value);
  }),
  deleteItemAsync: jest.fn(async (key: string) => {
    mockSecureStoreMap.delete(key);
  }),
  __reset: () => mockSecureStoreMap.clear(),
}));

// Mock expo-file-system (SDK 57 modern API: File, Directory, Paths, EncodingType, FileMode)
class MockDirectory {
  uri: string;
  name: string;

  constructor(...paths: (string | MockDirectory | MockFile)[]) {
    const segments = paths.map((p) => (typeof p === 'string' ? p : p?.uri ?? ''));
    let joined = segments.join('/');
    if (!joined.startsWith('file://') && !joined.startsWith('/')) {
      joined = '/' + joined;
    }
    this.uri = joined.replace(/([^:]\/)\/+/g, '$1');
    if (!this.uri.endsWith('/')) {
      this.uri += '/';
    }
    const parts = this.uri.split('/').filter(Boolean);
    this.name = parts[parts.length - 1] || '';
  }

  get exists(): boolean {
    return true;
  }

  get size(): number {
    return 1024;
  }

  create(): void {}
  delete(): void {}
  list(): (MockFile | MockDirectory)[] {
    return [];
  }
}

class MockFile {
  uri: string;
  name: string;

  constructor(...paths: (string | MockDirectory | MockFile)[]) {
    const segments = paths.map((p) => (typeof p === 'string' ? p : p?.uri ?? ''));
    let joined = segments.join('/');
    if (!joined.startsWith('file://') && !joined.startsWith('/')) {
      joined = '/' + joined;
    }
    this.uri = joined.replace(/([^:]\/)\/+/g, '$1');
    const parts = this.uri.split('/').filter(Boolean);
    this.name = parts[parts.length - 1] || '';
  }

  get exists(): boolean {
    return true;
  }

  get size(): number {
    return 1024;
  }

  get modificationTime(): number {
    return Date.now();
  }

  get creationTime(): number {
    return Date.now();
  }

  create(): void {}
  delete(): void {}
  async copy(): Promise<void> {}
  copySync(): void {}
  async move(): Promise<void> {}
  moveSync(): void {}

  async text(): Promise<string> {
    return 'U1FMaXRlIGZvcm1hdCAzAA==';
  }
  textSync(): string {
    return 'U1FMaXRlIGZvcm1hdCAzAA==';
  }
  async base64(): Promise<string> {
    return 'U1FMaXRlIGZvcm1hdCAzAA==';
  }
  base64Sync(): string {
    return 'U1FMaXRlIGZvcm1hdCAzAA==';
  }
  async bytes(): Promise<Uint8Array> {
    return new Uint8Array([83, 81, 76, 105, 116, 101, 32, 102, 111, 114, 109, 97, 116, 32, 51, 0]);
  }
  bytesSync(): Uint8Array {
    return new Uint8Array([83, 81, 76, 105, 116, 101, 32, 102, 111, 114, 109, 97, 116, 32, 51, 0]);
  }
  open(): { readBytes: (len: number) => Uint8Array; close: () => void } {
    return {
      readBytes: (len: number) =>
        new Uint8Array([83, 81, 76, 105, 116, 101, 32, 102, 111, 114, 109, 97, 116, 32, 51, 0].slice(0, len)),
      close: () => {},
    };
  }
  write(): void {}
}

const mockPaths = {
  document: new MockDirectory('/tmp/test/'),
  cache: new MockDirectory('/tmp/test/cache/'),
  bundle: new MockDirectory('/tmp/test/bundle/'),
  availableDiskSpace: 1024 * 1024 * 1024,
  totalDiskSpace: 10 * 1024 * 1024 * 1024,
  join: (...paths: (string | MockDirectory | MockFile)[]) => {
    const raw = paths.map((p) => (typeof p === 'string' ? p : p?.uri ?? '')).join('/');
    return raw.replace(/([^:]\/)\/+/g, '$1');
  },
};

const mockEncodingType = {
  Base64: 'base64',
  UTF8: 'utf8',
};

const mockFileMode = {
  ReadOnly: 'r',
  ReadWrite: 'rw',
  WriteOnly: 'w',
  Append: 'wa',
  Truncate: 'wt',
};

jest.mock('expo-file-system', () => ({
  File: MockFile,
  Directory: MockDirectory,
  Paths: mockPaths,
  EncodingType: mockEncodingType,
  FileMode: mockFileMode,
}));

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
  useAuthRequest: jest.fn(() => [null, null, jest.fn()]),
  useAuthRequestResult: jest.fn(),
  AuthRequest: class {
    promptAsync = jest.fn(async () => ({
      type: 'success',
      params: { code: 'x' },
    }));
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
  digestStringAsync: jest.fn(async (_algo: any, str: string) => `hashed_${str}`),
  getRandomBytesAsync: jest.fn(async (len: number) => {
    const arr = new Uint8Array(len);
    for (let i = 0; i < len; i++) arr[i] = (i + 1) * 15 % 256;
    return arr;
  }),
  randomUUID: jest.fn(() => 'uuid'),
  Random: { getRandomBytesAsync: jest.fn(async (len: number) => new Uint8Array(len)) },
  CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
}));

// Mock expo-router — tests that need finer-grained control over
// `useRouter`, `usePathname`, etc. should re-mock this module locally
// with their own jest.fn() instances. The default here passes through
// to no-op stubs so screens that just render children don't crash.
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
  withLayoutContext: (component: any) => component,
  Tabs: ({ children }: any) => children,
  Stack: ({ children }: any) => children,
  Slot: ({ children }: any) => children,
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

// Mock expo-local-authentication -- lib/auth/biometrics.ts imports this
// module at load time. Defaults describe a phone with an enrolled
// fingerprint; individual tests override with mockResolvedValue.
jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: jest.fn(async () => true),
  isEnrolledAsync: jest.fn(async () => true),
  supportedAuthenticationTypesAsync: jest.fn(async () => [1]),
  authenticateAsync: jest.fn(async () => ({ success: true })),
  AuthenticationType: { FINGERPRINT: 1, FACIAL_RECOGNITION: 2, IRIS: 3 },
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
    FontAwesome: (props: any) =>
      mockReact.createElement(mockRN.Text, props, props.name),
    FontAwesome5: (props: any) =>
      mockReact.createElement(mockRN.Text, props, props.name),
    Ionicons: (props: any) =>
      mockReact.createElement(mockRN.Text, props, props.name),
    MaterialIcons: (props: any) =>
      mockReact.createElement(mockRN.Text, props, props.name),
    MaterialCommunityIcons: (props: any) =>
      mockReact.createElement(mockRN.Text, props, props.name),
    Feather: (props: any) =>
      mockReact.createElement(mockRN.Text, props, props.name),
    Entypo: (props: any) =>
      mockReact.createElement(mockRN.Text, props, props.name),
  };
});

// Mock expo-image-picker to prevent EventEmitter failures in Node/Jest
jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  requestMediaLibraryPermissionsAsync: jest.fn(async () => ({
    status: 'granted',
  })),
  launchCameraAsync: jest.fn(async () => ({ canceled: true, assets: [] })),
  launchImageLibraryAsync: jest.fn(async () => ({
    canceled: true,
    assets: [],
  })),
}));

// Mock expo-clipboard
jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn(async () => true),
  getStringAsync: jest.fn(async () => ''),
}));

// Mock expo-notifications to prevent EventEmitter failures in Node/Jest
jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  requestPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  scheduleNotificationAsync: jest.fn(async () => 'notification-id'),
  cancelScheduledNotificationAsync: jest.fn(async () => undefined),
  setNotificationHandler: jest.fn(),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({
    remove: jest.fn(),
  })),
  removeNotificationSubscription: jest.fn(),
}));

// Mock expo-linear-gradient to prevent EventEmitter failures in Node/Jest
jest.mock('expo-linear-gradient', () => {
  const mockReact = require('react');
  const mockRN = require('react-native');
  return {
    LinearGradient: ({ children, ...rest }: any) =>
      mockReact.createElement(mockRN.View, rest, children),
  };
});

// Mock react-native-reanimated using a lightweight mock to bypass react-native's mockComponent constructor errors
jest.mock('react-native-reanimated', () => {
  const mockReact = require('react');
  const mockRN = require('react-native');
  const createAnimatedComponent = (comp: any) => comp;
  return {
    __esModule: true,
    default: {
      View: mockRN.View,
      Text: mockRN.Text,
      Image: mockRN.View,
      ScrollView: mockRN.ScrollView,
      createAnimatedComponent,
    },
    createAnimatedComponent,
    useSharedValue: (initial: any) => ({ value: initial }),
    useAnimatedStyle: (fn: any) => fn() || {},
    useAnimatedReaction: (prepare: any, react: any) => {
      if (prepare && react) react(prepare(), prepare());
    },
    useDerivedValue: (fn: any) => ({ value: fn() }),
    interpolateColor: (_val: any, _input: any, output: any) => output?.[0] || '#EAE6DF',
    withSpring: (toValue: any) => toValue,
    withTiming: (toValue: any) => toValue,
    withRepeat: (animation: any) => animation,
    Easing: {
      inOut: (fn: any) => fn,
      ease: (x: any) => x,
      linear: (x: any) => x,
      bezier: () => (x: any) => x,
    },
  };
});

// Mock react-native Modal to avoid importing LogBox and standard Text mock components
jest.mock('react-native/Libraries/Modal/Modal', () => {
  const mockReact = require('react');
  const mockRN = require('react-native');
  const ModalMock = ({ visible, children }: any) => {
    return visible
      ? mockReact.createElement(mockRN.View, null, children)
      : null;
  };
  return {
    __esModule: true,
    default: ModalMock,
  };
});

// Mock react-native TextInput to avoid internal mockComponent Text constructor errors
jest.mock('react-native/Libraries/Components/TextInput/TextInput', () => {
  const mockReact = require('react');
  const mockRN = require('react-native');
  const TextInputMock = mockReact.forwardRef(({ onChangeText, value, ...props }: any, ref: any) => {
    return mockReact.createElement(mockRN.View, {
      ...props,
      value,
      onChangeText,
      ref,
    });
  });
  TextInputMock.displayName = 'TextInput';
  return {
    __esModule: true,
    default: TextInputMock,
  };
});

// Mock react-native Image to avoid internal mockComponent Image constructor errors
jest.mock('react-native/Libraries/Image/Image', () => {
  const mockReact = require('react');
  const mockRN = require('react-native');
  const ImageMock = (props: any) => {
    return mockReact.createElement(mockRN.View, props);
  };
  ImageMock.displayName = 'Image';
  return {
    __esModule: true,
    default: ImageMock,
  };
});
// Mock moti
jest.mock('moti', () => {
  const mockReact = require('react');
  const mockRN = require('react-native');
  return {
    MotiView: ({ children, ...rest }: any) =>
      mockReact.createElement(mockRN.View, rest, children),
    MotiText: ({ children, ...rest }: any) =>
      mockReact.createElement(mockRN.Text, rest, children),
    AnimatePresence: ({ children }: any) => children,
  };
});

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  SafeAreaProvider: ({ children }: any) => children,
  SafeAreaView: ({ children }: any) => children,
}));

// Mock expo-image to prevent EventEmitter native module errors in Node/Jest
jest.mock('expo-image', () => {
  const mockReact = require('react');
  const mockRN = require('react-native');
  return {
    Image: (props: any) => mockReact.createElement(mockRN.View, props),
  };
});

// Mock react-native-gifted-charts — the real package ships ESM in
// gifted-charts-core and pulls react-native-svg internals. Tests only
// assert on chart props/lifecycle, not the rendered SVG, so a plain
// passthrough View stub is enough. Replace per-test by re-mocking this
// module locally if a test needs different chart behavior.
jest.mock('react-native-gifted-charts', () => {
  const mockReact = require('react');
  const mockRN = require('react-native');
  const Stub = ({ children, ...props }: any) =>
    mockReact.createElement(mockRN.View, props, children);
  Stub.displayName = 'GiftedChartStub';
  return {
    BarChart: Stub,
    PieChart: Stub,
    LineChart: Stub,
    PopulationPyramid: Stub,
    StackedBarChart: Stub,
    RadarChart: Stub,
    AnimatedThreeDBar: Stub,
  };
});

jest.mock('react-native-keyboard-controller', () =>
  require('react-native-keyboard-controller/jest'),
);
