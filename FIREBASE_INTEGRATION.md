# Firebase + Superagent Integration

This project integrates Firebase Cloud Functions with the Superagent API to provide a secure and scalable backend for agent management. The integration provides a layer of authentication, data persistence, and improved security for your Superagent agents.

## Overview

The Firebase + Superagent integration provides:

1. **Authentication & Authorization**: Authenticate users with Firebase Authentication and authorize access to agents
2. **Data Persistence**: Store agent metadata and user associations in Firestore
3. **Proxy API**: Securely proxy requests to Superagent API with proper error handling
4. **Knowledge Management**: Upload and manage knowledge sources for agents
5. **LLM Configuration**: Configure and manage LLM models
6. **Tool Integration**: Set up tools for agents to use

## Architecture

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│             │    │             │    │             │
│  Next.js    │───▶│  Firebase   │───▶│ Superagent  │
│  Frontend   │    │  Functions  │    │    API      │
│             │    │             │    │             │
└─────────────┘    └─────────────┘    └─────────────┘
       │                  │                  │
       │                  ▼                  │
       │           ┌─────────────┐           │
       │           │             │           │
       └──────────▶│  Firestore  │◀──────────┘
                   │  Database   │
                   │             │
                   └─────────────┘
```

## Firebase Functions

The following Firebase Functions are implemented:

### Agent Management
- `listAgents`: List all agents accessible to the user
- `getAgent`: Get agent details
- `createAgent`: Create a new agent
- `updateAgent`: Update an existing agent
- `deleteAgent`: Delete an agent
- `invokeAgent`: Send a message to an agent

### Knowledge Management
- `listDatasources`: List all knowledge sources
- `createDatasource`: Create a new knowledge source (text, URL)
- `uploadFileDatasource`: Upload a file as a knowledge source (PDF, CSV, TXT)

### LLM Management
- `listLLMs`: List available LLM models
- `createLLM`: Create a new LLM configuration

### Tool Management
- `listTools`: List available tools
- `createTool`: Create a new tool

## Setting Up

1. **Configure Environment Variables**:
   - Copy `.env.development` to `.env.local`
   - Fill in your Firebase configuration details
   - Add your Superagent API key

2. **Install Dependencies**:
   ```bash
   npm install
   cd functions
   npm install
   cd ..
   ```

3. **Start Development Servers**:
   ```bash
   # Start Firebase emulators
   npm run functions:serve
   
   # In a separate terminal, start Next.js
   npm run dev
   ```

4. **Access the Integration**:
   - Open `http://localhost:3000/dashboard/superagent`
   - Click "Show Firebase" button to display the integration UI

## Using the Integration

### Creating an Agent

1. Navigate to the Superagent Manager component
2. Fill in the agent details (name, description, etc.)
3. Select an LLM model
4. Click "Create Agent"
5. The agent will be created in Superagent and its reference stored in Firestore

### Adding Knowledge

1. Select an agent
2. Navigate to the "Upload Knowledge" section
3. Select a file (PDF, CSV, TXT)
4. Enter a name and description
5. Click "Upload File"
6. The knowledge will be added to Superagent and associated with the agent

### Chatting with an Agent

1. Select an agent from the list
2. Enter a message in the chat input
3. Click "Send"
4. The message will be sent to the agent via Firebase Functions

## Security Considerations

- API keys are stored securely in Firebase Environment Variables, never exposed to clients
- All requests are authenticated through Firebase Authentication
- Authorization checks ensure users can only access their own agents
- File uploads are validated and securely handled

## Extending the Integration

To add new functions:

1. Implement the function in `functions/src/superagent.ts`
2. Export it in `functions/src/index.ts`
3. Add the client method in `app/lib/firebase-functions-client.ts`
4. Add UI components in `components/superagent/SuperagentManager.tsx`