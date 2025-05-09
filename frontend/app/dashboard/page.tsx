export default function DashboardPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Agents</h2>
          <p className="text-gray-600 mb-4">Manage your AI agents and their configurations</p>
          <a href="/dashboard/agents" className="text-blue-600 hover:text-blue-800">View agents →</a>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Tracking</h2>
          <p className="text-gray-600 mb-4">Monitor conversation analytics and performance</p>
          <a href="/dashboard/tracking" className="text-blue-600 hover:text-blue-800">View tracking →</a>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Superagent</h2>
          <p className="text-gray-600 mb-4">Manage your Superagent integration settings</p>
          <a href="/dashboard/superagent" className="text-blue-600 hover:text-blue-800">View superagent →</a>
        </div>
      </div>
    </div>
  );
}