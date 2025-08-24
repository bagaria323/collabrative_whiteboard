import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
const server = http.createServer(app);

// app.use(cors({ origin: "http://localhost:5173" }));


const io = new Server(server, {
  cors: {
    origin: "https://collabrative-whiteboard-sigma.vercel.app",
    methods: ["GET", "POST"],
  },
});

const boardHistory = {};

io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);

  socket.on("join-room", (boardId) => {
    socket.join(boardId);
    console.log(`User ${socket.id} joined room ${boardId}`);

    if (boardHistory[boardId]) {
      socket.emit("load-history", boardHistory[boardId]);
    }
  });

  socket.on("drawing", (data) => {
    if (!boardHistory[data.boardId]) {
      boardHistory[data.boardId] = [];
    }
    boardHistory[data.boardId].push(data);
    socket.to(data.boardId).emit("drawing", data);
  });

  socket.on("clear", (boardId) => {
    boardHistory[boardId] = [];
    socket.to(boardId).emit("clear");
  });

  socket.on("disconnect", () => {
    console.log("User Disconnected", socket.id);
  });
});

const PORT = 3001;
server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
