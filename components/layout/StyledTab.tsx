import { tabs } from '@/constants/tabs';
import { FontAwesome } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { memo, useCallback } from 'react';
import { TouchableOpacity, View } from 'react-native';
import StyledText from '../elements/StyledText';

const StyledTab = () => {
	const router = useRouter();
	const pathname = usePathname();
	const visibleRoutes = tabs.slice(0, 5);

	const handlePress = useCallback(
		(href: string) => {
			const shouldNavigate = href === '/'
				? pathname !== '/' && pathname !== ''
				: pathname !== href && !pathname.startsWith(`${href}/`);

			if (shouldNavigate) router.push(href as any);
		},
		[pathname, router]
	);

	return (
		<View className="bg-white px-6 py-4 shadow-xl shadow-black" style={{ elevation: 6 }}>
			<View className="flex-row justify-between items-center">
				{visibleRoutes.map((tab) => {
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
							className={`flex-1 items-center py-2 ${isFocused ? 'rounded-xl bg-[#F3E4FF]' : ''}`}
							activeOpacity={0.2}
							disabled={isFocused}
						>
							<FontAwesome
								name={tab.icon}
								size={20}
								color={isFocused ? '#7A1CAC' : '#9ca3af'}
							/>
							<StyledText
								variant={isFocused ? 'extrabold' : 'light'}
								className={`text-md leading-4 mt-1 text-center ${isFocused ? 'text-secondary' : 'text-[#9ca3af]'}`}
							>
								{tab.name}
							</StyledText>
						</TouchableOpacity>
					);
				})}
			</View>
		</View>
	);
};

export default memo(StyledTab);