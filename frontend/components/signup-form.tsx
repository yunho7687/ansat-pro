"use client";

import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { AlertCircle, CheckCircle2, Info } from "lucide-react-native";
import { account, functions, LABEL_FUNCTION_ID } from "~/appwriteConfig";
import { ExecutionMethod, ID } from "react-native-appwrite";
import { router } from "expo-router";

export function SignupForm() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateUsername = (username: string) => {
    if (!username) return "Username is required";
    if (username.length < 3) return "Username must be at least 3 characters";
    if (!/^[a-zA-Z0-9_]+$/.test(username))
      return "Username can only contain letters, numbers, and underscores";
    return "";
  };

  const validateEmail = (email: string) => {
    if (!email) return "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return "Please enter a valid email address";
    return "";
  };

  const validatePassword = (password: string) => {
    if (!password) return "Password is required";
    if (password.length < 8) return "Password must be at least 8 characters";
    return "";
  };

  const validateConfirmPassword = (
    password: string,
    confirmPassword: string,
  ) => {
    if (!confirmPassword) return "Please confirm your password";
    if (password !== confirmPassword) return "Passwords do not match";
    return "";
  };

  const validateRole = (role: string) => {
    if (!role) return "Role selection is required";
    return "";
  };

  const calculatePasswordStrength = (password: string) => {
    if (!password) return 0;
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    if (/[^A-Za-z0-9]/.test(password)) strength += 25;
    return strength;
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength === 0) return "";
    if (passwordStrength <= 25) return "Weak";
    if (passwordStrength <= 50) return "Fair";
    if (passwordStrength <= 75) return "Good";
    return "Strong";
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 25) return "bg-destructive";
    if (passwordStrength <= 50) return "bg-warning";
    if (passwordStrength <= 75) return "bg-warning/80";
    return "bg-success";
  };

  const handleChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }

    if (name === "password") {
      setPasswordStrength(calculatePasswordStrength(value));
      if (formData.confirmPassword) {
        const confirmError = validateConfirmPassword(
          value,
          formData.confirmPassword,
        );
        setErrors((prev) => ({ ...prev, confirmPassword: confirmError }));
      }
    }

    if (name === "confirmPassword") {
      const confirmError = validateConfirmPassword(formData.password, value);
      setErrors((prev) => ({ ...prev, confirmPassword: confirmError }));
    }
  };

  async function register() {
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      await account.create(
        ID.unique(),
        formData.email,
        formData.password,
        formData.username,
      );

      Alert.alert("Success", "Registration successful!");
      // Clear form
      setFormData({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "",
      });
      setPasswordStrength(0);

      // Delete any existing session before creating a new one
      try {
        await account.deleteSession("current");
      } catch (error) {
        // Ignore error if no session exists
      }

      // Create a session for the new user
      await account.createEmailPasswordSession(
        formData.email,
        formData.password,
      );

      const user = await account.get();

      // Select the role for the new user
      const result = await functions.createExecution(
        LABEL_FUNCTION_ID,
        JSON.stringify({
          action: "createLabel",
          userId: user.$id,
          label: formData.role,
        }),
        false,
        undefined,
        ExecutionMethod.POST,
        { "Content-Type": "application/json" },
      );

      // Navigate to profile page
      router.replace("/profile");
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.message || "Registration failed. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    const usernameError = validateUsername(formData.username);
    if (usernameError) newErrors.username = usernameError;

    const emailError = validateEmail(formData.email);
    if (emailError) newErrors.email = emailError;

    const passwordError = validatePassword(formData.password);
    if (passwordError) newErrors.password = passwordError;

    const confirmPasswordError = validateConfirmPassword(
      formData.password,
      formData.confirmPassword,
    );
    if (confirmPasswordError) newErrors.confirmPassword = confirmPasswordError;

    const roleError = validateRole(formData.role);
    if (roleError) newErrors.role = roleError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    await register();
  };

  return (
    <ScrollView className="flex-1">
      <View className="bg-card rounded-lg shadow-sm p-4">
        <View className="items-center mb-4">
          <Text className="text-2xl font-semibold text-foreground">
            Create an account
          </Text>
          <Text className="text-sm text-muted-foreground">
            Enter your information below to create your account
          </Text>
        </View>

        <View className="gap-4">
          <View className="gap-2">
            <Text className="text-sm font-medium text-foreground">
              Username
              <Text className="text-destructive">*</Text>
            </Text>
            <TextInput
              className="bg-background border border-input rounded-md p-3 text-sm text-foreground"
              placeholder="johndoe"
              value={formData.username}
              onChangeText={(value) => handleChange("username", value)}
              editable={!isSubmitting}
            />
            {errors.username && (
              <View className="flex-row items-center gap-1 mt-1">
                <AlertCircle size={16} className="text-destructive" />
                <Text className="text-sm text-destructive">
                  {errors.username}
                </Text>
              </View>
            )}
          </View>

          <View className="gap-2">
            <Text className="text-sm font-medium text-foreground">
              Email
              <Text className="text-destructive">*</Text>
            </Text>
            <TextInput
              className="bg-background border border-input rounded-md p-3 text-sm text-foreground"
              placeholder="john@example.com"
              value={formData.email}
              onChangeText={(value) => handleChange("email", value)}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isSubmitting}
            />
            {errors.email && (
              <View className="flex-row items-center gap-1 mt-1">
                <AlertCircle size={16} className="text-destructive" />
                <Text className="text-sm text-destructive">{errors.email}</Text>
              </View>
            )}
          </View>

          <View className="gap-2">
            <Text className="text-sm font-medium text-foreground">
              Password
              <Text className="text-destructive">*</Text>
            </Text>
            <TextInput
              className="bg-background border border-input rounded-md p-3 text-sm text-foreground"
              placeholder="Password"
              value={formData.password}
              onChangeText={(value) => handleChange("password", value)}
              secureTextEntry
              editable={!isSubmitting}
            />
            {errors.password && (
              <View className="flex-row items-center gap-1 mt-1">
                <AlertCircle size={16} className="text-destructive" />
                <Text className="text-sm text-destructive">
                  {errors.password}
                </Text>
              </View>
            )}

            {formData.password && (
              <View className="mt-2 gap-2">
                <View className="flex-row justify-between items-center">
                  <Text className="text-sm text-muted-foreground">
                    Password strength:
                  </Text>
                  <Text className="text-sm font-medium text-foreground">
                    {getPasswordStrengthText()}
                  </Text>
                </View>
                <View className="h-2 bg-muted rounded-full overflow-hidden">
                  <View
                    className={`h-full ${getPasswordStrengthColor()}`}
                    style={{ width: `${passwordStrength}%` }}
                  />
                </View>
                <View className="gap-1 mt-2">
                  <View className="flex-row items-center gap-1">
                    {formData.password.length >= 8 ? (
                      <CheckCircle2 size={12} className="text-emerald-500" />
                    ) : (
                      <Info size={12} className="text-muted-foreground" />
                    )}
                    <Text className="text-sm text-muted-foreground">
                      At least 8 characters
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-1">
                    {/[A-Z]/.test(formData.password) ? (
                      <CheckCircle2 size={12} className="text-emerald-500" />
                    ) : (
                      <Info size={12} className="text-muted-foreground" />
                    )}
                    <Text className="text-sm text-muted-foreground">
                      At least one uppercase letter
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-1">
                    {/[0-9]/.test(formData.password) ? (
                      <CheckCircle2 size={12} className="text-emerald-500" />
                    ) : (
                      <Info size={12} className="text-muted-foreground" />
                    )}
                    <Text className="text-sm text-muted-foreground">
                      At least one number
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-1">
                    {/[^A-Za-z0-9]/.test(formData.password) ? (
                      <CheckCircle2 size={12} className="text-emerald-500" />
                    ) : (
                      <Info size={12} className="text-muted-foreground" />
                    )}
                    <Text className="text-sm text-muted-foreground">
                      At least one special character
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </View>

          <View className="gap-2">
            <Text className="text-sm font-medium text-foreground">
              Confirm Password
              <Text className="text-destructive">*</Text>
            </Text>
            <TextInput
              className="bg-background border border-input rounded-md p-3 text-sm text-foreground"
              placeholder="Confirm password"
              value={formData.confirmPassword}
              onChangeText={(value) => handleChange("confirmPassword", value)}
              secureTextEntry
              editable={!isSubmitting}
            />
            {errors.confirmPassword && (
              <View className="flex-row items-center gap-1 mt-1">
                <AlertCircle size={16} className="text-destructive" />
                <Text className="text-sm text-destructive">
                  {errors.confirmPassword}
                </Text>
              </View>
            )}
          </View>

          <View className="gap-2">
            <Text className="text-sm font-medium text-foreground">
              Select Role
              <Text className="text-destructive">*</Text>
            </Text>
            <View className="flex-row items-center gap-2 flex-wrap">
              <TouchableOpacity
                className={`bg-background border border-input rounded-md p-3 text-sm ${formData.role === "student" ? "bg-primary" : ""}`}
                onPress={() => handleChange("role", "student")}
                disabled={isSubmitting}
              >
                <Text
                  className={`${formData.role === "student" ? "text-primary-foreground" : "text-foreground"}`}
                >
                  Student
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`bg-background border border-input rounded-md p-3 text-sm ${formData.role === "preceptor" ? "bg-primary" : ""}`}
                onPress={() => handleChange("role", "preceptor")}
                disabled={isSubmitting}
              >
                <Text
                  className={`${formData.role === "preceptor" ? "text-primary-foreground" : "text-foreground"}`}
                >
                  Preceptor
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`bg-background border border-input rounded-md p-3 text-sm ${formData.role === "facilitator" ? "bg-primary" : ""}`}
                onPress={() => handleChange("role", "facilitator")}
                disabled={isSubmitting}
              >
                <Text
                  className={`${formData.role === "facilitator" ? "text-primary-foreground" : "text-foreground"}`}
                >
                  Clinical Facilitator
                </Text>
              </TouchableOpacity>
            </View>
            {errors.role && (
              <View className="flex-row items-center gap-1 mt-1">
                <AlertCircle size={16} className="text-destructive" />
                <Text className="text-sm text-destructive">{errors.role}</Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            className="bg-primary hover:bg-primary/90 active:bg-primary/90 rounded-md p-3 items-center mt-4"
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <Text className="text-sm font-medium text-primary-foreground">
              {isSubmitting ? "Creating account..." : "Create account"}
            </Text>
          </TouchableOpacity>

          <View className="flex-row justify-center items-center mt-4">
            <Text className="text-sm text-foreground">
              Already have an account?{" "}
            </Text>
            <TouchableOpacity onPress={() => router.push("/login")}>
              <Text className="text-sm text-primary underline">Sign in</Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row justify-center flex-wrap mt-4">
            <Text className="text-xs text-muted-foreground">
              By creating an account, you agree to our{" "}
            </Text>
            <TouchableOpacity>
              <Text className="text-xs text-muted-foreground underline">
                Terms of Service
              </Text>
            </TouchableOpacity>
            <Text className="text-xs text-muted-foreground"> and </Text>
            <TouchableOpacity>
              <Text className="text-xs text-muted-foreground underline">
                Privacy Policy
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
