// jest.config.ts — ESM default export
// See AGENTS.md §4 — single SQLite handle; tests mock `configs/sqlite` so
// every test file uses the same in-memory better-sqlite3 DB.
export default {
	preset: 'react-native',
	testMatch: [
		'<rootDir>/tests/**/*.test.ts',
		'<rootDir>/tests/**/*.test.tsx',
		'<rootDir>/utils/__tests__/**/*.test.ts',
	],
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
		'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)',
	],
};
