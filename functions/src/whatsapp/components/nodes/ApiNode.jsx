/**
 * Componente de Nó de API para o Editor de Fluxo
 * Representa uma chamada a API externa
 */

import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

function ApiNode({ data, isConnectable, selected }) {
  // Estilo do nó
  const nodeStyle = {
    padding: '10px 15px',
    borderRadius: '8px',
    background: 'linear-gradient(to right, rgba(239, 68, 68, 0.15), rgba(239, 68, 68, 0.05))',
    border: '2px solid #EF4444',
    boxShadow: selected ? '0 0 0 2px rgba(239, 68, 68, 0.3)' : 'none',
    width: '220px',
  };

  // Estilo do handle (ponto de conexão)
  const handleStyle = {
    background: '#EF4444',
    width: '8px',
    height: '8px',
    border: '1px solid white',
  };
  
  // Badge de método HTTP
  const getMethodBadge = () => {
    const method = data.method || 'GET';
    let bgColor;
    
    switch(method) {
      case 'GET':
        bgColor = 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
        break;
      case 'POST':
        bgColor = 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
        break;
      case 'PUT':
        bgColor = 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
        break;
      case 'DELETE':
        bgColor = 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
        break;
      default:
        bgColor = 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
    
    return (
      <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ${bgColor}`}>
        {method}
      </span>
    );
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
        <div className="flex items-center justify-between font-medium text-sm mb-2">
          <span>{data.label || 'API'}</span>
          {getMethodBadge()}
        </div>
        
        <div className="text-xs text-gray-600 dark:text-gray-300 mb-2 overflow-hidden text-ellipsis">
          Endpoint: {data.endpoint || 'https://api.exemplo.com'}
        </div>
        
        {data.resultVariable && (
          <div className="text-xs bg-red-50 dark:bg-red-900/30 p-1 rounded font-mono">
            var: {data.resultVariable}
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

export default memo(ApiNode);