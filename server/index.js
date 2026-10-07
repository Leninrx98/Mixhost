const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Estructura de memoria para las salas
const rooms = {};

io.on('connection', (socket) => {
  let currentRoom = null;
  let currentUsername = null;

  socket.on('join_room', (data) => {
    const { roomId, username, avatar, sessionId, isCreatingNew } = data;

    if (!roomId) return;

    // Validación si la sala no existe al intentar unirse
    if (!isCreatingNew && (!rooms[roomId] || Object.keys(rooms[roomId].users).length === 0)) {
      socket.emit('room_error', { message: 'La sala especificada no existe o fue cerrada.' });
      return;
    }

    // Crear la sala si es nueva
    if (!rooms[roomId]) {
      rooms[roomId] = {
        hostSessionId: sessionId,
        users: {},
        messages: [],
        currentVideo: null,
        videoQueue: [],
        historyQueue: [],
        hasPreviousVideo: false,
      };
    }

    currentRoom = roomId;
    currentUsername = username;
    socket.roomId = roomId;
    socket.join(roomId);

    const room = rooms[roomId];

    if (!room.hostSessionId) {
      room.hostSessionId = sessionId;
    }
    const isHost = room.hostSessionId === sessionId;

    room.users[socket.id] = {
      id: socket.id,
      username,
      avatar,
      sessionId,
      isHost,
    };

    socket.to(roomId).emit('user_joined', { username });

    // Enviar estado inicial completo
    socket.emit('init_state', {
      messages: room.messages,
      connectedUsers: Object.keys(room.users).length,
      isHost,
      currentVideo: room.currentVideo,
      videoQueue: room.videoQueue,
      hasPreviousVideo: room.hasPreviousVideo,
    });

    io.to(roomId).emit('users_count', Object.keys(room.users).length);
    io.to(roomId).emit('update_participants', Object.values(room.users));
  });

  socket.on('send_message', (msgData) => {
    if (!currentRoom || !rooms[currentRoom]) return;
    const msg = {
      id: Date.now(),
      user: msgData.user || msgData.username,
      text: msgData.text,
      isSystem: msgData.isSystem || false,
    };
    rooms[currentRoom].messages.push(msg);
    io.to(currentRoom).emit('receive_message', msg);
  });

  socket.on('send_reaction', (emoji) => {
    if (!currentRoom) return;
    io.to(currentRoom).emit('receive_reaction', {
      id: Date.now(),
      symbol: emoji,
      left: Math.floor(Math.random() * 80) + 10,
    });
  });

  socket.on('add_to_queue', (videoData) => {
    if (!currentRoom || !rooms[currentRoom]) return;
    const room = rooms[currentRoom];
    const newVideo = { ...videoData, id: Date.now() };

    if (!room.currentVideo) {
      room.currentVideo = newVideo;
      io.to(currentRoom).emit('sync_video', {
        currentVideo: room.currentVideo,
        videoQueue: room.videoQueue,
        hasPreviousVideo: room.hasPreviousVideo,
      });
    } else {
      room.videoQueue.push(newVideo);
      io.to(currentRoom).emit('update_queue', room.videoQueue);
    }
  });

  socket.on('host_play', (time) => {
    if (!currentRoom) return;
    socket.to(currentRoom).emit('sync_play', time);
  });

  socket.on('host_pause', (time) => {
    if (!currentRoom) return;
    socket.to(currentRoom).emit('sync_pause', time);
  });

  socket.on('play_next_video', () => {
    if (!currentRoom || !rooms[currentRoom]) return;
    const room = rooms[currentRoom];

    if (room.currentVideo) {
      if (!room.historyQueue) room.historyQueue = [];
      room.historyQueue.push(room.currentVideo);
    }

    if (room.videoQueue.length > 0) {
      room.hasPreviousVideo = true;
      room.currentVideo = room.videoQueue.shift();
    } else {
      room.currentVideo = null;
    }

    io.to(currentRoom).emit('sync_video', {
      currentVideo: room.currentVideo,
      videoQueue: room.videoQueue,
      hasPreviousVideo: room.hasPreviousVideo,
    });
  });

  socket.on('play_previous_video', () => {
    if (!currentRoom || !rooms[currentRoom]) return;
    const room = rooms[currentRoom];

    if (room.historyQueue && room.historyQueue.length > 0) {
      if (room.currentVideo) {
        room.videoQueue.unshift(room.currentVideo);
      }
      room.currentVideo = room.historyQueue.pop();
      room.hasPreviousVideo = room.historyQueue.length > 0;

      io.to(currentRoom).emit('sync_video', {
        currentVideo: room.currentVideo,
        videoQueue: room.videoQueue,
        hasPreviousVideo: room.hasPreviousVideo,
      });
    }
  });

  socket.on('leave_room', () => {
    if (!currentRoom || !rooms[currentRoom]) return;
    socket.leave(currentRoom);
    delete rooms[currentRoom].users[socket.id];

    if (currentUsername) {
      socket.to(currentRoom).emit('user_left', { username: currentUsername });
    }

    io.to(currentRoom).emit('users_count', Object.keys(rooms[currentRoom].users).length);
    io.to(currentRoom).emit('update_participants', Object.values(rooms[currentRoom].users));
  });

  socket.on('disconnect', () => {
    if (currentRoom && rooms[currentRoom]) {
      delete rooms[currentRoom].users[socket.id];

      if (currentUsername) {
        socket.to(currentRoom).emit('user_left', { username: currentUsername });
      }

      io.to(currentRoom).emit('users_count', Object.keys(rooms[currentRoom].users).length);
      io.to(currentRoom).emit('update_participants', Object.values(rooms[currentRoom].users));

      if (Object.keys(rooms[currentRoom].users).length === 0) {
        delete rooms[currentRoom];
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Servidor backend corriendo en el puerto ${PORT}`);
});