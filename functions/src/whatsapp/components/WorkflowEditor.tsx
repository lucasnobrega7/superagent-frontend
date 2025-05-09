/**
 * WorkflowEditor Component
 * Editor visual para criação de fluxos de conversa de agentes WhatsApp
 * Implementado seguindo os princípios de design da OpenAI com alternância entre contextos
 */

import React, { useEffect, useState, useRef } from 'react';
import { OpenAIStyleUI } from '../ui-components';

// Tipos para os nós do fluxo
type NodeType = 'message' | 'input' | 'condition' | 'api' | 'action';

interface Node {
  id: string;
  type: NodeType;
  title: string;
  content: string;
  position: { x: number; y: number };
  options?: { value: string; text: string; nextNodeId?: string }[];
  nextNodeId?: string;
}

interface Edge {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  label?: string;
}

interface WorkflowData {
  id?: string;
  name: string;
  description?: string;
  nodes: Node[];
  edges: Edge[];
  startNodeId?: string;
}

interface WorkflowEditorProps {
  initialWorkflow?: WorkflowData;
  onSave?: (workflow: WorkflowData) => void;
}

const defaultWorkflow: WorkflowData = {
  name: 'Novo Fluxo',
  description: 'Descrição do fluxo',
  nodes: [],
  edges: []
};

