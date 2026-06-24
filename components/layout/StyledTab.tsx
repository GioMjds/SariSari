import { Tab, tabs } from '@/constants';
import { FontAwesome } from '@expo/vector-icons';
import { Href, usePathname, useRouter } from 'expo-router';
import { memo, useCallback } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { StyledText } from '@/components/elements';

export const StyledTab = memo(() => {
	const router = useRouter();
	const pathname = usePathname();
	const visibleRoutes = tabs.slice(0, 5);

	const handlePress = useCallback(
		(href: Href) => {
			const shouldNavigate = href === '/'
				? pathname !== '/' && pathname !== ''
				: pathname !== href && !pathname.startsWith(`${href}/`);

			if (shouldNavigate) router.push(href);
		},
		[pathname, router]
	);

	return (
		<View className="bg-white px-6 py-4 shadow-xl shadow-black" style={{ elevation: 6 }}>
			<View className="flex-row justify-between items-center">
				{visibleRoutes.map((tab: Tab) => {
					const isFocused =
						tab.href === '/'
							? pathname === '/' || pathname === ''
							: pathname === tab.href || pathname.startsWith(`${tab.href}/`);

					return (
						<TouchableOpacity
							key={tab.name}
							accessibilityRole="button"
							accessibilityState={{ selected: isFocused, disabled: isFocused }}
							onPress={() => handlePress(tab.href)}
							className={`flex-1 items-center py-2 ${isFocused ? 'rounded-xl bg-secondary-50' : ''}`}
							activeOpacity={0.2}
							disabled={isFocused}
						>
							<FontAwesome
								name={tab.icon}
								size={20}
								color={isFocused ? '#B45309' : '#A8A29E'}
							/>
							<StyledText
								variant={isFocused ? 'extrabold' : 'light'}
								className={`text-md leading-4 mt-1 text-center ${isFocused ? 'text-primary-500' : 'text-warm-500'}`}
							>
								{tab.name}
							</StyledText>
						</TouchableOpacity>
					);
				})}
			</View>
		</View>
	);
});

StyledTab.displayName = 'StyledTab';