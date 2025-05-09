'use client';

import { useState, useEffect } from 'react';

export default function SimpleTrackingPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Rastreamento de Conversas LiteralAI</h1>
      
      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-6">
        <p className="text-yellow-700">
          Esta é uma página de demonstração da integração LiteralAI. Para testar a funcionalidade completa:
        </p>
        <ol className="list-decimal ml-5 mt-2 text-yellow-700">
          <li>Configure corretamente as chaves de API para Clerk e Firebase</li>
          <li>Use o componente de chat para gerar dados de rastreamento</li>
          <li>Retorne a esta página para visualizar as análises</li>
        </ol>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Demo - Lista de threads */}
        <div className="bg-white rounded-lg shadow p-4 md:col-span-1">
          <h2 className="text-lg font-semibold mb-4">Conversas (Demo)</h2>
          
          <ul className="divide-y divide-gray-200">
            {[1, 2, 3].map((id) => (
              <li 
                key={id} 
                className="py-2 px-2 cursor-pointer hover:bg-gray-50 rounded"
              >
                <p className="font-medium">Conversa com Agente {id}</p>
                <p className="text-sm text-gray-500">
                  {new Date().toLocaleString()}
                </p>
                <p className="text-xs text-gray-400">
                  Agente: agent-{id}
                </p>
              </li>
            ))}
          </ul>
        </div>

        {/* Demo - Timeline */}
        <div className="bg-white rounded-lg shadow p-4 md:col-span-2">
          <h2 className="text-lg font-semibold mb-2">Conversa com Agente 1</h2>
          <p className="text-sm text-gray-500 mb-4">
            Criado em {new Date().toLocaleString()}
          </p>

          <h3 className="font-medium mt-6 mb-2">Timeline</h3>
          <div className="space-y-3">
            <div className="border rounded-lg p-3 bg-blue-100 border-blue-200">
              <div className="flex justify-between items-start">
                <h4 className="font-medium">Mensagem do usuário</h4>
                <span className="text-xs bg-white px-2 py-1 rounded-full">
                  Entrada
                </span>
              </div>
              
              <p className="text-sm text-gray-700 mt-2">
                Como posso integrar o LiteralAI com o Next.js?
              </p>
              
              <div className="mt-2 text-xs text-gray-500">
                {new Date().toLocaleString()}
              </div>
            </div>
            
            <div className="border rounded-lg p-3 bg-green-100 border-green-200">
              <div className="flex justify-between items-start">
                <h4 className="font-medium">Resposta do assistente</h4>
                <span className="text-xs bg-white px-2 py-1 rounded-full">
                  Saída
                </span>
              </div>
              
              <p className="text-sm text-gray-700 mt-2">
                Para integrar o LiteralAI com Next.js, você pode instalar a biblioteca oficial @literalai/client e configurar o cliente com sua API key. Depois, use o componente de rastreamento para monitorar interações do usuário.
              </p>
              
              <div className="mt-2 text-xs text-gray-500">
                {new Date().toLocaleString()}
              </div>
            </div>
            
            <div className="border rounded-lg p-3 bg-purple-100 border-purple-200">
              <div className="flex justify-between items-start">
                <h4 className="font-medium">Recuperação de conhecimento</h4>
                <span className="text-xs bg-white px-2 py-1 rounded-full">
                  Recuperação
                </span>
              </div>
              
              <p className="text-sm text-gray-700 mt-2">
                Consulta: "LiteralAI Next.js integration"
              </p>
              
              <div className="mt-2 text-xs text-gray-500">
                {new Date().toLocaleString()}
              </div>
              
              <details className="mt-2">
                <summary className="text-xs text-gray-500 cursor-pointer">
                  Metadados
                </summary>
                <pre className="mt-1 text-xs bg-gray-50 p-2 rounded overflow-x-auto">
{JSON.stringify({
  "sources": [
    { "title": "LiteralAI Documentation", "url": "https://docs.literal.ai" }
  ],
  "timestamp": new Date().toISOString()
}, null, 2)}
                </pre>
              </details>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}