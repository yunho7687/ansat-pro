"use client";

import { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  Platform,
  SafeAreaView,
  TextInput,
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
import {
  account,
  functions,
  LABEL_FUNCTION_ID,
  realtimeClient,
} from "~/appwriteConfig";
import { ExecutionMethod } from "react-native-appwrite";

const GITHUB_AVATAR_URI =
  "https://i.pinimg.com/originals/ef/a2/8d/efa28d18a04e7fa40ed49eeb0ab660db.jpg";

interface PreceptorInfo {
  name: string;
  email: string;
  specialty?: string;
  day?: string;
  $id?: string;
}

interface PreceptorResponse {
  success: boolean;
  message?: string;
  data: {
    users: Array<{
      name?: string;
      email: string;
      prefs?: {
        specialty?: string;
        day?: string;
      };
    }>;
  };
  error?: string;
}

export function ProfilePage() {
  const [currentDay, setCurrentDay] = useState("");
  const [currentPreceptor, setCurrentPreceptor] =
    useState<PreceptorInfo | null>(null);
  const [activeTab, setActiveTab] = useState("today");
  const [searchTerm, setSearchTerm] = useState("");
  const [preceptors, setPreceptors] = useState<PreceptorInfo[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [userData, setUserData] = useState<{
    id: string;
    name: string;
    email: string;
    title: string;
    phone: string;
    location: string;
    department: string;
    joinDate: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingPreceptor, setLoadingPreceptor] = useState(true);

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
            if (session) {
              console.log("Got session:", session.$id);
              break;
            }
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
        console.log("Fetched user data:", { id: user.$id, email: user.email });

        if (!user || !mounted) return;

        // Get user's labels (roles)
        const labels = user.labels || [];
        const role = labels[0] || "User"; // Default to "User" if no role is set

        // Format the role for display
        const formattedRole = role.charAt(0).toUpperCase() + role.slice(1);
        const roleTitle =
          role === "student"
            ? "Student Nurse"
            : role === "preceptor"
              ? "Preceptor"
              : role === "facilitator"
                ? "Clinical Facilitator"
                : formattedRole;

        // For now, we'll use the email name as the display name
        const name = user.email.split("@")[0].replace(/[.-]/g, " ");
        const capitalizedName = name
          .split(" ")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");

        setUserData({
          id: user.$id,
          name: capitalizedName,
          email: user.email,
          title: roleTitle,
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
    const searchPreceptors = async () => {
      // Trim the search term and check minimum length
      const trimmedSearch = searchTerm.trim();
      if (!trimmedSearch || trimmedSearch.length < 2) {
        setPreceptors([]);
        setSearchError(
          trimmedSearch.length === 1
            ? "Please enter at least 2 characters"
            : null,
        );
        return;
      }

      setSearching(true);
      setSearchError(null);
      try {
        console.log("Searching for preceptors with term:", trimmedSearch);
        const response = await functions.createExecution(
          LABEL_FUNCTION_ID,
          JSON.stringify({
            action: "searchPreceptors",
            search: trimmedSearch,
          }),
          false,
          undefined,
          ExecutionMethod.POST,
          { "Content-Type": "application/json" },
        );

        // Handle the response
        let responseData: PreceptorResponse;
        try {
          responseData = JSON.parse(response.responseBody);
          console.log("Parsed response data:", responseData);
        } catch (parseError) {
          console.error("Failed to parse response:", parseError);
          throw new Error(
            "Server returned invalid data. Please try again later.",
          );
        }

        // Check if we have a valid response with users
        if (!responseData.success) {
          throw new Error(
            responseData.error ||
              responseData.message ||
              "Failed to fetch preceptors",
          );
        }

        if (
          !responseData.data?.users ||
          !Array.isArray(responseData.data.users)
        ) {
          setPreceptors([]);
          return; // Not an error case, just no results
        }

        const preceptorData = responseData.data.users.map(
          (user: {
            name?: string;
            email: string;
            prefs?: {
              specialty?: string;
              day?: string;
            };
            $id?: string;
          }) => ({
            name: user.name || user.email.split("@")[0].replace(/[.-]/g, " "),
            email: user.email,
            $id: user.$id,
            specialty: user.prefs?.specialty || "Not specified",
            day: user.prefs?.day || "Not assigned",
          }),
        );

        setPreceptors(preceptorData);
        setSearchError(null);
      } catch (error) {
        console.error("Search error:", error);
        let errorMessage =
          "An error occurred while searching. Please try again.";

        if (error instanceof Error) {
          // Network or parsing errors
          if (
            error.message.includes("Network") ||
            error.message.includes("connection")
          ) {
            errorMessage = "Network error. Please check your connection.";
          } else if (error.message.includes("invalid")) {
            errorMessage = "Invalid response from server. Please try again.";
          } else {
            errorMessage = error.message;
          }
        }

        setSearchError(errorMessage);
        setPreceptors([]);
      } finally {
        setSearching(false);
      }
    };

    // Increase debounce time to 800ms to reduce server load
    const timeoutId = setTimeout(searchPreceptors, 800);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

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

    const fetchCurrentPreceptor = async () => {
      setLoadingPreceptor(true);
      try {
        const response = await functions.createExecution(
          LABEL_FUNCTION_ID,
          JSON.stringify({
            action: "getCurrentPreceptor",
            role: "preceptor",
            day: today,
          }),
          false,
          undefined,
          ExecutionMethod.POST,
          { "Content-Type": "application/json" },
        );

        const responseData = JSON.parse(
          response.responseBody,
        ) as PreceptorResponse;
        if (
          responseData.success &&
          responseData.data.users &&
          responseData.data.users.length > 0
        ) {
          const preceptor = responseData.data.users[0];
          setCurrentPreceptor({
            name:
              preceptor.name ||
              preceptor.email.split("@")[0].replace(/[.-]/g, " "),
            email: preceptor.email,
            specialty: preceptor.prefs?.specialty || "Not specified",
            day: preceptor.prefs?.day || today,
          });
        } else {
          setCurrentPreceptor(null);
        }
      } catch (error) {
        console.error("Failed to fetch current preceptor:", error);
        setCurrentPreceptor(null);
      } finally {
        setLoadingPreceptor(false);
      }
    };

    fetchCurrentPreceptor();
  }, []);

  const handlePreceptorRequest = async (preceptor: PreceptorInfo) => {
    try {
      const response = await functions.createExecution(
        LABEL_FUNCTION_ID,
        JSON.stringify({
          action: "requestPreceptor",
          studentId: userData?.id,
          studentName: userData?.name,
          studentEmail: userData?.email,
          preceptorId: preceptor.$id,
          preceptorName: preceptor.name,
          preceptorEmail: preceptor.email,
          isPaired: false,
          day: currentDay,
        }),
        false,
        undefined,
        ExecutionMethod.POST,
        { "Content-Type": "application/json" },
      );

      const result = JSON.parse(response.responseBody);
      if (result.success) {
        console.log("Request sent to " + preceptor.name);
        // Clear the search field after successful request
        setSearchTerm("");
        // Clear the search results
        setPreceptors([]);
      } else {
        throw new Error(result.error || "Failed to send request");
      }
    } catch (error) {
      console.error("Failed to send preceptor request:", error);
    }
  };

  useEffect(() => {
    // Only set up subscription if we have userData
    if (!userData?.id) return;

    // Define the payload type for type safety
    interface DocumentPayload {
      studentId: string;
      isPaired: boolean;
      preceptorName: string;
      preceptorEmail: string;
      specialty: string;
      day: string;
    }

    const unsubscribe = realtimeClient.subscribe("documents", (response) => {
      // Type guard to ensure payload matches our expected structure
      const payload = response.payload as DocumentPayload;

      if (
        response.events.includes(
          "databases.*.collections.*.documents.*.update",
        ) &&
        payload.studentId === userData.id &&
        payload.isPaired === true
      ) {
        console.log("New document updated!!:", response);
        setCurrentPreceptor({
          name: payload.preceptorName,
          email: payload.preceptorEmail,
          specialty: payload.specialty || "Not specified",
          day: payload.day || currentDay,
        });
      }
    });

    // Cleanup subscription
    return () => {
      unsubscribe();
    };
  }, [userData]); // Add userData as dependency

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

                    <View className="mb-4">
                      <Text className="font-medium mb-2">
                        Search Preceptors
                      </Text>
                      <TextInput
                        className="bg-background border border-input rounded-md p-3 text-sm text-foreground"
                        placeholder="Search by name or email..."
                        value={searchTerm}
                        onChangeText={setSearchTerm}
                      />
                    </View>

                    <Text className="font-medium mb-4">
                      {searchTerm ? "Search Results" : "Today's Preceptor"}
                    </Text>

                    {searchTerm ? (
                      <ScrollView style={{ maxHeight: 300 }}>
                        {searching ? (
                          <Text className="text-muted-foreground">
                            Searching...
                          </Text>
                        ) : searchError ? (
                          <Text className="text-destructive">
                            {searchError}
                          </Text>
                        ) : preceptors.length > 0 ? (
                          preceptors.map((preceptor, index) => (
                            <View
                              key={index}
                              className="flex-row items-center gap-4 bg-card p-4 rounded-lg border mb-2"
                            >
                              <Avatar
                                alt={preceptor.name}
                                className="h-12 w-12"
                              />
                              <View className="flex-1">
                                <Text className="font-medium">
                                  {preceptor.name}
                                </Text>
                                <Text className="text-sm text-muted-foreground">
                                  {preceptor.email}
                                </Text>
                                <View className="flex-row items-center gap-2 mt-1">
                                  <Badge variant="outline">
                                    <Text>{preceptor.day}</Text>
                                  </Badge>
                                  <Text className="text-xs text-muted-foreground">
                                    {preceptor.specialty}
                                  </Text>
                                </View>
                                <Button
                                  variant="outline"
                                  className="mt-2"
                                  onPress={() =>
                                    handlePreceptorRequest(preceptor)
                                  }
                                >
                                  <Text>Request as Preceptor</Text>
                                </Button>
                              </View>
                            </View>
                          ))
                        ) : (
                          <Text className="text-muted-foreground">
                            No preceptors found matching your search.
                          </Text>
                        )}
                      </ScrollView>
                    ) : loadingPreceptor ? (
                      <Text className="text-muted-foreground">
                        Loading today's preceptor...
                      </Text>
                    ) : currentPreceptor ? (
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
                            {currentPreceptor.email}
                          </Text>
                          <View className="flex-row items-center gap-2 mt-1">
                            <Text className="text-xs text-muted-foreground">
                              {currentPreceptor.specialty}
                            </Text>
                          </View>
                        </View>
                      </View>
                    ) : (
                      <Text className="text-muted-foreground">
                        No preceptor assigned for today.
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
                    {preceptors.map(
                      (preceptor: PreceptorInfo, index: number) => (
                        <View
                          key={index}
                          className={`flex-row p-3 border-t ${currentDay === preceptor.day ? "bg-muted/50" : ""}`}
                        >
                          <Text className="flex-1 text-sm">
                            {preceptor.day}
                          </Text>
                          <Text className="flex-2 text-sm">
                            {preceptor.name}
                          </Text>
                          <Text className="flex-2 text-sm">
                            {preceptor.specialty}
                          </Text>
                        </View>
                      ),
                    )}
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
