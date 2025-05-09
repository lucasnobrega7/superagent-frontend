/**
 * Componente de Nó de Entrada para o Editor de Fluxo
 * Representa a coleta de uma entrada do usuário
 */

import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

function InputNode({ data, isConnectable, selected }) {
  // Estilo do nó
  const nodeStyle = {
    padding: '10px 15px',
    borderRadius: '8px',
    background: 'linear-gradient(to right, rgba(139, 92, 246, 0.15), rgba(139, 92, 246, 0.05))',
    border: '2px solid #8B5CF6',
    boxShadow: selected ? '0 0 0 2px rgba(139, 92, 246, 0.3)' : 'none',
    width: '220px',
  };

  // Estilo do handle (ponto de conexão)
  const handleStyle = {
    background: '#8B5CF6',
    width: '8px',
    height: '8px',
    border: '1px solid white',
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
        <div className="font-medium text-sm mb-1">{data.label || 'Entrada'}</div>
        <div className="text-xs text-gray-600 dark:text-gray-300 mb-2">
          {data.question || 'Digite sua pergunta aqui...'}
        </div>
        
        {data.variableName && (
          <div className="text-xs bg-purple-50 dark:bg-purple-900/30 p-1 rounded font-mono">
            var: {data.variableName}
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

export default memo(InputNode);