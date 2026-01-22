"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useSocket } from "@/hooks/useSocket";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Locale } from "@/i18n/config";

export default function Home() {
  const router = useRouter();
  const { isConnected, error, setError, createRoom, joinRoom } = useSocket();
  const t = useTranslations();
  const locale = useLocale() as Locale;

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
      {/* Connection Status & Language Switcher */}
      <div className="absolute top-4 right-4 flex items-center gap-3">
        <LanguageSwitcher currentLocale={locale} />
        <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
             title={isConnected ? t('common.connected') : t('common.disconnected')} />
      </div>

      {/* Logo/Title */}
      <div className="text-center mb-12">
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-2 tracking-tight">
          Spy<span className="text-red-500">Room</span>
        </h1>
        <p className="text-gray-400 text-lg">{t('home.subtitle')}</p>
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
            {t('home.createRoom')}
          </button>
          <button
            onClick={() => setShowJoinForm(true)}
            className="w-full py-4 px-6 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors text-lg"
          >
            {t('home.joinRoom')}
          </button>
        </div>
      )}

      {/* Create Room Form */}
      {showCreateForm && (
        <form onSubmit={handleCreateRoom} className="w-full max-w-xs space-y-4">
          <h2 className="text-2xl font-bold text-white text-center mb-6">{t('createRoom.title')}</h2>

          <div>
            <label htmlFor="create-nickname" className="block text-sm font-medium text-gray-300 mb-1">
              {t('createRoom.nickname')}
            </label>
            <input
              id="create-nickname"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder={t('createRoom.nicknamePlaceholder')}
              required
              maxLength={20}
              disabled={isLoading}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:opacity-50"
            />
          </div>

          <div>
            <label htmlFor="room-password" className="block text-sm font-medium text-gray-300 mb-1">
              {t('createRoom.password')} <span className="text-gray-500">({t('common.optional')})</span>
            </label>
            <input
              id="room-password"
              type="password"
              value={roomPassword}
              onChange={(e) => setRoomPassword(e.target.value)}
              placeholder={t('createRoom.passwordPlaceholder')}
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
            {isLoading ? t('createRoom.creating') : t('createRoom.create')}
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
            {t('common.back')}
          </button>
        </form>
      )}

      {/* Join Room Form */}
      {showJoinForm && (
        <form onSubmit={handleJoinRoom} className="w-full max-w-xs space-y-4">
          <h2 className="text-2xl font-bold text-white text-center mb-6">{t('joinRoom.title')}</h2>

          <div>
            <label htmlFor="room-code" className="block text-sm font-medium text-gray-300 mb-1">
              {t('joinRoom.roomCode')}
            </label>
            <input
              id="room-code"
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder={t('joinRoom.roomCodePlaceholder')}
              required
              maxLength={6}
              disabled={isLoading}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-center text-2xl tracking-widest font-mono disabled:opacity-50"
            />
          </div>

          <div>
            <label htmlFor="join-nickname" className="block text-sm font-medium text-gray-300 mb-1">
              {t('joinRoom.nickname')}
            </label>
            <input
              id="join-nickname"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder={t('joinRoom.nicknamePlaceholder')}
              required
              maxLength={20}
              disabled={isLoading}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:opacity-50"
            />
          </div>

          <div>
            <label htmlFor="join-password" className="block text-sm font-medium text-gray-300 mb-1">
              {t('joinRoom.password')} <span className="text-gray-500">({t('joinRoom.passwordHint')})</span>
            </label>
            <input
              id="join-password"
              type="password"
              value={joinPassword}
              onChange={(e) => setJoinPassword(e.target.value)}
              placeholder={t('joinRoom.passwordPlaceholder')}
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
            {isLoading ? t('joinRoom.joining') : t('joinRoom.join')}
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
            {t('common.back')}
          </button>
        </form>
      )}

      {/* Footer */}
      <footer className="absolute bottom-4 text-gray-600 text-sm">
        {t('home.footer')}
      </footer>
    </main>
  );
}
