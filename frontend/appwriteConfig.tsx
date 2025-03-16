import { Client, Account, Functions, Databases } from "react-native-appwrite";
import { Client as AppwriteClient } from "appwrite";

export const PROJECT_ID = "67cfd8da000a715e73fa";
export const LABEL_FUNCTION_ID = "67d5827c0025e24c00e3";

const appwriteClient = new AppwriteClient();
appwriteClient
  .setEndpoint("https://cloud.appwrite.io/v1")
  .setProject(PROJECT_ID);

const client = new Client();
client.setEndpoint("https://cloud.appwrite.io/v1").setProject(PROJECT_ID);

export const account = new Account(client);

export const functions = new Functions(client);
export const databases = new Databases(client);

export const realtimeClient = appwriteClient;

export default client;