const WorkflowEditor: React.FC<WorkflowEditorProps> = ({ 
  initialWorkflow = defaultWorkflow,
  onSave
}) => {
  // Estado principal
  const [workflow, setWorkflow] = useState<WorkflowData>(initialWorkflow);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Refs para visualizações
  const editorRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const visualizationRef = useRef<any>(null);

  // Inicialização da interface
  useEffect(() => {
    // Injetar estilos CSS necessários
    OpenAIStyleUI.injectStyles();

    // Inicializar visualização para o preview (contexto escuro)
    if (previewRef.current) {
      visualizationRef.current = OpenAIStyleUI.initializeVisualization('preview-visualization', {
        type: 'particles',
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

  // Manipuladores de evento
  const handleNodeAdd = (type: NodeType) => {
    const newId = `node-${Date.now()}`;
    const newNode: Node = {
      id: newId,
      type,
      title: `Novo ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      content: '',
      position: { x: 100, y: 100 }
    };

    // Adicionar opções para nós de condição
    if (type === 'condition') {
      newNode.options = [
        { value: 'true', text: 'Sim' },
        { value: 'false', text: 'Não' }
      ];
    }

    setWorkflow(prev => ({
      ...prev,
      nodes: [...prev.nodes, newNode],
      // Se for o primeiro nó, defini-lo como inicial
      startNodeId: prev.nodes.length === 0 ? newId : prev.startNodeId
    }));

    setSelectedNode(newId);
    
    // Atualizar visualização com atividade
    if (visualizationRef.current) {
      visualizationRef.current.setActivity(0.8);
      setTimeout(() => {
        visualizationRef.current.setActivity(0.5);
      }, 1000);
    }
  };

  const handleNodeSelect = (nodeId: string) => {
    setSelectedNode(nodeId);
    
    // Pulso na visualização ao selecionar
    if (visualizationRef.current) {
      visualizationRef.current.setActivity(0.7);
      setTimeout(() => {
        visualizationRef.current.setActivity(0.5);
      }, 800);
    }
  };

  const handleNodeDragStart = (nodeId: string, e: React.MouseEvent) => {
    const node = workflow.nodes.find(n => n.id === nodeId);
    if (!node) return;
    
    setDraggingNode(nodeId);
    
    // Calcular offset para manter a posição relativa do mouse durante o arrasto
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };
  
  const handleNodeDrag = (e: React.MouseEvent) => {
    if (!draggingNode || !editorRef.current) return;
    
    const editorRect = editorRef.current.getBoundingClientRect();
    
    setWorkflow(prev => {
      const updatedNodes = prev.nodes.map(node => {
        if (node.id === draggingNode) {
          // Calcular nova posição considerando o offset e os limites do editor
          const newX = Math.max(0, Math.min(e.clientX - editorRect.left - dragOffset.x, editorRect.width - 200));
          const newY = Math.max(0, Math.min(e.clientY - editorRect.top - dragOffset.y, editorRect.height - 100));
          
          return {
            ...node,
            position: { x: newX, y: newY }
          };
        }
        return node;
      });
      
      return { ...prev, nodes: updatedNodes };
    });
  };
  
  const handleNodeDragEnd = () => {
    setDraggingNode(null);
  };

  const handleNodeUpdate = (nodeId: string, updates: Partial<Node>) => {
    setWorkflow(prev => ({
      ...prev,
      nodes: prev.nodes.map(node => 
        node.id === nodeId ? { ...node, ...updates } : node
      )
    }));
  };

  const handleNodeDelete = (nodeId: string) => {
    setWorkflow(prev => {
      // Remover o nó
      const updatedNodes = prev.nodes.filter(node => node.id !== nodeId);
      
      // Remover arestas conectadas a este nó
      const updatedEdges = prev.edges.filter(
        edge => edge.fromNodeId !== nodeId && edge.toNodeId !== nodeId
      );
      
      // Atualizar nó inicial se necessário
      let updatedStartNode = prev.startNodeId;
      if (prev.startNodeId === nodeId) {
        updatedStartNode = updatedNodes.length > 0 ? updatedNodes[0].id : undefined;
      }
      
      return {
        ...prev,
        nodes: updatedNodes,
        edges: updatedEdges,
        startNodeId: updatedStartNode
      };
    });
    
    // Limpar seleção
    setSelectedNode(null);
    
    // Efeito na visualização
    if (visualizationRef.current) {
      visualizationRef.current.setColor(OpenAIStyleUI.config.colors.error);
      visualizationRef.current.setActivity(0.8);
      
      setTimeout(() => {
        visualizationRef.current.setColor(OpenAIStyleUI.config.colors.primary);
        visualizationRef.current.setActivity(0.5);
      }, 1000);
    }
  };

  const handleCreateEdge = (fromNodeId: string, toNodeId: string) => {
    const newEdge: Edge = {
      id: `edge-${Date.now()}`,
      fromNodeId,
      toNodeId
    };
    
    setWorkflow(prev => ({
      ...prev,
      edges: [...prev.edges, newEdge]
    }));
  };

  const handleSaveWorkflow = () => {
    if (onSave) {
      onSave(workflow);
    }
    
    // Feedback visual
    if (visualizationRef.current) {
      visualizationRef.current.setColor(OpenAIStyleUI.config.colors.success);
      visualizationRef.current.setActivity(0.9);
      
      setTimeout(() => {
        visualizationRef.current.setColor(OpenAIStyleUI.config.colors.primary);
        visualizationRef.current.setActivity(0.5);
      }, 1200);
    }
  };

  const handleToggleMode = () => {
    const newMode = mode === 'edit' ? 'preview' : 'edit';
    setMode(newMode);
    
    // Mostrar transição visual
    if (newMode === 'preview') {
      // Transição para modo imersivo
      OpenAIStyleUI.transitionContext('#editor-panel', '#preview-panel', {
        type: 'immersive',
        direction: 'horizontal',
        onComplete: () => {
          // Aumentar atividade da visualização no modo preview
          if (visualizationRef.current) {
            visualizationRef.current.setActivity(0.8);
          }
        }
      });
    } else {
      // Transição para modo funcional
      OpenAIStyleUI.transitionContext('#preview-panel', '#editor-panel', {
        type: 'functional',
        direction: 'horizontal'
      });
    }
  };

  // Renderiza uma conexão entre nós
  const renderEdge = (edge: Edge) => {
    const fromNode = workflow.nodes.find(node => node.id === edge.fromNodeId);
    const toNode = workflow.nodes.find(node => node.id === edge.toNodeId);
    
    if (!fromNode || !toNode) return null;
    
    // Calcular pontos de início e fim da linha
    const x1 = fromNode.position.x + 100; // centro do nó de origem
    const y1 = fromNode.position.y + 50;
    const x2 = toNode.position.x;
    const y2 = toNode.position.y + 50;
    
    // Definir path SVG para a linha com curva
    const path = `M ${x1} ${y1} C ${x1 + 50} ${y1}, ${x2 - 50} ${y2}, ${x2} ${y2}`;
    
    return (
      <g key={edge.id}>
        <path
          d={path}
          stroke="#0EA5E9"
          strokeWidth="2"
          fill="none"
          strokeDasharray={edge.label ? "0" : "5,5"}
          markerEnd="url(#arrowhead)"
        />
        {edge.label && (
          <text
            x={(x1 + x2) / 2}
            y={((y1 + y2) / 2) - 10}
            fill="#64748b"
            fontSize="12"
            textAnchor="middle"
            dominantBaseline="middle"
            className="bg-white px-1"
          >
            {edge.label}
          </text>
        )}
      </g>
    );
  };

  // Renderizar um nó do fluxo
  const renderNode = (node: Node) => {
    // Determinar cores com base no tipo de nó
    let borderColor = "#0EA5E9"; // Azul padrão
    let bgColor = "#f0f9ff";
    
    switch (node.type) {
      case 'message':
        borderColor = "#0EA5E9"; // Azul
        bgColor = "#f0f9ff";
        break;
      case 'input':
        borderColor = "#8B5CF6"; // Roxo
        bgColor = "#f5f3ff";
        break;
      case 'condition':
        borderColor = "#F59E0B"; // Âmbar
        bgColor = "#fffbeb";
        break;
      case 'api':
        borderColor = "#059669"; // Verde
        bgColor = "#ecfdf5";
        break;
      case 'action':
        borderColor = "#EF4444"; // Vermelho
        bgColor = "#fef2f2";
        break;
    }
    
    // Estilo adicional se o nó estiver selecionado
    const isSelected = selectedNode === node.id;
    
    return (
      <div
        key={node.id}
        className={`absolute rounded-lg overflow-hidden shadow-md transition-shadow duration-200 ${
          isSelected ? 'ring-2 ring-offset-2' : ''
        }`}
        style={{
          left: `${node.position.x}px`,
          top: `${node.position.y}px`,
          width: '200px',
          borderLeft: `4px solid ${borderColor}`,
          backgroundColor: bgColor,
          zIndex: isSelected ? 10 : 1
        }}
        onClick={() => handleNodeSelect(node.id)}
        onMouseDown={(e) => handleNodeDragStart(node.id, e)}
      >
        {/* Cabeçalho do nó */}
        <div 
          className="px-3 py-2 font-medium text-sm flex justify-between items-center cursor-move"
          style={{ borderBottom: `1px solid ${borderColor}30` }}
        >
          <span>{node.title}</span>
          <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: `${borderColor}20`, color: borderColor }}>
            {node.type}
          </span>
        </div>
        
        {/* Conteúdo do nó */}
        <div className="p-3 text-sm">
          {node.content ? (
            <p className="text-gray-600 line-clamp-2">{node.content}</p>
          ) : (
            <p className="text-gray-400 italic">Sem conteúdo</p>
          )}
          
          {/* Opções para nó de condição */}
          {node.type === 'condition' && node.options && (
            <div className="mt-2 space-y-1">
              {node.options.map((option, index) => (
                <div key={index} className="flex items-center text-xs">
                  <span className="w-12 font-medium">{option.text}:</span>
                  <span className="text-gray-500 truncate">{option.nextNodeId || 'Não conectado'}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Conexão para próximo nó (exceto para nós de condição que têm múltiplas saídas) */}
        {node.type !== 'condition' && (
          <div className="px-3 py-2 bg-gray-50 text-xs text-gray-500 border-t border-gray-200">
            Próximo: {node.nextNodeId || 'Não conectado'}
          </div>
        )}
        
        {/* Indicador de nó inicial */}
        {workflow.startNodeId === node.id && (
          <div className="absolute -top-2 -left-2 w-5 h-5 rounded-full bg-green-500 border-2 border-white shadow-sm"></div>
        )}
      </div>
    );
  };

  // Preview do chat no WhatsApp
  const renderChatPreview = () => {
    // Simular conversa para previewing
    const selectedNodeData = workflow.nodes.find(node => node.id === selectedNode);
    
    return (
      <div className="bg-[#e5ddd5] bg-opacity-40 rounded-lg overflow-hidden flex flex-col h-full max-w-sm mx-auto relative z-10">
        {/* Header do chat */}
        <div className="bg-green-700 text-white p-3 shadow-sm">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-gray-300 mr-3"></div>
            <div>
              <h3 className="font-medium text-sm">Preview do Chat</h3>
              <p className="text-xs text-green-100">Agente WhatsApp</p>
            </div>
          </div>
        </div>
        
        {/* Área de mensagens */}
        <div className="flex-1 p-3 overflow-y-auto flex flex-col space-y-2">
          {/* Mensagem do agente */}
          <div className="bg-white p-2 rounded-lg shadow-sm self-start max-w-[70%]">
            <p className="text-sm">Olá! Como posso ajudar você hoje?</p>
            <p className="text-[10px] text-gray-500 text-right mt-1">10:30</p>
          </div>
          
          {/* Resposta do usuário */}
          <div className="bg-green-100 p-2 rounded-lg shadow-sm self-end max-w-[70%]">
            <p className="text-sm">Quero saber mais sobre seus produtos</p>
            <p className="text-[10px] text-gray-500 text-right mt-1">10:31</p>
          </div>
          
          {/* Mensagem selecionada do nó do fluxo */}
          {selectedNodeData?.type === 'message' && selectedNodeData.content && (
            <div className="bg-white p-2 rounded-lg shadow-sm self-start max-w-[70%] border-l-2 border-blue-500">
              <p className="text-sm">{selectedNodeData.content}</p>
              <p className="text-[10px] text-gray-500 text-right mt-1">10:32</p>
            </div>
          )}
        </div>
        
        {/* Input */}
        <div className="p-2 border-t border-gray-300">
          <div className="flex rounded-full bg-white p-1 shadow-sm">
            <input 
              type="text" 
              className="flex-1 bg-transparent outline-none px-2 text-sm" 
              placeholder="Digite uma mensagem..."
              disabled
            />
            <button className="rounded-full bg-green-600 text-white p-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Editor de propriedades do nó
  const renderNodeEditor = () => {
    if (!selectedNode) return null;
    
    const node = workflow.nodes.find(n => n.id === selectedNode);
    if (!node) return null;
    
    return (
      <div className="bg-white rounded-lg shadow p-4 mt-4">
        <h3 className="text-lg font-medium mb-4">Propriedades do Nó</h3>
        
        <div className="space-y-4">
          {/* Título */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
            <input
              type="text"
              value={node.title}
              onChange={(e) => handleNodeUpdate(node.id, { title: e.target.value })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          
          {/* Conteúdo - varia de acordo com o tipo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {node.type === 'message' ? 'Texto da Mensagem' : 
               node.type === 'input' ? 'Pergunta' : 
               node.type === 'condition' ? 'Condição' : 
               node.type === 'api' ? 'Endpoint da API' : 'Ação'}
            </label>
            
            <textarea
              value={node.content}
              onChange={(e) => handleNodeUpdate(node.id, { content: e.target.value })}
              rows={3}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          
          {/* Opções específicas para cada tipo de nó */}
          {node.type === 'condition' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Opções</label>
              {node.options?.map((option, index) => (
                <div key={index} className="flex items-center gap-2 mt-2">
                  <input
                    type="text"
                    value={option.text}
                    onChange={(e) => {
                      const updatedOptions = [...(node.options || [])];
                      updatedOptions[index] = { ...option, text: e.target.value };
                      handleNodeUpdate(node.id, { options: updatedOptions });
                    }}
                    className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Rótulo"
                  />
                  <select
                    value={option.nextNodeId || ''}
                    onChange={(e) => {
                      const updatedOptions = [...(node.options || [])];
                      updatedOptions[index] = { ...option, nextNodeId: e.target.value || undefined };
                      handleNodeUpdate(node.id, { options: updatedOptions });
                    }}
                    className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">Selecionar próximo nó</option>
                    {workflow.nodes
                      .filter(n => n.id !== node.id)
                      .map(n => (
                        <option key={n.id} value={n.id}>{n.title}</option>
                      ))
                    }
                  </select>
                </div>
              ))}
            </div>
          )}
          
          {/* Próximo nó (para tipos diferentes de condição) */}
          {node.type !== 'condition' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Próximo Nó</label>
              <select
                value={node.nextNodeId || ''}
                onChange={(e) => handleNodeUpdate(node.id, { nextNodeId: e.target.value || undefined })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Nenhum (fim do fluxo)</option>
                {workflow.nodes
                  .filter(n => n.id !== node.id)
                  .map(n => (
                    <option key={n.id} value={n.id}>{n.title}</option>
                  ))
                }
              </select>
            </div>
          )}
          
          {/* Definir como nó inicial */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="startNode"
              checked={workflow.startNodeId === node.id}
              onChange={(e) => {
                if (e.target.checked) {
                  setWorkflow(prev => ({ ...prev, startNodeId: node.id }));
                } else if (workflow.startNodeId === node.id) {
                  setWorkflow(prev => ({ ...prev, startNodeId: undefined }));
                }
              }}
              className="rounded text-blue-500 focus:ring-blue-500"
            />
            <label htmlFor="startNode" className="ml-2 text-sm text-gray-700">
              Definir como nó inicial
            </label>
          </div>
          
          {/* Botões de ação */}
          <div className="flex justify-end space-x-2 pt-2 border-t">
            <button
              onClick={() => handleNodeDelete(node.id)}
              className="px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors"
            >
              Excluir
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-3 gap-4 h-[calc(100vh-8rem)]">
      {/* Painel de Edição (Contexto Claro) */}
      <div id="editor-panel" className={`col-span-2 ${mode === 'preview' ? 'hidden' : 'block'}`}>
        <div className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col h-full">
          {/* Barra de ferramentas */}
          <div className="bg-gray-50 border-b border-gray-200 p-4 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-medium">Editor de Fluxo</h2>
              <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700">Funcional</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={workflow.name}
                onChange={(e) => setWorkflow(prev => ({ ...prev, name: e.target.value }))}
                className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Nome do fluxo"
              />
              <button 
                onClick={handleToggleMode}
                className="px-3 py-1.5 bg-black text-white text-sm rounded-md hover:bg-gray-800 transition-colors"
              >
                Visualizar
              </button>
              <button 
                onClick={handleSaveWorkflow}
                className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
              >
                Salvar
              </button>
            </div>
          </div>
          
          {/* Paleta de nós */}
          <div className="bg-gray-50 border-b border-gray-200 p-2 flex items-center space-x-2">
            <span className="text-xs text-gray-500 mr-2">Adicionar:</span>
            <button 
              onClick={() => handleNodeAdd('message')}
              className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded border border-blue-200 hover:bg-blue-100"
            >
              Mensagem
            </button>
            <button 
              onClick={() => handleNodeAdd('input')}
              className="px-2 py-1 bg-purple-50 text-purple-600 text-xs rounded border border-purple-200 hover:bg-purple-100"
            >
              Entrada
            </button>
            <button 
              onClick={() => handleNodeAdd('condition')}
              className="px-2 py-1 bg-amber-50 text-amber-600 text-xs rounded border border-amber-200 hover:bg-amber-100"
            >
              Condição
            </button>
            <button 
              onClick={() => handleNodeAdd('api')}
              className="px-2 py-1 bg-green-50 text-green-600 text-xs rounded border border-green-200 hover:bg-green-100"
            >
              API
            </button>
            <button 
              onClick={() => handleNodeAdd('action')}
              className="px-2 py-1 bg-red-50 text-red-600 text-xs rounded border border-red-200 hover:bg-red-100"
            >
              Ação
            </button>
          </div>
          
          {/* Área de fluxo */}
          <div className="flex-1 relative overflow-auto">
            <div 
              ref={editorRef}
              className="relative w-full h-full"
              onMouseMove={draggingNode ? handleNodeDrag : undefined}
              onMouseUp={draggingNode ? handleNodeDragEnd : undefined}
              onMouseLeave={draggingNode ? handleNodeDragEnd : undefined}
            >
              {/* Renderizar arestas (conexões) */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <defs>
                  <marker
                    id="arrowhead"
                    markerWidth="10"
                    markerHeight="7"
                    refX="9"
                    refY="3.5"
                    orient="auto"
                  >
                    <polygon points="0 0, 10 3.5, 0 7" fill="#0EA5E9" />
                  </marker>
                </defs>
                {workflow.edges.map(renderEdge)}
              </svg>
              
              {/* Renderizar nós */}
              {workflow.nodes.map(renderNode)}
              
              {/* Mensagem inicial quando não há nós */}
              {workflow.nodes.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <p>Seu fluxo está vazio</p>
                    <p className="text-sm">Adicione nós usando os botões acima</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Painel de propriedades */}
        {renderNodeEditor()}
      </div>
      
      {/* Preview (Contexto Escuro) */}
      <div 
        id="preview-panel" 
        className={`${mode === 'edit' ? 'hidden' : 'block'} col-span-3`}
      >
        <div className="bg-black text-white rounded-lg shadow-xl overflow-hidden flex flex-col h-full">
          {/* Barra de título */}
          <div className="p-4 flex justify-between items-center border-b border-gray-800">
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-medium">Visualização do Agente</h2>
              <span className="text-xs px-2 py-0.5 rounded bg-blue-900 text-blue-200">Imersivo</span>
            </div>
            
            <button 
              onClick={handleToggleMode}
              className="px-3 py-1.5 bg-white text-black text-sm rounded-md hover:bg-gray-200 transition-colors"
            >
              Voltar ao Editor
            </button>
          </div>
          
          {/* Área de preview */}
          <div className="flex-1 relative p-6">
            {/* Canvas de visualização abstrata */}
            <canvas 
              id="preview-visualization" 
              className="absolute inset-0 opacity-80"
              ref={previewRef}
            ></canvas>
            
            {/* Preview de chat */}
            <div className="h-full flex flex-col md:flex-row gap-6 relative z-10">
              <div className="flex-1 flex items-center justify-center">
                {renderChatPreview()}
              </div>
              
              <div className="flex-1 flex flex-col">
                {/* Informações de estado do agente */}
                <div className="bg-gray-900 bg-opacity-70 rounded-lg p-4 mb-4">
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Estado do Agente</h3>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full bg-blue-500 bg-opacity-20 flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full bg-blue-500 thinking-indicator"></div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-300">
                        {selectedNode 
                          ? `Executando "${workflow.nodes.find(n => n.id === selectedNode)?.title}"`
                          : 'Aguardando interação'
                        }
                      </p>
                      <div className="mt-2 h-1 bg-gray-700 rounded-full w-56">
                        <div 
                          className="h-1 bg-blue-500 rounded-full" 
                          style={{ width: `${selectedNode ? '45%' : '10%'}` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Resumo do fluxo */}
                <div className="bg-gray-900 bg-opacity-70 rounded-lg p-4 flex-1">
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Resumo do Fluxo</h3>
                  
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center">
                      <span className="w-5 h-5 rounded-full bg-green-500 mr-2 flex items-center justify-center text-[10px]">✓</span>
                      <span>Total de nós: {workflow.nodes.length}</span>
                    </li>
                    <li className="flex items-center">
                      <span className="w-5 h-5 rounded-full bg-blue-500 mr-2 flex items-center justify-center text-[10px]">✓</span>
                      <span>Nó inicial: {workflow.startNodeId ? workflow.nodes.find(n => n.id === workflow.startNodeId)?.title : 'Não definido'}</span>
                    </li>
                    <li className="flex items-center">
                      <span className="w-5 h-5 rounded-full bg-purple-500 mr-2 flex items-center justify-center text-[10px]">✓</span>
                      <span>Conexões: {workflow.edges.length}</span>
                    </li>
                  </ul>
                  
                  {workflow.nodes.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-xs font-medium text-gray-500 mb-2">Tipos de Nós</h4>
                      <div className="flex gap-1">
                        {['message', 'input', 'condition', 'api', 'action'].map(type => {
                          const count = workflow.nodes.filter(n => n.type === type).length;
                          if (count === 0) return null;
                          
                          // Definir cor para cada tipo de nó
                          const colors: {[key: string]: string} = {
                            message: 'bg-blue-600',
                            input: 'bg-purple-600',
                            condition: 'bg-amber-500',
                            api: 'bg-green-600',
                            action: 'bg-red-600'
                          };
                          
                          return (
                            <div 
                              key={type}
                              className={`${colors[type]} h-6 rounded-sm flex items-center justify-center px-2`}
                              style={{ width: `${Math.max(count * 15, 30)}px` }}
                            >
                              <span className="text-xs text-white">{count}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkflowEditor;