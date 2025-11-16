import { tabs } from '@/constants/tabs';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import { Platform, TouchableOpacity, View } from 'react-native';
import StyledText from '../elements/StyledText';

const StyledTab = ({ state, descriptors, navigation }: BottomTabBarProps) => {
	const visibleRoutes = state.routes.slice(0, 5);

	return (
		<View className="bg-background border-t border-primary/10 shadow-lg pb-5 ios:pb-6">
			<View className="flex-row h-20 items-center justify-around px-4 pt-2">
				{visibleRoutes.map((route, visualIndex) => {
					const routeIndex = state.routes.indexOf(route);
					const isFocused = state.index === routeIndex;
					const tab = tabs[visualIndex];

					if (!tab) return null;

					const onPress = () => {
						const event = navigation.emit({
							type: 'tabPress',
							target: route.key,
							canPreventDefault: true,
						});

						if (!isFocused && !event.defaultPrevented) {
							if (Platform.OS === 'ios') {
								Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
							}
							navigation.navigate(route.name);
						}
					};

					const onLongPress = () => {
						if (Platform.OS === 'ios') {
							Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
						}
						navigation.emit({
							type: 'tabLongPress',
							target: route.key,
						});
					};

					return (
						<TouchableOpacity
							key={route.key}
							accessibilityRole="button"
							accessibilityState={isFocused ? { selected: true } : {}}
							onPress={onPress}
							onLongPress={onLongPress}
							className="flex-1 items-center justify-center py-2"
							activeOpacity={0.7}
						>
							<View
								className={`items-center justify-center px-4 py-3 rounded-full ${
									isFocused ? 'bg-secondary' : 'bg-transparent'
								}`}
							>
								<StyledText
									variant={isFocused ? 'semibold' : 'medium'}
									className={`text-base ${
										isFocused ? 'text-background' : 'text-secondary/60'
									}`}
								>
									{tab.name}
								</StyledText>
							</View>
						</TouchableOpacity>
					);
				})}
			</View>
		</View>
	);
};

export default StyledTab;