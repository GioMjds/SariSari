import { createRequire as _createRequire } from 'node:module';
const _require = _createRequire(import.meta.url);

export default {
	preset: 'react-native',
	testMatch: [
		'<rootDir>/tests/**/*.test.ts',
		'<rootDir>/tests/**/*.test.tsx',
		'<rootDir>/utils/__tests__/**/*.test.ts',
	],
	// Override the preset's react-native-env so we resolve jest-environment-node
	// from the top-level node_modules. React Native 0.81 ships a nested 29.7.0
	// copy under node_modules/react-native/node_modules that drags in its own
	// 29.7.0 jest-mock. That nested ModuleMocker is missing methods (notably
	// clearMocksOnScope) added in jest 30, so jest-runtime 30.4.2 crashes on
	// the first test with "clearMocksOnScope is not a function". Pointing
	// testEnvironment at the top-level copy makes the whole chain line up.
	testEnvironment: _require.resolve('jest-environment-node'),
	moduleNameMapper: {
		'^@/(.*)$': '<rootDir>/$1',
	},
	transform: {
		'^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
	},
	setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
	collectCoverageFrom: [
		'app/**/*.{ts,tsx}',
		'components/**/*.{ts,tsx}',
		'services/**/*.{ts,tsx}',
		'hooks/**/*.{ts,tsx}',
		'utils/**/*.{ts,tsx}',
		'!**/*.d.ts',
		'!**/node_modules/**',
	],
	testPathIgnorePatterns: ['<rootDir>/node_modules/'],
	transformIgnorePatterns: [
		'node_modules/(?!(\\.pnpm/|(jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)',
	],
};

