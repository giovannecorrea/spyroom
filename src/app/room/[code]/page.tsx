"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useSocket } from "@/hooks/useSocket";
import { getSocket } from "@/lib/socket";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Locale } from "@/i18n/config";

function Timer({ startedAt, duration }: { startedAt: number; duration: number }) {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    const updateTimer = () => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      const remaining = Math.max(0, duration - elapsed);
      setTimeLeft(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [startedAt, duration]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="text-4xl font-mono font-bold text-white">
      {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
    </div>
  );
}

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const {
    isConnected,
    room,
    game,
    results,
    error,
    leaveRoom,
    startGame,
    startVoting,
    castVote,
    playAgain,
  } = useSocket();

  const [selectedVote, setSelectedVote] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const socketId = getSocket().id;
  const isHost = room?.hostId === socketId;

  useEffect(() => {
    if (!room && isConnected) {
      router.push("/");
    }
  }, [room, isConnected, router]);

  useEffect(() => {
    // Reset voting state when game changes
    setSelectedVote(null);
    setHasVoted(false);
  }, [game?.isSpy]);

  const handleStartGame = async () => {
    setIsLoading(true);
    try {
      await startGame({ roundDuration: 480 }); // 8 minutes
    } catch {
      // Error handled in hook
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartVoting = () => {
    startVoting();
  };

  const handleVote = async () => {
    if (!selectedVote) return;
    setIsLoading(true);
    try {
      await castVote({ targetId: selectedVote });
      setHasVoted(true);
    } catch {
      // Error handled in hook
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayAgain = () => {
    playAgain();
  };

  // Helper function to translate location names
  const translateLocation = (location: string) => {
    return t(`locations.${location}` as Parameters<typeof t>[0]);
  };

  if (!room) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 flex flex-col items-center justify-center p-4">
        <div className="text-white text-xl">{t('room.loadingRoom')}</div>
      </main>
    );
  }

  // RESULTS STATE
  if (room.state === "results" && results) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 flex flex-col items-center p-4">
        <div className="w-full max-w-md mt-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-4">
              {results.spyCaught ? t('results.playersWin') : t('results.spyWins')}
            </h1>
            <div
              className={`text-6xl mb-4 ${results.spyCaught ? "text-green-500" : "text-red-500"}`}
            >
              {results.spyCaught ? "🎉" : "🕵️"}
            </div>
          </div>

          <div className="bg-gray-800/50 rounded-xl p-6 mb-6">
            <div className="text-center mb-4">
              <p className="text-gray-400 text-sm">{t('results.theSpyWas')}</p>
              <p className="text-2xl font-bold text-red-500">{results.spyName}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-sm">{t('results.theLocationWas')}</p>
              <p className="text-2xl font-bold text-white">{translateLocation(results.location)}</p>
            </div>
          </div>

          <div className="bg-gray-800/50 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">{t('results.votes')}</h3>
            <ul className="space-y-2">
              {results.votes.map((vote) => (
                <li
                  key={vote.voterId}
                  className="flex justify-between text-sm text-gray-300"
                >
                  <span>{vote.voterName}</span>
                  <span className="text-gray-500">{t('results.votedFor')}</span>
                  <span
                    className={vote.votedFor === results.spyId ? "text-green-400" : ""}
                  >
                    {vote.votedForName}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {isHost && (
            <button
              onClick={handlePlayAgain}
              className="w-full py-4 px-6 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors text-lg mb-4"
            >
              {t('results.playAgain')}
            </button>
          )}

          <button
            onClick={leaveRoom}
            className="w-full py-3 px-6 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
          >
            {t('results.leaveRoom')}
          </button>
        </div>
      </main>
    );
  }

  // VOTING STATE
  if (room.state === "voting" && game) {
    const otherPlayers = game.players.filter((p) => p.id !== socketId);

    return (
      <main className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 flex flex-col items-center p-4">
        <div className="w-full max-w-md mt-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">{t('voting.title')}</h1>
            <p className="text-gray-400">{t('voting.subtitle')}</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-200 text-sm text-center">
              {error}
            </div>
          )}

          {hasVoted ? (
            <div className="bg-gray-800/50 rounded-xl p-6 mb-6 text-center">
              <div className="text-4xl mb-4">✓</div>
              <p className="text-white text-lg">{t('voting.voteSubmitted')}</p>
              <p className="text-gray-400 mt-2">
                {t('voting.waitingForOthers', {
                  current: game.players.filter((p) => p.hasVoted).length,
                  total: game.players.length
                })}
              </p>
            </div>
          ) : (
            <>
              <div className="bg-gray-800/50 rounded-xl p-6 mb-6">
                <ul className="space-y-2">
                  {otherPlayers.map((player) => (
                    <li key={player.id}>
                      <button
                        onClick={() => setSelectedVote(player.id)}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                          selectedVote === player.id
                            ? "bg-red-600 text-white"
                            : "bg-gray-700/50 text-gray-300 hover:bg-gray-700"
                        }`}
                      >
                        <span className="font-medium">{player.nickname}</span>
                        {player.hasVoted && (
                          <span className="text-xs bg-gray-600 px-2 py-1 rounded">
                            {t('voting.voted')}
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={handleVote}
                disabled={!selectedVote || isLoading}
                className="w-full py-4 px-6 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? t('voting.submitting') : t('voting.submitVote')}
              </button>
            </>
          )}
        </div>
      </main>
    );
  }

  // PLAYING STATE
  if (room.state === "playing" && game) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 flex flex-col items-center p-4">
        <div className="w-full max-w-md mt-8">
          {/* Timer */}
          <div className="text-center mb-8">
            <Timer startedAt={game.roundStartedAt} duration={game.roundDuration} />
            <p className="text-gray-400 text-sm mt-2">{t('game.timeRemaining')}</p>
          </div>

          {/* Role Reveal */}
          <div
            className={`rounded-xl p-8 mb-6 text-center ${
              game.isSpy
                ? "bg-gradient-to-br from-red-900/50 to-red-800/30 border border-red-700"
                : "bg-gradient-to-br from-blue-900/50 to-blue-800/30 border border-blue-700"
            }`}
          >
            {game.isSpy ? (
              <>
                <div className="text-6xl mb-4">🕵️</div>
                <h2 className="text-2xl font-bold text-red-400 mb-2">{t('game.youAreTheSpy')}</h2>
                <p className="text-gray-300">
                  {t('game.spyInstructions')}
                </p>
              </>
            ) : (
              <>
                <div className="text-6xl mb-4">📍</div>
                <p className="text-gray-400 text-sm mb-1">{t('game.theLocationIs')}</p>
                <h2 className="text-3xl font-bold text-white">{translateLocation(game.location!)}</h2>
                <p className="text-gray-300 mt-4">{t('game.findTheSpy')}</p>
              </>
            )}
          </div>

          {/* Players */}
          <div className="bg-gray-800/50 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">
              {t('game.players')} ({game.players.length})
            </h3>
            <ul className="space-y-2">
              {game.players.map((player) => (
                <li
                  key={player.id}
                  className="flex items-center justify-between bg-gray-700/50 rounded-lg px-4 py-2"
                >
                  <span className="text-white">{player.nickname}</span>
                  {player.isHost && (
                    <span className="text-xs bg-red-600 text-white px-2 py-1 rounded">
                      {t('lobby.host')}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Start Voting Button (Host only) */}
          {isHost && (
            <button
              onClick={handleStartVoting}
              className="w-full py-4 px-6 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold rounded-lg transition-colors text-lg mb-4"
            >
              {t('game.startVoting')}
            </button>
          )}

          <button
            onClick={leaveRoom}
            className="w-full py-3 px-6 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
          >
            {t('game.leaveRoom')}
          </button>
        </div>
      </main>
    );
  }

  // LOBBY STATE (default)
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 flex flex-col items-center p-4">
      {/* Connection Status & Language Switcher */}
      <div className="absolute top-4 right-4 flex items-center gap-3">
        <LanguageSwitcher currentLocale={locale} />
        <div
          className={`w-3 h-3 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`}
          title={isConnected ? t('common.connected') : t('common.disconnected')}
        />
      </div>

      {/* Header */}
      <div className="w-full max-w-md mt-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Spy<span className="text-red-500">Room</span>
          </h1>
          <div className="flex items-center justify-center gap-2">
            <span className="text-gray-400">{t('lobby.roomCode')}</span>
            <span className="text-2xl font-mono font-bold text-white tracking-widest bg-gray-800 px-4 py-2 rounded-lg">
              {code}
            </span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-200 text-sm text-center">
            {error}
          </div>
        )}

        {/* Players List */}
        <div className="bg-gray-800/50 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            {t('lobby.players')} ({room.players.length})
          </h2>
          <ul className="space-y-2">
            {room.players.map((player) => (
              <li
                key={player.id}
                className="flex items-center justify-between bg-gray-700/50 rounded-lg px-4 py-3"
              >
                <span className="text-white font-medium">{player.nickname}</span>
                {player.isHost && (
                  <span className="text-xs bg-red-600 text-white px-2 py-1 rounded">
                    {t('lobby.host')}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Waiting / Start Game */}
        {room.players.length < 3 ? (
          <div className="text-center text-gray-400 mb-6">
            {t('lobby.needMorePlayers', { count: room.players.length })}
          </div>
        ) : isHost ? (
          <button
            onClick={handleStartGame}
            disabled={isLoading || !isConnected}
            className="w-full py-4 px-6 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors text-lg shadow-lg shadow-red-900/30 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
          >
            {isLoading ? t('lobby.starting') : t('lobby.startGame')}
          </button>
        ) : (
          <div className="text-center text-gray-400 mb-6">
            {t('lobby.waitingForHost')}
          </div>
        )}

        {/* Leave Button */}
        <button
          onClick={leaveRoom}
          className="w-full py-3 px-6 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
        >
          {t('lobby.leaveRoom')}
        </button>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-4 text-gray-600 text-sm">
        {t('lobby.footer')}
      </footer>
    </main>
  );
}
