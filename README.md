# ChronoGonk 

A cyberpunk-themed Discord bot for managing timezones and tracking availability across a small crew in different times.

## Features

### Timezone Management
- `/timezone set` - Set your timezone
- `/timezone view` - View your timezone
- `/timezone list` - See everyone's local times
- `/timezone clear` - Remove your timezone

### Status & Availability
- `/status set` - Set your status (free/busy/DND) with optional notes and expiration
- `/status view` - Check someone's status
- `/status list` - See everyone's availability with sleep detection
- `/status clear` - Clear your status
- `/afk` - Quick busy status
- `/back` - Clear AFK status

### Smart Features
- `/check @user` - Check if it's a good time to ping someone
- `/overlap` - Find best time when everyone's awake
- Sleep detection (1am-5am local time)
- Conversation-aware late-night warnings

### Activity Tracking
- `/stats activity` - Weekly activity leaderboard with bot commentary
- `/stats today` - Today's activity snapshot

### Reactive Personality
- Automatically responds to solo late-night messagers (1-5am)
- 5% chance to comment on group late-night sessions

## Tech Stack
- Node.js
- Discord.js
- SQLite (better-sqlite3)
- Luxon (timezone handling)

## Setup

1. Clone the repo
2. Run `npm install`
3. Create `.env` file:
```
   DISCORD_TOKEN=your_token_here
   CLIENT_ID=your_client_id_here
   GUILD_ID=your_guild_id_here
```
4. Run `node deploy-commands.js` to register slash commands
5. Run `node index.js` to start the bot


Built for Night City. Stay preem, chooms