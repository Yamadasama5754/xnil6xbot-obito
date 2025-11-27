# Goat Bot V2 - Arabic Version

## Overview
This is a Facebook Messenger bot (Goat Bot V2) that has been fully translated to Arabic. The bot uses a personal Facebook account to respond to messages in groups and private chats.

## Recent Changes
- **2025-11-27**: Full Arabic translation implemented
  - Created `languages/ar.lang` - Main system messages in Arabic
  - Created `languages/cmds/ar.js` - All command translations in Arabic
  - Created `languages/events/ar.js` - Event messages in Arabic
  - Updated `config.json` to use Arabic language (`"language": "ar"`)

## Project Architecture

### Directory Structure
```
/
├── bot/                    # Bot core functionality
│   ├── handler/           # Event and action handlers
│   ├── login/             # Login and authentication
│   └── custom.js          # Custom bot features
├── dashboard/             # Web dashboard
│   ├── css/              # Stylesheets
│   ├── js/               # JavaScript files
│   ├── views/            # ETA templates
│   └── routes/           # Express routes
├── database/              # Database management
│   ├── controller/       # Data controllers
│   ├── models/           # Database models
│   └── data/             # SQLite database files
├── languages/             # Language files
│   ├── ar.lang           # Arabic main translations
│   ├── en.lang           # English main translations
│   ├── cmds/             # Command translations
│   │   ├── ar.js        # Arabic command translations
│   │   └── en.js        # English command translations
│   └── events/           # Event translations
│       ├── ar.js        # Arabic event translations
│       └── en.js        # English event translations
├── scripts/               # Bot commands and events
│   ├── cmds/             # Command scripts
│   └── events/           # Event scripts
├── config.json           # Main configuration
├── index.js              # Entry point
└── account.txt           # Facebook cookies
```

### Key Configuration
- **Language**: Arabic (`ar`)
- **Prefix**: `.`
- **Database**: SQLite
- **Dashboard Port**: 3001

### Running the Bot
The bot is configured to run with `node index.js` and will:
1. Login to Facebook using cookies from `account.txt`
2. Connect to SQLite database
3. Load all commands (107 commands)
4. Load all events (6 events)
5. Start the dashboard on port 3001
6. Begin listening for messages

## User Preferences
- Language: Arabic (العربية)
- All system messages, commands, and events are translated to Arabic

## Commands Overview
The bot includes 107+ commands covering:
- Admin management (`admin`, `ban`, `kick`)
- Fun games (`quiz`, `slot`, `dice`, `spin`)
- Utilities (`help`, `uid`, `tid`, `translate`)
- Media downloads (`ytb`, `tik`, `sing`, `dl`)
- Group management (`setwelcome`, `setleave`, `rules`)
- Economy (`balance`, `daily`, `bank`, `top`)
- AI integration (`gpt`, `gemini`)

## Notes
- Bot prefix is `.` (dot)
- To change language back to English, update `config.json` and set `"language": "en"`
- All commands support Arabic descriptions and responses
