// Mock das variáveis de ambiente
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://mock-supabase-url.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'mock-supabase-anon-key';
process.env.NEXT_PUBLIC_SUPERAGENT_API_URL = 'https://mock-superagent-api.com';
process.env.NEXT_PUBLIC_SUPERAGENT_API_KEY = 'mock-superagent-api-key';

// Mock do módulo @clerk/nextjs
jest.mock('@clerk/nextjs', () => ({
  auth: jest.fn(() => ({
    userId: 'mock-user-id',
  })),
  currentUser: jest.fn(),
  clerkClient: {
    users: {
      getUser: jest.fn(),
    },
  },
}));

// Mock para fetch global
global.fetch = jest.fn();

// Note: afterEach é adicionado pelo Jest automaticamente,
// então não precisamos adicioná-lo aqui