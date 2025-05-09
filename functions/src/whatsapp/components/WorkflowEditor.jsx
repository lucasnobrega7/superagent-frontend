/**
 * Componente de Editor de Fluxo de Trabalho para Agentes de Conversão
 * Implementa a estética OpenAI com alternância entre modos claro (funcional) e escuro (imersivo)
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  MiniMap,
  Panel,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';

// Componentes de nós customizados
import MessageNode from './nodes/MessageNode';
import ConditionNode from './nodes/ConditionNode';
import InputNode from './nodes/InputNode';
import ActionNode from './nodes/ActionNode';
import ApiNode from './nodes/ApiNode';

// Utilitários de visualização
import { OpenAIStyleUI } from '../ui-components';

// Registra tipos de nós personalizados
const nodeTypes = {
  message: MessageNode,
  condition: ConditionNode,
  input: InputNode,
  action: ActionNode,
  api: ApiNode,
};

// Cores para os diferentes tipos de nós
const nodeColors = {
  message: '#0EA5E9', // Azul primário
  condition: '#F59E0B', // Âmbar
  input: '#8B5CF6', // Púrpura
  action: '#10B981', // Verde
  api: '#EF4444', // Vermelho
};

/**
 * Componente principal do Editor de Fluxo de Trabalho
 */
