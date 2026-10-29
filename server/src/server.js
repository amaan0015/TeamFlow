
import "dotenv/config";
import http from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";

import app from "./app.js";
import connectDB from "./config/db.js";
import User from "./models/User.js";

const PORT = process.env.PORT || 5000;

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

// Add any other frontend origins here if you use them.
const allowedOrigins = [
  ...new Set([
    CLIENT_URL,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://10.127.178.137:5173",
  ]),
];

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
    credentials: true,
  },
});

app.set("io", io);

console.log("Allowed frontend origins:", allowedOrigins);

io.engine.on("connection_error", (error) => {
  console.error("Socket.IO connection error:", {
    code: error.code,
    message: error.message,
    context: error.context,
  });
});

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;

    if (!token || !process.env.JWT_SECRET) {
      return next(new Error("Authentication required"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (
      typeof decoded !== "object" ||
      !decoded.userId ||
      typeof decoded.userId !== "string"
    ) {
      return next(new Error("Invalid or expired token"));
    }

    const user = await User.findById(decoded.userId).select("_id");

    if (!user) {
      return next(new Error("User account no longer exists"));
    }

    socket.data.userId = user._id.toString();
    next();
  } catch (error) {
    console.error("Socket authentication failed:", error.message);
    next(new Error("Invalid or expired token"));
  }
});

io.on("connection", (socket) => {
  const userId = socket.data.userId;

  socket.join(`user:${userId}`);

  console.log(
    `Authenticated socket connected: ${socket.id}, user: ${userId}`
  );

  socket.on("disconnect", (reason) => {
    console.log(`Socket disconnected: ${socket.id}, reason: ${reason}`);
  });
});

const startServer = async () => {
  try {
    await connectDB();

    httpServer.listen(PORT, "0.0.0.0", () => {
      console.log(`TeamFlow API running on port ${PORT}`);
      console.log("TeamFlow real-time notifications server ready");
    });
  } catch (error) {
    console.error("Failed to start TeamFlow:", error.message);
    process.exit(1);
  }
};

startServer();
