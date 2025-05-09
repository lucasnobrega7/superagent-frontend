# Superagent LiteralAI Integration

This project demonstrates the integration of [LiteralAI](https://www.literalai.io/) with a Superagent-based chat interface, providing conversation tracking and analytics.

## Features

- Real-time message tracking with LiteralAI
- Chat interface with simulated responses
- Analytics dashboard for conversation monitoring
- Demo mode that works without API keys

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
# or
yarn install
```

### Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```
NEXT_PUBLIC_LITERALAI_API_KEY=your_literalai_api_key
NEXT_PUBLIC_LITERALAI_PROJECT=your_literalai_project
```

Note: If these variables are not provided, the application will run in demo mode with simulated responses.

### Running the Development Server

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Usage

1. Navigate to the chat interface at `/chat` to start a conversation
2. Send messages and receive simulated responses
3. Visit the tracking dashboard at `/dashboard/tracking` to view analytics

## Implementation Details

### Components

- **ChatMonitoring**: Monitors chat messages and tracks them with LiteralAI
- **AgentChatInterface**: The chat UI component
- **TrackingDashboard**: Dashboard for viewing conversation analytics

### LiteralAI Integration

The project uses a custom fetch-based implementation of the LiteralAI client to avoid compatibility issues with Next.js. The implementation includes:

- Thread creation for each conversation
- Step tracking for user and AI messages
- Metadata capture for analytics
- Demo mode for testing without API keys

## License

MIT