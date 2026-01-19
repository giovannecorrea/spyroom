export type RoomState = 'lobby' | 'playing' | 'voting' | 'results';

export interface Player {
  id: string;
  nickname: string;
  isHost: boolean;
  isConnected: boolean;
}

export interface PlayerGameState {
  id: string;
  nickname: string;
  isHost: boolean;
  isConnected: boolean;
  hasVoted: boolean;
  votedFor?: string;
}

export interface GameData {
  spyId: string;
  location: string;
  roundDuration: number;
  roundStartedAt: number;
  votes: Map<string, string>; // voterId -> votedForId
}

export interface Room {
  code: string;
  password?: string;
  hostId: string;
  players: Map<string, Player>;
  state: RoomState;
  createdAt: Date;
  gameData?: GameData;
}

export interface RoomPublic {
  code: string;
  hasPassword: boolean;
  players: Player[];
  state: RoomState;
  hostId: string;
}

export interface GamePublic {
  location: string | null; // null for spy
  isSpy: boolean;
  roundDuration: number;
  roundStartedAt: number;
  players: PlayerGameState[];
}

export interface VoteResults {
  votes: { voterId: string; votedFor: string; voterName: string; votedForName: string }[];
  spyId: string;
  spyName: string;
  spyCaught: boolean;
  location: string;
}
