/**
 * Componente de Visualização de Chat para testar fluxos de conversação
 * Simula a interface do WhatsApp e mostra o estado do agente com visualizações
 */

import React, { useState, useRef, useEffect } from 'react';
import { OpenAIStyleUI } from '../ui-components';

export function ChatPreview({ agentFlow, initialVariables = {} }) {
  // Estado da conversa
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [variables, setVariables] = useState(initialVariables);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentNode, setCurrentNode] = useState(null);
  const [waitingForInput, setWaitingForInput] = useState(false);
  
  // Referências
  const messagesEndRef = useRef(null);
  const visualizationRef = useRef(null);
  const agentThinkingRef = useRef(null);
  
  // Inicializar visualizações
  useEffect(() => {
    // Injetar estilos CSS para efeitos
    OpenAIStyleUI.injectStyles();
    
    // Visualização principal do agente
    if (agentThinkingRef.current) {
      agentThinkingRef.current.visualization = OpenAIStyleUI.initializeVisualization('agent-thinking', {
        type: 'waves',
        color: '#0EA5E9',
        speed: 0.5,
        interactive: true,
      });
    }
    
    // Iniciar com a mensagem de boas-vindas
    startConversation();
    
    // Cleanup
    return () => {
      if (agentThinkingRef.current?.visualization) {
        agentThinkingRef.current.visualization.cleanup();
      }
    };
  }, []);
  
  // Rolagem automática para o final da conversa
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Atualiza visualização baseado no estado do processamento
  useEffect(() => {
    if (agentThinkingRef.current?.visualization) {
      if (isProcessing) {
        agentThinkingRef.current.visualization.setActivity(0.9);
      } else {
        agentThinkingRef.current.visualization.setActivity(0.3);
      }
    }
  }, [isProcessing]);
  
  // Função para iniciar conversa
  const startConversation = () => {
    // Encontrar nó inicial (mensagem sem conexões de entrada)
    const startNode = agentFlow.nodes.find(node => 
      node.type === 'message' && 
      !agentFlow.edges.some(edge => edge.target === node.id)
    );
    
    if (startNode) {
      processNode(startNode);
    } else {
      addSystemMessage("Fluxo sem mensagem inicial. Adicione um nó de mensagem para começar.");
    }
  };
  
  // Adicionar mensagem do sistema
  const addSystemMessage = (content) => {
    setMessages(msgs => [
      ...msgs, 
      { 
        id: Date.now(), 
        content, 
        sender: 'system', 
        timestamp: new Date().toISOString() 
      }
    ]);
  };
  
  // Adicionar mensagem do agente
  const addAgentMessage = (content) => {
    setMessages(msgs => [
      ...msgs, 
      { 
        id: Date.now(), 
        content, 
        sender: 'agent', 
        timestamp: new Date().toISOString() 
      }
    ]);
  };
  
  // Adicionar mensagem do usuário
  const addUserMessage = (content) => {
    setMessages(msgs => [
      ...msgs, 
      { 
        id: Date.now(), 
        content, 
        sender: 'user', 
        timestamp: new Date().toISOString() 
      }
    ]);
  };
  
  // Processar um nó de fluxo
  const processNode = async (node) => {
    setCurrentNode(node);
    setIsProcessing(true);
    
    // Simular tempo de processamento
    const processingTime = Math.random() * 700 + 300; // 300-1000ms
    await new Promise(resolve => setTimeout(resolve, processingTime));
    
    switch (node.type) {
      case 'message':
        // Substituir variáveis no conteúdo da mensagem
        let content = node.data.content;
        Object.entries(variables).forEach(([key, value]) => {
          content = content.replace(new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g'), value);
        });
        
        addAgentMessage(content);
        break;
        
      case 'input':
        addAgentMessage(node.data.question);
        setWaitingForInput(true);
        setIsProcessing(false);
        return; // Interromper o processamento até receber input
        
      case 'condition':
        // Avaliar condição
        try {
          // Substituir variáveis na condição
          let conditionStr = node.data.condition;
          Object.entries(variables).forEach(([key, value]) => {
            // Para strings, substituir por valor entre aspas
            if (typeof value === 'string') {
              conditionStr = conditionStr.replace(
                new RegExp(`\\b${key}\\b`, 'g'), 
                `"${value.replace(/"/g, '\\"')}"`
              );
            } else {
              conditionStr = conditionStr.replace(
                new RegExp(`\\b${key}\\b`, 'g'), 
                value
              );
            }
          });
          
          // Avaliar expressão
          const result = eval(conditionStr);
          
          // Encontrar próximo nó baseado no resultado
          const nextEdge = agentFlow.edges.find(edge => 
            edge.source === node.id && 
            ((result && edge.sourceHandle === 'true') || (!result && edge.sourceHandle === 'false'))
          );
          
          if (nextEdge) {
            const nextNode = agentFlow.nodes.find(n => n.id === nextEdge.target);
            if (nextNode) {
              setIsProcessing(false);
              processNode(nextNode);
              return;
            }
          }
        } catch (error) {
          console.error('Erro ao avaliar condição:', error);
          addSystemMessage(`Erro ao avaliar condição: ${error.message}`);
        }
        break;
        
      case 'action':
        addSystemMessage(`Executando ação: ${node.data.label}`);
        
        if (node.data.actionType === 'script' && node.data.script) {
          try {
            // Criar contexto para execução do script
            const scriptContext = {
              variables,
              setVariable: (key, value) => {
                setVariables(vars => ({ ...vars, [key]: value }));
              },
              log: (message) => {
                addSystemMessage(`Log: ${message}`);
              }
            };
            
            // Executar script em contexto seguro
            const scriptFn = new Function('context', `
              with(context) {
                ${node.data.script}
              }
              return context.variables;
            `);
            
            const updatedVars = scriptFn(scriptContext);
            if (updatedVars) {
              setVariables(updatedVars);
            }
          } catch (error) {
            console.error('Erro ao executar script:', error);
            addSystemMessage(`Erro ao executar script: ${error.message}`);
          }
        }
        break;
        
      case 'api':
        addSystemMessage(`Chamando API: ${node.data.method} ${node.data.endpoint}`);
        
        // Simular chamada de API
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Simular resposta
        const mockApiResponse = { status: 'success', data: { id: 12345, timestamp: new Date().toISOString() } };
        
        // Armazenar resultado na variável configurada
        if (node.data.resultVariable) {
          setVariables(vars => ({ 
            ...vars, 
            [node.data.resultVariable]: mockApiResponse 
          }));
        }
        
        addSystemMessage('API retornou com sucesso');
        break;
        
      default:
        addSystemMessage(`Tipo de nó desconhecido: ${node.type}`);
    }
    
    // Buscar próximo nó (para nós que não são de condição)
    if (node.type !== 'condition') {
      const nextEdge = agentFlow.edges.find(edge => edge.source === node.id);
      
      if (nextEdge) {
        const nextNode = agentFlow.nodes.find(n => n.id === nextEdge.target);
        if (nextNode) {
          setIsProcessing(false);
          processNode(nextNode);
          return;
        }
      }
    }
    
    setIsProcessing(false);
  };
  
  // Processar entrada do usuário
  const handleSendMessage = () => {
    if (!userInput.trim() || !waitingForInput) return;
    
    // Adicionar mensagem do usuário
    addUserMessage(userInput);
    
    // Processar input recebido
    if (currentNode?.type === 'input' && currentNode.data.variableName) {
      // Armazenar valor na variável
      setVariables(vars => ({ 
        ...vars, 
        [currentNode.data.variableName]: userInput 
      }));
      
      // Resetar estado
      setWaitingForInput(false);
      setUserInput('');
      
      // Buscar próximo nó
      const nextEdge = agentFlow.edges.find(edge => edge.source === currentNode.id);
      
      if (nextEdge) {
        const nextNode = agentFlow.nodes.find(n => n.id === nextEdge.target);
        if (nextNode) {
          // Aguardar um momento para simular processamento
          setTimeout(() => {
            processNode(nextNode);
          }, 500);
          return;
        }
      }
      
      // Se não houver próximo nó
      addSystemMessage("Fluxo de conversa finalizado.");
    }
  };
  
  // Formatar timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex h-full">
      {/* Chat (Contexto Claro) */}
      <div className="w-2/3 bg-white rounded-lg shadow-lg overflow-hidden flex flex-col border border-gray-200">
        {/* Header do WhatsApp */}
        <div className="bg-green-700 text-white p-4 flex items-center">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-green-700 font-bold mr-3">
            A
          </div>
          <div>
            <h3 className="font-medium">Agente de Vendas</h3>
            <p className="text-xs text-green-100">{isProcessing ? 'Digitando...' : waitingForInput ? 'Aguardando resposta...' : 'Online'}</p>
          </div>
        </div>
        
        {/* Área de mensagens */}
        <div className="flex-1 bg-[#e5ddd5] p-4 overflow-y-auto flex flex-col space-y-3">
          {messages.map((message) => (
            <div 
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`p-3 rounded-lg max-w-[70%] ${
                  message.sender === 'user' 
                    ? 'bg-green-100 rounded-tr-none' 
                    : message.sender === 'agent'
                      ? 'bg-white rounded-tl-none'
                      : 'bg-gray-200 text-gray-700 text-xs italic'
                }`}
              >
                <div className="flex justify-between items-baseline mb-1">
                  <span className="font-medium text-xs">{
                    message.sender === 'user' 
                      ? 'Você' 
                      : message.sender === 'agent' 
                        ? 'Agente'
                        : 'Sistema'
                  }</span>
                  <span className="text-xs text-gray-500 ml-2">
                    {formatTime(message.timestamp)}
                  </span>
                </div>
                <p className={`${message.sender === 'system' ? 'text-xs' : 'text-sm'}`}>
                  {message.content}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Input */}
        <div className="p-3 border-t border-gray-200 bg-gray-50">
          <div className="flex rounded-full bg-white p-2 border border-gray-300">
            <input 
              type="text" 
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              className="flex-1 bg-transparent outline-none px-2 text-sm" 
              placeholder={waitingForInput ? "Digite sua resposta..." : "Aguardando o agente..."}
              disabled={!waitingForInput}
            />
            <button 
              onClick={handleSendMessage}
              disabled={!waitingForInput || !userInput.trim()}
              className={`rounded-full p-2 ${
                waitingForInput && userInput.trim()
                  ? 'bg-green-700 text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              <span>Enviar</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Estado do Agente (Contexto Escuro) */}
      <div className="w-1/3 bg-black text-white ml-4 rounded-lg p-4 border border-gray-800 overflow-hidden">
        <h3 className="font-medium mb-4">Estado do Agente</h3>
        
        {/* Visualização do "pensamento" do agente */}
        <div id="agent-thinking" ref={agentThinkingRef} className="relative h-60 mb-4">
          <div className="absolute inset-0"></div>
          <div className="relative z-10 p-2">
            <h4 className="text-sm font-medium text-gray-400">
              {isProcessing ? 'Processando' : waitingForInput ? 'Aguardando entrada' : 'Aguardando'}
            </h4>
            
            {isProcessing && (
              <p className="text-sm text-gray-300 mt-2">
                {currentNode?.type === 'message' 
                  ? 'Preparando mensagem...' 
                  : currentNode?.type === 'condition'
                    ? 'Avaliando condição...'
                    : currentNode?.type === 'action'
                      ? 'Executando ação...'
                      : currentNode?.type === 'api'
                        ? 'Chamando API externa...'
                        : 'Processando próximo passo...'}
              </p>
            )}
            
            {waitingForInput && (
              <p className="text-sm text-gray-300 mt-2 thinking-indicator">
                Aguardando resposta do usuário...
              </p>
            )}
          </div>
        </div>
        
        {/* Informações do nó atual */}
        {currentNode && (
          <div>
            <h4 className="text-sm font-medium text-gray-400 mb-2">Nó Atual</h4>
            <div className="bg-gray-800 rounded p-3">
              <div className="flex justify-between">
                <p className="text-sm">{currentNode.data.label}</p>
                <span className="text-xs px-1.5 py-0.5 rounded bg-gray-700 text-gray-300">
                  {currentNode.type}
                </span>
              </div>
              
              {currentNode.type === 'input' && waitingForInput && (
                <div className="mt-2 h-1 bg-gray-700 rounded-full">
                  <div className="h-1 bg-purple-500 rounded-full w-[50%] thinking-indicator"></div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Variáveis */}
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-400 mb-2">Variáveis</h4>
          <div className="bg-gray-800 rounded p-3 max-h-32 overflow-y-auto">
            {Object.keys(variables).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(variables).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-start text-xs">
                    <span className="font-mono text-blue-400">{key}:</span>
                    <span className="font-mono text-gray-300 text-right overflow-hidden text-ellipsis" style={{maxWidth: '60%'}}>
                      {typeof value === 'object' 
                        ? JSON.stringify(value).slice(0, 30) + (JSON.stringify(value).length > 30 ? '...' : '')
                        : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500">Nenhuma variável definida</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatPreview;