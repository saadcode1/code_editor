import express from "express";
import http from "http";
import { Server } from "socket.io";

// Create an instance of Express
const app = express();

// Create an HTTP server
const server = http.createServer(app);

// Start the server
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// Initialize Socket.IO with the HTTP server
const io = new Server(server, {
  cors: {
    origin: "*", // Adjust the origin as needed for your frontend
    methods: ["GET", "POST"],
  },
});

const rooms = new Map();

// Handle Socket.IO connections
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  let currentRoom = null;
  let currentUser = null;

  socket.on("join", ({ roomId, userName }) => {
    // Handle leaving the current room
    if (currentRoom) {
      socket.leave(currentRoom);
      rooms.get(currentRoom)?.delete(currentUser);
    }

    // Join the new room
    currentRoom = roomId;
    currentUser = userName;

    socket.join(roomId);

    // Initialize room if not exists
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Set());
    }

    // Add the user to the room
    rooms.get(roomId).add(userName);

    // Emit updated user list to the room
    io.to(roomId).emit("userJoined", Array.from(rooms.get(roomId)));
  });

  // Handle language change
  socket.on("language-change", (lang) => {
    console.log(`Language changed to: ${lang} in room ${currentRoom}`);
    if (currentRoom) {
      io.to(currentRoom).emit("language-change", lang);
    }
  });

  socket.on('codeChange',codeTyped=>{
    console.log("typing someOne in room",codeTyped)
     const {code ,userName}=codeTyped;
    if(currentRoom){
      console.log(currentUser,"current user")
      io.to(currentRoom).emit("codeChange",{code ,userName});
    }
  })

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("A user disconnected:", socket.id);

    if (currentRoom && rooms.has(currentRoom)) {
      rooms.get(currentRoom).delete(currentUser);

      // Notify others in the room
      io.to(currentRoom).emit("userAvailable", Array.from(rooms.get(currentRoom)));
      io.to(currentRoom).emit("userLeft", currentUser);
    }
  });
});
