import { createServer } from "node:http";
import * as dotenv from "dotenv";
import { dirname, join } from "node:path";
import { Server } from "socket.io";
import express, { Express } from "express";
import { fileURLToPath } from "node:url";
import { connectDB } from "./database/db";
import { Db } from "mongodb";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import { auth } from "./routes/auth";

import { Message, Contact, ChatQuery } from "./util/types";
import { chatList, messages, onlineUsers } from "./database/collections";
import {
  fetchUserChatList,
  fetchChatMessages,
  fetchUsers,
  usersInContactList,
} from "./util/helpers";

dotenv.config();

const app: Express = express();
const server = createServer(app);
const io = new Server(server);

const __dirname = dirname(fileURLToPath(import.meta.url));

// middlewares
app.use(express.static(join(__dirname, "public")));
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(auth);

let db: Db | null;
connectDB();

io.use((socket, next) => {
  const token = socket.handshake?.auth?.token;
  if (!token) {
    console.log("No token present");
    return next(new Error("Unauthorized"));
  }
  try {
    const user = jwt.verify(
      token.split(" ")[1],
      process.env.JWT_SECRET as string
    );
    //@ts-ignore
    socket.userId = user.sub;
    //@ts-ignore
    socket.token = token;
    //@ts-ignore
    socket.username = user.username;
    next();
  } catch (e) {
    console.log(e);
    next(new Error("Authentication error"));
  }
});

// Socket.io connection
io.on("connection", async (socket) => {
  console.log("A user connected");
  const userId = socket.id;
  //@ts-ignore
  let username = socket.username;

  try {
    db = await connectDB();
    //socket.userId is set in socket middleware above
    //@ts-ignore
    const userId = socket.userId;

    const onlineCollection = db?.collection(onlineUsers);
    await onlineCollection?.deleteOne({ username });
    await onlineCollection?.insertOne({
      userId: socket.id,
      username,
      createdAt: new Date(),
    });
  } catch (error: any) {
    console.log(error);
    if (error.code === 11000) {
      console.log("User already exists.");
    }
  }

  // Fetch all users
  socket.emit("userlist", await fetchUsers());

  // Add a user to chat list
  socket.on("add-to-chat-list", async (data) => {
    db = await connectDB();
    try {
      const chatListCollection = db?.collection(chatList);
      const contact: Contact = {
        user: data.sender,
        contact: data.receiver,
        createdAt: new Date(),
      };
      const contactExists = await chatListCollection?.findOne({
        $or: [{ user: data.sender, contact: data.receiver }],
      });
      if (!contactExists) {
        await chatListCollection?.insertOne(contact);
      }
    } catch (error) {
      console.log(error);
    }
  });

  // Send contacts on chat list to the user
  socket.emit("chat-list", [...await usersInContactList(username)]);

  socket.on("private", async (data: ChatQuery) => {
    db = await connectDB();
    const chat = await fetchChatMessages(data);
    socket.emit("chat-message", chat?.privateMessages);
  });

  // Message
  socket.on("message", async (data) => {
    const newMessage: Message = {
      sender: data.sender,
      receiver: data.receiver,
      message: data.message,
      createdAt: new Date(),
    };
    try {
      db = await connectDB();
      const messageCollection = db?.collection(messages);
      await messageCollection?.insertOne(newMessage);
      const chat = await fetchChatMessages(data);
      socket.emit("send-message", newMessage);
      io.to(chat?.receiver?.userId).emit("live-chat", newMessage);
    } catch (error: any) {
      console.log(error.message);
    }
  });

  // Feedback on typing status
  socket.on("feedback", async (data) => {
    socket.broadcast.emit("client-feedback", data);
  });

  // Action on socket disconnect
  socket.on("disconnect", async () => {
    db = await connectDB();
    const onlineCollection = db?.collection(onlineUsers);
    await onlineCollection?.deleteOne({ userId });
    console.log("A user disconnected");
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http:localhost:${PORT}`);
});
