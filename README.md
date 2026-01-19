# SpyRoom

A real-time web game where players try to uncover the spy among them. Designed for players who are together in person or on Discord - the app serves as a tool for role assignments and round timing.

## How It Works

1. One player creates a room and shares the code with friends
2. Players join with their chosen nicknames
3. System randomly assigns one player as the spy and reveals a secret location to non-spies
4. The spy sees only "You are the spy" (no location)
5. Players ask each other questions to identify the spy
6. Voting phase determines the winner

### Win Conditions

- **Players win** if the spy is correctly identified
- **Spy wins** if not found

## Design Philosophy

- **No authentication** - players just pick a nickname
- **No database** - data exists only in-memory during the game session
- **Room-based** - create a room with optional password, share code with friends
- **Ephemeral** - game data is discarded after the session ends
- **Companion tool** - players communicate via Discord/in-person, app handles game logic

## Tech Stack

- **Framework:** Next.js 16 (App Router) + React 19 + TypeScript
- **Styling:** Tailwind CSS 4
- **Real-time:** WebSockets (Socket.IO)
- **State:** In-memory only

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Commands

```bash
npm run dev      # Start development server at localhost:3000
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Project Structure

```
src/
  app/           # App Router pages and layouts
    layout.tsx   # Root layout
    page.tsx     # Home page
    globals.css  # Global styles with Tailwind
```

Path alias: `@/*` maps to `./src/*`
