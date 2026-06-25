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
						// Expo SDK 54 ships Hermes v0, which does NOT support private
						// class fields (`#foo`) natively. babel-preset-expo@56 defaults
						// to `hermes-stable` (Hermes v1) when the caller passes
						// `engine: 'hermes'`, which assumes native support and skips the
						// downleveling transforms — leaving `#field` syntax in the bundle
						// and crashing hermesc with "private properties are not supported".
						// Force the v0 profile so Babel rewrites private fields to
						// weakmap-based helpers that Hermes v0 can parse.
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
