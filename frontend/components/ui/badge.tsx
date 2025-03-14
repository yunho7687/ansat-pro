import * as React from "react";
import { View, Text } from "react-native";
import { cn } from "~/lib/utils";

interface BadgeProps {
  variant?: "default" | "secondary" | "destructive" | "outline";
  className?: string;
  children: React.ReactNode;
}

export function Badge({
  variant = "default",
  className,
  children,
}: BadgeProps) {
  const baseStyle = "rounded-md px-2.5 py-0.5";
  const variants = {
    default: "bg-primary",
    secondary: "bg-secondary",
    destructive: "bg-destructive",
    outline: "border border-border",
  };

  return (
    <View className={cn(baseStyle, variants[variant], className)}>
      <Text
        className={cn(
          "text-xs font-semibold",
          variant === "default" && "text-primary-foreground",
          variant === "secondary" && "text-secondary-foreground",
          variant === "destructive" && "text-destructive-foreground",
          variant === "outline" && "text-foreground",
        )}
      >
        {children}
      </Text>
    </View>
  );
}
