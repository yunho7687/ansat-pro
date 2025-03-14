import { View } from "react-native";
import { SignupForm } from "~/components/signup-form";

export default function SignupScreen() {
  return (
    <View className="flex-1 p-4">
      <SignupForm />
    </View>
  );
}
