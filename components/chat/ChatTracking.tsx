import { useEffect, useCallback } from 'react';
import { literalAIClient } from '../../lib/literalai-client';

interface ChatTrackingProps {
  isEnabled?: boolean;
  agentId: string | null;
  userName?: string;
  conversationId?: string | null;
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    id?: string;
    metadata?: any;
  }>;
}

/**
 * Componente para rastreamento de interações de chat com LiteralAI
 * 
 * Este componente não renderiza conteúdo visual, apenas rastreia
 * as interações de chat quando há mudanças nas mensagens.
 */
export function ChatTracking({
  isEnabled = true,
  agentId,
  userName = 'User',
  conversationId,
  messages
}: ChatTrackingProps) {
  // Rastrear thread quando a conversa é iniciada
  useEffect(() => {
    if (!isEnabled || !agentId || !conversationId || messages.length === 0) {
      return;
    }

    // Criar uma thread para a conversa
    const initializeThread = async () => {
      try {
        await literalAIClient.createThread({
          name: `Conversa com Agente ${agentId}`,
          metadata: {
            agentId,
            conversationId,
            userName,
            startedAt: new Date().toISOString()
          }
        });
        console.log('Thread de rastreamento criada:', conversationId);
      } catch (error) {
        console.error('Erro ao criar thread de rastreamento:', error);
      }
    };

    initializeThread();
  }, [isEnabled, agentId, conversationId, userName]);

  // Processar novas mensagens
  const lastTrackedMessageRef = useCallback((messageId: string | undefined) => {
    let trackedMessageId = '';
    
    return {
      isTracked: (id: string | undefined) => {
        return id && id === trackedMessageId;
      },
      setTracked: (id: string | undefined) => {
        if (id) {
          trackedMessageId = id;
        }
      }
    };
  }, [])();

  // Rastrear mensagens quando adicionadas
  useEffect(() => {
    if (!isEnabled || !agentId || !conversationId || messages.length === 0) {
      return;
    }

    const trackMessages = async () => {
      try {
        // Processar apenas mensagens não rastreadas
        for (const message of messages) {
          if (message.id && lastTrackedMessageRef.isTracked(message.id)) {
            continue;
          }

          if (message.role === 'user') {
            await literalAIClient.trackUserMessage({
              message: message.content,
              metadata: {
                ...message.metadata,
                agentId,
                conversationId,
                messageId: message.id,
                timestamp: new Date().toISOString()
              }
            });
          } else if (message.role === 'assistant') {
            await literalAIClient.trackAssistantMessage({
              message: message.content,
              metadata: {
                ...message.metadata,
                agentId,
                conversationId,
                messageId: message.id,
                timestamp: new Date().toISOString()
              }
            });
          }

          // Marcar mensagem como rastreada
          if (message.id) {
            lastTrackedMessageRef.setTracked(message.id);
          }
        }
      } catch (error) {
        console.error('Erro ao rastrear mensagens:', error);
      }
    };

    trackMessages();
  }, [isEnabled, agentId, conversationId, messages, lastTrackedMessageRef]);

  // Este componente não renderiza conteúdo visual
  return null;
}

export default ChatTracking;