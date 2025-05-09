'use client';

import { useState, useRef, useEffect } from 'react';
import ChatMonitoring from '../tracking/ChatMonitoring';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface AgentChatInterfaceProps {
  agentId: string;
  userId: string;
}

export default function AgentChatInterface({ agentId, userId }: AgentChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'system', content: 'Chat started.' }
  ]);
  const [input, setInput] = useState('');
  const [threadId, setThreadId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    // Add user message
    const userMessage = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    
    // Simulate API call to get AI response
    try {
      // Simulate loading time
      setTimeout(() => {
        const aiResponse = { 
          role: 'assistant', 
          content: `This is a simulated response to "${input.trim()}". In a real implementation, this would come from the Superagent API.` 
        };
        setMessages(prev => [...prev, aiResponse]);
      }, 1000);
    } catch (error) {
      console.error('Error getting AI response:', error);
      setMessages(prev => [...prev, { 
        role: 'system', 
        content: 'Error: Failed to get a response.' 
      }]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen max-h-screen w-full overflow-hidden">
      {/* Include the monitoring component */}
      <ChatMonitoring
        agentId={agentId}
        userId={userId}
        onThreadCreated={id => setThreadId(id)}
      />

      <div className="flex-1 overflow-y-auto p-4 space-y-4 w-full">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`p-3 rounded-lg ${
              message.role === 'user'
                ? 'bg-blue-100 ml-auto max-w-md'
                : message.role === 'assistant'
                  ? 'bg-gray-100 max-w-md'
                  : 'bg-yellow-100 text-sm max-w-md mx-auto'
            }`}
          >
            {message.content}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="border-t p-4 w-full">
        <div className="flex space-x-2 w-full">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message here..."
            className="flex-1 p-2 border rounded-md w-full"
            rows={2}
          />
          <button
            onClick={handleSendMessage}
            className="px-4 py-2 bg-blue-500 text-white rounded-md whitespace-nowrap"
          >
            Send
          </button>
        </div>
        <div className="text-xs text-gray-500 mt-2">
          {threadId ? `LiteralAI Thread ID: ${threadId}` : 'Initializing tracking...'}
        </div>
      </div>
    </div>
  );
}