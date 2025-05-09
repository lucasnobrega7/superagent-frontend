/**
 * Componente de Nó de Ação para o Editor de Fluxo
 * Representa a execução de uma ação personalizada ou script
 */

import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

function ActionNode({ data, isConnectable, selected }) {
  // Estilo do nó
  const nodeStyle = {
    padding: '10px 15px',
    borderRadius: '8px',
    background: 'linear-gradient(to right, rgba(16, 185, 129, 0.15), rgba(16, 185, 129, 0.05))',
    border: '2px solid #10B981',
    boxShadow: selected ? '0 0 0 2px rgba(16, 185, 129, 0.3)' : 'none',
    width: '220px',
  };

  // Estilo do handle (ponto de conexão)
  const handleStyle = {
    background: '#10B981',
    width: '8px',
    height: '8px',
    border: '1px solid white',
  };
  
  // Ícone baseado no tipo de ação
  const getActionTypeIcon = () => {
    switch(data.actionType) {
      case 'webhook':
        return '🔗';
      case 'function':
        return '⚙️';
      case 'script':
      default:
        return '📝';
    }
  };

  return (
    <div style={nodeStyle}>
      {/* Handle de entrada (topo) */}
      <Handle
        type="target"
        position={Position.Top}
        style={handleStyle}
        isConnectable={isConnectable}
      />
      
      {/* Conteúdo do nó */}
      <div>
        <div className="flex items-center font-medium text-sm mb-1">
          <span className="mr-1">{getActionTypeIcon()}</span>
          <span>{data.label || 'Ação'}</span>
        </div>
        
        <div className="text-xs text-gray-600 dark:text-gray-300 mb-2">
          Tipo: {data.actionType || 'script'}
        </div>
        
        {data.script && (
          <div className="text-xs bg-green-50 dark:bg-green-900/30 p-1 rounded font-mono overflow-hidden" style={{ maxHeight: '40px', textOverflow: 'ellipsis' }}>
            {data.script.slice(0, 50)}{data.script.length > 50 ? '...' : ''}
          </div>
        )}
      </div>
      
      {/* Handle de saída (base) */}
      <Handle
        type="source"
        position={Position.Bottom}
        style={handleStyle}
        isConnectable={isConnectable}
      />
    </div>
  );
}

export default memo(ActionNode);