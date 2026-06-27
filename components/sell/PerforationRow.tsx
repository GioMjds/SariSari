import { View } from 'react-native';

const PERFORATION_COUNT = 22;
const PERFORATION_BG = '#EFE6D2'; // page bg = paper-200, so circles look bitten out

export function PerforationRow({ side }: { side: 'top' | 'bottom' }) {
  return (
    <View className="relative h-0">
      <View
        className="absolute left-0 right-0 h-3 flex-row justify-between"
        style={side === 'top' ? { bottom: -6 } : { top: -6 }}
      >
        {Array.from({ length: PERFORATION_COUNT }).map((_, i) => (
          <View
            key={`${side}-${i}`}
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: PERFORATION_BG }}
          />
        ))}
      </View>
    </View>
  );
}
