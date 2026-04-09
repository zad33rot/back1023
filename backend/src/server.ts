import express, { type Request, type Response } from "express";
import cors from "cors";
import cookieParser from 'cookie-parser';
import http from 'http'
import {Server} from 'socket.io'
import { prisma } from "./db";

// import { pool } from "./db";

import authRouter from "./api/auth";
import postRouter from "./api/posts";
import { registerChatHandlers } from "./socket/chatSocket";

const app = express();
const httpServer = http.createServer(app)

app.use(express.json());
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(cookieParser())

app.use("/api/auth", authRouter);
app.use("/api/posts", postRouter)

const io = new Server(httpServer, {
  cors: { origin: "http://localhost:5173", 
  methods: ["GET", "POST"],
  credentials: true
  }
}) 

registerChatHandlers(io)

app.get("/", (req, res) => {
  res.status(200).json({ status: "ok!!!!!!" });
});

app.get("/api/users", async (req, res) => {
  try {
    // Берем из таблицы User только поле username
    const users = await prisma.user.findMany({
      select: { username: true }
    });
    res.status(200).json(users);
  } catch (error) {
    console.error("Ошибка при получении пользователей:", error);
    res.status(500).json({ error: "Не удалось загрузить пользователей" });
  }
});

const PORT = 3000;

httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});