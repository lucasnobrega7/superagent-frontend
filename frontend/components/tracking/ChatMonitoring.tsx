'use client';

import { useEffect, useState } from 'react';
import { LiteralAIClient, Thread, Step } from '../../lib/literalai-fetch';

interface ChatMonitoringProps {
  agentId: string;
  userId: string;
  onThreadCreated?: (threadId: string) => void;
}

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export default function ChatMonitoring({ agentId, userId, onThreadCreated }: ChatMonitoringProps) {
  const [client] = useState(() => new LiteralAIClient());
  const [thread, setThread] = useState<Thread | null>(null);
  
  // Create thread on component mount
  useEffect(() => {
    async function createThread() {
      try {
        const newThread = await client.createThread({
          agentId,
          userId,
          startTime: Date.now(),
        });
        
        setThread(newThread);
        if (onThreadCreated) {
          onThreadCreated(newThread.id);
        }
        
        console.log('LiteralAI thread created:', newThread.id);
      } catch (error) {
        console.error('Failed to create LiteralAI thread:', error);
      }
    }
    
    if (agentId && userId) {
      createThread();
    }
    
    return () => {
      // Optionally update thread metadata on unmount
      if (thread) {
        client.createStep(
          thread.id,
          'system',
          'Conversation ended',
          { endTime: Date.now() }
        ).catch(err => console.error('Error recording conversation end:', err));
      }
    };
  }, [agentId, userId, client, onThreadCreated]);

  // Expose functions for tracking messages
  const trackMessage = async (message: Message) => {
    if (!thread) return;
    
    try {
      const stepType = message.role === 'user' ? 'human' : 
                      message.role === 'assistant' ? 'ai' : 'system';
      
      await client.createStep(
        thread.id,
        stepType,
        message.content,
        { timestamp: message.timestamp }
      );
      
      console.log(`LiteralAI: Tracked ${stepType} message`);
    } catch (error) {
      console.error('Failed to track message with LiteralAI:', error);
    }
  };

  // This component doesn't render anything, it just provides monitoring
  return null;
}

// Export hook for easy usage in components
export function useChatMonitoring(threadId: string | null) {
  const [client] = useState(() => new LiteralAIClient());
  
  const trackUserMessage = async (content: string) => {
    if (!threadId) return;
    
    try {
      await client.createStep(
        threadId,
        'human',
        content,
        { timestamp: Date.now() }
      );
    } catch (error) {
      console.error('Failed to track user message:', error);
    }
  };
  
  const trackAIMessage = async (content: string) => {
    if (!threadId) return;
    
    try {
      await client.createStep(
        threadId,
        'ai',
        content,
        { timestamp: Date.now() }
      );
    } catch (error) {
      console.error('Failed to track AI message:', error);
    }
  };
  
  const trackSystemEvent = async (content: string, metadata?: Record<string, any>) => {
    if (!threadId) return;
    
    try {
      await client.createStep(
        threadId,
        'system',
        content,
        { timestamp: Date.now(), ...metadata }
      );
    } catch (error) {
      console.error('Failed to track system event:', error);
    }
  };
  
  return {
    trackUserMessage,
    trackAIMessage,
    trackSystemEvent
  };
}