const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Inicializar la Base de Datos SQLite
const db = new Database(path.join(__dirname, 'mixhost.db'));

// Crear tablas en SQLite si no existen
db.exec(`
  CREATE TABLE IF NOT EXISTS rooms (
    id TEXT PRIMARY KEY,
    host_username TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id TEXT,
    user TEXT,
    text TEXT,
    is_system INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(room_id) REFERENCES rooms(id)
  );

  CREATE TABLE IF NOT EXISTS queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id TEXT,
    url TEXT,
    title TEXT,
    added_by TEXT,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(room_id) REFERENCES rooms(id)
  );
`);

// Consultas preparadas
const stmtEnsureRoom = db.prepare('INSERT OR IGNORE INTO rooms (id, host_username) VALUES (?, ?)');
const stmtGetRoomHost = db.prepare('SELECT host_username FROM rooms WHERE id = ?');
const stmtUpdateRoomHost = db.prepare('UPDATE rooms SET host_username = ? WHERE id = ?');

const stmtInsertMessage = db.prepare('INSERT INTO messages (room_id, user, text, is_system) VALUES (?, ?, ?, ?)');
const stmtGetMessages = db.prepare('SELECT id, user, text, is_system as isSystem FROM messages WHERE room_id = ? ORDER BY id ASC LIMIT 50');

const stmtInsertQueue = db.prepare('INSERT INTO queue (room_id, url, title, added_by, status) VALUES (?, ?, ?, ?, ?)');
const stmtGetQueue = db.prepare("SELECT id, url, title, added_by as addedBy FROM queue WHERE room_id = ? AND status = 'pending' ORDER BY id ASC");
const stmtGetCurrentVideo = db.prepare("SELECT id, url, title, added_by as addedBy FROM queue WHERE room_id = ? AND status = 'playing' LIMIT 1");
const stmtSetVideoStatus = db.prepare('UPDATE queue SET status = ? WHERE id = ?');
const stmtHasHistory = db.prepare("SELECT COUNT(*) as count FROM queue WHERE room_id = ? AND status = 'played'");
const stmtGetLastPlayed = db.prepare("SELECT id, url, title, added_by as addedBy FROM queue WHERE room_id = ? AND status = 'played' ORDER BY id DESC LIMIT 1");

// Estado en memoria para conexiones activas y temporizadores de gracia
const activeRooms = {};
const disconnectTimers = {};

