# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**SpyRoom** is a real-time web game where players try to uncover the spy among them. It's designed for players who are together in person or on Discord - the app serves as a tool for role assignments and round timing.

### Game Concept
- One player creates a room and shares the code with friends
- Players join with their chosen nicknames
- System randomly assigns one player as the spy and reveals a secret location to non-spies
- The spy sees only "You are the spy" (no location)
- Players ask each other questions to identify the spy
- Voting phase determines the winner

### Design Philosophy (Keep It Simple)
- **No authentication/authorization** - players just pick a nickname
- **No database persistence** - data exists only in-memory during the game session
- **Room-based** - create a room with optional password, share code with friends
- **Ephemeral** - game data is discarded after the session ends
- **Companion tool** - players communicate via Discord/in-person, app handles game logic

## Commands

```bash
npm run dev      # Start development server at localhost:3000
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint (uses eslint-config-next with core-web-vitals and TypeScript rules)
```

## Architecture

This is a Next.js 16 project using the App Router with React 19, TypeScript, and Tailwind CSS 4.

### Tech Stack
- **Frontend:** Next.js + TypeScript + Tailwind CSS
- **Real-time:** WebSockets (Socket.IO) for player sync and game events
- **State:** In-memory only (no database)

### Project Structure

- `src/app/` - App Router pages and layouts
  - `layout.tsx` - Root layout
  - `page.tsx` - Home page
  - `globals.css` - Global styles with Tailwind

### Path Aliases

`@/*` maps to `./src/*` (configured in tsconfig.json)

## Core Features (MVP)

1. **Room Management**
   - Create room (optional password)
   - Join room with code + nickname
   - Real-time player list updates

2. **Game Flow**
   - Random spy and location assignment
   - Role reveal (spy sees "You are the spy", others see location)
   - Round timer
   - Voting system
   - Results reveal

3. **Win Conditions**
   - Players win if spy is correctly identified
   - Spy wins if not found
