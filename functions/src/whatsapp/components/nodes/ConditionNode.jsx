/**
 * Componente de Nó de Condição para o Editor de Fluxo
 * Representa uma bifurcação no fluxo baseada em uma condição
 */

import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

function ConditionNode({ data, isConnectable, selected }) {
  // Estilo do nó
  const nodeStyle = {
    padding: '10px 15px',
    borderRadius: '8px',
    background: 'linear-gradient(to right, rgba(245, 158, 11, 0.15), rgba(245, 158, 11, 0.05))',
    border: '2px solid #F59E0B',
    boxShadow: selected ? '0 0 0 2px rgba(245, 158, 11, 0.3)' : 'none',
    width: '220px',
  };

  // Estilo do handle (ponto de conexão)
  const handleStyle = {
    background: '#F59E0B',
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
        <div className="font-medium text-sm mb-1">{data.label || 'Condição'}</div>
        <div className="text-xs text-gray-600 dark:text-gray-300 font-mono bg-amber-50 dark:bg-amber-900/30 p-1 rounded mb-2">
          {data.condition || 'variavel == "valor"'}
        </div>
        
        <div className="flex justify-between text-xs mt-2">
          <div className="flex items-center">
            <div className="w-2 h-2 rounded-full bg-green-500 mr-1"></div>
            <span>{data.trueLabel || 'Sim'}</span>
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 rounded-full bg-red-500 mr-1"></div>
            <span>{data.falseLabel || 'Não'}</span>
          </div>
        </div>
      </div>
      
      {/* Handle de saída Verdadeiro (esquerda) */}
      <Handle
        type="source"
        position={Position.Left}
        id="true"
        style={{ ...handleStyle, background: '#10B981' }}
        isConnectable={isConnectable}
      />
      
      {/* Handle de saída Falso (direita) */}
      <Handle
        type="source"
        position={Position.Right}
        id="false"
        style={{ ...handleStyle, background: '#EF4444' }}
        isConnectable={isConnectable}
      />
    </div>
  );
}

export default memo(ConditionNode);