import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://192.168.2.62:5173"],
    credentials: true,
  },
});

// Store online users: { userId: socketId }
const userSocketMap = {};

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;

  if (userId) {
    const previousSocketId = userSocketMap[userId];

    // Only set new socket if different
    if (previousSocketId !== socket.id) {
      userSocketMap[userId] = socket.id;
      console.log(`✅ User ${userId} connected as ${socket.id}`);
      io.emit("getOnlineUsers", Object.keys(userSocketMap));
    }
  }

  // Manual refresh request from client
  socket.on("refreshOnlineUsers", () => {
    console.log(`🔄 Manual refresh requested by ${socket.id}`);
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });

  socket.on("disconnect", () => {
    console.log(`❌ Socket disconnected: ${socket.id}`);

    // Remove user from map
    for (const [uid, sid] of Object.entries(userSocketMap)) {
      if (sid === socket.id) {
        delete userSocketMap[uid];
        console.log(`🗑️ User ${uid} removed from online list`);
        break;
      }
    }

    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { io, app, server };
