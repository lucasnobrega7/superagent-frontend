/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow using environment variables from the LiteralAI client
  env: {
    NEXT_PUBLIC_LITERALAI_API_KEY: process.env.NEXT_PUBLIC_LITERALAI_API_KEY || 'demo-key',
    NEXT_PUBLIC_LITERALAI_PROJECT: process.env.NEXT_PUBLIC_LITERALAI_PROJECT || 'default',
  },
  
  // Add support for transpiling ESM modules
  experimental: {
    esmExternals: 'loose',
  },
}

module.exports = nextConfig