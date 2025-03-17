const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app); // HTTP sunucusu oluşturuldu

// CORS yapılandırması (Vercel frontend URL'ni buraya yaz)
app.use(cors({
  origin: "https://webfe-rose.vercel.app",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));

// Socket.io sunucusu oluşturuluyor ve CORS yapılandırması ekleniyor
const io = new Server(server, {
  cors: {
    origin: "https://webfe-rose.vercel.app", // Vercel frontend URL'ni buraya yaz
    methods: ["GET", "POST"]
  }
});

const rooms = {};

io.on("connection", (socket) => {
  console.log("New user connected:", socket.id);

  socket.on("join-room", (roomId) => {
    if (!rooms[roomId]) rooms[roomId] = [];
    rooms[roomId].push(socket.id);

    console.log(`User ${socket.id} joined room ${roomId}`);
    const otherUsers = rooms[roomId].filter((id) => id !== socket.id);
    
    socket.emit("other-users", otherUsers);

    socket.on("send-signal", (data) => {
      io.to(data.userToSignal).emit("user-joined", {
        signal: data.signal,
        callerId: socket.id,
      });
    });

    socket.on("return-signal", (data) => {
      io.to(data.callerId).emit("receive-returned-signal", {
        signal: data.signal,
        id: socket.id,
      });
    });
    socket.on("send-message", (message) => {
      io.emit("receive-message", message);
    });
    
    socket.on("disconnect", () => {
      if (rooms[roomId]) {
        rooms[roomId] = rooms[roomId].filter((id) => id !== socket.id);
        socket.broadcast.emit("user-disconnected", socket.id);
      }
    });
    
  });
});

// Sunucuyu 5000 portunda başlat
server.listen(5000, () => console.log("Server running on port 5000"));
