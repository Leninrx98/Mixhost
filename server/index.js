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

    // Validación si la sala existe al intentar unirse
    if (!isCreatingNew && (!rooms[roomId] || Object.keys(rooms[roomId].users).length === 0)) {
      socket.emit('room_error', { message: 'La sala especificada no existe o fue cerrada.' });
      return;
    }

    // Si la sala no existe y es nueva, se crea
    if (!rooms[roomId]) {
      rooms[roomId] = {
        hostSessionId: sessionId,
        users: {},
        messages: [],
        currentVideo: null,
        videoQueue: [],
        hasPreviousVideo: false,
      };
    }

    currentRoom = roomId;
    currentUsername = username;
    socket.join(roomId);

    const room = rooms[roomId];

    // Asignar o verificar si es el Host de la sala
    if (!room.hostSessionId) {
      room.hostSessionId = sessionId;
    }
    const isHost = room.hostSessionId === sessionId;

    // Registrar o actualizar usuario en la sala
    room.users[socket.id] = {
      id: socket.id,
      username,
      avatar,
      sessionId,
      isHost,
    };

    // Notificar a los demás usuarios que alguien entró (para la notificación flotante)
    socket.to(roomId).emit('user_joined', { username });

    // Enviar el estado inicial al usuario recién conectado
    socket.emit('init_state', {
      messages: room.messages,
      connectedUsers: Object.keys(room.users).length,
      isHost,
      currentVideo: room.currentVideo,
      videoQueue: room.videoQueue,
      hasPreviousVideo: room.hasPreviousVideo,
    });

    // Actualizar conteo e integrantes para todos en la sala
    io.to(roomId).emit('users_count', Object.keys(room.users).length);
    io.to(roomId).emit('update_participants', Object.values(room.users));
  });

  socket.on('send_message', (msgData) => {
    if (!currentRoom || !rooms[currentRoom]) return;
    const msg = {
      id: Date.now(),
      user: msgData.user,
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
    if (room.videoQueue.length > 0) {
      room.hasPreviousVideo = true;
      room.currentVideo = room.videoQueue.shift();
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

      // Si la sala queda vacía, se elimina
      if (Object.keys(rooms[currentRoom].users).length === 0) {
        delete rooms[currentRoom];
      }
    }
  });
});

server.listen(3001, () => {
  console.log('Servidor backend corriendo en el puerto 3001');
});