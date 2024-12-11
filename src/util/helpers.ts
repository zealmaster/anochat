import { Db } from "mongodb";
import { connectDB } from "../database/db";
import {
  chatList,
  messages,
  onlineUsers,
  users,
} from "../database/collections";
import { ChatQuery } from "./types";

let db: Db | null;

export const fetchUsers = async () => {
  try {
    db = await connectDB();
    const usersCollection = db?.collection(users);
    const userList = usersCollection
      ?.find({}, { projection: { password: 0 } })
      .toArray();
    return userList;
  } catch (error) {
    console.log(error);
  }
};

export async function fetchChatMessages(data: ChatQuery) {
  try {
    db = await connectDB();
    const messageCollection = db?.collection(messages);
    const privateMessages = await messageCollection
      ?.find({
        $or: [
          { sender: data.sender, receiver: data.receiver }, // Messages sent by sender to receiver
          { sender: data.receiver, receiver: data.sender }, // Messages sent by receiver to sender
        ],
      })
      .toArray();
    const onlineCollection = db?.collection(onlineUsers);
    const receiver = await onlineCollection?.findOne({
      username: data.receiver,
    });
    const sender = await onlineCollection?.findOne({
      username: data.sender,
    });

    return { sender, receiver, privateMessages };
  } catch (error: any) {
    console.log(error.message);
  }
}

export async function fetchUserChatList(user: string) {
  db = await connectDB();
  const chatListCollection = db?.collection(chatList);
  const contacts = await chatListCollection?.find({ user: user }).toArray();
  return contacts;
}
