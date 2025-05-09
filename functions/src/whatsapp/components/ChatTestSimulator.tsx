/**
 * ChatTestSimulator Component
 * Simulador de conversa WhatsApp para testar fluxos dos agentes
 * Implementado com estética OpenAI e contexto imersivo
 */

import React, { useEffect, useState, useRef } from 'react';
import { OpenAIStyleUI } from '../ui-components';

interface Message {
  id: string;
  type: 'agent' | 'user';
  text: string;
  timestamp: Date;
}

interface WorkflowNode {
  id: string;
  title: string;
  type: string;
  content: string;
}

interface ChatTestSimulatorProps {
  workflowId?: string;
  initialMessages?: Message[];
  onSendMessage?: (message: string) => Promise<string>;
  currentNode?: WorkflowNode | null;
}

const ChatTestSimulator: React.FC<ChatTestSimulatorProps> = ({
  workflowId,
  initialMessages = [],
  onSendMessage,
  currentNode
}) => {
  // Estado
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activityLevel, setActivityLevel] = useState(0.5);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const visualizationRef = useRef<any>(null);
  const agentThinkingRef = useRef<HTMLDivElement>(null);
  
  // Inicializar visualizações
  useEffect(() => {
    // Injetar estilos CSS necessários
    OpenAIStyleUI.injectStyles();
    
    // Inicializar visualização do "pensamento" do agente
    if (agentThinkingRef.current) {
      visualizationRef.current = OpenAIStyleUI.initializeVisualization('agent-thinking', {
        type: 'waves',
        density: 'medium',
        color: OpenAIStyleUI.config.colors.primary,
        interactive: true
      });
    }
    
    return () => {
      // Limpar recursos
      if (visualizationRef.current) {
        visualizationRef.current.cleanup();
      }
    };
  }, []);
  
  // Atualizar visualização quando o nó muda
  useEffect(() => {
    if (visualizationRef.current && currentNode) {
      // Mudar cores baseado no tipo de nó
      const nodeTypeColors: { [key: string]: string } = {
        message: OpenAIStyleUI.config.colors.primary,
        input: '#8B5CF6', // Roxo
        condition: OpenAIStyleUI.config.colors.warning,
        api: OpenAIStyleUI.config.colors.success,
        action: OpenAIStyleUI.config.colors.error
      };
      
      const color = nodeTypeColors[currentNode.type] || OpenAIStyleUI.config.colors.primary;
      visualizationRef.current.setColor(color);
      
      // Pulsar a atividade
      visualizationRef.current.setActivity(0.8);
      setTimeout(() => {
        visualizationRef.current.setActivity(0.5);
      }, 1000);
    }
  }, [currentNode]);
  
  // Scroll para o final das mensagens quando novas são adicionadas
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Funções de manipulação
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim()) return;
    
    // Adicionar mensagem do usuário
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      type: 'user',
      text: inputValue,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    
    // Simular agente digitando
    setIsTyping(true);
    if (visualizationRef.current) {
      visualizationRef.current.setActivity(0.9);
    }
    
    // Se houver handler de envio, processar a resposta
    if (onSendMessage) {
      try {
        const response = await onSendMessage(inputValue);
        
        // Pequeno delay para simular processamento
        setTimeout(() => {
          setIsTyping(false);
          
          // Adicionar resposta do agente
          const agentMessage: Message = {
            id: `msg-${Date.now()}`,
            type: 'agent',
            text: response,
            timestamp: new Date()
          };
          
          setMessages(prev => [...prev, agentMessage]);
          
          // Reduzir atividade visual
          if (visualizationRef.current) {
            visualizationRef.current.setActivity(0.5);
          }
        }, 1500);
      } catch (error) {
        console.error('Erro ao processar mensagem:', error);
        setIsTyping(false);
        
        // Adicionar mensagem de erro
        const errorMessage: Message = {
          id: `msg-${Date.now()}`,
          type: 'agent',
          text: 'Desculpe, ocorreu um erro ao processar sua mensagem.',
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, errorMessage]);
        
        // Visualização de erro
        if (visualizationRef.current) {
          visualizationRef.current.setColor(OpenAIStyleUI.config.colors.error);
          visualizationRef.current.setActivity(0.7);
          
          setTimeout(() => {
            visualizationRef.current.setColor(OpenAIStyleUI.config.colors.primary);
            visualizationRef.current.setActivity(0.5);
          }, 1000);
        }
      }
    } else {
      // Modo de demonstração sem handler real
      setTimeout(() => {
        setIsTyping(false);
        
        // Simular resposta do agente
        const responseText = currentNode?.type === 'message' && currentNode.content
          ? currentNode.content
          : 'Entendi! Como posso ajudar mais?';
          
        const agentMessage: Message = {
          id: `msg-${Date.now()}`,
          type: 'agent',
          text: responseText,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, agentMessage]);
        
        // Reduzir atividade visual
        if (visualizationRef.current) {
          visualizationRef.current.setActivity(0.5);
        }
      }, Math.random() * 1000 + 1000); // Tempo de resposta variável para parecer natural
    }
  };
  
  // Formatar horário da mensagem
  const formatMessageTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  return (
    <div className="grid grid-cols-3 gap-4 h-[calc(100vh-6rem)]">
      {/* Chat (estilo WhatsApp) */}
      <div className="col-span-2 bg-white rounded-lg shadow-lg overflow-hidden flex flex-col">
        {/* Header do chat */}
        <div className="bg-green-700 text-white p-4">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-green-600 mr-3 flex items-center justify-center">
              <span className="text-lg font-bold">A</span>
            </div>
            <div>
              <h3 className="font-medium">Simulador WhatsApp</h3>
              <p className="text-xs text-green-100">
                {workflowId ? `Fluxo #${workflowId}` : 'Modo de teste'}
              </p>
            </div>
          </div>
        </div>
        
        {/* Área de mensagens */}
        <div 
          className="flex-1 bg-[#e5ddd5] p-4 overflow-y-auto flex flex-col space-y-3"
          style={{ 
            backgroundImage: 'url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAOxAAADsQBlSsOGwAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAABoSURBVDiNY/z//z8DNQETlKYpYEHm9DlxJTAwMDD4H9gCoeAafmgX5TKhG4gLoBvIRIJmKDhwYDPFBo5aOLQtZGKgIhjVTGUtPLRgFNNG8UEmBoaCC2S5htybzXegIUFTwDgqYcjR/B8AeY8USC6xAbAAAAAASUVORK5CYII=")',
            backgroundRepeat: 'repeat'
          }}
        >
          {messages.map(message => (
            <div 
              key={message.id} 
              className={`
                ${message.type === 'agent' ? 'self-start' : 'self-end'}
                ${message.type === 'agent' ? 'bg-white' : 'bg-green-100'} 
                p-3 rounded-lg shadow-sm max-w-[70%]
                ${message.type === 'agent' ? 'rounded-tl-none' : 'rounded-tr-none'}
              `}
            >
              <p className="text-sm">{message.text}</p>
              <p className="text-[10px] text-gray-500 text-right mt-1">
                {formatMessageTime(message.timestamp)}
              </p>
            </div>
          ))}
          
          {/* Indicador de "digitando" */}
          {isTyping && (
            <div className="self-start bg-white p-3 rounded-lg shadow-sm max-w-[70%] rounded-tl-none">
              <div className="flex space-x-1">
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce delay-0"></div>
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce delay-150"></div>
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce delay-300"></div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        {/* Input de mensagem */}
        <form onSubmit={handleSubmit} className="p-3 border-t">
          <div className="flex rounded-full bg-white p-2 shadow-sm">
            <input 
              type="text" 
              value={inputValue}
              onChange={handleInputChange}
              className="flex-1 outline-none px-3 text-sm"
              placeholder="Digite uma mensagem..."
              disabled={isTyping}
            />
            <button 
              type="submit"
              disabled={isTyping || !inputValue.trim()}
              className={`
                rounded-full p-2 text-white 
                ${inputValue.trim() && !isTyping ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400'}
                transition-colors
              `}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 101.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </form>
      </div>
      
      {/* Painel do agente (contexto escuro) */}
      <div className="col-span-1 bg-black text-white rounded-lg overflow-hidden flex flex-col">
        {/* Header do painel */}
        <div className="p-4 border-b border-gray-800">
          <h3 className="font-medium">Estado do Agente</h3>
          <p className="text-xs text-gray-400">Visualizando processamento</p>
        </div>
        
        {/* Visualização do "pensamento" */}
        <div className="p-4">
          <div 
            id="agent-thinking" 
            ref={agentThinkingRef}
            className="h-60 w-full relative rounded-lg overflow-hidden"
          ></div>
          
          {/* Informações sobre o nó atual */}
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-400 mb-2">Processando</h4>
            
            {currentNode ? (
              <div className="bg-gray-800 rounded-lg p-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">{currentNode.title}</span>
                  <span className="text-xs px-2 py-0.5 rounded" 
                    style={{ 
                      backgroundColor: currentNode.type === 'message' ? 'rgba(14, 165, 233, 0.2)' :
                                       currentNode.type === 'input' ? 'rgba(139, 92, 246, 0.2)' :
                                       currentNode.type === 'condition' ? 'rgba(245, 158, 11, 0.2)' :
                                       currentNode.type === 'api' ? 'rgba(16, 185, 129, 0.2)' : 
                                       'rgba(239, 68, 68, 0.2)',
                      color: currentNode.type === 'message' ? '#0EA5E9' :
                             currentNode.type === 'input' ? '#8B5CF6' :
                             currentNode.type === 'condition' ? '#F59E0B' :
                             currentNode.type === 'api' ? '#10B981' : '#EF4444'
                    }}
                  >
                    {currentNode.type}
                  </span>
                </div>
                
                <p className="text-sm text-gray-300 line-clamp-3">
                  {currentNode.content || 'Sem conteúdo definido'}
                </p>
                
                {/* Barra de progresso */}
                <div className="mt-3 h-1 bg-gray-700 rounded-full">
                  <div className="h-1 bg-blue-500 rounded-full w-[45%]"></div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-800 rounded-lg p-3 text-sm text-gray-400">
                Aguardando interação do usuário...
              </div>
            )}
          </div>
        </div>
        
        {/* Estatísticas da conversa */}
        <div className="p-4 mt-auto">
          <h4 className="text-sm font-medium text-gray-400 mb-2">Estatísticas</h4>
          
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-gray-800 bg-opacity-70 p-3 rounded-lg">
              <p className="text-xs text-gray-500">Mensagens</p>
              <p className="text-lg font-semibold">{messages.length}</p>
            </div>
            
            <div className="bg-gray-800 bg-opacity-70 p-3 rounded-lg">
              <p className="text-xs text-gray-500">Tempo médio</p>
              <p className="text-lg font-semibold">1.2s</p>
            </div>
          </div>
          
          {/* Botões de ação */}
          <div className="flex justify-between mt-4">
            <button className="px-3 py-1.5 bg-gray-800 text-gray-300 rounded-md text-sm hover:bg-gray-700 transition-colors">
              Reiniciar
            </button>
            
            <button className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors">
              Exportar Log
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatTestSimulator;