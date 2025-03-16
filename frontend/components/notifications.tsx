"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import {
  Bell,
  Check,
  CheckSquare,
  Info,
  AlertTriangle,
  AlertCircle,
  X,
  Filter,
  User,
} from "lucide-react-native";
import { View, ScrollView, Pressable } from "react-native";
import { Text } from "@/components/ui/text";
import {
  account,
  realtimeClient,
  functions,
  LABEL_FUNCTION_ID,
} from "~/appwriteConfig";
import type { Models } from "react-native-appwrite";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ExecutionMethod } from "appwrite";

// Types
type NotificationType = "success" | "error" | "warning" | "info" | "request";

interface Notification {
  $id: string;
  message: string;
  timestamp: Date;
  type: NotificationType;
  read: boolean;
  studentId?: string;
  studentName?: string;
  studentEmail?: string;
  day?: string;
}

// Mock data
const initialNotifications: Notification[] = [
  {
    $id: "1",
    message: "Your profile has been updated successfully",
    timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
    type: "success",
    read: false,
  },
  {
    $id: "2",
    message: "Assessment failed. Please talk with your facilitator",
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    type: "error",
    read: false,
  },
  {
    $id: "3",
    message: "Your assessment will expire in 3 days",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    type: "warning",
    read: true,
  },
  {
    $id: "4",
    message: "New feature available: Dark mode is now available",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
    type: "info",
    read: false,
  },
  {
    $id: "5",
    message: "Your document has been shared with 3 people",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    type: "info",
    read: true,
  },
  {
    $id: "6",
    message: "Security alert: New login from unknown device",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
    type: "warning",
    read: false,
  },
  {
    $id: "7",
    message: "Your password was changed successfully",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
    type: "success",
    read: true,
  },
  {
    $id: "8",
    message: "System maintenance scheduled for tomorrow",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4), // 4 days ago
    type: "info",
    read: true,
  },
];

// Helper functions
const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case "success":
      return <Check size={16} color="#10B981" />;
    case "error":
      return <AlertCircle size={16} color="#EF4444" />;
    case "warning":
      return <AlertTriangle size={16} color="#F59E0B" />;
    case "info":
      return <Info size={16} color="#3B82F6" />;
    case "request":
      return <User size={16} color="#6366F1" />;
  }
};

const getNotificationBadge = (type: NotificationType) => {
  switch (type) {
    case "success":
      return (
        <Badge
          variant="outline"
          className="bg-green-50 text-green-700 border-green-200"
        >
          Success
        </Badge>
      );
    case "error":
      return (
        <Badge
          variant="outline"
          className="bg-red-50 text-red-700 border-red-200"
        >
          Error
        </Badge>
      );
    case "warning":
      return (
        <Badge
          variant="outline"
          className="bg-amber-50 text-amber-700 border-amber-200"
        >
          Warning
        </Badge>
      );
    case "info":
      return (
        <Badge
          variant="outline"
          className="bg-blue-50 text-blue-700 border-blue-200"
        >
          Info
        </Badge>
      );
  }
};

