import { Image } from 'expo-image';
import { FontAwesome, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { cssInterop } from 'nativewind';

// NativeWind only maps className to style for registered components, so third-party ones must be added here.
cssInterop(Image, { className: 'style' });

// Icons take their color from token classes (text-ink-700) instead of hex literals.
for (const Icon of [FontAwesome, FontAwesome5, Ionicons]) {
  cssInterop(Icon, {
    className: { target: 'style', nativeStyleToProp: { color: true } },
  });
}
