import { View } from "react-native";

export function Divider() {
  return (
    <View
      className="w-px self-stretch"
      style={{
        backgroundColor: '#D2CCC1',
        opacity: 0.55,
        borderLeftWidth: 1,
        borderLeftColor: '#D2CCC1',
        borderStyle: 'dashed',
      }}
    />
  );
}
