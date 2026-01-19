import { Player, RoomPublic, GamePublic, VoteResults } from './room';

export interface CreateRoomData {
  nickname: string;
  password?: string;
}

export interface JoinRoomData {
  code: string;
  nickname: string;
  password?: string;
}

export interface CreateRoomResponse {
  success: boolean;
  code?: string;
  room?: RoomPublic;
  error?: string;
}

export interface JoinRoomResponse {
  success: boolean;
  room?: RoomPublic;
  error?: string;
}

export interface StartGameData {
  roundDuration?: number; // seconds, default 480 (8 minutes)
}

export interface StartGameResponse {
  success: boolean;
  error?: string;
}

export interface VoteData {
  targetId: string;
}

export interface VoteResponse {
  success: boolean;
  error?: string;
}

export interface ServerToClientEvents {
  'room:player-joined': (player: Player) => void;
  'room:player-left': (playerId: string) => void;
  'room:state-changed': (room: RoomPublic) => void;
  'game:started': (game: GamePublic) => void;
  'game:vote-cast': (playerId: string) => void;
  'game:voting-started': () => void;
  'game:results': (results: VoteResults) => void;
}

export interface ClientToServerEvents {
  'room:create': (data: CreateRoomData, callback: (response: CreateRoomResponse) => void) => void;
  'room:join': (data: JoinRoomData, callback: (response: JoinRoomResponse) => void) => void;
  'room:leave': () => void;
  'game:start': (data: StartGameData, callback: (response: StartGameResponse) => void) => void;
  'game:start-voting': () => void;
  'game:vote': (data: VoteData, callback: (response: VoteResponse) => void) => void;
  'game:play-again': () => void;
}
