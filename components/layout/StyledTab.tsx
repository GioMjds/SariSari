import { tabs } from '@/constants/tabs';
import { useTabVisibilityStore } from '@/stores/ScrollStore';
import { FontAwesome } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { memo, useCallback, useEffect, useRef } from 'react';
import { Animated, Platform, TouchableOpacity, View } from 'react-native';
import StyledText from '../elements/StyledText';

const StyledTab = ({ state, navigation }: BottomTabBarProps) => {
	const visibleRoutes = state.routes.slice(0, 5);
	const tabState = useTabVisibilityStore((s) => s.state);
	const translateY = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		Animated.timing(translateY, {
			toValue: tabState === 'hidden' ? 100 : 0,
			duration: 250,
			useNativeDriver: true,
		}).start();
	}, [tabState, translateY]);

	const handlePress = useCallback(
		(route: typeof state.routes[0], isFocused: boolean) => {
			const event = navigation.emit({
				type: 'tabPress',
				target: route.key,
				canPreventDefault: true,
			});

			if (!isFocused && !event.defaultPrevented) {
				navigation.navigate(route.name);
			}
		},
		[navigation]
	);

	const handleLongPress = useCallback(
		(route: typeof state.routes[0]) => {
			navigation.emit({
				type: 'tabLongPress',
				target: route.key,
			});
		},
		[navigation]
	);

	return (
		<Animated.View
			style={{
				transform: [{ translateY }],
				position: 'absolute',
				left: 0,
				right: 0,
				bottom: 0,
			}}
			pointerEvents="box-none"
		>
			<View style={{ paddingHorizontal: 16, paddingBottom: 32 }}>
				<View
					style={{
						marginHorizontal: 8,
						borderRadius: 16,
						overflow: 'hidden',
						backgroundColor: '#ffffff',
						shadowColor: '#000',
						shadowOffset: { width: 0, height: -2 },
						shadowOpacity: 0.1,
						shadowRadius: 12,
						elevation: 8,
					}}
				>
					<View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', padding: 8 }}>
						{visibleRoutes.map((route, visualIndex) => {
							const routeIndex = state.routes.indexOf(route);
							const isFocused = state.index === routeIndex;
							const tab = tabs[visualIndex];

							if (!tab) return null;

							return (
								<TouchableOpacity
									key={route.key}
									accessibilityRole="button"
									accessibilityState={{ selected: isFocused, disabled: isFocused }}
									onPress={() => handlePress(route, isFocused)}
									onLongPress={() => handleLongPress(route)}
									style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 4 }}
									activeOpacity={0.4}
									disabled={isFocused}
								>
									<View style={{ alignItems: 'center', borderColor: 'transparent' }}>
										<View style={{ marginBottom: 2 }}>
											<FontAwesome
												name={tab.icon}
												size={25}
												style={{ padding: 12 }}
												color={isFocused ? '#7A1CAC' : '#9ca3af'}
											/>
										</View>

										<StyledText
											variant={isFocused ? 'semibold' : 'medium'}
											style={{ 
												color: isFocused ? '#7A1CAC' : '#9ca3af',
												fontSize: 12,
												textAlign: 'center'
											}}
											numberOfLines={1}
										>
											{tab.name}
										</StyledText>
									</View>
								</TouchableOpacity>
							);
						})}
					</View>
				</View>
			</View>
		</Animated.View>
	);
};

export default memo(StyledTab);