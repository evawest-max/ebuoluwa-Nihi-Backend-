// Import dependencies
import dotenv from "dotenv";
import helmet from "helmet";
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import compression from "compression";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import itemRoutes from "./routes/item.routes.js";
// import paymentRoutes from "./routes/payment.routes.js";
import paymentsRoutes from "./routes/payment.routes.js";
import chatRoutes from "./routes/chat.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import userRoutes from "./routes/user.routes.js";
import { createServer } from "http";
import { Server } from "socket.io";
import { getapprovedTestimonies, getFeaturedTestimonies } from "./controllers/testimony.controller.js";
import passport from "passport";
import session from "express-session";
import "./config/passport.js"; // Google Strategy
import donationRequestRoutes from "./routes/donationRequest.route.js";
import offerRoutes from './routes/offerHelp.routes.js';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Security headers
app.use(helmet());

// Enable CORS
app.use(cors());
// app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));

// Request logging
app.use(morgan("combined"));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 100, // max requests per IP
});
app.use(limiter);

// Parse JSON bodies
app.use(express.json());

// Compress responses
app.use(compression());

app.use(session({
  secret: process.env.SESSION_SECRET || "default-secret-key-change-in-production",
  resave: false,
  saveUninitialized: true,
}));

// Routes
app.use(passport.initialize());
app.use(passport.session());
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/user", userRoutes);
// app.use("/api/payment", paymentRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/testimony/featured", getFeaturedTestimonies);
app.use("/api/testimony/approved", getapprovedTestimonies);
app.use('/api', donationRequestRoutes);
app.use('/api', offerRoutes);
app.use("/api/payment", paymentsRoutes);


// Root route
app.get("/", (req, res) => res.send("API Running"));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

// Connect to database
connectDB();

// Create HTTP server and Socket.IO instance
const server = createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

// Import Chat model
import Chat from "./models/chat.model.js";

// Socket.IO events
io.on("connection", (socket) => {
  console.log("User connected: ", socket.id);

  // Join a room (userId)
  socket.on("joinRoom", (userId) => {
    socket.join(userId);
    console.log(`User joined room: ${userId}`);
  });

  // Listen for messages
  socket.on("sendMessage", async ({ senderId, receiverId, message }) => {
    try {
      const chat = await Chat.create({ sender: senderId, receiver: receiverId, message });
      // Emit to receiver
      io.to(receiverId).emit("receiveMessage", chat);
      // Emit to sender
      io.to(senderId).emit("receiveMessage", chat);
    } catch (error) {
      console.error("Error saving chat message:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected: ", socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

export { io, server };