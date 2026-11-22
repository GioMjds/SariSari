import { Image } from 'expo-image';
import { cssInterop } from 'nativewind';

// NativeWind only maps className to style for registered components, so third-party ones must be added here.
cssInterop(Image, { className: 'style' });
