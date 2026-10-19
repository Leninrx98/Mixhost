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

const normalizeText = (text) => {
  if (!text) return '';
  return text
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
};

const INITIAL_IDEAS_POOL = [
  'Aparece un invitado especial',
  'Discurso de más de 3 minutos',
  'Fallo técnico de sonido',
  'Mencionan al público',
  'Chiste sobre Inteligencia Artificial',
  'Alguien llora en el escenario',
  'Ropa de color rojo brillante',
  'Mencionan una película clásica',
  'Se cae un micrófono u objeto',
  'Problemas de iluminación',
  'Risa fuerte de la audiencia',
  'Agradecen a la familia',
  'Alguien olvida lo que iba a decir',
  'Mencionan las redes sociales',
  'Abrazo emotivo entre presentadores',
  'Premio inesperado o sorpresa',
  'Broma sobre la organización',
  'Referencia a un meme viral',
  'Alguien lee sus notas en el celular',
  'Cantan un fragmento de canción',
  'Comentario sobre la comida del evento',
  'Interrupción por aplausos largos',
  'Alguien tropieza al subir al escenario',
  'Mencionan el clima o la lluvia',
  'Grito entusiasta entre el público',
  'Presentador confunde un nombre',
  'Gesto de corazón con las manos',
  'Selfie en vivo desde el escenario',
  'Referencia al café o energía',
  'Agradecimiento especial al equipo técnico'
];

const rooms = {};

