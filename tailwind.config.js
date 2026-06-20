/** @type {import('tailwindcss').Config} */
module.exports = {
	content: [
		'./app/**/*.{js,jsx,ts,tsx}',
		'./components/**/*.{js,jsx,ts,tsx}',
		'./index.{js,jsx,ts,tsx}',
	],
	presets: [require('nativewind/preset')],
	theme: {
		extend: {
			colors: {
				// Brand primary - terracotta scale
				'primary-50': '#FFF7ED',
				'primary-100': '#FFEDD5',
				'primary-200': '#FED7AA',
				'primary-300': '#FDBA74',
				'primary-400': '#FB923C',
				'primary-500': '#B45309', // Burnt Orange
				'primary-600': '#C2410C', // Terracotta (Deep)
				'primary-700': '#9A3412',
				'primary-800': '#7C2D0E',
				'primary-900': '#4C1D0B',

				// Action/Secondary - sage scale
				'secondary-50': '#ECFCCB',
				'secondary-100': '#F0FDF4',
				'secondary-200': '#DCFCE7',
				'secondary-300': '#BBF7D0',
				'secondary-400': '#86EFAC',
				'secondary-500': '#4ADE80',
				'secondary-600': '#65A30D', // Sage Green
				'secondary-700': '#3F6212',
				'secondary-800': '#365314',
				'secondary-900': '#1A2E05',

				// Surfaces
				'surface-warm': '#FED7AA', // Peach
				'background': '#FEF3C7',   // Cream
				'surface-subtle': '#FFFBEB', // Soft cream

				// Text - warm gray scale
				'warm-50': '#FAF9F6',
				'warm-100': '#F5F5F4',
				'warm-200': '#E7E5E4',
				'warm-300': '#D6D3D1',
				'warm-400': '#A8A29E',
				'warm-500': '#A8A29E', // Muted (Fix: no longer bright purple)
				'warm-600': '#78716C',
				'warm-700': '#57534E', // Secondary
				'warm-800': '#44403C',
				'warm-900': '#1C1917', // Primary

				// Semantic tokens
				'semantic-success': '#16A34A',
				'semantic-danger': '#DC2626',
				'semantic-warning': '#D97706',
				'semantic-info': '#0284C7',
			},
			fontFamily: {
				'stack-sans': ['StackSansText-Regular'],
				'stack-sans-extralight': ['StackSansText-ExtraLight'],
				'stack-sans-light': ['StackSansText-Light'],
				'stack-sans-medium': ['StackSansText-Medium'],
				'stack-sans-semibold': ['StackSansText-SemiBold'],
				'stack-sans-bold': ['StackSansText-Bold'],
			},
			borderRadius: {
				'md': '6px',
				'lg': '12px',
				'xl': '16px',
				'pill': '9999px',
				'card': '16px',
			},
			boxShadow: {
				'card': '0 1px 2px rgba(180, 83, 9, 0.06)',
				'raised': '0 4px 12px rgba(180, 83, 9, 0.15)',
				'modal': '0 6px 20px rgba(180, 83, 9, 0.20)',
			},
			fontSize: {
				'display': ['36px', { lineHeight: '1.1', fontWeight: '800' }],
				'h1': ['28px', { lineHeight: '1.2', fontWeight: '800' }],
				'h2': ['20px', { lineHeight: '1.3', fontWeight: '700' }],
				'h3': ['16px', { lineHeight: '1.4', fontWeight: '600' }],
				'body': ['14px', { lineHeight: '1.5', fontWeight: '400' }],
				'caption': ['12px', { lineHeight: '1.4', fontWeight: '400' }],
			},
		},
	},
	plugins: [],
};
