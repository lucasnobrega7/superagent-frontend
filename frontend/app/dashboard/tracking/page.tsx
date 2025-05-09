'use client';

import { useEffect, useState } from 'react';
import { literalAIClient, Thread, Step } from '../../../lib/literalai-fetch';

export default function TrackingDashboard() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchThreads() {
      try {
        const threads = await literalAIClient.getProjectThreads();
        setThreads(threads);
        setLoading(false);
        
        // Auto-select the first thread
        if (threads.length > 0) {
          setSelectedThread(threads[0]);
        }
      } catch (error) {
        console.error('Error fetching threads:', error);
        setLoading(false);
      }
    }
    
    fetchThreads();
  }, []);

  useEffect(() => {
    async function fetchSteps() {
      if (!selectedThread) return;
      
      try {
        setLoading(true);
        const steps = await literalAIClient.getThreadSteps(selectedThread.id);
        setSteps(steps);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching steps:', error);
        setLoading(false);
      }
    }
    
    if (selectedThread) {
      fetchSteps();
    }
  }, [selectedThread]);

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">LiteralAI Tracking Dashboard</h1>
      
      {loading ? (
        <div className="text-center">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="col-span-1 border rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-2">Conversations</h2>
            {threads.length === 0 ? (
              <p className="text-gray-500">No conversations found.</p>
            ) : (
              <ul className="space-y-2">
                {threads.map((thread) => (
                  <li 
                    key={thread.id}
                    onClick={() => setSelectedThread(thread)}
                    className={`cursor-pointer p-2 rounded ${
                      selectedThread?.id === thread.id 
                        ? 'bg-blue-100' 
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <div className="font-medium">Thread {thread.id.split('-')[1]}</div>
                    <div className="text-xs text-gray-500">
                      {thread.metadata?.created 
                        ? formatTimestamp(thread.metadata.created)
                        : 'No timestamp'}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          <div className="col-span-2 border rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-2">Conversation Details</h2>
            {!selectedThread ? (
              <p className="text-gray-500">Select a conversation to view details.</p>
            ) : (
              <div>
                <div className="mb-4 p-2 bg-gray-100 rounded">
                  <h3 className="font-medium">Thread ID: {selectedThread.id}</h3>
                  <div className="text-sm">
                    {selectedThread.metadata && (
                      <pre className="whitespace-pre-wrap text-xs mt-2">
                        {JSON.stringify(selectedThread.metadata, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
                
                <h3 className="font-medium mb-2">Messages</h3>
                {steps.length === 0 ? (
                  <p className="text-gray-500">No messages in this conversation.</p>
                ) : (
                  <div className="space-y-3">
                    {steps.map((step) => (
                      <div 
                        key={step.id}
                        className={`p-3 rounded-lg ${
                          step.type === 'human' 
                            ? 'bg-blue-100' 
                            : step.type === 'ai' 
                              ? 'bg-gray-100' 
                              : 'bg-yellow-100 text-sm'
                        }`}
                      >
                        <div className="flex justify-between">
                          <span className="font-medium capitalize">{step.type}</span>
                          {step.metadata?.timestamp && (
                            <span className="text-xs text-gray-500">
                              {formatTimestamp(step.metadata.timestamp)}
                            </span>
                          )}
                        </div>
                        <div className="mt-1">{step.content}</div>
                        {step.metadata && Object.keys(step.metadata).length > 0 && (
                          <details className="mt-2">
                            <summary className="text-xs text-gray-500 cursor-pointer">
                              Metadata
                            </summary>
                            <pre className="whitespace-pre-wrap text-xs mt-1 p-1 bg-gray-50 rounded">
                              {JSON.stringify(step.metadata, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}