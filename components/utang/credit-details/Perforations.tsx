import { View } from "react-native";

export function Perforations({
  negativeTop,
  negativeBottom,
}: {
  negativeTop?: boolean;
  negativeBottom?: boolean;
}) {
  const PERF_COUNT = 22;
  const PERF_BG = '#EFE6D2';
  return (
    <View
      className="relative h-0"
      style={negativeTop ? { top: -3 } : negativeBottom ? { bottom: -3 } : undefined}
    >
      <View
        className="absolute left-0 right-0 h-3 flex-row justify-between"
        style={negativeTop ? { top: 0 } : { top: -6 }}
      >
        {Array.from({ length: PERF_COUNT }).map((_, i) => (
          <View
            key={`p-${negativeTop ? 't' : 'b'}-${i}`}
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: PERF_BG }}
          />
        ))}
      </View>
    </View>
  );
}