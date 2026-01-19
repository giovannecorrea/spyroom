"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSocket } from "@/hooks/useSocket";

export default function Home() {
  const router = useRouter();
  const { isConnected, error, setError, createRoom, joinRoom } = useSocket();

  const [joinCode, setJoinCode] = useState("");
  const [nickname, setNickname] = useState("");
  const [roomPassword, setRoomPassword] = useState("");
  const [joinPassword, setJoinPassword] = useState("");
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const code = await createRoom({
        nickname: nickname.trim(),
        password: roomPassword || undefined,
      });
      router.push(`/room/${code}`);
    } catch {
      // Error is already set in useSocket
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await joinRoom({
        code: joinCode.toUpperCase(),
        nickname: nickname.trim(),
        password: joinPassword || undefined,
      });
      router.push(`/room/${joinCode.toUpperCase()}`);
    } catch {
      // Error is already set in useSocket
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 flex flex-col items-center justify-center p-4">
      {/* Connection Status */}
      <div className="absolute top-4 right-4">
        <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
             title={isConnected ? 'Connected' : 'Disconnected'} />
      </div>

      {/* Logo/Title */}
      <div className="text-center mb-12">
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-2 tracking-tight">
          Spy<span className="text-red-500">Room</span>
        </h1>
        <p className="text-gray-400 text-lg">Find the spy among you</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="w-full max-w-xs mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-200 text-sm text-center">
          {error}
        </div>
      )}

      {/* Main Actions */}
      {!showJoinForm && !showCreateForm && (
        <div className="flex flex-col gap-4 w-full max-w-xs">
          <button
            onClick={() => setShowCreateForm(true)}
            className="w-full py-4 px-6 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors text-lg shadow-lg shadow-red-900/30"
          >
            Create Room
          </button>
          <button
            onClick={() => setShowJoinForm(true)}
            className="w-full py-4 px-6 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors text-lg"
          >
            Join Room
          </button>
        </div>
      )}

      {/* Create Room Form */}
      {showCreateForm && (
        <form onSubmit={handleCreateRoom} className="w-full max-w-xs space-y-4">
          <h2 className="text-2xl font-bold text-white text-center mb-6">Create Room</h2>

          <div>
            <label htmlFor="create-nickname" className="block text-sm font-medium text-gray-300 mb-1">
              Your Nickname
            </label>
            <input
              id="create-nickname"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Enter your nickname"
              required
              maxLength={20}
              disabled={isLoading}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:opacity-50"
            />
          </div>

          <div>
            <label htmlFor="room-password" className="block text-sm font-medium text-gray-300 mb-1">
              Room Password <span className="text-gray-500">(optional)</span>
            </label>
            <input
              id="room-password"
              type="password"
              value={roomPassword}
              onChange={(e) => setRoomPassword(e.target.value)}
              placeholder="Enter room password"
              maxLength={50}
              disabled={isLoading}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !isConnected}
            className="w-full py-4 px-6 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors text-lg shadow-lg shadow-red-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creating...' : 'Create'}
          </button>

          <button
            type="button"
            onClick={() => {
              setShowCreateForm(false);
              setNickname("");
              setRoomPassword("");
              setError(null);
            }}
            disabled={isLoading}
            className="w-full py-3 px-6 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          >
            Back
          </button>
        </form>
      )}

      {/* Join Room Form */}
      {showJoinForm && (
        <form onSubmit={handleJoinRoom} className="w-full max-w-xs space-y-4">
          <h2 className="text-2xl font-bold text-white text-center mb-6">Join Room</h2>

          <div>
            <label htmlFor="room-code" className="block text-sm font-medium text-gray-300 mb-1">
              Room Code
            </label>
            <input
              id="room-code"
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="Enter room code"
              required
              maxLength={6}
              disabled={isLoading}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-center text-2xl tracking-widest font-mono disabled:opacity-50"
            />
          </div>

          <div>
            <label htmlFor="join-nickname" className="block text-sm font-medium text-gray-300 mb-1">
              Your Nickname
            </label>
            <input
              id="join-nickname"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Enter your nickname"
              required
              maxLength={20}
              disabled={isLoading}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:opacity-50"
            />
          </div>

          <div>
            <label htmlFor="join-password" className="block text-sm font-medium text-gray-300 mb-1">
              Password <span className="text-gray-500">(if required)</span>
            </label>
            <input
              id="join-password"
              type="password"
              value={joinPassword}
              onChange={(e) => setJoinPassword(e.target.value)}
              placeholder="Enter room password"
              maxLength={50}
              disabled={isLoading}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !isConnected}
            className="w-full py-4 px-6 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors text-lg shadow-lg shadow-red-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Joining...' : 'Join'}
          </button>

          <button
            type="button"
            onClick={() => {
              setShowJoinForm(false);
              setJoinCode("");
              setNickname("");
              setJoinPassword("");
              setError(null);
            }}
            disabled={isLoading}
            className="w-full py-3 px-6 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          >
            Back
          </button>
        </form>
      )}

      {/* Footer */}
      <footer className="absolute bottom-4 text-gray-600 text-sm">
        Play with friends in person or on Discord
      </footer>
    </main>
  );
}
