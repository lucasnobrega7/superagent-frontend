/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_SUPERAGENT_API_URL: process.env.NEXT_PUBLIC_SUPERAGENT_API_URL || 'http://localhost:8000',
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || 'pk_test_mock-clerk-key',
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'mock-api-key',
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'mock-project.firebaseapp.com',
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'mock-project',
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'mock-project.appspot.com',
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '123456789',
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:123456789:web:mock-app-id',
    NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || 'G-MOCK123456',
    NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL: process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL || 'http://localhost:5001',
    NEXT_PUBLIC_LITERALAI_API_KEY: process.env.NEXT_PUBLIC_LITERALAI_API_KEY || '',
    NEXT_PUBLIC_LITERALAI_API_URL: process.env.NEXT_PUBLIC_LITERALAI_API_URL || 'https://api.literalai.io',
  },
  images: {
    domains: ['cdn.clerk.dev', 'cdttnoomvugputkweazg.supabase.co'],
  },
  webpack: (config) => {
    config.resolve.fallback = { 
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      undici: false
    };
    
    // Ignorar problemas com o undici
    config.module = {
      ...config.module,
      exprContextCritical: false,
      rules: [
        ...config.module.rules,
        {
          test: /node_modules\/undici\/.*\.js$/,
          loader: 'ignore-loader'
        }
      ]
    };
    
    return config;
  },
  async rewrites() {
    const SUPERAGENT_API_URL = process.env.NEXT_PUBLIC_SUPERAGENT_API_URL || 'http://localhost:8000';
    const FIREBASE_FUNCTIONS_URL = process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL || 'http://localhost:5001';
    
    return [
      {
        source: '/api/:path*',
        destination: `${SUPERAGENT_API_URL}/api/:path*`,
      },
      {
        source: '/health',
        destination: `${SUPERAGENT_API_URL}/health`,
      },
      {
        source: '/cors-test',
        destination: `${SUPERAGENT_API_URL}/cors-test`,
      },
      {
        source: '/diagnostico',
        destination: `${SUPERAGENT_API_URL}/api/v1/diagnostico`,
      },
      {
        source: '/api/firebase/:path*',
        destination: `${FIREBASE_FUNCTIONS_URL}/:path*`,
      }
    ]
  },
}

module.exports = nextConfig