export function Notifications() {
  const [notifications, setNotifications] =
    useState<Notification[]>(initialNotifications);
  const [activeFilter, setActiveFilter] = useState<NotificationType | "all">(
    "all",
  );
  const [activeTab, setActiveTab] = useState<"all" | "unread">("all");
  const [currentUser, setCurrentUser] =
    useState<Models.User<Models.Preferences> | null>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    // Fetch current user
    const fetchUser = async () => {
      try {
        const user = await account.get();
        setCurrentUser(user);
      } catch (error) {
        console.error("Failed to fetch user:", error);
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    if (!currentUser) return; // Don't subscribe if no user

    const unsubscribe = realtimeClient.subscribe("documents", (response) => {
      console.log("Received real-time update:", response);
      console.log(currentUser);
      if (
        response.events.includes(
          "databases.*.collections.*.documents.*.create",
        ) &&
        response.payload.preceptorId === currentUser.$id
      ) {
        console.log("New request received");

        // Create new notification from payload
        const newNotification: Notification = {
          $id: response.payload.$id,
          message: `${response.payload.studentName} has requested you as a preceptor today. Please confirm.`,
          timestamp: new Date(),
          type: "request",
          read: false,
          studentId: response.payload.studentId,
          studentName: response.payload.studentName,
          studentEmail: response.payload.studentEmail,
          day: response.payload.day,
        };

        // Add to notifications list
        setNotifications((prev) => [newNotification, ...prev]);
      }
    });

    // Cleanup subscription
    return () => {
      unsubscribe();
    };
  }, [currentUser]);

  // Filter notifications based on active filter and tab
  const filteredNotifications = notifications.filter((notification) => {
    const typeMatch =
      activeFilter === "all" || notification.type === activeFilter;
    const readMatch =
      activeTab === "all" || (activeTab === "unread" && !notification.read);
    return typeMatch && readMatch;
  });

  // Mark a notification as read
  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.$id === id
          ? { ...notification, read: true }
          : notification,
      ),
    );
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((notification) => ({ ...notification, read: true })),
    );
  };

  // Clear all notifications
  const clearAll = () => {
    setNotifications([]);
  };

  // Add handlers for confirm and reject
  const handleConfirm = async (notification: Notification) => {
    try {
      // Call your API to confirm the request
      const response = await functions.createExecution(
        LABEL_FUNCTION_ID,
        JSON.stringify({
          action: "confirmPreceptorRequest",
          documentId: notification.$id,
          preceptorId: currentUser?.$id,
          studentId: notification.studentId,
          day: notification.day,
        }),
        false,
        undefined,
        ExecutionMethod.POST,
        { "Content-Type": "application/json" },
      );

      const result = JSON.parse(response.responseBody);
      if (result.success) {
        // Update the notification
        setNotifications((prev) =>
          prev.map((n) =>
            n.$id === notification.$id
              ? {
                  ...n,
                  type: "success",
                  message: `You have accepted ${notification.studentName}'s request.`,
                  read: true,
                }
              : n,
          ),
        );
      } else {
        throw new Error(result.error || "Failed to confirm request");
      }
    } catch (error) {
      console.error("Failed to confirm request:", error);
      // Show error notification
      const errorNotification: Notification = {
        $id: Date.now().toString(),
        message: "Failed to confirm request. Please try again.",
        timestamp: new Date(),
        type: "error",
        read: false,
      };
      setNotifications((prev) => [errorNotification, ...prev]);
    }
  };

  const handleReject = async (notification: Notification) => {
    try {
      // Call your API to reject the request
      const response = await functions.createExecution(
        LABEL_FUNCTION_ID,
        JSON.stringify({
          action: "rejectPreceptorRequest",
          documentId: notification.$id,
          preceptorId: currentUser?.$id,
          studentId: notification.studentId,
          day: notification.day,
        }),
        false,
        undefined,
        ExecutionMethod.POST,
        { "Content-Type": "application/json" },
      );

      const result = JSON.parse(response.responseBody);
      if (result.success) {
        // Update the notification
        setNotifications((prev) =>
          prev.map((n) =>
            n.$id === notification.$id
              ? {
                  ...n,
                  type: "error",
                  message: `You have rejected ${notification.studentName}'s request.`,
                  read: true,
                }
              : n,
          ),
        );
      } else {
        throw new Error(result.error || "Failed to reject request");
      }
    } catch (error) {
      console.error("Failed to reject request:", error);
      // Show error notification
      const errorNotification: Notification = {
        $id: Date.now().toString(),
        message: "Failed to reject request. Please try again.",
        timestamp: new Date(),
        type: "error",
        read: false,
      };
      setNotifications((prev) => [errorNotification, ...prev]);
    }
  };

  return (
    <View className="w-full max-w-4xl mx-auto bg-background rounded-lg shadow-sm">
      <View className="p-4 space-y-2">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center space-x-2">
            <Bell size={20} />
            <Text className="text-xl font-semibold">Notifications</Text>
            {unreadCount > 0 && (
              <View className="ml-2 px-2 py-1 bg-secondary rounded-full">
                <Text className="text-xs">{unreadCount} unread</Text>
              </View>
            )}
          </View>
          <View className="flex-row space-x-2">
            <Pressable
              className="flex-row items-center px-3 py-2 rounded-md bg-muted"
              onPress={() => {
                /* Add filter menu logic */
              }}
            >
              <Filter size={16} />
              <Text className="ml-1">Filter</Text>
            </Pressable>
            <Pressable
              className="flex-row items-center px-3 py-2 rounded-md bg-muted"
              onPress={markAllAsRead}
            >
              <CheckSquare size={16} />
              <Text className="ml-1">Mark all read</Text>
            </Pressable>
            <Pressable
              className="flex-row items-center px-3 py-2 rounded-md bg-muted"
              onPress={clearAll}
            >
              <X size={16} />
              <Text className="ml-1">Clear all</Text>
            </Pressable>
          </View>
        </View>
        <Text className="text-sm text-muted-foreground">
          Stay updated with your latest notifications and alerts
        </Text>
      </View>

      <View className="p-4">
        <View className="flex-row mb-4 bg-muted rounded-lg p-1">
          <Pressable
            className={`flex-1 py-2 px-4 rounded-md ${
              activeTab === "all" ? "bg-background" : ""
            }`}
            onPress={() => setActiveTab("all")}
          >
            <Text>All</Text>
          </Pressable>
          <Pressable
            className={`flex-1 py-2 px-4 rounded-md ${
              activeTab === "unread" ? "bg-background" : ""
            }`}
            onPress={() => setActiveTab("unread")}
          >
            <Text>Unread</Text>
          </Pressable>
        </View>

        <NotificationList
          notifications={filteredNotifications}
          markAsRead={markAsRead}
          handleConfirm={handleConfirm}
          handleReject={handleReject}
        />
      </View>

      <View className="p-4 flex-row justify-between items-center border-t border-border">
        <View>
          {activeFilter !== "all" && (
            <Pressable
              className="py-2 px-4"
              onPress={() => setActiveFilter("all")}
            >
              <Text className="text-sm text-muted-foreground">
                Clear filter
              </Text>
            </Pressable>
          )}
        </View>
        <Text className="text-sm text-muted-foreground">
          {notifications.length === 0
            ? "No notifications"
            : `Showing ${filteredNotifications.length} of ${notifications.length} notifications`}
        </Text>
      </View>
    </View>
  );
}

