import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server } from 'socket.io';
import { ClientToServerEvents, ServerToClientEvents } from './src/types/events';
import { gameStore } from './src/server/store';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: {
      origin: dev ? ['http://localhost:3000'] : [],
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    socket.on('room:create', (data, callback) => {
      const { nickname, password } = data;

      if (!nickname || nickname.trim().length === 0) {
        callback({ success: false, error: 'Nickname is required' });
        return;
      }

      const room = gameStore.createRoom(socket.id, nickname.trim(), password);
      socket.join(room.code);

      console.log(`Room created: ${room.code} by ${nickname}`);
      callback({ success: true, code: room.code, room: gameStore.toPublicRoom(room) });
    });

    socket.on('room:join', (data, callback) => {
      const { code, nickname, password } = data;

      if (!nickname || nickname.trim().length === 0) {
        callback({ success: false, error: 'Nickname is required' });
        return;
      }

      if (!code || code.trim().length === 0) {
        callback({ success: false, error: 'Room code is required' });
        return;
      }

      const result = gameStore.joinRoom(code.toUpperCase(), socket.id, nickname.trim(), password);

      if (!result.success || !result.room) {
        callback({ success: false, error: result.error });
        return;
      }

      socket.join(code.toUpperCase());

      const player = result.room.players.get(socket.id);
      if (player) {
        socket.to(code.toUpperCase()).emit('room:player-joined', player);
      }

      console.log(`${nickname} joined room: ${code}`);
      callback({ success: true, room: gameStore.toPublicRoom(result.room) });
    });

    socket.on('room:leave', () => {
      const room = gameStore.getRoomByPlayerId(socket.id);
      if (!room) return;

      const { room: updatedRoom } = gameStore.removePlayer(socket.id);
      socket.leave(room.code);

      if (updatedRoom) {
        io.to(room.code).emit('room:player-left', socket.id);
        io.to(room.code).emit('room:state-changed', gameStore.toPublicRoom(updatedRoom));
      }

      console.log(`Player left room: ${room.code}`);
    });

    socket.on('game:start', (data, callback) => {
      const room = gameStore.getRoomByPlayerId(socket.id);
      if (!room) {
        callback({ success: false, error: 'Not in a room' });
        return;
      }

      const result = gameStore.startGame(room.code, socket.id, data.roundDuration);

      if (!result.success || !result.room) {
        callback({ success: false, error: result.error });
        return;
      }

      // Send personalized game state to each player
      for (const player of result.room.players.values()) {
        const gameState = gameStore.getGameStateForPlayer(result.room, player.id);
        if (gameState) {
          io.to(player.id).emit('game:started', gameState);
        }
      }

      io.to(room.code).emit('room:state-changed', gameStore.toPublicRoom(result.room));

      console.log(`Game started in room: ${room.code}`);
      callback({ success: true });
    });

    socket.on('game:start-voting', () => {
      const room = gameStore.getRoomByPlayerId(socket.id);
      if (!room) return;

      const result = gameStore.startVoting(room.code, socket.id);

      if (result.success && result.room) {
        io.to(room.code).emit('game:voting-started');
        io.to(room.code).emit('room:state-changed', gameStore.toPublicRoom(result.room));
        console.log(`Voting started in room: ${room.code}`);
      }
    });

    socket.on('game:vote', (data, callback) => {
      const room = gameStore.getRoomByPlayerId(socket.id);
      if (!room) {
        callback({ success: false, error: 'Not in a room' });
        return;
      }

      const result = gameStore.castVote(room.code, socket.id, data.targetId);

      if (!result.success) {
        callback({ success: false, error: result.error });
        return;
      }

      io.to(room.code).emit('game:vote-cast', socket.id);

      if (result.allVoted && result.room) {
        gameStore.endGame(room.code);
        const voteResults = gameStore.getVoteResults(result.room);
        if (voteResults) {
          io.to(room.code).emit('game:results', voteResults);
        }
        io.to(room.code).emit('room:state-changed', gameStore.toPublicRoom(result.room));
        console.log(`Voting complete in room: ${room.code}`);
      }

      callback({ success: true });
    });

    socket.on('game:play-again', () => {
      const room = gameStore.getRoomByPlayerId(socket.id);
      if (!room) return;

      const result = gameStore.resetToLobby(room.code, socket.id);

      if (result.success && result.room) {
        io.to(room.code).emit('room:state-changed', gameStore.toPublicRoom(result.room));
        console.log(`Room ${room.code} reset to lobby`);
      }
    });

    socket.on('disconnect', () => {
      const room = gameStore.getRoomByPlayerId(socket.id);
      if (room) {
        const { room: updatedRoom } = gameStore.removePlayer(socket.id);

        if (updatedRoom) {
          io.to(room.code).emit('room:player-left', socket.id);
          io.to(room.code).emit('room:state-changed', gameStore.toPublicRoom(updatedRoom));
        }

        console.log(`Player disconnected from room: ${room.code}`);
      }

      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