io.on('connection', (socket) => {
  let userRoomId = null;

  // 1. Unirse o Validar Sala
  socket.on('join_room', ({ roomId, username, avatar, sessionId, isCreatingNew }) => {
    // Validar si la sala existe en SQLite si no se está creando de cero
    let roomRecord = stmtGetRoomHost.get(roomId);

    if (!roomRecord && !isCreatingNew) {
      // Si la sala no existe en la BD y el usuario intentó ingresar adivinando la URL
      socket.emit('room_error', { message: 'La sala especificada no existe o fue eliminada.' });
      return;
    }

    if (!roomRecord && isCreatingNew) {
      // Registrar la nueva sala en la base de datos
      stmtEnsureRoom.run(roomId, username);
      roomRecord = { host_username: username };
    }

    userRoomId = roomId;
    socket.join(roomId);

    // Inicializar estado en memoria de la sala si no existe
    if (!activeRooms[roomId]) {
      activeRooms[roomId] = {
        hostUsername: roomRecord.host_username,
        hostSocketId: null,
        users: {},
      };
    }

    const room = activeRooms[roomId];
    const isHost = username === room.hostUsername;

    if (isHost) {
      room.hostSocketId = socket.id;
      if (disconnectTimers[roomId]) {
        clearTimeout(disconnectTimers[roomId]);
        delete disconnectTimers[roomId];
      }
    }

    room.users[socket.id] = {
      id: socket.id,
      sessionId,
      username,
      avatar,
      isHost,
    };

    // Obtener historial guardado en BD
    const messages = stmtGetMessages.all(roomId);
    const videoQueue = stmtGetQueue.all(roomId);
    const currentVideo = stmtGetCurrentVideo.get(roomId) || null;
    const historyCount = stmtHasHistory.get(roomId).count;

    // Enviar estado inicial al usuario que ingresa
    socket.emit('init_state', {
      messages,
      connectedUsers: Object.keys(room.users).length,
      isHost,
      currentVideo,
      videoQueue,
      hasPreviousVideo: historyCount > 0,
    });

    io.to(roomId).emit('users_count', Object.keys(room.users).length);
    io.to(roomId).emit('update_participants', Object.values(room.users));
  });

  // Salir de una sala para cambiarse a otra
  socket.on('leave_room', ({ roomId }) => {
    if (activeRooms[roomId] && activeRooms[roomId].users[socket.id]) {
      delete activeRooms[roomId].users[socket.id];
      socket.leave(roomId);
      io.to(roomId).emit('users_count', Object.keys(activeRooms[roomId].users).length);
      io.to(roomId).emit('update_participants', Object.values(activeRooms[roomId].users));
    }
  });

  // 2. Chat
  socket.on('send_message', ({ user, text }) => {
    if (!userRoomId) return;
    const info = stmtInsertMessage.run(userRoomId, user, text, 0);
    const msg = { id: info.lastInsertRowid, user, text, isSystem: false };
    io.to(userRoomId).emit('receive_message', msg);
  });

  // 3. Reacciones
  socket.on('send_reaction', (symbol) => {
    if (!userRoomId) return;
    const reaction = {
      id: Date.now(),
      symbol,
      left: Math.floor(Math.random() * 80) + 10,
    };
    io.to(userRoomId).emit('receive_reaction', reaction);
  });

  // 4. Cola de videos
  socket.on('add_to_queue', (videoData) => {
    if (!userRoomId) return;

    const current = stmtGetCurrentVideo.get(userRoomId);

    if (!current) {
      const info = stmtInsertQueue.run(userRoomId, videoData.url, videoData.title, videoData.addedBy, 'playing');
      const currentVideo = { id: info.lastInsertRowid, ...videoData };
      const videoQueue = stmtGetQueue.all(userRoomId);
      const historyCount = stmtHasHistory.get(userRoomId).count;

      io.to(userRoomId).emit('sync_video', {
        currentVideo,
        videoQueue,
        hasPreviousVideo: historyCount > 0,
      });
    } else {
      stmtInsertQueue.run(userRoomId, videoData.url, videoData.title, videoData.addedBy, 'pending');
      const videoQueue = stmtGetQueue.all(userRoomId);
      io.to(userRoomId).emit('update_queue', videoQueue);
    }
  });

  // 5. Controles de Sincronización en Tiempo Real
  socket.on('host_play', (time) => {
    if (!userRoomId) return;
    io.to(userRoomId).emit('sync_play', time);
  });

  socket.on('host_pause', (time) => {
    if (!userRoomId) return;
    io.to(userRoomId).emit('sync_pause', time);
  });

  // 6. Siguiente video
  socket.on('play_next_video', () => {
    if (!userRoomId) return;

    const current = stmtGetCurrentVideo.get(userRoomId);
    if (current) {
      stmtSetVideoStatus.run('played', current.id);
    }

    const pendingQueue = stmtGetQueue.all(userRoomId);
    if (pendingQueue.length > 0) {
      const nextVideo = pendingQueue[0];
      stmtSetVideoStatus.run('playing', nextVideo.id);
    }

    const currentVideo = stmtGetCurrentVideo.get(userRoomId) || null;
    const videoQueue = stmtGetQueue.all(userRoomId);
    const historyCount = stmtHasHistory.get(userRoomId).count;

    io.to(userRoomId).emit('sync_video', {
      currentVideo,
      videoQueue,
      hasPreviousVideo: historyCount > 0,
    });
  });

  // 7. Video anterior
  socket.on('play_previous_video', () => {
    if (!userRoomId) return;

    const lastPlayed = stmtGetLastPlayed.get(userRoomId);
    if (lastPlayed) {
      const current = stmtGetCurrentVideo.get(userRoomId);
      if (current) {
        stmtSetVideoStatus.run('pending', current.id);
      }
      stmtSetVideoStatus.run('playing', lastPlayed.id);
    }

    const currentVideo = stmtGetCurrentVideo.get(userRoomId) || null;
    const videoQueue = stmtGetQueue.all(userRoomId);
    const historyCount = stmtHasHistory.get(userRoomId).count;

    io.to(userRoomId).emit('sync_video', {
      currentVideo,
      videoQueue,
      hasPreviousVideo: historyCount > 0,
    });
  });

  // 8. Desconexión con Tiempo de Gracia
  socket.on('disconnect', () => {
    if (!userRoomId || !activeRooms[userRoomId]) return;

    const room = activeRooms[userRoomId];
    const disconnectedUser = room.users[socket.id];
    delete room.users[socket.id];

    if (disconnectedUser && disconnectedUser.isHost) {
      room.hostSocketId = null;

      disconnectTimers[userRoomId] = setTimeout(() => {
        const remainingSockets = Object.keys(room.users);
        if (remainingSockets.length > 0) {
          const newHostSocket = remainingSockets[0];
          const newHostUser = room.users[newHostSocket];

          room.hostUsername = newHostUser.username;
          room.hostSocketId = newHostSocket;
          newHostUser.isHost = true;

          stmtUpdateRoomHost.run(newHostUser.username, userRoomId);

          io.to(newHostSocket).emit('host_status', true);
          io.to(userRoomId).emit('update_participants', Object.values(room.users));
        } else {
          delete activeRooms[userRoomId];
        }
      }, 60000); // 60 segundos de gracia
    }

    io.to(userRoomId).emit('users_count', Object.keys(room.users).length);
    io.to(userRoomId).emit('update_participants', Object.values(room.users));
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Servidor backend corriendo en http://localhost:${PORT} con SQLite`);
});