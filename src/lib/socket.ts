import { io, Socket } from 'socket.io-client';
import { ClientToServerEvents, ServerToClientEvents } from '@/types/events';
import { RoomPublic, GamePublic, VoteResults } from '@/types/room';

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: TypedSocket | null = null;
let currentRoom: RoomPublic | null = null;
let currentGame: GamePublic | null = null;
let currentResults: VoteResults | null = null;

const roomListeners: Set<(room: RoomPublic | null) => void> = new Set();
const gameListeners: Set<(game: GamePublic | null) => void> = new Set();
const resultsListeners: Set<(results: VoteResults | null) => void> = new Set();

export function getSocket(): TypedSocket {
  if (!socket) {
    socket = io({
      autoConnect: false,
    });
  }
  return socket;
}

export function connectSocket(): TypedSocket {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
  }
  return s;
}

export function disconnectSocket(): void {
  if (socket?.connected) {
    socket.disconnect();
  }
}

export function getCurrentRoom(): RoomPublic | null {
  return currentRoom;
}

export function setCurrentRoom(room: RoomPublic | null): void {
  currentRoom = room;
  roomListeners.forEach((listener) => listener(room));
}

export function subscribeToRoom(listener: (room: RoomPublic | null) => void): () => void {
  roomListeners.add(listener);
  return () => roomListeners.delete(listener);
}

export function getCurrentGame(): GamePublic | null {
  return currentGame;
}

export function setCurrentGame(game: GamePublic | null): void {
  currentGame = game;
  gameListeners.forEach((listener) => listener(game));
}

export function subscribeToGame(listener: (game: GamePublic | null) => void): () => void {
  gameListeners.add(listener);
  return () => gameListeners.delete(listener);
}

export function getCurrentResults(): VoteResults | null {
  return currentResults;
}

export function setCurrentResults(results: VoteResults | null): void {
  currentResults = results;
  resultsListeners.forEach((listener) => listener(results));
}

export function subscribeToResults(listener: (results: VoteResults | null) => void): () => void {
  resultsListeners.add(listener);
  return () => resultsListeners.delete(listener);
}

export function resetGameState(): void {
  currentGame = null;
  currentResults = null;
  gameListeners.forEach((listener) => listener(null));
  resultsListeners.forEach((listener) => listener(null));
}
