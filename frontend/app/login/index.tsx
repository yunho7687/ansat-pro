import { View } from "react-native";
import { LoginForm } from "~/components/login-form";

export default function LoginScreen() {
  return (
    <View className="flex-1 p-4">
      <LoginForm />
    </View>
  );
}
