require("dotenv").config();

const http = require("http");
const { Server } = require("socket.io");

const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "*",
    methods: ["GET", "POST"]
  }
});

module.exports.io = io;

const startServer = async () => {
  await connectDB();

  server.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
  });
};

startServer();
