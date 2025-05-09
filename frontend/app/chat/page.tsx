import AgentChatInterface from '../../components/chat/AgentChatInterface';

export default function ChatPage() {
  // In a real implementation, these would come from authentication
  const demoAgentId = 'agent-demo-123';
  const demoUserId = 'user-demo-456';
  
  return (
    <div className="container mx-auto p-4 h-screen">
      <h1 className="text-2xl font-bold mb-4">Chat with Agent</h1>
      <div className="h-[calc(100vh-120px)] border rounded-lg overflow-hidden">
        <AgentChatInterface 
          agentId={demoAgentId}
          userId={demoUserId}
        />
      </div>
    </div>
  );
}