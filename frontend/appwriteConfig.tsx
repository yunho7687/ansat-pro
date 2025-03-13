import { Client, Account } from "react-native-appwrite";

export const PROJECT_ID = "67cfd8da000a715e73fa";

const client = new Client();
client.setEndpoint("https://cloud.appwrite.io/v1").setProject(PROJECT_ID);

export const account = new Account(client);

export default client;
