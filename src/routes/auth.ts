import express, { Request, Response } from "express";
import { connectDB } from "../database/db";
import { Db } from "mongodb";
import jwt from "jsonwebtoken";
import * as dotenv from "dotenv";
dotenv.config();
import * as bcrypt from "bcrypt";

export const auth = express.Router();

let db: Db | null;
const messages = "messages";
const onlineUsers = "onlineUsers";
const users = "users";
connectDB();

// Register user
auth.post("/register", async (req: Request, res: Response) => {
  try {
    const data = req.body;
    db = await connectDB();
    const userCollection = db?.collection("users");
    const userExists = await userCollection?.findOne({
      username: data.username,
    });
    if (!userExists) {
      const newUser = await userCollection?.insertOne({
        username: data.username,
        password: await bcrypt.hash(data.password, 10),
        createdAt: new Date(),
      });
      return res.send({ success: true });
    }
    return res
      .status(400)
      .send({ error: "Username taken! Registration failed." });
  } catch (error) {
    console.log(error);
  }
});

// Sign in user
auth.post("/sign-in", async (req: Request, res: Response) => {
  try {
    const data = req.body;
    db = await connectDB();
    const username = data.username;
    const usersCollection = db?.collection(users);
    const userExists = await usersCollection?.findOne({ username });
    if (userExists) {
      const passwordMatch = await bcrypt.compare(
        data.password,
        userExists?.password
      );
      if (passwordMatch) {
        const token = jwt.sign(
          { sub: userExists._id.toHexString(), username: username },
          process.env.JWT_SECRET!,
          { expiresIn: "2d" }
        );

        const userId = userExists._id.toHexString();
        const onlineUsersCollection = db?.collection(onlineUsers);
        await onlineUsersCollection?.deleteOne({ username });
        await onlineUsersCollection?.insertOne({
          userId,
          username,
          createdAt: new Date(),
        });

        res.send({ username, token });
      } else {
        res.send({ error: "Wrong password." });
      }
    } else {
      res.send({ error: "Username does not exist." });
    }
  } catch (error) {
    console.log(error);
  }
});
