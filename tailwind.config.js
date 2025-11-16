/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ['./app/**/*.{js,jsx,ts,tsx}', './index.{js,jsx,ts,tsx}'],
	presets: [require('nativewind/preset')],
	theme: {
		extend: {
			colors: {
				// Deep purple - Primary brand color, headers, important CTAs
				primary: '#2E073F',
				
				// Rich purple - Secondary actions, active states, highlights
				secondary: '#7A1CAC',
				
				// Bright purple - Accent elements, hover states, links
				accent: '#AD49E1',
				
				// Light lavender - Backgrounds, cards, subtle UI elements
				background: '#EBD3F8',
				
				// Additional semantic colors for better UX
				text: {
					primary: '#2E073F',   // Main text on light backgrounds
					secondary: '#7A1CAC', // Secondary text, labels
					muted: '#AD49E1',     // Disabled or less important text
				},
			},
			fontFamily: {
				'stack-sans': ['StackSansText-Regular'],
				'stack-sans-extralight': ['StackSansText-ExtraLight'],
				'stack-sans-light': ['StackSansText-Light'],
				'stack-sans-medium': ['StackSansText-Medium'],
				'stack-sans-semibold': ['StackSansText-SemiBold'],
				'stack-sans-bold': ['StackSansText-Bold'],
			},
		},
	},
	plugins: [],
};