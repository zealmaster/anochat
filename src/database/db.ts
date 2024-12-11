// db.ts
import { MongoClient, Db } from "mongodb";
import * as dotenv from "dotenv";

dotenv.config();

let db: Db | null = null;

export const connectDB = async (): Promise<Db | null> => {
  try {
    if (!db) {
      const client = await MongoClient.connect(process.env.MONGO_URI!);

      db = client.db();
      await db.collection("onlineUsers").createIndex({ username: 1 }, { unique: true });
      console.log("MongoDB connected");
    }
    return db;
  } catch (error) {
    console.error("Error connecting to MongoDB:", error); 
    return null;
  }
};

export const getDB = (): Db | null => db;

