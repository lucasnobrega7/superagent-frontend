import * as admin from 'firebase-admin';
import * as functionsTest from 'firebase-functions-test';
import * as sinon from 'sinon';
import { superagentService } from '../services/superagent-service';

// Initialize Firebase Test SDK
const testEnv = functionsTest();

// Mock data
const mockAgents = [
  {
    id: 'agent-1',
    name: 'Test Agent 1',
    description: 'A test agent',
    isPublic: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'agent-2',
    name: 'Test Agent 2',
    description: 'Another test agent',
    isPublic: false,
    createdAt: new Date().toISOString()
  }
];

const mockLLMs = [
  {
    id: 'llm-1',
    provider: 'openai',
    model: 'gpt-4',
    apiKey: '••••••••'
  }
];

const mockDatasources = [
  {
    id: 'ds-1',
    name: 'Test Datasource',
    description: 'A test datasource',
    type: 'text'
  }
];

const mockTools = [
  {
    id: 'tool-1',
    name: 'Test Tool',
    description: 'A test tool',
    type: 'web'
  }
];

// Service mocks
const superagentServiceMock = {
  listAgents: sinon.stub().resolves(mockAgents),
  createAgent: sinon.stub().resolves(mockAgents[0]),
  listLLMs: sinon.stub().resolves(mockLLMs),
  createLLM: sinon.stub().resolves(mockLLMs[0]),
  listDatasources: sinon.stub().resolves(mockDatasources),
  listTools: sinon.stub().resolves(mockTools),
  invokeAgent: sinon.stub().resolves({
    output: 'This is a test response',
    session_id: 'test-session',
    usage: { total_tokens: 100 }
  })
};

// Replace the real service with our mock
sinon.stub(superagentService, 'listAgents').callsFake(superagentServiceMock.listAgents);
sinon.stub(superagentService, 'createAgent').callsFake(superagentServiceMock.createAgent);
sinon.stub(superagentService, 'listLLMs').callsFake(superagentServiceMock.listLLMs);
sinon.stub(superagentService, 'createLLM').callsFake(superagentServiceMock.createLLM);
sinon.stub(superagentService, 'listDatasources').callsFake(superagentServiceMock.listDatasources);
sinon.stub(superagentService, 'listTools').callsFake(superagentServiceMock.listTools);
sinon.stub(superagentService, 'invokeAgent').callsFake(superagentServiceMock.invokeAgent);

// Import functions after mocking
import * as functions from '../index';

describe('Firebase Functions', () => {
  // Mock admin.auth()
  const authStub = sinon.stub(admin, 'auth');

  beforeEach(() => {
    // Clear all call counts between tests
    sinon.resetHistory();
  });

  afterAll(() => {
    // Clean up
    testEnv.cleanup();
    sinon.restore();
  });

  describe('helloWorld', () => {
    it('should return a greeting for unauthenticated users', async () => {
      const wrapped = testEnv.wrap(functions.helloWorld);
      const result = await wrapped({});

      expect(result).toHaveProperty('message');
      expect(result.message).toContain('Hello world');
      expect(result).toHaveProperty('timestamp');
    });

    it('should return a personalized greeting for authenticated users', async () => {
      const wrapped = testEnv.wrap(functions.helloWorld);
      const result = await wrapped({}, { auth: { uid: 'user123', token: { email: 'test@example.com' } } });

      expect(result).toHaveProperty('message');
      expect(result.message).toContain('Hello test@example.com');
      expect(result).toHaveProperty('timestamp');
    });
  });

  describe('listAgents', () => {
    it('should list all agents for authenticated users', async () => {
      const wrapped = testEnv.wrap(functions.listAgents);
      const result = await wrapped({}, { auth: { uid: 'user123' } });

      expect(superagentServiceMock.listAgents.calledOnce).toBeTruthy();
      expect(result).toHaveProperty('agents');
      expect(result.agents).toHaveLength(2);
    });

    it('should only show public agents for unauthenticated users', async () => {
      const wrapped = testEnv.wrap(functions.listAgents);
      const result = await wrapped({});

      expect(superagentServiceMock.listAgents.calledOnce).toBeTruthy();
      expect(result).toHaveProperty('agents');
      expect(result.agents).toHaveLength(1);
      expect(result.agents[0].isPublic).toBeTruthy();
    });
  });

  describe('createAgent', () => {
    it('should create an agent for authenticated users', async () => {
      const wrapped = testEnv.wrap(functions.createAgent);
      const data = {
        name: 'New Agent',
        description: 'A new agent description',
        initialMessage: 'Hello there!',
        isPublic: true
      };

      const result = await wrapped(data, { auth: { uid: 'user123' } });

      expect(superagentServiceMock.createAgent.calledOnce).toBeTruthy();
      expect(superagentServiceMock.createAgent.calledWith({
        name: 'New Agent',
        description: 'A new agent description',
        initialMessage: 'Hello there!',
        isPublic: true
      })).toBeTruthy();
      
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('agent');
      expect(result.agent).toHaveProperty('userId', 'user123');
    });

    it('should throw error for unauthenticated users', async () => {
      const wrapped = testEnv.wrap(functions.createAgent);
      const data = {
        name: 'New Agent',
        description: 'A new agent description'
      };

      await expect(wrapped(data)).rejects.toThrow();
    });

    it('should validate input data', async () => {
      const wrapped = testEnv.wrap(functions.createAgent);
      const badData = {
        // Missing description
        name: 'New Agent'
      };

      await expect(wrapped(badData, { auth: { uid: 'user123' } })).rejects.toThrow();
    });
  });

  describe('invokeAgent', () => {
    it('should invoke an agent and return the response', async () => {
      const wrapped = testEnv.wrap(functions.invokeAgent);
      const data = {
        id: 'agent-1',
        input: 'Hello agent',
        sessionId: 'test-session'
      };

      const result = await wrapped(data, { auth: { uid: 'user123' } });

      expect(superagentServiceMock.invokeAgent.calledOnce).toBeTruthy();
      expect(superagentServiceMock.invokeAgent.calledWith('agent-1', 'Hello agent', 'test-session')).toBeTruthy();
      
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('output', 'This is a test response');
      expect(result).toHaveProperty('sessionId', 'test-session');
      expect(result).toHaveProperty('usage');
    });

    it('should throw error for unauthenticated users', async () => {
      const wrapped = testEnv.wrap(functions.invokeAgent);
      const data = {
        id: 'agent-1',
        input: 'Hello agent'
      };

      await expect(wrapped(data)).rejects.toThrow();
    });
  });

  describe('healthCheck', () => {
    it('should return system status information', async () => {
      const wrapped = testEnv.wrap(functions.healthCheck);
      const result = await wrapped({});

      expect(result).toHaveProperty('status', 'online');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('services');
      expect(result.services).toHaveProperty('functions', 'ok');
    });
  });
});