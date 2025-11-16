import StyledText from "@/components/elements/StyledText";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";

// Edit product screen
export default function EditProduct() {
    const { id } = useLocalSearchParams<{ id: string }>();

    return (
        <SafeAreaView>
            <StyledText>
                Edit Product Screen: {id}
            </StyledText>
        </SafeAreaView>
    )
}