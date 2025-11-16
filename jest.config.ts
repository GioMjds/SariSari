module.exports = {
	testEnvironment: 'node',
	testMatch: [
		'<rootDir>/tests/**/*.test.ts',
		'<rootDir>/utils/__tests__/**/*.test.ts',
		'<rootDir>/tests/**/*.test.tsx',
	],
	moduleNameMapper: {
		'^@/(.*)$': '<rootDir>/$1',
	},
	transform: {
		'^.+\\.(ts|tsx)$': 'ts-jest',
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
