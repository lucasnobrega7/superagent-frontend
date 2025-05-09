# Security Implementation Guide

Este documento descreve as implementações de segurança adotadas para o projeto Agentes de Conversão.

> **Nota sobre Middleware Edge Runtime**: O middleware implementado usa recursos compatíveis com o Edge Runtime da Vercel. Alguns warnings de compilação relacionados a dependências externas (como o Clerk) podem aparecer, mas não afetam o funcionamento da aplicação, pois estão relacionados a módulos usados apenas no cliente.

## Implementações de Segurança

### 1. Headers de Segurança

Implementamos os seguintes headers de segurança via middleware:

- **Content-Security-Policy (CSP)**: Controla quais recursos o navegador pode carregar
- **X-Content-Type-Options**: Impede MIME-sniffing
- **X-Frame-Options**: Proteção contra clickjacking
- **X-XSS-Protection**: Proteção extra contra XSS em navegadores mais antigos
- **Referrer-Policy**: Controla informações de referência enviadas em requisições
- **Permissions-Policy**: Controla quais features o navegador pode usar
- **Strict-Transport-Security**: Força conexões HTTPS

### 2. Proteção contra Bots Maliciosos

O middleware inclui detecção e bloqueio de bots maliciosos:

- Identificação de user-agents conhecidos de crawlers agressivos
- Bloqueio automático com resposta 403 Forbidden
- Configuração complementar no arquivo `robots.txt`

### 3. Rate Limiting

Implementamos rate limiting por IP para mitigar ataques de DDoS e brute-force:

- Limite de 600 requisições por minuto por IP (10 req/s)
- Resposta 429 Too Many Requests quando o limite é atingido
- Limpeza automática do cache para evitar memory leaks

### 4. Security.txt

Adicionamos arquivos `security.txt` conforme a RFC 9116:

- Localizado em `/.well-known/security.txt`
- Contém informações de contato para reportar vulnerabilidades
- Indica políticas e procedimentos de divulgação responsável

### 5. Configuração de Autenticação Segura

O middleware de autenticação Clerk foi configurado para:

- Separar rotas públicas e protegidas
- Sincronizar usuários com Supabase de forma segura
- Tratar erros e operações assíncronas adequadamente

## Arquivos Relevantes

- `/middleware.ts`: Implementação central de segurança
- `/public/.well-known/security.txt`: Arquivo de segurança principal
- `/public/security.txt`: Redirecionamento para o arquivo principal
- `/public/security-policy.md`: Política de segurança detalhada
- `/public/robots.txt`: Configuração para crawlers e bots

## Próximos Passos

1. **Vercel Security Edge Config**: Ativar configurações de segurança adicionais no painel da Vercel
2. **Web Application Firewall (WAF)**: Configurar WAF na Vercel para proteção avançada
3. **Relatórios CSP**: Implementar endpoint para receber relatórios de violações de CSP
4. **Monitoramento de Segurança**: Integrar ferramentas de monitoramento de segurança

## Referências

- [OWASP Security Headers](https://owasp.org/www-project-secure-headers/)
- [RFC 9116 - Security.txt](https://www.rfc-editor.org/rfc/rfc9116.html)
- [Content Security Policy (CSP)](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [Vercel Edge Config](https://vercel.com/docs/concepts/edge-network/edge-config)