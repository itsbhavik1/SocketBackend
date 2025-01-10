const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const cors = require('cors');

app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:8080"],
  methods: ["GET", "POST"]
}));

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:8080"],
    methods: ["GET", "POST"]
  }
});

const rooms = {
  comedy: { name: 'Comedy Club', users: new Set(), messages: [] },
  horror: { name: 'Horror Haven', users: new Set(), messages: [] },
  music: { name: 'Music Lounge', users: new Set(), messages: [] },
  gaming: { name: 'Gaming Zone', users: new Set(), messages: [] }
};

const updateRoomUsers = (roomName) => {
  const room = rooms[roomName];
  if (room) {
    io.to(roomName).emit('update_users', room.users.size);
  }
};

io.on('connection', (socket) => {
  console.log('a user connected');

  socket.on('join_room', (roomName) => {
    // Leave previous room if any
    Object.keys(rooms).forEach(room => {
      if (rooms[room].users.has(socket.id)) {
        rooms[room].users.delete(socket.id);
        socket.leave(room);
        updateRoomUsers(room);
      }
    });

    // Join new room
    if (rooms[roomName]) {
      rooms[roomName].users.add(socket.id);
      socket.join(roomName);
      console.log(`User ${socket.id} joined room ${roomName}`);
      updateRoomUsers(roomName);
    } else {
      console.log(`Room ${roomName} does not exist`);
    }
  });

  socket.on('send_message', (data) => {
    const { roomName, message } = data;
    if (rooms[roomName]) {
      rooms[roomName].messages.push(message);
      io.to(roomName).emit('receive_message', message);
      console.log(`Message sent to room ${roomName}: ${message}`);
    } else {
      console.log(`Room ${roomName} does not exist`);
    }
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
    Object.keys(rooms).forEach(room => {
      if (rooms[room].users.has(socket.id)) {
        rooms[room].users.delete(socket.id);
        updateRoomUsers(room);
      }
    });
  });
});

server.listen(3000, () => {
  console.log('listening on *:3000');
});