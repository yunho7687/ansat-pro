"use client";

import { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  Platform,
  SafeAreaView,
} from "react-native";
import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  User,
  Clock,
  Edit,
} from "lucide-react-native";
import { router } from "expo-router";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Separator } from "~/components/ui/separator";
import { account } from "~/appwriteConfig";

const GITHUB_AVATAR_URI =
  "https://i.pinimg.com/originals/ef/a2/8d/efa28d18a04e7fa40ed49eeb0ab660db.jpg";
// Mock data for shift preceptors
const shiftPreceptors = [
  { day: "Monday", name: "Dr. Robert Chen", specialty: "Emergency Medicine" },
  { day: "Tuesday", name: "Dr. Sarah Johnson", specialty: "Internal Medicine" },
  { day: "Wednesday", name: "Dr. Michael Williams", specialty: "Surgery" },
  { day: "Thursday", name: "Dr. Emily Davis", specialty: "Pediatrics" },
  { day: "Friday", name: "Dr. James Wilson", specialty: "Cardiology" },
  { day: "Saturday", name: "Dr. Lisa Thompson", specialty: "Neurology" },
  { day: "Sunday", name: "Dr. David Martinez", specialty: "Orthopedics" },
];

export function ProfilePage() {
  const [currentDay, setCurrentDay] = useState("");
  const [currentPreceptor, setCurrentPreceptor] = useState<
    (typeof shiftPreceptors)[0] | null
  >(null);
  const [activeTab, setActiveTab] = useState("today");
  const [userData, setUserData] = useState<{
    name: string;
    email: string;
    title: string;
    phone: string;
    location: string;
    department: string;
    joinDate: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function fetchUserData() {
      try {
        // Add retry mechanism for iOS
        let retryCount = 0;
        let session = null;

        while (retryCount < 3) {
          try {
            session = await account.getSession("current");
            if (session) break;
          } catch (error) {
            console.log(`Session attempt ${retryCount + 1} failed:`, error);
            await new Promise((resolve) => setTimeout(resolve, 500));
          }
          retryCount++;
        }

        if (!session) {
          throw new Error("No active session after retries");
        }

        // Then fetch user data
        const user = await account.get();
        if (!user || !mounted) return;

        // For now, we'll use the email name as the display name
        const name = user.email.split("@")[0].replace(/[.-]/g, " ");
        const capitalizedName = name
          .split(" ")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");

        setUserData({
          name: capitalizedName,
          email: user.email,
          title: "Student Nurse",
          phone: "Not set",
          location: "Not set",
          department: "UWA",
          joinDate: new Date(user.$createdAt).toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          }),
        });
      } catch (error) {
        console.error("Failed to fetch user data:", error);
        if (mounted) {
          router.replace("/login");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchUserData();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const today = days[new Date().getDay()];
    setCurrentDay(today);

    const preceptor = shiftPreceptors.find((p) => p.day === today) || null;
    setCurrentPreceptor(preceptor);
  }, []);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text>Loading profile...</Text>
      </View>
    );
  }

  if (!userData) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text>Please log in to view your profile</Text>
        <Button className="mt-4" onPress={() => router.replace("/login")}>
          <Text>Go to Login</Text>
        </Button>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView className="flex-1 p-4">
        <Text className="text-2xl font-bold mb-6">My Profile</Text>

        <View className="gap-6">
          {/* User Profile Card */}
          <Card className="p-4">
            <View className="mb-2">
              <Text className="text-xl font-semibold">
                Personal Information
              </Text>
            </View>
            <View className="items-center mb-6">
              <Avatar alt={userData.name} className="w-24 h-24  mb-4">
                <AvatarImage source={{ uri: GITHUB_AVATAR_URI }} />
                <AvatarFallback>
                  <Text>{userData.name}</Text>
                </AvatarFallback>
              </Avatar>

              <Text className="text-xl font-bold">{userData.name}</Text>
              <Text className="text-muted-foreground">{userData.title}</Text>
              <Badge className="mt-2">
                <Text>{userData.department}</Text>
              </Badge>
            </View>

            <Separator className="my-4" />

            <View className="gap-4">
              <View className="flex-row items-center gap-3">
                <Mail size={20} className="text-muted-foreground" />
                <View>
                  <Text className="text-sm text-muted-foreground">Email</Text>
                  <Text>{userData.email}</Text>
                </View>
              </View>

              <View className="flex-row items-center gap-3">
                <Phone size={20} className="text-muted-foreground" />
                <View>
                  <Text className="text-sm text-muted-foreground">Phone</Text>
                  <Text>{userData.phone}</Text>
                </View>
              </View>

              <View className="flex-row items-center gap-3">
                <MapPin size={20} className="text-muted-foreground" />
                <View>
                  <Text className="text-sm text-muted-foreground">
                    Location
                  </Text>
                  <Text>{userData.location}</Text>
                </View>
              </View>

              <View className="flex-row items-center gap-3">
                <Calendar size={20} className="text-muted-foreground" />
                <View>
                  <Text className="text-sm text-muted-foreground">Joined</Text>
                  <Text>{userData.joinDate}</Text>
                </View>
              </View>
            </View>

            <Button
              variant="outline"
              className="w-full mt-6"
              onPress={() => {}}
            >
              <Edit size={16} className="mr-2" />
              <Text>Edit Profile</Text>
            </Button>
          </Card>

          {/* Shift Information and Preceptor Card */}
          <Card className="p-4">
            <View className="mb-2">
              <Text className="text-xl font-semibold">Shift Information</Text>
            </View>

            <View>
              <View className="flex-row mb-4 border-b border-border">
                <TouchableOpacity
                  onPress={() => setActiveTab("today")}
                  className={`py-2 px-4 ${activeTab === "today" ? "border-b-2 border-primary" : ""}`}
                >
                  <Text
                    className={
                      activeTab === "today"
                        ? "text-primary font-medium"
                        : "text-muted-foreground"
                    }
                  >
                    Today's Shift
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setActiveTab("schedule")}
                  className={`py-2 px-4 ${activeTab === "schedule" ? "border-b-2 border-primary" : ""}`}
                >
                  <Text
                    className={
                      activeTab === "schedule"
                        ? "text-primary font-medium"
                        : "text-muted-foreground"
                    }
                  >
                    Weekly Schedule
                  </Text>
                </TouchableOpacity>
              </View>

              {activeTab === "today" && (
                <View className="gap-4">
                  <View className="bg-muted/50 p-4 rounded-lg">
                    <View className="flex-row items-center justify-between mb-4">
                      <View className="flex-row items-center gap-2">
                        <Clock size={20} className="text-primary" />
                        <Text className="font-medium">Current Day</Text>
                      </View>
                      <Badge variant="outline">
                        <Text>{currentDay}</Text>
                      </Badge>
                    </View>

                    <Separator className="my-4" />

                    <Text className="font-medium mb-4">
                      Today's Shift Preceptor
                    </Text>

                    {currentPreceptor ? (
                      <View className="flex-row items-center gap-4 bg-card p-4 rounded-lg border">
                        <Avatar
                          alt={currentPreceptor.name}
                          className="h-12 w-12"
                        />
                        <View>
                          <Text className="font-medium">
                            {currentPreceptor.name}
                          </Text>
                          <Text className="text-sm text-muted-foreground">
                            {currentPreceptor.specialty}
                          </Text>
                        </View>
                      </View>
                    ) : (
                      <Text className="text-muted-foreground">
                        Loading preceptor information...
                      </Text>
                    )}
                  </View>

                  <View className="flex-row gap-4">
                    <View className="flex-1 bg-muted/50 p-4 rounded-lg">
                      <View className="flex-row items-center gap-2 mb-2">
                        <Clock size={20} className="text-primary" />
                        <Text className="font-medium">Shift Hours</Text>
                      </View>
                      <Text>7:00 AM - 3:30 PM</Text>
                    </View>

                    <View className="flex-1 bg-muted/50 p-4 rounded-lg">
                      <View className="flex-row items-center gap-2 mb-2">
                        <User size={20} className="text-primary" />
                        <Text className="font-medium">Team Members</Text>
                      </View>
                      <Text>5 nurses, 2 assistants</Text>
                    </View>
                  </View>
                </View>
              )}

              {activeTab === "schedule" && (
                <View className="gap-4 mt-4">
                  <Text className="font-medium">Weekly Preceptor Schedule</Text>
                  <View className="border rounded-lg">
                    <View className="bg-muted p-3 flex-row">
                      <Text className="flex-1 text-xs font-medium text-muted-foreground uppercase">
                        Day
                      </Text>
                      <Text className="flex-2 text-xs font-medium text-muted-foreground uppercase">
                        Preceptor
                      </Text>
                      <Text className="flex-2 text-xs font-medium text-muted-foreground uppercase">
                        Specialty
                      </Text>
                    </View>
                    {shiftPreceptors.map((preceptor, index) => (
                      <View
                        key={index}
                        className={`flex-row p-3 border-t ${currentDay === preceptor.day ? "bg-muted/50" : ""}`}
                      >
                        <Text className="flex-1 text-sm">{preceptor.day}</Text>
                        <Text className="flex-2 text-sm">{preceptor.name}</Text>
                        <Text className="flex-2 text-sm">
                          {preceptor.specialty}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
