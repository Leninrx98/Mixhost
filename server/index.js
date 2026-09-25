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

// Estructura de estado global para múltiples salas
// { roomId: { users: {}, hostSocketId: null, chatMessages: [], videoQueue: [], videoHistory: [], currentVideo: null } }
const rooms = {};

// Obtener o inicializar el estado de una sala
function getRoom(roomId) {
  if (!rooms[roomId]) {
    rooms[roomId] = {
      users: {},
      hostSocketId: null,
      chatMessages: [],
      videoQueue: [],
      videoHistory: [],
      currentVideo: null,
    };
  }
  return rooms[roomId];
}

// Actualizar Anfitrión y enviar lista de participantes por sala
function updateHostAndParticipants(roomId) {
  const room = getRoom(roomId);
  const userIds = Object.keys(room.users);

  if (userIds.length === 0) {
    room.hostSocketId = null;
  } else if (!room.hostSocketId || !room.users[room.hostSocketId]) {
    room.hostSocketId = userIds[0];
  }

  // Notificar estado de Host individualmente
  userIds.forEach((id) => {
    io.to(id).emit('host_status', id === room.hostSocketId);
  });

  // Construir lista de participantes
  const participantsList = userIds.map((id) => ({
    id,
    username: room.users[id].username,
    avatar: room.users[id].avatar || null,
    isHost: id === room.hostSocketId,
  }));

  // Emitir evento solo a la sala específica
  io.to(roomId).emit('update_participants', participantsList);
  io.to(roomId).emit('users_count', userIds.length);
}

io.on('connection', (socket) => {
  let currentRoomId = null;

  console.log(`⚡ Cliente conectado: ${socket.id}`);

  // 1. Unirse a una sala específica
  socket.on('join_room', ({ roomId, username, avatar }) => {
    currentRoomId = roomId || 'main';
    socket.join(currentRoomId);

    const room = getRoom(currentRoomId);
    room.users[socket.id] = { username, avatar };

    updateHostAndParticipants(currentRoomId);

    const systemMsg = {
      id: Date.now(),
      text: `🎉 ${username} se ha unido a la sala.`,
      isSystem: true,
    };
    room.chatMessages.push(systemMsg);
    io.to(currentRoomId).emit('receive_message', systemMsg);

    // Enviar estado inicial de la sala al usuario
    socket.emit('init_state', {
      messages: room.chatMessages,
      connectedUsers: Object.keys(room.users).length,
      isHost: socket.id === room.hostSocketId,
      currentVideo: room.currentVideo,
      videoQueue: room.videoQueue,
      hasPreviousVideo: room.videoHistory.length > 0,
      roomId: currentRoomId,
    });
  });

  // 2. Agregar video a la cola de la sala
  socket.on('add_to_queue', (data) => {
    if (!currentRoomId) return;
    const room = getRoom(currentRoomId);
    const { url, title, addedBy } = data;

    const videoItem = {
      id: Date.now().toString(),
      url,
      title: title || 'Video de YouTube',
      addedBy,
    };

    if (!room.currentVideo) {
      room.currentVideo = videoItem;
      io.to(currentRoomId).emit('sync_video', {
        currentVideo: room.currentVideo,
        videoQueue: room.videoQueue,
        hasPreviousVideo: room.videoHistory.length > 0,
      });
    } else {
      room.videoQueue.push(videoItem);
      io.to(currentRoomId).emit('update_queue', room.videoQueue);

      const systemMsg = {
        id: Date.now(),
        text: `🎵 ${addedBy} agregó "${videoItem.title}" a la cola.`,
        isSystem: true,
      };
      room.chatMessages.push(systemMsg);
      io.to(currentRoomId).emit('receive_message', systemMsg);
    }
  });

  // 3. Siguiente Video
  socket.on('play_next_video', () => {
    if (!currentRoomId) return;
    const room = getRoom(currentRoomId);

    if (room.currentVideo) {
      room.videoHistory.push(room.currentVideo);
    }

    if (room.videoQueue.length > 0) {
      room.currentVideo = room.videoQueue.shift();
    } else {
      room.currentVideo = null;
    }

    io.to(currentRoomId).emit('sync_video', {
      currentVideo: room.currentVideo,
      videoQueue: room.videoQueue,
      hasPreviousVideo: room.videoHistory.length > 0,
    });
  });

  // 4. Anterior Video
  socket.on('play_previous_video', () => {
    if (!currentRoomId) return;
    const room = getRoom(currentRoomId);

    if (socket.id === room.hostSocketId && room.videoHistory.length > 0) {
      if (room.currentVideo) {
        room.videoQueue.unshift(room.currentVideo);
      }

      room.currentVideo = room.videoHistory.pop();

      io.to(currentRoomId).emit('sync_video', {
        currentVideo: room.currentVideo,
        videoQueue: room.videoQueue,
        hasPreviousVideo: room.videoHistory.length > 0,
      });

      const systemMsg = {
        id: Date.now(),
        text: `⏮ El Anfitrión regresó al video anterior: "${room.currentVideo.title}".`,
        isSystem: true,
      };
      room.chatMessages.push(systemMsg);
      io.to(currentRoomId).emit('receive_message', systemMsg);
    }
  });

  // 5. Sincronización del reproductor (Solo Host)
  socket.on('host_play', (time) => {
    if (currentRoomId && socket.id === getRoom(currentRoomId).hostSocketId) {
      socket.to(currentRoomId).emit('sync_play', time);
    }
  });

  socket.on('host_pause', (time) => {
    if (currentRoomId && socket.id === getRoom(currentRoomId).hostSocketId) {
      socket.to(currentRoomId).emit('sync_pause', time);
    }
  });

  // 6. Chat y Reacciones
  socket.on('send_message', (data) => {
    if (!currentRoomId) return;
    const room = getRoom(currentRoomId);
    const msg = {
      id: Date.now(),
      user: data.user,
      text: data.text,
      isSystem: false,
    };
    room.chatMessages.push(msg);
    io.to(currentRoomId).emit('receive_message', msg);
  });

  socket.on('send_reaction', (emoji) => {
    if (!currentRoomId) return;
    io.to(currentRoomId).emit('receive_reaction', {
      id: Date.now(),
      symbol: emoji,
      left: Math.floor(Math.random() * 80) + 10,
    });
  });

  // 7. Desconexión
  socket.on('disconnect', () => {
    if (currentRoomId && rooms[currentRoomId]) {
      const room = rooms[currentRoomId];
      const disconnectedUser = room.users[socket.id];
      delete room.users[socket.id];

      if (disconnectedUser) {
        const systemMsg = {
          id: Date.now(),
          text: `👋 ${disconnectedUser.username} ha salido de la sala.`,
          isSystem: true,
        };
        room.chatMessages.push(systemMsg);
        io.to(currentRoomId).emit('receive_message', systemMsg);
      }

      updateHostAndParticipants(currentRoomId);

      // Limpiar sala de la memoria si queda vacía
      if (Object.keys(room.users).length === 0) {
        delete rooms[currentRoomId];
      }
    }
  });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
});