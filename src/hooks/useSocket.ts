'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  getSocket,
  connectSocket,
  disconnectSocket,
  getCurrentRoom,
  setCurrentRoom,
  subscribeToRoom,
  getCurrentGame,
  setCurrentGame,
  subscribeToGame,
  getCurrentResults,
  setCurrentResults,
  subscribeToResults,
  resetGameState,
} from '@/lib/socket';
import { Player, RoomPublic, GamePublic, VoteResults } from '@/types/room';
import { CreateRoomData, JoinRoomData, StartGameData, VoteData } from '@/types/events';

export function useSocket() {
  const router = useRouter();
  const [isConnected, setIsConnected] = useState(() => getSocket().connected);
  const [room, setRoomState] = useState<RoomPublic | null>(() => getCurrentRoom());
  const [game, setGameState] = useState<GamePublic | null>(() => getCurrentGame());
  const [results, setResultsState] = useState<VoteResults | null>(() => getCurrentResults());
  const [error, setError] = useState<string | null>(null);

  const setRoom = useCallback((room: RoomPublic | null) => {
    setCurrentRoom(room);
    setRoomState(room);
  }, []);

  useEffect(() => {
    const socket = connectSocket();

    function onConnect() {
      setIsConnected(true);
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    function onPlayerJoined(player: Player) {
      const current = getCurrentRoom();
      if (!current) return;
      const updated = {
        ...current,
        players: [...current.players, player],
      };
      setCurrentRoom(updated);
    }

    function onPlayerLeft(playerId: string) {
      const current = getCurrentRoom();
      if (!current) return;
      const updated = {
        ...current,
        players: current.players.filter((p) => p.id !== playerId),
      };
      setCurrentRoom(updated);
    }

    function onStateChanged(updatedRoom: RoomPublic) {
      setCurrentRoom(updatedRoom);
      // Reset game state when returning to lobby
      if (updatedRoom.state === 'lobby') {
        resetGameState();
      }
    }

    function onGameStarted(gameData: GamePublic) {
      setCurrentGame(gameData);
      setCurrentResults(null);
    }

    function onVoteCast(playerId: string) {
      const current = getCurrentGame();
      if (!current) return;
      const updated = {
        ...current,
        players: current.players.map((p) =>
          p.id === playerId ? { ...p, hasVoted: true } : p
        ),
      };
      setCurrentGame(updated);
    }

    function onVotingStarted() {
      // Room state change will be handled by onStateChanged
    }

    function onResults(voteResults: VoteResults) {
      setCurrentResults(voteResults);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('room:player-joined', onPlayerJoined);
    socket.on('room:player-left', onPlayerLeft);
    socket.on('room:state-changed', onStateChanged);
    socket.on('game:started', onGameStarted);
    socket.on('game:vote-cast', onVoteCast);
    socket.on('game:voting-started', onVotingStarted);
    socket.on('game:results', onResults);

    const unsubRoom = subscribeToRoom(setRoomState);
    const unsubGame = subscribeToGame(setGameState);
    const unsubResults = subscribeToResults(setResultsState);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('room:player-joined', onPlayerJoined);
      socket.off('room:player-left', onPlayerLeft);
      socket.off('room:state-changed', onStateChanged);
      socket.off('game:started', onGameStarted);
      socket.off('game:vote-cast', onVoteCast);
      socket.off('game:voting-started', onVotingStarted);
      socket.off('game:results', onResults);
      unsubRoom();
      unsubGame();
      unsubResults();
    };
  }, []);

  const createRoom = useCallback((data: CreateRoomData): Promise<string> => {
    return new Promise((resolve, reject) => {
      const socket = getSocket();
      setError(null);

      socket.emit('room:create', data, (response) => {
        if (response.success && response.code && response.room) {
          setCurrentRoom(response.room);
          resolve(response.code);
        } else {
          setError(response.error || 'Failed to create room');
          reject(new Error(response.error || 'Failed to create room'));
        }
      });
    });
  }, []);

  const joinRoom = useCallback((data: JoinRoomData): Promise<RoomPublic> => {
    return new Promise((resolve, reject) => {
      const socket = getSocket();
      setError(null);

      socket.emit('room:join', data, (response) => {
        if (response.success && response.room) {
          setCurrentRoom(response.room);
          resolve(response.room);
        } else {
          setError(response.error || 'Failed to join room');
          reject(new Error(response.error || 'Failed to join room'));
        }
      });
    });
  }, []);

  const leaveRoom = useCallback(() => {
    const socket = getSocket();
    socket.emit('room:leave');
    setCurrentRoom(null);
    resetGameState();
    router.push('/');
  }, [router]);

  const startGame = useCallback((data: StartGameData = {}): Promise<void> => {
    return new Promise((resolve, reject) => {
      const socket = getSocket();
      setError(null);

      socket.emit('game:start', data, (response) => {
        if (response.success) {
          resolve();
        } else {
          setError(response.error || 'Failed to start game');
          reject(new Error(response.error || 'Failed to start game'));
        }
      });
    });
  }, []);

  const startVoting = useCallback(() => {
    const socket = getSocket();
    socket.emit('game:start-voting');
  }, []);

  const castVote = useCallback((data: VoteData): Promise<void> => {
    return new Promise((resolve, reject) => {
      const socket = getSocket();
      setError(null);

      socket.emit('game:vote', data, (response) => {
        if (response.success) {
          resolve();
        } else {
          setError(response.error || 'Failed to cast vote');
          reject(new Error(response.error || 'Failed to cast vote'));
        }
      });
    });
  }, []);

  const playAgain = useCallback(() => {
    const socket = getSocket();
    socket.emit('game:play-again');
  }, []);

  return {
    isConnected,
    room,
    setRoom,
    game,
    results,
    error,
    setError,
    createRoom,
    joinRoom,
    leaveRoom,
    startGame,
    startVoting,
    castVote,
    playAgain,
    disconnect: disconnectSocket,
  };
}
