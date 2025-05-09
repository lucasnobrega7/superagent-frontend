import Link from 'next/link'

export default function Home() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-4xl font-bold mb-8">Superagent Project with LiteralAI</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/chat" className="block p-6 bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100">
          <h2 className="text-2xl font-semibold mb-2">Chat Demo</h2>
          <p>Test the chat interface with LiteralAI tracking</p>
        </Link>
        
        <Link href="/dashboard/tracking" className="block p-6 bg-purple-50 rounded-lg border border-purple-200 hover:bg-purple-100">
          <h2 className="text-2xl font-semibold mb-2">Tracking Dashboard</h2>
          <p>View conversation analytics and monitoring</p>
        </Link>
      </div>
      
      <div className="mt-12 p-6 bg-gray-50 rounded-lg border border-gray-200">
        <h2 className="text-2xl font-semibold mb-4">About This Demo</h2>
        <p className="mb-4">
          This demo showcases the integration of LiteralAI tracking with a Superagent-based chat interface. 
          It demonstrates how to monitor and analyze AI interactions in real-time.
        </p>
        <p>
          <strong>Features:</strong>
        </p>
        <ul className="list-disc ml-6 space-y-1">
          <li>Conversation tracking with LiteralAI</li>
          <li>Real-time message monitoring</li>
          <li>Analytics dashboard</li>
          <li>Demo mode that works without API keys</li>
        </ul>
      </div>
    </div>
  )
}