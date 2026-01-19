import { Room, Player, RoomPublic, GamePublic, PlayerGameState, VoteResults } from '../types/room';
import { generateRoomCode } from './utils/roomCode';
import { getRandomLocation } from './data/locations';

class GameStore {
  private rooms: Map<string, Room> = new Map();
  private playerToRoom: Map<string, string> = new Map();

  createRoom(hostId: string, hostNickname: string, password?: string): Room {
    let code: string;
    do {
      code = generateRoomCode();
    } while (this.rooms.has(code));

    const host: Player = {
      id: hostId,
      nickname: hostNickname,
      isHost: true,
      isConnected: true,
    };

    const room: Room = {
      code,
      password: password || undefined,
      hostId,
      players: new Map([[hostId, host]]),
      state: 'lobby',
      createdAt: new Date(),
    };

    this.rooms.set(code, room);
    this.playerToRoom.set(hostId, code);

    return room;
  }

  getRoom(code: string): Room | undefined {
    return this.rooms.get(code);
  }

  getRoomByPlayerId(playerId: string): Room | undefined {
    const code = this.playerToRoom.get(playerId);
    if (!code) return undefined;
    return this.rooms.get(code);
  }

  joinRoom(code: string, playerId: string, nickname: string, password?: string): { success: boolean; error?: string; room?: Room } {
    const room = this.rooms.get(code);

    if (!room) {
      return { success: false, error: 'Room not found' };
    }

    if (room.password && room.password !== password) {
      return { success: false, error: 'Invalid password' };
    }

    if (room.state !== 'lobby') {
      return { success: false, error: 'Game already in progress' };
    }

    if (room.players.has(playerId)) {
      return { success: false, error: 'Already in room' };
    }

    const existingNicknames = Array.from(room.players.values()).map(p => p.nickname.toLowerCase());
    if (existingNicknames.includes(nickname.toLowerCase())) {
      return { success: false, error: 'Nickname already taken' };
    }

    const player: Player = {
      id: playerId,
      nickname,
      isHost: false,
      isConnected: true,
    };

    room.players.set(playerId, player);
    this.playerToRoom.set(playerId, code);

    return { success: true, room };
  }

  removePlayer(playerId: string): { room?: Room; wasHost: boolean } {
    const code = this.playerToRoom.get(playerId);
    if (!code) return { wasHost: false };

    const room = this.rooms.get(code);
    if (!room) return { wasHost: false };

    const player = room.players.get(playerId);
    const wasHost = player?.isHost || false;

    room.players.delete(playerId);
    this.playerToRoom.delete(playerId);

    if (room.players.size === 0) {
      this.rooms.delete(code);
      return { wasHost };
    }

    if (wasHost && room.players.size > 0) {
      const newHost = room.players.values().next().value;
      if (newHost) {
        newHost.isHost = true;
        room.hostId = newHost.id;
      }
    }

    return { room, wasHost };
  }

  toPublicRoom(room: Room): RoomPublic {
    return {
      code: room.code,
      hasPassword: !!room.password,
      players: Array.from(room.players.values()),
      state: room.state,
      hostId: room.hostId,
    };
  }

  startGame(code: string, playerId: string, roundDuration: number = 480): { success: boolean; error?: string; room?: Room } {
    const room = this.rooms.get(code);

    if (!room) {
      return { success: false, error: 'Room not found' };
    }

    if (room.hostId !== playerId) {
      return { success: false, error: 'Only the host can start the game' };
    }

    if (room.state !== 'lobby') {
      return { success: false, error: 'Game already in progress' };
    }

    if (room.players.size < 3) {
      return { success: false, error: 'Need at least 3 players to start' };
    }

    const playerIds = Array.from(room.players.keys());
    const spyIndex = Math.floor(Math.random() * playerIds.length);
    const spyId = playerIds[spyIndex];
    const location = getRandomLocation();

    room.gameData = {
      spyId,
      location,
      roundDuration,
      roundStartedAt: Date.now(),
      votes: new Map(),
    };

    room.state = 'playing';

    return { success: true, room };
  }

