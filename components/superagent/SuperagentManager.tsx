'use client';

import { useState, useEffect } from 'react';
import ApiFunctionsClient, { 
  Agent, 
  AgentInput,
  Datasource,
  LLMModel,
  Tool
} from '../../app/lib/api-functions-client';
import { uploadToFirebaseStorage } from '../../app/lib/firebase-storage';

export default function SuperagentManager() {
  // State for agents
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [newAgentData, setNewAgentData] = useState<AgentInput>({
    name: '',
    description: '',
    initialMessage: 'How can I help you today?',
    llmModel: '',
    isPublic: false
  });
  
  // State for LLMs
  const [llms, setLLMs] = useState<LLMModel[]>([]);
  const [newLLMData, setNewLLMData] = useState<{
    provider: string;
    model: string;
    apiKey?: string;
  }>({
    provider: '',
    model: '',
    apiKey: ''
  });
  
  // State for datasources
  const [datasources, setDatasources] = useState<Datasource[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileUploadName, setFileUploadName] = useState('');
  const [fileUploadDescription, setFileUploadDescription] = useState('');
  const [storageUrl, setStorageUrl] = useState<string | null>(null);
  
  // State for tools
  const [tools, setTools] = useState<Tool[]>([]);
  
  // State for chat
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
  
  // State for loading indicators
  const [loading, setLoading] = useState({
    agents: false,
    llms: false,
    datasources: false,
    tools: false,
    createAgent: false,
    createLLM: false,
    uploadFile: false,
    uploadToStorage: false,
    chat: false
  });
  
  // State for errors
  const [error, setError] = useState<string | null>(null);
  
  // Maximum allowed file size in bytes (10MB)
  const MAX_FILE_SIZE = 10 * 1024 * 1024;
  
  // Load initial data
  useEffect(() => {
    loadAgents();
    loadLLMs();
    loadDatasources();
    loadTools();
  }, []);
  
  // Load agents
  const loadAgents = async () => {
    try {
      setLoading(prev => ({ ...prev, agents: true }));
      const agentsList = await ApiFunctionsClient.listAgents();
      setAgents(agentsList);
      setError(null);
    } catch (err) {
      console.error('Error loading agents:', err);
      let errorMessage = 'Failed to load agents';
      
      if (err instanceof Error) {
        errorMessage += `: ${err.message}`;
      } else if (typeof err === 'string') {
        errorMessage += `: ${err}`;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(prev => ({ ...prev, agents: false }));
    }
  };
  
  // Load LLMs
  const loadLLMs = async () => {
    try {
      setLoading(prev => ({ ...prev, llms: true }));
      const llmsList = await ApiFunctionsClient.listLLMs();
      setLLMs(llmsList);
      setError(null);
    } catch (err) {
      console.error('Error loading LLMs:', err);
      let errorMessage = 'Failed to load LLMs';
      
      if (err instanceof Error) {
        errorMessage += `: ${err.message}`;
      } else if (typeof err === 'string') {
        errorMessage += `: ${err}`;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(prev => ({ ...prev, llms: false }));
    }
  };
  
  // Load datasources
  const loadDatasources = async () => {
    try {
      setLoading(prev => ({ ...prev, datasources: true }));
      const datasourcesList = await ApiFunctionsClient.listDatasources();
      setDatasources(datasourcesList);
      setError(null);
    } catch (err) {
      console.error('Error loading datasources:', err);
      let errorMessage = 'Failed to load datasources';
      
      if (err instanceof Error) {
        errorMessage += `: ${err.message}`;
      } else if (typeof err === 'string') {
        errorMessage += `: ${err}`;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(prev => ({ ...prev, datasources: false }));
    }
  };
  
  // Load tools
  const loadTools = async () => {
    try {
      setLoading(prev => ({ ...prev, tools: true }));
      const toolsList = await ApiFunctionsClient.listTools();
      setTools(toolsList);
      setError(null);
    } catch (err) {
      console.error('Error loading tools:', err);
      let errorMessage = 'Failed to load tools';
      
      if (err instanceof Error) {
        errorMessage += `: ${err.message}`;
      } else if (typeof err === 'string') {
        errorMessage += `: ${err}`;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(prev => ({ ...prev, tools: false }));
    }
  };
  
  // Create agent
  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(prev => ({ ...prev, createAgent: true }));
      const createdAgent = await ApiFunctionsClient.createAgent(newAgentData);
      setAgents(prev => [...prev, createdAgent]);
      
      // Reset form
      setNewAgentData({
        name: '',
        description: '',
        initialMessage: 'How can I help you today?',
        llmModel: '',
        isPublic: false
      });
      
      setError(null);
    } catch (err) {
      console.error('Error creating agent:', err);
      let errorMessage = 'Failed to create agent';
      
      if (err instanceof Error) {
        errorMessage += `: ${err.message}`;
      } else if (typeof err === 'string') {
        errorMessage += `: ${err}`;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(prev => ({ ...prev, createAgent: false }));
    }
  };
  
  // Handle file upload
  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile || !fileUploadName) {
      setError('Please select a file and provide a name');
      return;
    }
    
    try {
      // First, upload to Firebase Storage
      setLoading(prev => ({ ...prev, uploadToStorage: true }));
      let firebaseUrl = '';
      
      try {
        // Upload to Firebase Storage with path based on file type
        const fileType = selectedFile.type.split('/')[0] || 'unknown';
        firebaseUrl = await uploadToFirebaseStorage(selectedFile, `datasources/${fileType}`);
        setStorageUrl(firebaseUrl);
        console.log('File uploaded to Firebase Storage:', firebaseUrl);
      } catch (storageErr) {
        console.error('Error uploading to Firebase Storage:', storageErr);
        // Continue with Superagent upload even if Firebase Storage fails
      } finally {
        setLoading(prev => ({ ...prev, uploadToStorage: false }));
      }
      
      // Then upload to Superagent through Firebase Functions
      setLoading(prev => ({ ...prev, uploadFile: true }));
      const uploadedDatasource = await ApiFunctionsClient.uploadFile(
        selectedFile, 
        fileUploadName,
        fileUploadDescription
      );
      
      // If we have a Firebase Storage URL, store it in a custom field
      if (firebaseUrl) {
        console.log('Storing Firebase Storage URL with datasource data');
        // Note: In a real implementation, you would update the datasource in Firestore
        // to associate it with the Firebase Storage URL
      }
      
      setDatasources(prev => [...prev, uploadedDatasource]);
      
      // Reset form
      setSelectedFile(null);
      setFileUploadName('');
      setFileUploadDescription('');
      setStorageUrl(null);
      
      setError(null);
    } catch (err) {
      console.error('Error uploading file:', err);
      let errorMessage = 'Failed to upload file';
      
      if (err instanceof Error) {
        errorMessage += `: ${err.message}`;
      } else if (typeof err === 'string') {
        errorMessage += `: ${err}`;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(prev => ({ ...prev, uploadFile: false }));
    }
  };
  
  // Send message to agent
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedAgent || !chatInput.trim()) {
      setError('Please select an agent and enter a message');
      return;
    }
    
    // Add user message to chat history
    setChatHistory(prev => [...prev, { role: 'user', content: chatInput }]);
    
    try {
      setLoading(prev => ({ ...prev, chat: true }));
      
      // Generate a unique session ID (in a real app, you would persist this)
      const sessionId = `session_${Date.now()}`;
      
      const response = await ApiFunctionsClient.invokeAgent({
        id: selectedAgent.id,
        input: chatInput,
        sessionId
      });
      
      // Add agent response to chat history
      setChatHistory(prev => [...prev, { role: 'assistant', content: response.output }]);
      
      // Clear chat input
      setChatInput('');
      
      setError(null);
    } catch (err) {
      console.error('Error invoking agent:', err);
      let errorMessage = 'Failed to get response from agent';
      
      if (err instanceof Error) {
        errorMessage += `: ${err.message}`;
      } else if (typeof err === 'string') {
        errorMessage += `: ${err}`;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(prev => ({ ...prev, chat: false }));
    }
  };
  
  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Check file size before setting it
      if (file.size > MAX_FILE_SIZE) {
        setError(`O arquivo é muito grande. O tamanho máximo permitido é ${MAX_FILE_SIZE / (1024 * 1024)}MB.`);
        e.target.value = ''; // Reset the input
        return;
      }
      
      setSelectedFile(file);
      setError(null); // Clear any previous errors
    }
  };
  
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Superagent Manager</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Agents Section */}
        <div className="border rounded-lg p-4 shadow-sm">
          <h2 className="text-xl font-semibold mb-3">Agents</h2>
          
          {/* Create Agent Form */}
          <div className="mb-6 border-b pb-4">
            <h3 className="text-lg font-medium mb-2">Create Agent</h3>
            <form onSubmit={handleCreateAgent}>
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={newAgentData.name}
                  onChange={(e) => setNewAgentData({ ...newAgentData, name: e.target.value })}
                  className="w-full border rounded p-2"
                  required
                />
              </div>
              
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={newAgentData.description}
                  onChange={(e) => setNewAgentData({ ...newAgentData, description: e.target.value })}
                  className="w-full border rounded p-2"
                  rows={3}
                  required
                />
              </div>
              
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">Initial Message</label>
                <input
                  type="text"
                  value={newAgentData.initialMessage}
                  onChange={(e) => setNewAgentData({ ...newAgentData, initialMessage: e.target.value })}
                  className="w-full border rounded p-2"
                />
              </div>
              
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">LLM Model</label>
                <select
                  value={newAgentData.llmModel}
                  onChange={(e) => setNewAgentData({ ...newAgentData, llmModel: e.target.value })}
                  className="w-full border rounded p-2"
                  required
                >
                  <option value="">Select Model</option>
                  {llms.map((llm) => (
                    <option key={llm.id} value={llm.id}>
                      {llm.provider} - {llm.model}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="mb-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newAgentData.isPublic}
                    onChange={(e) => setNewAgentData({ ...newAgentData, isPublic: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium">Public Agent</span>
                </label>
              </div>
              
              <button
                type="submit"
                className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
                disabled={loading.createAgent}
              >
                {loading.createAgent ? 'Creating...' : 'Create Agent'}
              </button>
            </form>
          </div>
          
          {/* Agent List */}
          <div>
            <h3 className="text-lg font-medium mb-2">Your Agents</h3>
            {loading.agents ? (
              <p>Loading agents...</p>
            ) : agents.length > 0 ? (
              <div className="space-y-2">
                {agents.map((agent) => (
                  <div
                    key={agent.id}
                    className={`p-3 border rounded cursor-pointer hover:bg-gray-50 ${
                      selectedAgent?.id === agent.id ? 'bg-blue-50 border-blue-300' : ''
                    }`}
                    onClick={() => setSelectedAgent(agent)}
                  >
                    <h4 className="font-medium">{agent.name}</h4>
                    <p className="text-sm text-gray-600">{agent.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {agent.isPublic ? 'Public' : 'Private'} • Created: {new Date(agent.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No agents found. Create one above.</p>
            )}
          </div>
        </div>
        
        {/* Knowledge & Chat Section */}
        <div className="border rounded-lg p-4 shadow-sm">
          {/* File Upload Form */}
          <div className="mb-6 border-b pb-4">
            <h3 className="text-lg font-medium mb-2">Upload Knowledge</h3>
            <form onSubmit={handleFileUpload}>
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">File</label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="w-full border rounded p-2"
                  accept=".pdf,.csv,.txt"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Supported formats: PDF, CSV, TXT. Maximum size: {MAX_FILE_SIZE / (1024 * 1024)}MB
                </p>
              </div>
              
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={fileUploadName}
                  onChange={(e) => setFileUploadName(e.target.value)}
                  className="w-full border rounded p-2"
                  required
                />
              </div>
              
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={fileUploadDescription}
                  onChange={(e) => setFileUploadDescription(e.target.value)}
                  className="w-full border rounded p-2"
                  rows={2}
                />
              </div>
              
              <div>
                <button
                  type="submit"
                  className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition-colors"
                  disabled={loading.uploadFile || loading.uploadToStorage}
                >
                  {loading.uploadToStorage ? 'Uploading to Storage...' : 
                   loading.uploadFile ? 'Uploading to Superagent...' : 'Upload File'}
                </button>
                
                {storageUrl && (
                  <div className="mt-2 text-xs text-gray-600">
                    <p>Backup stored in Firebase Storage</p>
                    <a href={storageUrl} target="_blank" rel="noopener noreferrer" 
                      className="text-blue-500 hover:underline truncate block">
                      {storageUrl}
                    </a>
                  </div>
                )}
              </div>
            </form>
          </div>
          
          {/* Chat Interface */}
          <div>
            <h3 className="text-lg font-medium mb-2">Chat with Agent</h3>
            
            {!selectedAgent ? (
              <p className="text-gray-500">Select an agent to start chatting</p>
            ) : (
              <>
                <div className="border rounded-lg p-3 mb-4 h-64 overflow-y-auto">
                  {chatHistory.length === 0 ? (
                    <p className="text-center text-gray-500 my-10">
                      Start a conversation with {selectedAgent.name}
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {chatHistory.map((message, index) => (
                        <div
                          key={index}
                          className={`p-2 rounded-lg ${
                            message.role === 'user'
                              ? 'bg-blue-100 ml-10'
                              : 'bg-gray-100 mr-10'
                          }`}
                        >
                          <p className="text-sm">
                            <span className="font-medium">
                              {message.role === 'user' ? 'You' : selectedAgent.name}:
                            </span>{' '}
                            {message.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <form onSubmit={handleSendMessage} className="flex">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    className="flex-1 border rounded-l-lg p-2"
                    placeholder={`Ask ${selectedAgent.name} something...`}
                    disabled={loading.chat}
                  />
                  <button
                    type="submit"
                    className="bg-blue-600 text-white py-2 px-4 rounded-r-lg hover:bg-blue-700 transition-colors"
                    disabled={loading.chat}
                  >
                    {loading.chat ? 'Sending...' : 'Send'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Data Resources Section */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* LLMs */}
        <div className="border rounded-lg p-4 shadow-sm">
          <h3 className="text-lg font-medium mb-2">LLM Models</h3>
          
          {/* Create LLM Form */}
          <div className="mb-4 border-b pb-4">
            <h4 className="text-md font-medium mb-2">Add New LLM</h4>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (!newLLMData.provider || !newLLMData.model) {
                setError('Provider and model name are required');
                return;
              }
              
              setLoading(prev => ({ ...prev, createLLM: true }));
              ApiFunctionsClient.createLLM(newLLMData)
                .then(createdLLM => {
                  setLLMs(prev => [...prev, createdLLM]);
                  // Reset form
                  setNewLLMData({
                    provider: '',
                    model: '',
                    apiKey: ''
                  });
                  setError(null);
                })
                .catch(err => {
                  console.error('Error creating LLM:', err);
                  let errorMessage = 'Failed to create LLM model';
                  
                  if (err instanceof Error) {
                    errorMessage += `: ${err.message}`;
                  } else if (typeof err === 'string') {
                    errorMessage += `: ${err}`;
                  }
                  
                  setError(errorMessage);
                })
                .finally(() => {
                  setLoading(prev => ({ ...prev, createLLM: false }));
                });
            }}>
              <div className="mb-2">
                <label className="block text-xs font-medium mb-1">Provider</label>
                <input
                  type="text"
                  className="w-full border rounded p-1 text-sm"
                  placeholder="openai, anthropic, etc."
                  value={newLLMData.provider}
                  onChange={(e) => setNewLLMData(prev => ({ ...prev, provider: e.target.value }))}
                  required
                />
              </div>
              
              <div className="mb-2">
                <label className="block text-xs font-medium mb-1">Model</label>
                <input
                  type="text"
                  className="w-full border rounded p-1 text-sm"
                  placeholder="gpt-4, claude-3, etc."
                  value={newLLMData.model}
                  onChange={(e) => setNewLLMData(prev => ({ ...prev, model: e.target.value }))}
                  required
                />
              </div>
              
              <div className="mb-2">
                <label className="block text-xs font-medium mb-1">API Key (optional)</label>
                <input
                  type="password"
                  className="w-full border rounded p-1 text-sm"
                  placeholder="sk-..."
                  value={newLLMData.apiKey || ''}
                  onChange={(e) => setNewLLMData(prev => ({ ...prev, apiKey: e.target.value }))}
                />
              </div>
              
              <button
                type="submit"
                className="bg-purple-600 text-white py-1 px-3 rounded text-sm hover:bg-purple-700 transition-colors"
                disabled={loading.createLLM}
              >
                {loading.createLLM ? 'Adding...' : 'Add LLM'}
              </button>
            </form>
          </div>
          
          {/* LLM List */}
          <h4 className="text-md font-medium mb-2">Available Models</h4>
          {loading.llms ? (
            <p>Loading LLMs...</p>
          ) : llms.length > 0 ? (
            <div className="space-y-2">
              {llms.map((llm) => (
                <div key={llm.id} className="p-2 border rounded">
                  <h4 className="font-medium">{llm.provider}</h4>
                  <p className="text-sm">{llm.model}</p>
                  {llm.apiKey && (
                    <p className="text-xs text-gray-500">API Key: ••••••••</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No LLM models available. Add one above.</p>
          )}
        </div>
        
        {/* Datasources */}
        <div className="border rounded-lg p-4 shadow-sm">
          <h3 className="text-lg font-medium mb-2">Knowledge Sources</h3>
          {loading.datasources ? (
            <p>Loading knowledge sources...</p>
          ) : datasources.length > 0 ? (
            <div className="space-y-2">
              {datasources.map((datasource) => (
                <div key={datasource.id} className="p-2 border rounded">
                  <h4 className="font-medium">{datasource.name}</h4>
                  <p className="text-sm">{datasource.description}</p>
                  <p className="text-xs text-gray-500">Type: {datasource.type}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No knowledge sources available.</p>
          )}
        </div>
        
        {/* Tools */}
        <div className="border rounded-lg p-4 shadow-sm">
          <h3 className="text-lg font-medium mb-2">Tools</h3>
          {loading.tools ? (
            <p>Loading tools...</p>
          ) : tools.length > 0 ? (
            <div className="space-y-2">
              {tools.map((tool) => (
                <div key={tool.id} className="p-2 border rounded">
                  <h4 className="font-medium">{tool.name}</h4>
                  <p className="text-sm">{tool.description}</p>
                  <p className="text-xs text-gray-500">Type: {tool.type}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No tools available.</p>
          )}
        </div>
      </div>
    </div>
  );
}