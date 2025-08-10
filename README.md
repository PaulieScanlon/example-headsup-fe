# Heads Up Game - Frontend

A React-based frontend for the Mastra-powered Heads Up guessing game. This application provides a clean, interactive chat interface that connects to your Mastra server to play the Heads Up game where users ask yes/no questions to figure out who the famous person is.

![Heads Up Game](https://raw.githubusercontent.com/PaulieScanlon/example-headsup/main/images/heads-up.jpg)

## Features

- 🎮 **Interactive Chat Interface** - Clean, responsive chat UI for gameplay
- 🤖 **Mastra Workflow Integration** - Direct connection to your Mastra server
- 🔄 **Real-time Game State** - Live updates as you play
- 🎯 **Auto-scrolling Chat** - Messages automatically scroll to the latest
- 🏆 **Win Detection** - Automatic detection when you guess correctly
- 🔄 **Play Again** - Reset and start a new game with one click
- 📱 **Responsive Design** - Works on desktop and mobile devices

## How It Works

This frontend connects directly to your Mastra server running the `headsUpWorkflow`. The game flow is:

1. **Game Start**: Automatically starts a new workflow when the page loads
2. **Question Phase**: You ask yes/no questions about the famous person
3. **AI Responses**: The Mastra workflow processes your questions and responds
4. **Guessing**: You can guess the person's name at any time
5. **Game End**: When you guess correctly, the UI shows a win message and "Play Again" button

## Prerequisites

- **Mastra Server**: You need the [Heads Up backend](https://github.com/PaulieScanlon/example-headsup) running locally
- Node.js (v18 or higher)
- npm or pnpm

## Backend Repository

This frontend connects to the [Heads Up Mastra Server](https://github.com/PaulieScanlon/example-headsup) which provides:

- 🤖 AI-powered question answering with context awareness
- 🎯 Intelligent guess verification that handles name variations
- 📊 Game statistics stored in PostgreSQL database
- 🔄 Suspend/resume workflow for interactive gameplay
- 🧠 Persistent agent memory

The backend runs the `headsUpWorkflow` that this frontend communicates with.

## Installation

1. **Clone this repository**

   ```bash
   git clone https://github.com/PaulieScanlon/example-headsup-fe.git
   cd example-headsup-fe
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure Mastra client**

   Update `src/lib/mastra-client.ts` with your Mastra server URL:

   ```typescript
   import { MastraClient } from "@mastra/client-js";

   export const mastraClient = new MastraClient({
     baseUrl: "http://localhost:4111" // Your Mastra server URL
   });
   ```

4. **Start the development server**

   ```bash
   npm run dev
   ```

   The frontend will start on `http://localhost:5173` (or another available port).

## Development

### Project Structure

```
src/
├── App.tsx              # Main game component with chat interface
├── lib/
│   └── mastra-client.ts # Mastra client configuration
├── components/          # UI components (if any)
└── assets/             # Static assets
```

### Key Components

- **App.tsx**: Main game logic, chat interface, and Mastra workflow integration
- **Mastra Client**: Handles communication with your Mastra server
- **Chat Interface**: Displays game messages and handles user input

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Gameplay

1. **Open the application** in your browser
2. **Wait for the game to start** - you'll see the initial question
3. **Ask yes/no questions** about the famous person
4. **Guess the person's name** when you think you know
5. **Click "Play Again"** to start a new game

## Mastra Integration

This frontend demonstrates how to integrate with Mastra workflows:

- **Workflow Creation**: Creates new workflow runs for each game
- **Suspend/Resume**: Handles the workflow's suspend/resume cycle
- **State Management**: Tracks workflow state and displays appropriate messages
- **Error Handling**: Gracefully handles workflow responses

## Environment Setup

Make sure your Mastra server is running with:

```bash
# In your Mastra backend directory
npm run dev
```

The server should be accessible at `http://localhost:4111` (or your configured port).

## Contributing

This is a simple example application. Feel free to:

- Add new UI components
- Improve the chat interface
- Add game statistics
- Enhance the responsive design

## License

This project is part of the Mastra examples collection.
