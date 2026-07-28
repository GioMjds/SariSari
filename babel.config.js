module.exports = function (api) {
	api.cache(true);
	const isTest = process.env.NODE_ENV === 'test';
	return {
		presets: [
			isTest
				? ['babel-preset-expo']
				: [
					'babel-preset-expo',
					{
						jsxImportSource: 'nativewind',
						unstable_transformProfile: 'hermes-v0',
					},
				],
			!isTest && 'nativewind/babel',
		].filter(Boolean),
		plugins: [
			'react-native-reanimated/plugin',
		]
	};
};
