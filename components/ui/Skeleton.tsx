import React, { useEffect, useRef } from 'react';
import { Animated, ViewStyle } from 'react-native';

/**
 * Skeleton — a pulsing greyed bar used as a loading placeholder.
 * Hand-rolled (no third-party) so it stays compatible with React 19
 * and the React Native New Architecture. The third-party
 * `react-loading-skeleton` package breaks under the new arch because
 * its DOM <span> wrapper fires a "View config getter" warning.
 *
 * Use it like a sizing primitive:
 *   <Skeleton width={120} height={14} />
 *   <Skeleton width={'100%'} height={20} style={{ marginTop: 6 }} />
 */

interface SkeletonProps {
	width?: number | `${number}%`;
	height?: number;
	borderRadius?: number;
	style?: ViewStyle | ViewStyle[];
}

export function Skeleton({
	width = '100%',
	height = 12,
	borderRadius = 4,
	style,
}: SkeletonProps) {
	const opacity = useRef(new Animated.Value(0.55)).current;

	useEffect(() => {
		const loop = Animated.loop(
			Animated.sequence([
				Animated.timing(opacity, {
					toValue: 1,
					duration: 700,
					useNativeDriver: true,
				}),
				Animated.timing(opacity, {
					toValue: 0.55,
					duration: 700,
					useNativeDriver: true,
				}),
			]),
		);
		loop.start();
		return () => loop.stop();
	}, [opacity]);

	return (
		<Animated.View
			style={[
				{
					width,
					height,
					borderRadius,
					opacity,
					backgroundColor: '#D2CCC1', // ink-200 — subtle, paper-friendly
				},
				style,
			]}
		/>
	);
}