const express = require('express');
const http = require('http');
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const sessions = {};

app.use(express.json());

app.post('/create-session', (req, res) => {
  const sessionId = Math.random().toString(36).substring(2, 15);
  sessions[sessionId] = { votes: {} };
  res.json({ sessionId });
});

io.on('connection', (socket) => {
  console.log('a user connected');

  socket.on('join-session', (sessionId) => {
    socket.join(sessionId);
  });

  socket.on('vote', (data) => {
    const { sessionId, userId, vote } = data;
    sessions[sessionId].votes[userId] = vote;
    io.to(sessionId).emit('update-votes', sessions[sessionId].votes);
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

server.listen(3001, () => {
  console.log('listening on *:3001');
});
