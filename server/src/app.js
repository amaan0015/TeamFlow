
import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import workspaceRoutes from "./routes/workspaceRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";


const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://10.127.178.137:5173",
    ],
    credentials: true,
  })
);

app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "TeamFlow API is running",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/workspaces", workspaceRoutes);
app.use("/api/notifications", notificationRoutes);


export default app;




