'use client';

import { useEffect, useState, useRef } from 'react';
import { literalAIClient } from '@/lib/literalai-fetch';

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  id?: string;
  metadata?: any;
}

interface ChatMonitoringProps {
  agentId: string | null;
  conversationId: string | null;
  messages: Message[];
  isEnabled?: boolean;
  userName?: string;
}

/**
 * Componente para rastreamento e monitoramento de conversas com IA
 * Usa a implementação fetch compatível com Next.js
 */
export default function ChatMonitoring({
  agentId,
  conversationId,
  messages,
  isEnabled = true,
  userName = 'Usuário'
}: ChatMonitoringProps) {
  const [threadId, setThreadId] = useState<string | null>(null);
  const lastProcessedMessageIdRef = useRef<string | null>(null);
  
  // Inicializar thread quando a conversa começa
  useEffect(() => {
    if (!isEnabled || !agentId || !conversationId || messages.length === 0) {
      return;
    }
    
    // Só criar thread se ainda não temos uma
    if (threadId) return;
    
    const initThread = async () => {
      const thread = await literalAIClient.createThread({
        name: `Conversa com Agente ${agentId}`,
        metadata: {
          agentId,
          conversationId,
          userName,
          startedAt: new Date().toISOString()
        }
      });
      
      if (thread?.id) {
        setThreadId(thread.id);
        console.log('LiteralAI thread iniciada:', thread.id);
      }
    };
    
    initThread();
  }, [isEnabled, agentId, conversationId, messages, threadId, userName]);
  
  // Processar novas mensagens quando adicionadas
  useEffect(() => {
    if (!isEnabled || !threadId || messages.length === 0) {
      return;
    }
    
    const trackNewMessages = async () => {
      // Identificar mensagens não processadas
      const unprocessedMessages = messages.filter(msg => 
        msg.id && msg.id !== lastProcessedMessageIdRef.current
      );
      
      if (unprocessedMessages.length === 0) return;
      
      // Processar as novas mensagens em ordem
      for (const message of unprocessedMessages) {
        if (message.role === 'user') {
          await literalAIClient.trackUserMessage({
            threadId,
            content: message.content,
            metadata: {
              ...message.metadata,
              messageId: message.id,
              timestamp: new Date().toISOString()
            }
          });
        } else if (message.role === 'assistant') {
          await literalAIClient.trackAssistantMessage({
            threadId,
            content: message.content,
            metadata: {
              ...message.metadata,
              messageId: message.id,
              timestamp: new Date().toISOString()
            }
          });
        }
        
        // Atualizar última mensagem processada
        if (message.id) {
          lastProcessedMessageIdRef.current = message.id;
        }
      }
    };
    
    trackNewMessages();
  }, [isEnabled, threadId, messages]);
  
  // Este componente não renderiza conteúdo visual
  return null;
}