interface NotificationListProps {
  notifications: Notification[];
  markAsRead: (id: string) => void;
  handleConfirm: (notification: Notification) => Promise<void>;
  handleReject: (notification: Notification) => Promise<void>;
}

function NotificationList({
  notifications,
  markAsRead,
  handleConfirm,
  handleReject,
}: NotificationListProps) {
  if (notifications.length === 0) {
    return (
      <View className="items-center justify-center py-12">
        <Bell size={48} className="text-muted-foreground mb-4" />
        <Text className="text-lg font-medium">No notifications</Text>
        <Text className="text-sm text-muted-foreground mt-1">
          When you receive notifications, they will appear here
        </Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1" style={{ maxHeight: 400 }}>
      <View className="space-y-4">
        {notifications.map((notification) => (
          <View
            key={notification.$id}
            className={`flex-row items-start p-3 rounded-lg ${
              notification.read ? "bg-background" : "bg-muted"
            }`}
          >
            <View className="mr-3 mt-0.5">
              {getNotificationIcon(notification.type)}
            </View>
            <View className="flex-1 min-w-0">
              <View className="flex-row items-start justify-between mb-1">
                <View className="flex-row items-center gap-2">
                  <View
                    className={`px-2 py-1 rounded-full ${
                      notification.type === "success"
                        ? "bg-green-50 border border-green-200"
                        : notification.type === "error"
                          ? "bg-red-50 border border-red-200"
                          : notification.type === "warning"
                            ? "bg-amber-50 border border-amber-200"
                            : notification.type === "request"
                              ? "bg-indigo-50 border border-indigo-200"
                              : "bg-blue-50 border border-blue-200"
                    }`}
                  >
                    <Text
                      className={
                        notification.type === "success"
                          ? "text-green-700"
                          : notification.type === "error"
                            ? "text-red-700"
                            : notification.type === "warning"
                              ? "text-amber-700"
                              : notification.type === "request"
                                ? "text-indigo-700"
                                : "text-blue-700"
                      }
                    >
                      {notification.type === "request"
                        ? "Request"
                        : notification.type.charAt(0).toUpperCase() +
                          notification.type.slice(1)}
                    </Text>
                  </View>
                  <Text className="text-xs text-muted-foreground">
                    {format(notification.timestamp, "MMM d, h:mm a")}
                  </Text>
                </View>
                {!notification.read && notification.type !== "request" && (
                  <Pressable
                    className="py-1 px-2"
                    onPress={() => markAsRead(notification.$id)}
                  >
                    <View className="flex-row items-center">
                      <Check size={12} />
                      <Text className="text-xs ml-1">Mark read</Text>
                    </View>
                  </Pressable>
                )}
              </View>
              <Text className="text-sm">{notification.message}</Text>

              {/* Add confirm/reject buttons for request type notifications */}
              {notification.type === "request" && !notification.read && (
                <View className="flex-row mt-3 space-x-2">
                  <Pressable
                    className="flex-1 bg-primary py-2 px-3 rounded-md items-center"
                    onPress={() => handleConfirm(notification)}
                  >
                    <Text className="text-white text-sm font-medium">
                      Confirm
                    </Text>
                  </Pressable>
                  <Pressable
                    className="flex-1 bg-destructive py-2 px-3 rounded-md items-center"
                    onPress={() => handleReject(notification)}
                  >
                    <Text className="text-white text-sm font-medium">
                      Reject
                    </Text>
                  </Pressable>
                </View>
              )}
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
