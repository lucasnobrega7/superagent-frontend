/**
 * Componente de Nó de Mensagem para o Editor de Fluxo
 * Representa uma mensagem enviada pelo agente para o usuário
 */

import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

function MessageNode({ data, isConnectable, selected }) {
  // Estilo do nó
  const nodeStyle = {
    padding: '10px 15px',
    borderRadius: '8px',
    background: 'linear-gradient(to right, rgba(14, 165, 233, 0.15), rgba(14, 165, 233, 0.05))',
    border: '2px solid #0EA5E9',
    boxShadow: selected ? '0 0 0 2px rgba(14, 165, 233, 0.3)' : 'none',
    width: '220px',
  };

  // Estilo do handle (ponto de conexão)
  const handleStyle = {
    background: '#0EA5E9',
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
        <div className="font-medium text-sm mb-1">{data.label || 'Mensagem'}</div>
        <div className="text-xs text-gray-600 dark:text-gray-300 overflow-hidden text-ellipsis" style={{ maxHeight: '60px' }}>
          {data.content || 'Conteúdo da mensagem'}
        </div>
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

export default memo(MessageNode);