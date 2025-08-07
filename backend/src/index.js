import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";

import { connectDB } from "./lib/db.js";
import authRoutes from "./routes/auth.routes.js";
import messageRoutes from "./routes/message.routes.js";
import { app, server } from "./lib/socket.js";

dotenv.config();

const PORT = process.env.PORT;
const __dirname = path.resolve();

// Middleware
app.use(express.json());
app.use(cookieParser());

// ✅ CORS configuration (allow specific origins only)
const allowedOrigins = [
  "https://chatapp-jagadeesh.vercel.app",
  "https://chatapp-six-roan.vercel.app", // ✅ include your current frontend
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS: " + origin));
      }
    },
    credentials: true, // ✅ send cookies cross-site
  })
);

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Chat API is healthy!",
  });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

// ✅ Serve frontend in production
if (process.env.NODE_ENV === "production") {
  console.log("Current NODE_ENV:", process.env.NODE_ENV);
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
  });
}

// Start server
server.listen(PORT, () => {
  console.log("Server is running on PORT: " + PORT);
  connectDB();
});
