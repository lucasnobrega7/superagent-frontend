import { clerkMiddleware, clerkClient } from "@clerk/nextjs";
import { NextRequest, NextResponse } from "next/server";

// Limite de requisições por minuto por IP
const MAX_REQUESTS_PER_MINUTE = 600; // 10 requisições por segundo em média
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minuto em ms
const ipRequestsMap = new Map<string, { count: number; timestamp: number }>();

// Regex para detectar bots maliciosos
const MALICIOUS_BOT_UA_REGEX = /(?:semrush|ahrefs|mj12bot|ahrefsbot|screaming frog|pingdom|netcraft|zoominfo|dataprovider)/i;

// Definir Content-Security-Policy
const CSP_POLICY = [
  "default-src 'self'",
  "script-src 'self' https://js.clerk.io https://apis.google.com https://cdn.jsdelivr.net https://*.vercel-insights.com https://*.sentry.io 'unsafe-inline'",
  "connect-src 'self' https://api.clerk.io https://clerk.literalai.com https://*.googleapis.com https://*.firebaseio.com https://*.literalai.com https://*.sentry.io https://*.posthog.com wss://*.firebaseio.com",
  "img-src 'self' data: https://* blob:",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "frame-src 'self' https://clerk.literalai.com https://*.firebaseapp.com https://*.stripe.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  "block-all-mixed-content",
  "upgrade-insecure-requests"
].join("; ");

// Função de middleware para adicionar headers de segurança
function addSecurityHeaders(response: NextResponse): NextResponse {
  // Adicionar headers de segurança
  response.headers.set("Content-Security-Policy", CSP_POLICY);
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), interest-cohort=()");
  response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");

  return response;
}

// Função para verificar se a requisição é de um bot malicioso
function isMaliciousBot(request: NextRequest): boolean {
  const userAgent = request.headers.get("user-agent") || "";
  return MALICIOUS_BOT_UA_REGEX.test(userAgent);
}

// Função para verificar rate limit por IP
function checkRateLimit(request: NextRequest): boolean {
  // Obter IP real considerando headers de proxy
  const ip = (request.headers.get("x-forwarded-for") || request.ip || "unknown").split(",")[0].trim();

  // Se não conseguimos determinar o IP, permitir a requisição
  if (ip === "unknown") return true;

  const now = Date.now();
  const ipData = ipRequestsMap.get(ip);

  // Se primeira requisição deste IP, ou janela expirou
  if (!ipData || now - ipData.timestamp > RATE_LIMIT_WINDOW) {
    ipRequestsMap.set(ip, { count: 1, timestamp: now });

    // Limpar IPs antigos para prevenir memory leak (a cada 10 minutos)
    if (ipRequestsMap.size > 10000 || Math.random() < 0.01) {
      const expiryTime = now - RATE_LIMIT_WINDOW;
      // Usando Array.from() para compatibilidade com o ES2015
      Array.from(ipRequestsMap.entries()).forEach(([key, value]) => {
        if (value.timestamp < expiryTime) {
          ipRequestsMap.delete(key);
        }
      });
    }

    return true;
  }

  // Incrementar contador
  ipData.count++;

  // Verificar se excedeu o limite
  return ipData.count <= MAX_REQUESTS_PER_MINUTE;
}

// Wrapper para middleware Clerk com segurança adicional
export default clerkMiddleware({
  // Rotas que podem ser acessadas sem autenticação
  publicRoutes: [
    "/",
    "/sign-in",
    "/sign-up",
    "/api-test",
    "/chat",
    "/about",
    "/pricing",
    "/health",
    "/cors-test",
    "/dashboard/(.*)", // Temporariamente público para teste
    "/api/(.*)" // Temporariamente público para teste
  ],

  // Rotas ignoradas pelo middleware de autenticação
  ignoredRoutes: [
    "/(api|trpc)(.*)",
    "/_next/(.*)",
    "/favicon.ico",
    "/api/webhook/(.*)",
    "/security.txt",
    "/.well-known/security.txt",
    "/robots.txt"
  ],

  // Função beforeAuth para segurança adicional
  beforeAuth: (req) => {
    // Verificar se a requisição é de um bot malicioso
    if (isMaliciousBot(req)) {
      return NextResponse.json(
        { error: "Acesso negado" },
        { status: 403, statusText: "Forbidden" }
      );
    }

    // Verificar rate limiting
    if (!checkRateLimit(req)) {
      return NextResponse.json(
        { error: "Muitas requisições, tente novamente mais tarde" },
        { status: 429, statusText: "Too Many Requests" }
      );
    }

    return NextResponse.next();
  },

  // Função afterAuth para sincronizar usuário com Supabase e adicionar headers de segurança
  afterAuth: async (auth, req, evt) => {
    // Criar resposta inicial
    let response = NextResponse.next();

    // Adicionar headers de segurança à resposta
    response = addSecurityHeaders(response);

    // Pular sincronização se o usuário não estiver autenticado
    if (!auth.userId) {
      return response;
    }

    try {
      // Obter detalhes completos do usuário
      const user = await clerkClient.users.getUser(auth.userId);

      // Adicionar chamada para sincronizar com o Supabase
      // Isso seria feito em uma API interna que chamaria syncUserWithSupabase
      // Para evitar carregar o middleware, fazemos a solicitação de forma assíncrona
      if (user) {
        fetch("/api/sync-user", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${auth.getToken()}`,
          },
          body: JSON.stringify({ userId: user.id }),
        }).catch((error) => {
          console.error("Erro ao sincronizar usuário:", error);
        });
      }
    } catch (error) {
      console.error("Erro no middleware afterAuth:", error);
    }

    return response;
  },
});

export const config = {
  // Match all request paths except for the ones starting with:
  matcher: ['/((?!.*\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};