export function WorkflowEditor({ 
  initialWorkflow = { nodes: [], edges: [] }, 
  onSave,
  readOnly = false,
}) {
  // Estado do fluxo
  const [nodes, setNodes, onNodesChange] = useNodesState(initialWorkflow.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialWorkflow.edges);
  
  // Estado da UI
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [isNodePanelOpen, setIsNodePanelOpen] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationPath, setSimulationPath] = useState([]);
  const [simulationStep, setSimulationStep] = useState(0);
  
  // Referências
  const editorRef = useRef(null);
  const visualizationRef = useRef(null);
  const previewRef = useRef(null);
  
  // Inicializar visualizações WebGL quando o modo escuro é ativado
  useEffect(() => {
    if (isDarkMode && visualizationRef.current) {
      // Limpar visualização existente
      if (visualizationRef.current.visualization) {
        visualizationRef.current.visualization.cleanup();
      }
      
      // Inicializar nova visualização
      visualizationRef.current.visualization = OpenAIStyleUI.initializeVisualization('workflow-visualization', {
        type: 'mesh',
        density: 'medium',
        color: '#0EA5E9',
        speed: 0.5,
        interactive: true,
      });
      
      // Injetar estilos CSS para efeitos
      OpenAIStyleUI.injectStyles();
    }
    
    return () => {
      if (visualizationRef.current?.visualization) {
        visualizationRef.current.visualization.cleanup();
      }
    };
  }, [isDarkMode]);
  
  // Conexão de nós
  const onConnect = useCallback(
    (params) => {
      // Cria uma conexão estilizada
      setEdges((eds) => addEdge({
        ...params,
        animated: true,
        style: { 
          stroke: nodeColors[nodes.find(n => n.id === params.source)?.type || 'message'],
          strokeWidth: 2
        },
        type: 'smoothstep',
      }, eds));
    },
    [nodes, setEdges]
  );
  
  // Manipulação de nós
  const onNodeClick = useCallback((_, node) => {
    setSelectedNode(node);
    setIsNodePanelOpen(true);
    
    // Atualizar visualização com atividade se estiver no modo escuro
    if (isDarkMode && visualizationRef.current?.visualization) {
      visualizationRef.current.visualization.setActivity(0.8);
      
      // Pulsar e depois retornar ao normal
      setTimeout(() => {
        if (visualizationRef.current?.visualization) {
          visualizationRef.current.visualization.setActivity(0.5);
        }
      }, 1000);
    }
  }, [isDarkMode]);
  
  // Atualizar um nó existente
  const onNodeUpdate = useCallback((nodeId, data) => {
    setNodes(nds => nds.map(node => 
      node.id === nodeId 
        ? { ...node, data: { ...node.data, ...data } }
        : node
    ));
  }, [setNodes]);
  
  // Adicionar um novo nó
  const onAddNode = useCallback((type) => {
    // Determinar posição para o novo nó
    const position = {
      x: 100 + Math.random() * 200,
      y: 100 + Math.random() * 200
    };
    
    // Dados padrão baseados no tipo
    let defaultData = { label: `Novo ${type}` };
    
    switch (type) {
      case 'message':
        defaultData = { 
          label: 'Mensagem', 
          content: 'Digite a mensagem aqui...',
        };
        break;
      case 'condition':
        defaultData = { 
          label: 'Condição', 
          condition: 'variavel == "valor"',
          trueLabel: 'Sim',
          falseLabel: 'Não'
        };
        break;
      case 'input':
        defaultData = { 
          label: 'Entrada', 
          question: 'Digite sua pergunta aqui...',
          variableName: 'resposta',
        };
        break;
      case 'action':
        defaultData = { 
          label: 'Ação', 
          actionType: 'script',
          script: '// Código da ação'
        };
        break;
      case 'api':
        defaultData = { 
          label: 'API', 
          endpoint: 'https://api.exemplo.com',
          method: 'GET',
          resultVariable: 'resultado'
        };
        break;
    }
    
    // Criar novo nó
    const newNode = {
      id: `${type}-${Date.now()}`,
      type,
      position,
      data: defaultData,
      style: {
        border: `2px solid ${nodeColors[type]}`,
        borderRadius: '8px',
      }
    };
    
    setNodes(nds => [...nds, newNode]);
    
    // Efeito visual
    if (isDarkMode && visualizationRef.current?.visualization) {
      visualizationRef.current.visualization.setActivity(0.9);
      
      // Voltar ao normal após o efeito
      setTimeout(() => {
        if (visualizationRef.current?.visualization) {
          visualizationRef.current.visualization.setActivity(0.5);
        }
      }, 800);
    }
  }, [setNodes, isDarkMode]);
  
  // Salvar fluxo
  const handleSave = useCallback(() => {
    if (onSave) {
      const workflow = { nodes, edges };
      onSave(workflow);
      
      // Feedback visual de confirmação
      OpenAIStyleUI.createConfirmationEffect('.save-button', 'success');
    }
  }, [nodes, edges, onSave]);
  
  // Alternar entre modos claro/escuro
  const toggleDarkMode = useCallback(() => {
    setIsDarkMode(prev => !prev);
    
    // Aplicar transição de contexto
    if (!isDarkMode) {
      // Transição para modo escuro
      OpenAIStyleUI.transitionContext(
        '#editor-content', 
        '#preview-content',
        { 
          type: 'immersive',
          direction: 'vertical',
          onComplete: () => {
            // Ajustar layout após transição
            document.querySelector('#editor-container').classList.add('dark-mode');
          }
        }
      );
    } else {
      // Transição para modo claro
      OpenAIStyleUI.transitionContext(
        '#preview-content', 
        '#editor-content',
        { 
          type: 'functional',
          direction: 'vertical',
          onComplete: () => {
            // Ajustar layout após transição
            document.querySelector('#editor-container').classList.remove('dark-mode');
          }
        }
      );
    }
  }, [isDarkMode]);
  
  // Simulação de fluxo
  const startSimulation = useCallback(() => {
    // Encontrar nó inicial (geralmente o primeiro)
    const startNode = nodes.find(n => n.type === 'message' && !edges.some(e => e.target === n.id));
    
    if (!startNode) {
      alert('Não foi possível encontrar um nó inicial. Adicione um nó de mensagem sem conexões de entrada.');
      return;
    }
    
    // Calcular caminho de simulação
    const path = calculateSimulationPath(startNode.id, nodes, edges);
    setSimulationPath(path);
    setSimulationStep(0);
    setIsSimulating(true);
    
    // Efeito visual para início da simulação
    OpenAIStyleUI.createConfirmationEffect('.simulate-button', 'completion');
  }, [nodes, edges]);
  
  // Avançar simulação
  const advanceSimulation = useCallback(() => {
    if (simulationStep < simulationPath.length - 1) {
      setSimulationStep(step => step + 1);
    } else {
      // Finalizar simulação
      setIsSimulating(false);
      setSimulationPath([]);
      setSimulationStep(0);
    }
  }, [simulationPath, simulationStep]);
  
  // Calcular caminho de simulação
  const calculateSimulationPath = (startNodeId, nodes, edges) => {
    // Implementação simplificada - na prática seria mais complexo com condições
    const path = [];
    let currentNodeId = startNodeId;
    
    // Evitar loops infinitos
    const maxSteps = 30;
    let steps = 0;
    
    while (currentNodeId && steps < maxSteps) {
      const node = nodes.find(n => n.id === currentNodeId);
      if (node) {
        path.push(node);
        
        // Encontrar próximo nó
        const outgoingEdge = edges.find(e => e.source === currentNodeId);
        if (outgoingEdge) {
          currentNodeId = outgoingEdge.target;
        } else {
          break; // Fim do caminho
        }
      } else {
        break; // Nó não encontrado
      }
      
      steps++;
    }
    
    return path;
  };
  
  return (
    <div 
      id="editor-container" 
      ref={editorRef}
      className={`flex flex-col h-full overflow-hidden rounded-lg border border-gray-200 transition-colors duration-300 ${isDarkMode ? 'dark-mode bg-black' : 'bg-white'}`}
    >
      {/* Barra de ferramentas superior */}
      <div className={`p-4 flex justify-between items-center border-b ${isDarkMode ? 'border-gray-800 text-white' : 'border-gray-200 text-gray-900'}`}>
        <h2 className="text-lg font-medium">Editor de Fluxo de Conversação</h2>
        
        <div className="flex items-center space-x-2">
          {/* Botões de ação */}
          <button 
            onClick={handleSave}
            className="save-button px-3 py-1.5 bg-brand-primary text-white rounded-md text-sm"
            disabled={readOnly}
          >
            Salvar
          </button>
          
          <button 
            onClick={startSimulation}
            className="simulate-button px-3 py-1.5 bg-brand-success text-white rounded-md text-sm"
            disabled={nodes.length === 0}
          >
            Simular
          </button>
          
          <button 
            onClick={toggleDarkMode}
            className={`px-3 py-1.5 rounded-md text-sm ${
              isDarkMode 
                ? 'bg-white text-black' 
                : 'bg-black text-white'
            }`}
          >
            Modo {isDarkMode ? 'Claro' : 'Escuro'}
          </button>
        </div>
      </div>
      
      {/* Container principal que alterna entre editor e preview */}
      <div className="flex-1 flex">
        {/* Editor (Contexto Claro) */}
        <div 
          id="editor-content"
          className={`flex-1 ${isDarkMode ? 'hidden' : 'flex flex-col'}`}
        >
          <div className="flex-1 relative">
            <ReactFlow
              nodes={nodes.map(node => ({
                ...node,
                // Destacar nó selecionado
                style: {
                  ...node.style,
                  borderWidth: selectedNode?.id === node.id ? '3px' : '2px',
                  boxShadow: selectedNode?.id === node.id ? '0 0 0 2px rgba(14, 165, 233, 0.3)' : 'none',
                }
              }))}
              edges={edges}
              nodeTypes={nodeTypes}
              onNodesChange={readOnly ? undefined : onNodesChange}
              onEdgesChange={readOnly ? undefined : onEdgesChange}
              onConnect={readOnly ? undefined : onConnect}
              onNodeClick={readOnly ? undefined : onNodeClick}
              fitView
              attributionPosition="bottom-right"
            >
              <Background 
                color="#aaaaaa" 
                gap={16} 
                size={1}
                variant="dots"
              />
              <Controls />
              <MiniMap
                nodeColor={(node) => nodeColors[node.type] || '#333'}
                maskColor="rgba(0, 0, 0, 0.05)"
                style={{
                  borderRadius: '8px',
                  right: 12,
                }}
              />
              
              {!readOnly && (
                <Panel position="top-left" className="p-3 rounded-md bg-white shadow">
                  <div className="flex flex-col space-y-2">
                    <h3 className="text-sm font-medium text-gray-700 mb-1">Adicionar nó</h3>
                    <button
                      onClick={() => onAddNode('message')}
                      className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                    >
                      Mensagem
                    </button>
                    <button
                      onClick={() => onAddNode('condition')}
                      className="px-2 py-1 text-xs bg-amber-100 text-amber-700 rounded hover:bg-amber-200"
                    >
                      Condição
                    </button>
                    <button
                      onClick={() => onAddNode('input')}
                      className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
                    >
                      Entrada
                    </button>
                    <button
                      onClick={() => onAddNode('action')}
                      className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                    >
                      Ação
                    </button>
                    <button
                      onClick={() => onAddNode('api')}
                      className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                    >
                      API
                    </button>
                  </div>
                </Panel>
              )}
            </ReactFlow>
          </div>
          
          {/* Painel de edição do nó selecionado */}
          {isNodePanelOpen && selectedNode && !readOnly && (
            <div className="h-64 border-t border-gray-200 p-4 overflow-y-auto">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-medium text-gray-900">
                  Editar {selectedNode.type}
                </h3>
                <button 
                  onClick={() => setIsNodePanelOpen(false)}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Fechar
                </button>
              </div>
              
              {/* Formulário dinâmico baseado no tipo do nó */}
              <div className="grid grid-cols-2 gap-4">
                {/* Campo comum a todos os nós */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Rótulo</label>
                  <input
                    type="text"
                    value={selectedNode.data.label || ''}
                    onChange={(e) => onNodeUpdate(selectedNode.id, { ...selectedNode.data, label: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
                
                {/* Campos específicos para cada tipo de nó */}
                {selectedNode.type === 'message' && (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Conteúdo da mensagem</label>
                    <textarea
                      value={selectedNode.data.content || ''}
                      onChange={(e) => onNodeUpdate(selectedNode.id, { ...selectedNode.data, content: e.target.value })}
                      rows={4}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                )}
                
                {selectedNode.type === 'condition' && (
                  <>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Condição</label>
                      <input
                        type="text"
                        value={selectedNode.data.condition || ''}
                        onChange={(e) => onNodeUpdate(selectedNode.id, { ...selectedNode.data, condition: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        placeholder="ex: variavel == 'valor'"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Rótulo Verdadeiro</label>
                      <input
                        type="text"
                        value={selectedNode.data.trueLabel || 'Sim'}
                        onChange={(e) => onNodeUpdate(selectedNode.id, { ...selectedNode.data, trueLabel: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Rótulo Falso</label>
                      <input
                        type="text"
                        value={selectedNode.data.falseLabel || 'Não'}
                        onChange={(e) => onNodeUpdate(selectedNode.id, { ...selectedNode.data, falseLabel: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    </div>
                  </>
                )}
                
                {selectedNode.type === 'input' && (
                  <>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Pergunta</label>
                      <textarea
                        value={selectedNode.data.question || ''}
                        onChange={(e) => onNodeUpdate(selectedNode.id, { ...selectedNode.data, question: e.target.value })}
                        rows={2}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Nome da variável</label>
                      <input
                        type="text"
                        value={selectedNode.data.variableName || ''}
                        onChange={(e) => onNodeUpdate(selectedNode.id, { ...selectedNode.data, variableName: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        placeholder="ex: resposta"
                      />
                    </div>
                  </>
                )}
                
                {selectedNode.type === 'action' && (
                  <>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Tipo de ação</label>
                      <select
                        value={selectedNode.data.actionType || 'script'}
                        onChange={(e) => onNodeUpdate(selectedNode.id, { ...selectedNode.data, actionType: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      >
                        <option value="script">Script</option>
                        <option value="webhook">Webhook</option>
                        <option value="function">Função</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Script</label>
                      <textarea
                        value={selectedNode.data.script || ''}
                        onChange={(e) => onNodeUpdate(selectedNode.id, { ...selectedNode.data, script: e.target.value })}
                        rows={4}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm font-mono"
                        placeholder="// Código JavaScript aqui"
                      />
                    </div>
                  </>
                )}
                
                {selectedNode.type === 'api' && (
                  <>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Endpoint</label>
                      <input
                        type="text"
                        value={selectedNode.data.endpoint || ''}
                        onChange={(e) => onNodeUpdate(selectedNode.id, { ...selectedNode.data, endpoint: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        placeholder="https://api.exemplo.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Método</label>
                      <select
                        value={selectedNode.data.method || 'GET'}
                        onChange={(e) => onNodeUpdate(selectedNode.id, { ...selectedNode.data, method: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      >
                        <option value="GET">GET</option>
                        <option value="POST">POST</option>
                        <option value="PUT">PUT</option>
                        <option value="DELETE">DELETE</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Variável de Resultado</label>
                      <input
                        type="text"
                        value={selectedNode.data.resultVariable || ''}
                        onChange={(e) => onNodeUpdate(selectedNode.id, { ...selectedNode.data, resultVariable: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        placeholder="ex: resultado"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Preview (Contexto Escuro) */}
        <div 
          id="preview-content" 
          ref={previewRef}
          className={`flex-1 relative bg-black text-white ${isDarkMode ? 'flex flex-col' : 'hidden'}`}
        >
          {/* Camada de visualização */}
          <div 
            id="workflow-visualization" 
            ref={visualizationRef}
            className="absolute inset-0 z-0"
          ></div>
          
          {/* Conteúdo sobreposto */}
          <div className="relative z-10 flex flex-col h-full">
            <div className="p-4">
              <h3 className="text-lg font-medium text-white mb-2">Visualização do Fluxo</h3>
              <p className="text-gray-400 text-sm">
                O agente segue este fluxo de conversação para interagir com os usuários.
              </p>
            </div>
            
            {/* Simulação de conversa */}
            {isSimulating ? (
              <div className="flex-1 p-4 overflow-y-auto flex flex-col items-center">
                <div className="bg-gray-900 rounded-lg p-4 mb-4 w-full max-w-lg">
                  <h4 className="text-sm font-medium text-gray-400 mb-2">
                    Simulação de conversa {simulationStep + 1}/{simulationPath.length}
                  </h4>
                  
                  <div className="space-y-4">
                    {simulationPath.slice(0, simulationStep + 1).map((node, index) => (
                      <div 
                        key={index}
                        className={`p-3 rounded-lg ${
                          node.type === 'message' 
                            ? 'bg-blue-900 bg-opacity-50' 
                            : node.type === 'input' 
                              ? 'bg-purple-900 bg-opacity-50'
                              : 'bg-gray-800'
                        } ${index === simulationStep ? 'border-2 border-white' : ''}`}
                      >
                        <p className="text-xs text-gray-400 mb-1">{node.type.toUpperCase()}</p>
                        {node.type === 'message' && <p className="text-white">{node.data.content}</p>}
                        {node.type === 'input' && <p className="text-white">{node.data.question}</p>}
                        {node.type === 'condition' && <p className="text-white">Condição: {node.data.condition}</p>}
                        {node.type === 'action' && <p className="text-white">Executando ação: {node.data.label}</p>}
                        {node.type === 'api' && <p className="text-white">{node.data.method} {node.data.endpoint}</p>}
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 flex justify-center">
                    <button 
                      onClick={advanceSimulation}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                    >
                      {simulationStep < simulationPath.length - 1 ? 'Avançar' : 'Concluir'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-gray-400 mb-4">Pressione "Simular" para visualizar o fluxo de conversa</p>
                  <button 
                    onClick={startSimulation}
                    className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-blue-600"
                    disabled={nodes.length === 0}
                  >
                    Iniciar Simulação
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default WorkflowEditor;