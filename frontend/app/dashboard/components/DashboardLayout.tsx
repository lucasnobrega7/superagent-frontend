import React from 'react';

type DashboardLayoutProps = {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return (
    <div className="dashboard-container">
      <header className="w-full bg-white border-b border-gray-200 py-4 px-6 shadow-sm">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-800">Dashboard</h1>
          <nav className="flex space-x-4">
            <a href="/dashboard/agents" className="text-gray-600 hover:text-gray-900">Agents</a>
            <a href="/dashboard/tracking" className="text-gray-600 hover:text-gray-900">Tracking</a>
            <a href="/dashboard/superagent" className="text-gray-600 hover:text-gray-900">Superagent</a>
          </nav>
        </div>
      </header>
      
      <div className="content-container">
        {children}
      </div>
    </div>
  );
}

export default DashboardLayout;