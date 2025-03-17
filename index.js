const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
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

    socket.on("disconnect", () => {
      rooms[roomId] = rooms[roomId].filter((id) => id !== socket.id);
      console.log(`User ${socket.id} left room ${roomId}`);
    });
  });
});

server.listen(5000, () => console.log("Server running on port 5000"));
