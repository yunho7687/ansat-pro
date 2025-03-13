import { StatusBar } from "expo-status-bar";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import { ID, Models } from "react-native-appwrite";
import React, { useState } from "react";
import client, { account } from "../appwriteConfig";

client.setPlatform("com.ansat.pro");

export default function App() {
  const [loggedInUser, setLoggedInUser] =
    useState<Models.User<Models.Preferences> | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  async function login(email: string, password: string) {
    if (!email || !password || !name) {
      Alert.alert("Error", "All fields are required");
      return;
    }
    if (password.length < 8) {
      Alert.alert("Error", "Password must be at least 8 characters long");
      return;
    }
    await account.createEmailPasswordSession(email, password);
    setLoggedInUser(await account.get());
    setEmail("");
    setPassword("");
    setName("");
  }

  async function register(email: string, password: string, name: string) {
    if (!email || !password || !name) {
      Alert.alert("Error", "All fields are required");
      return;
    }
    if (password.length < 8) {
      Alert.alert("Error", "Password must be at least 8 characters long");
      return;
    }
    try {
      await account.create(ID.unique(), email, password, name);
      await login(email, password);
      setLoggedInUser(await account.get());
      setEmail("");
      setPassword("");
      setName("");
      Alert.alert("Success", "Registration successful!");
    } catch (error) {
      Alert.alert("Error", "Registration failed. Please try again.");
    }
  }
  return (
    <View style={styles.root}>
      <Text style={styles.text}>
        {loggedInUser
          ? `Welcome ${loggedInUser.name}!`
          : "Please login or register"}
      </Text>
      <Text style={[styles.text, { fontSize: 16 }]}>
        If you encountered any error, please logout first.
      </Text>
      <View>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={(text) => setEmail(text)}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={(text) => setPassword(text)}
          secureTextEntry
        />
        <TextInput
          style={styles.input}
          placeholder="Name"
          value={name}
          onChangeText={(text) => setName(text)}
        />

        <TouchableOpacity
          style={styles.button}
          onPress={() => login(email, password)}
        >
          <Text>Login</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => register(email, password, name)}
        >
          <Text>Register</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={async () => {
            await account.deleteSession("current");
            setLoggedInUser(null);
            setEmail("");
            setPassword("");
            setName("");
          }}
        >
          <Text>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    marginTop: 40,
    marginBottom: 40,
  },
  text: {
    marginBottom: 10,
    fontSize: 32,
    fontWeight: "bold",
  },
  input: {
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  button: {
    backgroundColor: "gray",
    padding: 10,
    marginBottom: 10,
    alignItems: "center",
  },
});
