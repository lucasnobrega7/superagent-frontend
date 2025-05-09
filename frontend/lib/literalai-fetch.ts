// literalai-fetch.ts
// Fetch-based implementation of LiteralAI client to avoid Next.js compatibility issues

// Types for LiteralAI
export interface Thread {
  id: string;
  metadata?: Record<string, any>;
}

export interface Step {
  id: string;
  threadId: string;
  type: 'human' | 'ai' | 'tool' | 'system';
  content: string;
  metadata?: Record<string, any>;
}

export interface Config {
  apiKey: string;
  apiUrl?: string;
  project?: string;
}

// Default config
const defaultConfig: Config = {
  apiKey: process.env.NEXT_PUBLIC_LITERALAI_API_KEY || 'demo-key',
  apiUrl: 'https://api.literalai.io',
  project: process.env.NEXT_PUBLIC_LITERALAI_PROJECT || 'default'
};

// LiteralAI client
export class LiteralAIClient {
  private config: Config;

  constructor(config: Partial<Config> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.config.apiKey}`,
    };
  }

  async createThread(metadata?: Record<string, any>): Promise<Thread> {
    try {
      // For demo mode, return a simulated response
      if (this.config.apiKey === 'demo-key') {
        return {
          id: `thread-${Date.now()}`,
          metadata
        };
      }

      const response = await fetch(`${this.config.apiUrl}/v1/threads`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          project: this.config.project,
          metadata
        }),
      });

      if (!response.ok) {
        throw new Error(`Error creating thread: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating thread:', error);
      // Return a mock thread in case of error
      return { id: `thread-error-${Date.now()}`, metadata };
    }
  }

  async createStep(threadId: string, type: Step['type'], content: string, metadata?: Record<string, any>): Promise<Step> {
    try {
      // For demo mode, return a simulated response
      if (this.config.apiKey === 'demo-key') {
        return {
          id: `step-${Date.now()}`,
          threadId,
          type,
          content,
          metadata
        };
      }

      const response = await fetch(`${this.config.apiUrl}/v1/threads/${threadId}/steps`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          type,
          content,
          metadata
        }),
      });

      if (!response.ok) {
        throw new Error(`Error creating step: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating step:', error);
      // Return a mock step in case of error
      return { 
        id: `step-error-${Date.now()}`,
        threadId,
        type,
        content,
        metadata
      };
    }
  }

  async getThreadSteps(threadId: string): Promise<Step[]> {
    try {
      // For demo mode, return a simulated response
      if (this.config.apiKey === 'demo-key') {
        return [
          {
            id: `step-demo-1`,
            threadId,
            type: 'human',
            content: 'This is a demo human message',
            metadata: { timestamp: Date.now() - 60000 }
          },
          {
            id: `step-demo-2`,
            threadId,
            type: 'ai',
            content: 'This is a demo AI response',
            metadata: { timestamp: Date.now() }
          }
        ];
      }

      const response = await fetch(`${this.config.apiUrl}/v1/threads/${threadId}/steps`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Error fetching thread steps: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching thread steps:', error);
      // Return mock steps in case of error
      return [
        {
          id: `step-error-1`,
          threadId,
          type: 'human',
          content: 'Error fetching real messages',
          metadata: { error: true }
        }
      ];
    }
  }

  async getProjectThreads(): Promise<Thread[]> {
    try {
      // For demo mode, return a simulated response
      if (this.config.apiKey === 'demo-key') {
        return [
          { id: `thread-demo-1`, metadata: { created: Date.now() - 60000 * 30 } },
          { id: `thread-demo-2`, metadata: { created: Date.now() - 60000 * 15 } },
          { id: `thread-demo-3`, metadata: { created: Date.now() } }
        ];
      }

      const response = await fetch(`${this.config.apiUrl}/v1/projects/${this.config.project}/threads`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Error fetching project threads: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching project threads:', error);
      // Return mock threads in case of error
      return [
        { id: `thread-error-1`, metadata: { error: true } }
      ];
    }
  }
}

// Create singleton instance with default config
export const literalAIClient = new LiteralAIClient();

// Helper hook for React components
export function useLiteralAI() {
  return literalAIClient;
}