  getGameStateForPlayer(room: Room, playerId: string): GamePublic | null {
    if (!room.gameData) return null;

    const isSpy = room.gameData.spyId === playerId;
    const players: PlayerGameState[] = Array.from(room.players.values()).map(p => ({
      ...p,
      hasVoted: room.gameData!.votes.has(p.id),
      votedFor: undefined, // Don't reveal who voted for whom until results
    }));

    return {
      location: isSpy ? null : room.gameData.location,
      isSpy,
      roundDuration: room.gameData.roundDuration,
      roundStartedAt: room.gameData.roundStartedAt,
      players,
    };
  }

  startVoting(code: string, playerId: string): { success: boolean; error?: string; room?: Room } {
    const room = this.rooms.get(code);

    if (!room) {
      return { success: false, error: 'Room not found' };
    }

    if (room.hostId !== playerId) {
      return { success: false, error: 'Only the host can start voting' };
    }

    if (room.state !== 'playing') {
      return { success: false, error: 'Game is not in playing state' };
    }

    room.state = 'voting';

    return { success: true, room };
  }

  castVote(code: string, voterId: string, targetId: string): { success: boolean; error?: string; allVoted: boolean; room?: Room } {
    const room = this.rooms.get(code);

    if (!room) {
      return { success: false, error: 'Room not found', allVoted: false };
    }

    if (room.state !== 'voting') {
      return { success: false, error: 'Not in voting phase', allVoted: false };
    }

    if (!room.gameData) {
      return { success: false, error: 'No game data', allVoted: false };
    }

    if (!room.players.has(voterId)) {
      return { success: false, error: 'You are not in this room', allVoted: false };
    }

    if (!room.players.has(targetId)) {
      return { success: false, error: 'Invalid target', allVoted: false };
    }

    if (voterId === targetId) {
      return { success: false, error: 'Cannot vote for yourself', allVoted: false };
    }

    room.gameData.votes.set(voterId, targetId);

    const allVoted = room.gameData.votes.size === room.players.size;

    return { success: true, allVoted, room };
  }

  getVoteResults(room: Room): VoteResults | null {
    if (!room.gameData) return null;

    const votes = Array.from(room.gameData.votes.entries()).map(([oderId, votedFor]) => {
      const voter = room.players.get(oderId);
      const votedForPlayer = room.players.get(votedFor);
      return {
        oderId: oderId,
        votedFor,
        voterName: voter?.nickname || 'Unknown',
        votedForName: votedForPlayer?.nickname || 'Unknown',
      };
    });

    // Count votes for each player
    const voteCounts = new Map<string, number>();
    for (const vote of room.gameData.votes.values()) {
      voteCounts.set(vote, (voteCounts.get(vote) || 0) + 1);
    }

    // Find player with most votes
    let maxVotes = 0;
    let mostVotedId = '';
    for (const [playerId, count] of voteCounts) {
      if (count > maxVotes) {
        maxVotes = count;
        mostVotedId = playerId;
      }
    }

    const spyId = room.gameData.spyId;
    const spy = room.players.get(spyId);
    const spyCaught = mostVotedId === spyId;

    return {
      votes: votes.map(v => ({
        voterId: v.oderId,
        votedFor: v.votedFor,
        voterName: v.voterName,
        votedForName: v.votedForName,
      })),
      spyId,
      spyName: spy?.nickname || 'Unknown',
      spyCaught,
      location: room.gameData.location,
    };
  }

  endGame(code: string): { success: boolean; room?: Room } {
    const room = this.rooms.get(code);

    if (!room) {
      return { success: false };
    }

    room.state = 'results';

    return { success: true, room };
  }

  resetToLobby(code: string, playerId: string): { success: boolean; error?: string; room?: Room } {
    const room = this.rooms.get(code);

    if (!room) {
      return { success: false, error: 'Room not found' };
    }

    if (room.hostId !== playerId) {
      return { success: false, error: 'Only the host can restart' };
    }

    room.state = 'lobby';
    room.gameData = undefined;

    return { success: true, room };
  }
}

export const gameStore = new GameStore();
