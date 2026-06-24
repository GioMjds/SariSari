import { StyledText } from "@/components/elements";
import { View } from "react-native";

/**
 * This is the user settings page. 
 * 
 * User settings must have:
 * 
 * 1. Backup Data
 * 2. Import Data
 * 3. Export CSV (Excel)
 * 4. Theme
 * 5. Language (English, Tagalog) - to implement the i18n library
 * 6. Export Backup
 */
export default function Settings() {
  return (
    <View>
      <StyledText>
        Settings page. This is a placeholder for the settings screen.
      </StyledText>
    </View>
  )
}