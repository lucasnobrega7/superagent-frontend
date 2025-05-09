// Jest setup file

// Mock environment variables
process.env.SUPERAGENT_API_URL = 'https://mock-api.superagent.sh';
process.env.SUPERAGENT_API_KEY = 'mock-superagent-api-key';
process.env.FIREBASE_STORAGE_BUCKET = 'mock-project-id.appspot.com';
process.env.FUNCTION_REGION = 'us-central1';
process.env.NODE_ENV = 'test';

// Firebase admin mock
jest.mock('firebase-admin', () => {
  const authMock = {
    verifyIdToken: jest.fn().mockResolvedValue({ uid: 'mock-uid' }),
    getUser: jest.fn().mockResolvedValue({ email: 'mock@example.com' })
  };

  const firestoreMock = {
    collection: jest.fn().mockReturnThis(),
    doc: jest.fn().mockReturnThis(),
    set: jest.fn().mockResolvedValue({}),
    get: jest.fn().mockResolvedValue({
      exists: true,
      data: () => ({
        allowedOrigins: ['http://localhost:3000']
      })
    })
  };

  const storageMock = {
    bucket: jest.fn().mockReturnValue({
      file: jest.fn().mockReturnValue({
        save: jest.fn().mockResolvedValue([{}]),
        makePublic: jest.fn().mockResolvedValue([{}]),
        getSignedUrl: jest.fn().mockResolvedValue(['https://mock-storage-url'])
      }),
      name: 'mock-bucket'
    })
  };

  return {
    initializeApp: jest.fn(),
    credential: {
      applicationDefault: jest.fn()
    },
    firestore: jest.fn().mockReturnValue(firestoreMock),
    storage: jest.fn().mockReturnValue(storageMock),
    auth: jest.fn().mockReturnValue(authMock),
    firestore: {
      FieldValue: {
        serverTimestamp: jest.fn().mockReturnValue('mock-timestamp')
      }
    }
  };
});

// Mock axios
jest.mock('axios', () => ({
  create: jest.fn().mockReturnValue({
    get: jest.fn().mockResolvedValue({ data: {} }),
    post: jest.fn().mockResolvedValue({ data: {} }),
    put: jest.fn().mockResolvedValue({ data: {} }),
    delete: jest.fn().mockResolvedValue({ data: {} }),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() }
    }
  }),
  get: jest.fn().mockResolvedValue({ data: {} }),
  post: jest.fn().mockResolvedValue({ data: {} })
}));

console.log('Jest setup completed');