io.on('connection', (socket) => {
  let currentRoom = null;
  let currentUsername = null;

  socket.on('join_room', (data) => {
    const { roomId, username, avatar, sessionId, isCreatingNew } = data;

    if (!roomId) return;

    if (!rooms[roomId] && !isCreatingNew && !sessionId) {
      socket.emit('room_error', { message: 'La sala especificada no existe o fue cerrada.' });
      return;
    }

    if (!rooms[roomId]) {
      rooms[roomId] = {
        hostSessionIds: [sessionId],
        users: {},
        messages: [],
        currentVideo: null,
        videoQueue: [],
        historyQueue: [],
        hasPreviousVideo: false,
        activePoll: null,
        bingoState: {
          status: 'idle',
          size: 16,
          ideasPool: [...INITIAL_IDEAS_POOL],
          pendingValidations: [],
          approvedClaims: {},
          scores: {},
          userCards: {}
        }
      };
    }

    currentRoom = roomId;
    currentUsername = username;
    socket.roomId = roomId;
    socket.join(roomId);

    const room = rooms[roomId];

    if (!room.hostSessionIds || room.hostSessionIds.length === 0) {
      room.hostSessionIds = [sessionId];
    } else if (isCreatingNew && !room.hostSessionIds.includes(sessionId)) {
      room.hostSessionIds.push(sessionId);
    }

    const isHost = room.hostSessionIds.includes(sessionId);

    room.users[socket.id] = {
      id: socket.id,
      username,
      avatar,
      sessionId,
      isHost,
      joinedAt: Date.now(),
    };

    socket.to(roomId).emit('user_joined', { username });

    socket.emit('init_state', {
      messages: room.messages,
      connectedUsers: Object.keys(room.users).length,
      isHost,
      currentVideo: room.currentVideo,
      videoQueue: room.videoQueue,
      hasPreviousVideo: room.hasPreviousVideo,
      activePoll: room.activePoll,
      bingoState: room.bingoState
    });

    io.to(roomId).emit('users_count', Object.keys(room.users).length);
    io.to(roomId).emit('update_participants', Object.values(room.users));
  });

  // --- EVENTOS DEL BINGO ---
  socket.on('bingo_start_draft', ({ roomId, size }) => {
    if (!rooms[roomId]) return;
    const room = rooms[roomId];
    room.bingoState.status = 'draft';
    room.bingoState.size = size || 16;
    io.to(roomId).emit('bingo_updated', room.bingoState);
    io.to(roomId).emit('bingo_notification', { text: `🎲 El Host ha iniciado la fase de armado de Bingo (${size} casillas)` });
  });

  socket.on('bingo_add_idea', ({ roomId, text, author }) => {
    if (!rooms[roomId] || !text) return;
    const room = rooms[roomId];

    const trimmedText = text.trim();
    const normalizedInput = normalizeText(trimmedText);

    // Comparación normalizada
    const exists = room.bingoState.ideasPool.some(
      (i) => normalizeText(i) === normalizedInput
    );

    if (exists) {
      socket.emit('bingo_notification', { text: `⚠️ La opción "${trimmedText}" ya existe en el banco.` });
    } else {
      room.bingoState.ideasPool.push(trimmedText);
      io.to(roomId).emit('bingo_updated', room.bingoState);
      io.to(roomId).emit('bingo_notification', { text: `💡 ${author} sugirió: "${trimmedText}"` });
    }
  });

  socket.on('bingo_update_card', ({ roomId, username, card }) => {
    if (!rooms[roomId]) return;
    const room = rooms[roomId];
    if (!room.bingoState.userCards) {
      room.bingoState.userCards = {};
    }
    room.bingoState.userCards[username] = card;
    io.to(roomId).emit('bingo_updated', room.bingoState);
  });

  socket.on('bingo_start_game', ({ roomId }) => {
    if (!rooms[roomId]) return;
    const room = rooms[roomId];
    room.bingoState.status = 'playing';
    io.to(roomId).emit('bingo_updated', room.bingoState);
    io.to(roomId).emit('bingo_notification', { text: '🚀 ¡Arrancó el Bingo! Marca tus eventos al ocurrir.' });
  });

  socket.on('bingo_claim_point', ({ roomId, username, cellText, cellIndex }) => {
    if (!rooms[roomId] || !cellText) return;
    const room = rooms[roomId];
    
    const isAlreadyApproved = (room.bingoState.approvedClaims[username] || []).includes(cellIndex);
    const isAlreadyPending = room.bingoState.pendingValidations.some(
      (v) => v.username === username && v.cellIndex === cellIndex
    );

    if (isAlreadyApproved || isAlreadyPending) return;

    const validation = {
      id: Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      username,
      cellText,
      cellIndex
    };

    room.bingoState.pendingValidations.push(validation);
    io.to(roomId).emit('bingo_updated', room.bingoState);
  });

  socket.on('bingo_validate_point', ({ roomId, validationId, approved }) => {
    if (!rooms[roomId]) return;
    const room = rooms[roomId];

    const valIndex = room.bingoState.pendingValidations.findIndex(v => v.id === validationId);
    if (valIndex !== -1) {
      const val = room.bingoState.pendingValidations[valIndex];
      room.bingoState.pendingValidations.splice(valIndex, 1);

      if (approved) {
        if (!room.bingoState.approvedClaims) room.bingoState.approvedClaims = {};
        if (!room.bingoState.approvedClaims[val.username]) room.bingoState.approvedClaims[val.username] = [];
        
        if (!room.bingoState.approvedClaims[val.username].includes(val.cellIndex)) {
          room.bingoState.approvedClaims[val.username].push(val.cellIndex);
          room.bingoState.scores[val.username] = (room.bingoState.scores[val.username] || 0) + 100;
          
          io.to(roomId).emit('bingo_notification', { 
            text: `🎯 ${val.username} atinó: "${val.cellText}"` 
          });
        }
      }

      io.to(roomId).emit('bingo_updated', room.bingoState);
    }
  });

  socket.on('bingo_finish_game', ({ roomId }) => {
    if (!rooms[roomId]) return;
    const room = rooms[roomId];
    room.bingoState.status = 'finished';
    io.to(roomId).emit('bingo_updated', room.bingoState);
    io.to(roomId).emit('bingo_notification', { text: '🏆 ¡El Bingo ha finalizado!' });
  });

  socket.on('bingo_reset_game', ({ roomId }) => {
    if (!rooms[roomId]) return;
    const room = rooms[roomId];
    room.bingoState = {
      status: 'idle',
      size: 16,
      ideasPool: [...INITIAL_IDEAS_POOL],
      pendingValidations: [],
      approvedClaims: {},
      scores: {},
      userCards: {}
    };
    io.to(roomId).emit('bingo_updated', room.bingoState);
    io.to(roomId).emit('bingo_notification', { text: '🔄 El Host ha reiniciado el módulo de Bingo para una nueva partida.' });
  });

  // --- OTROS EVENTOS EXISTENTES ---
  socket.on('promote_to_host', ({ targetSocketId, targetSessionId }) => {
    if (!currentRoom || !rooms[currentRoom]) return;
    const room = rooms[currentRoom];

    if (!room.hostSessionIds.includes(socket.sessionId || room.users[socket.id]?.sessionId)) {
      return;
    }

    if (!room.hostSessionIds.includes(targetSessionId)) {
      room.hostSessionIds.push(targetSessionId);
    }

    if (room.users[targetSocketId]) {
      room.users[targetSocketId].isHost = true;
    }

    io.to(targetSocketId).emit('host_status', true);

    const targetName = room.users[targetSocketId]?.username || 'Usuario';
    const msg = {
      id: Date.now(),
      user: 'Sistema',
      text: `👑 ${targetName} ha sido ascendido a Host de la sala.`,
      isSystem: true,
    };
    room.messages.push(msg);
    io.to(currentRoom).emit('receive_message', msg);
    io.to(currentRoom).emit('update_participants', Object.values(room.users));
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

  socket.on('clear_chat', () => {
    if (!currentRoom || !rooms[currentRoom]) return;
    const room = rooms[currentRoom];
    room.messages = [];
    io.to(currentRoom).emit('chat_cleared');
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
    const newVideo = { ...videoData, id: Date.now(), votes: 0 };

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

  socket.on('start_queue_poll', () => {
    if (!currentRoom || !rooms[currentRoom]) return;
    const room = rooms[currentRoom];

    if (room.videoQueue.length < 3) return;

    room.activePoll = {
      id: Date.now(),
      items: room.videoQueue.map((v) => ({ ...v, votes: 0 })),
      votedSessionIds: [],
    };

    io.to(currentRoom).emit('poll_started', room.activePoll);
  });

  socket.on('vote_queue_item', ({ pollId, videoId, sessionId }) => {
    if (!currentRoom || !rooms[currentRoom]) return;
    const room = rooms[currentRoom];

    if (!room.activePoll || room.activePoll.id !== pollId) return;
    if (room.activePoll.votedSessionIds.includes(sessionId)) return;

    const item = room.activePoll.items.find((i) => i.id === videoId);
    if (item) {
      item.votes = (item.votes || 0) + 1;
      room.activePoll.votedSessionIds.push(sessionId);
      io.to(currentRoom).emit('poll_updated', room.activePoll);
    }
  });

  socket.on('finish_queue_poll', () => {
    if (!currentRoom || !rooms[currentRoom]) return;
    const room = rooms[currentRoom];

    if (!room.activePoll) return;

    const sortedItems = [...room.activePoll.items].sort((a, b) => b.votes - a.votes);
    room.videoQueue = sortedItems.map(({ votes, ...rest }) => rest);
    room.activePoll = null;

    io.to(currentRoom).emit('poll_finished', { videoQueue: room.videoQueue });
    io.to(currentRoom).emit('update_queue', room.videoQueue);
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
      const leavingUser = rooms[currentRoom].users[socket.id];
      delete rooms[currentRoom].users[socket.id];

      if (currentUsername) {
        socket.to(currentRoom).emit('user_left', { username: currentUsername });
      }

      const room = rooms[currentRoom];
      const remainingSockets = Object.keys(room.users);

      if (remainingSockets.length > 0 && leavingUser && leavingUser.isHost) {
        const activeHost = remainingSockets.some((sId) => room.users[sId].isHost);
        if (!activeHost) {
          const oldestSocketId = remainingSockets.sort(
            (a, b) => room.users[a].joinedAt - room.users[b].joinedAt
          )[0];

          const newHostUser = room.users[oldestSocketId];
          newHostUser.isHost = true;
          if (!room.hostSessionIds.includes(newHostUser.sessionId)) {
            room.hostSessionIds.push(newHostUser.sessionId);
          }

          io.to(oldestSocketId).emit('host_status', true);
          
          const sysMsg = {
            id: Date.now(),
            user: 'Sistema',
            text: `👑 ${newHostUser.username} es ahora el nuevo Host de la sala.`,
            isSystem: true,
          };
          room.messages.push(sysMsg);
          io.to(currentRoom).emit('receive_message', sysMsg);
        }
      }

      io.to(currentRoom).emit('users_count', remainingSockets.length);
      io.to(currentRoom).emit('update_participants', Object.values(room.users));

      if (remainingSockets.length === 0) {
        const roomToClean = currentRoom;
        setTimeout(() => {
          if (rooms[roomToClean] && Object.keys(rooms[roomToClean].users).length === 0) {
            delete rooms[roomToClean];
          }
        }, 5000);
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Servidor backend corriendo en el puerto ${PORT}`);
});