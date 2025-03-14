import { Apple } from "lucide-react-native";
import { useState } from "react";
import type { ViewProps } from "react-native";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { account } from "~/appwriteConfig";
import { cn } from "~/lib/utils";

export function LoginForm({ className, ...props }: ViewProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function login(email: string, password: string) {
    if (!email || !password) {
      Alert.alert("Error", "All fields are required");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }
    if (password.length < 8) {
      Alert.alert("Error", "Password must be at least 8 characters long");
      return;
    }
    try {
      setIsLoading(true);
      // Delete any existing session before creating a new one
      try {
        await account.deleteSession("current");
      } catch {
        // Ignore error if no session exists
      }

      await account.createEmailPasswordSession(email, password);
      setEmail("");
      setPassword("");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to login");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <ScrollView className={cn("flex-1", className)} {...props}>
      <View className="bg-card rounded-lg shadow-sm p-4">
        <View className="items-center mb-4">
          <Text className="text-xl font-semibold text-foreground">
            Welcome back
          </Text>
          <Text className="text-sm text-muted-foreground">
            Login with your Apple or Google account
          </Text>
        </View>

        <View className="gap-6">
          <View className="gap-4">
            <TouchableOpacity className="bg-background border border-input rounded-md p-3 flex-row items-center justify-center gap-2">
              <Apple size={20} className="text-foreground" />
              <Text className="text-sm font-medium text-foreground">
                Login with Apple
              </Text>
            </TouchableOpacity>

            <TouchableOpacity className="bg-background border border-input rounded-md p-3 flex-row items-center justify-center gap-2">
              <View className="w-5 h-5 items-center justify-center">
                <Text className="text-base font-bold text-foreground">G</Text>
              </View>
              <Text className="text-sm font-medium text-foreground">
                Login with Google
              </Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row items-center">
            <View className="flex-1 h-[1px] bg-border" />
            <Text className="mx-2 text-sm text-muted-foreground">
              Or continue with
            </Text>
            <View className="flex-1 h-[1px] bg-border" />
          </View>

          <View className="gap-6">
            <View className="gap-2">
              <Text className="text-sm font-medium text-foreground">Email</Text>
              <TextInput
                className="bg-background border border-input rounded-md p-3 text-sm text-foreground"
                placeholder="m@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View className="gap-2">
              <View className="flex-row justify-between items-center">
                <Text className="text-sm font-medium text-foreground">
                  Password
                </Text>
                <TouchableOpacity>
                  <Text className="text-sm text-primary underline">
                    Forgot your password?
                  </Text>
                </TouchableOpacity>
              </View>
              <TextInput
                className="bg-background border border-input rounded-md p-3 text-sm text-foreground"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            <TouchableOpacity
              className="bg-primary rounded-md p-3 items-center"
              onPress={() => login(email, password)}
              disabled={isLoading}
            >
              <Text className="text-sm font-medium text-primary-foreground">
                {isLoading ? "Logging in..." : "Login"}
              </Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row justify-center items-center">
            <Text className="text-sm text-foreground">
              Don't have an account?{" "}
            </Text>
            <TouchableOpacity>
              <Text className="text-sm text-primary underline">Sign up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View className="mt-6 items-center">
        <Text className="text-xs text-muted-foreground text-center">
          By clicking continue, you agree to our{" "}
          <Text onPress={() => {}} className="underline">
            Terms of Service
          </Text>{" "}
          and{" "}
          <Text onPress={() => {}} className="underline">
            Privacy Policy
          </Text>
          .
        </Text>
      </View>
    </ScrollView>
  );
}
