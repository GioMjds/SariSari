import { Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';

type SearchParams = {
  detail: string;
  type?: string;
};

export default function DetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<SearchParams>();

  return (
    <SafeAreaView className="flex-1 bg-paper-200" edges={['top']}>
      {/* Detail Header */}
      <View className="bg-cinnamon-500 px-4 py-3 flex-row items-center justify-between">
        <Pressable
          onPress={() => router.back()}
          className="flex-row items-center hit-slop-8"
        >
          <FontAwesome5 name="arrow-left" size={16} color="#FAF7F2" />
          <StyledText
            variant="extrabold"
            className="text-paper-50 text-base ml-2"
          >
            Back
          </StyledText>
        </Pressable>
        <StyledText variant="extrabold" className="text-paper-50 text-base">
          Detail View
        </StyledText>
        <View className="w-8" />
      </View>

      {/* Detail Content */}
      <View className="p-4">
        <View className="bg-paper-50 p-4 rounded-2xl border border-ink-100 shadow-sm">
          <StyledText
            variant="medium"
            className="text-ink-400 text-xs uppercase"
          >
            Type: {params.type ?? 'General'}
          </StyledText>
          <StyledText variant="extrabold" className="text-ink-900 text-lg mt-1">
            {params.detail ?? 'Item Detail'}
          </StyledText>
        </View>
      </View>
    </SafeAreaView>
  );
}
