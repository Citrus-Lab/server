import dotenv from "dotenv";
import { createServer } from "http";
import connectDB from "./config/database.js";
import app from "./app.js";
import socketService from "./services/socket.service.js";

dotenv.config();

// DB connect
connectDB();

// Create HTTP server
const server = createServer(app);

// Initialize Socket.io
socketService.initialize(server);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔌 WebSocket server ready`);
  console.log(`📧 Email service: ${process.env.EMAIL_SERVICE || 'Not configured'}`);
});
