import express from 'express';
import http from 'http';
import { Server } from 'socket.io';

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
    origin: '*', // Adjust the origin as needed for your frontend
    methods: ['GET', 'POST']
  }
});

const rooms = new Map();

// Handle Socket.IO connections
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  let currentRoom = null;
  let currentUser = null;

  socket.on('join', ({ roomId, userName }) => {
    // Handle leaving the current room
    if (currentRoom) {
      socket.leave(currentRoom);
      rooms.get(currentRoom).delete(currentUser);

      // // Notify others in the room about the updated user list
      // io.to(currentRoom).emit('userJoind', Array.from(rooms.get(currentRoom)));
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

    // // Emit updated user list to the room
    io.to(roomId).emit('userJoind', Array.from(rooms.get(roomId)));
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);

    if (currentRoom && rooms.has(currentRoom)) {
      rooms.get(currentRoom).delete(currentUser);
      console.log(currentUser,'after leaving...');


        // Notify others in the room about the updated user list
        io.to(currentRoom).emit('userAvailable', Array.from(rooms.get(currentRoom))) // Updated list of user );

      // Notify others in the room about the updated user list
      io.to(currentRoom).emit('userLeft', currentUser );
      
    }
  });
});
