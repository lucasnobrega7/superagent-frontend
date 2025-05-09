/**
 * Configuração de monitoramento com Sentry
 */
import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';
import { logger } from 'firebase-functions';

/**
 * Inicializa o Sentry para monitoramento de erros e performance
 */
export function initMonitoring(): void {
  // Só inicializar em produção
  if (process.env.NODE_ENV !== 'production') {
    logger.info('Monitoramento com Sentry não inicializado em ambiente de desenvolvimento');
    return;
  }

  try {
    // Inicializa o SDK do Sentry com a integração de profiling
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      integrations: [
        // Habilita o profiling de performance
        new ProfilingIntegration(),
      ],
      // Porcentagem de transações que serão amostradas para profiling
      tracesSampleRate: 0.1,
      // Porcentagem de perfis que serão amostrados
      profilesSampleRate: 0.1,
      // Informações de ambiente
      environment: process.env.NODE_ENV,
      // Informações de release (idealmente setado no deploy)
      release: process.env.FUNCTION_VERSION || '1.0.0',
      // Contexto adicional
      initialScope: {
        tags: {
          region: process.env.FUNCTION_REGION || 'unknown',
        },
      },
    });

    logger.info('Sentry inicializado com sucesso');
  } catch (error) {
    logger.error('Erro ao inicializar Sentry:', error);
  }
}

/**
 * Captura exceções com contexto adicional
 * @param error Erro a ser capturado
 * @param context Contexto adicional
 */
export function captureException(error: Error, context?: Record<string, any>): void {
  if (process.env.NODE_ENV !== 'production') {
    logger.error('Erro capturado (dev mode):', error, context);
    return;
  }

  Sentry.captureException(error, {
    extra: context,
  });
}

/**
 * Inicializa uma transação para monitoramento de performance
 * @param name Nome da transação
 * @param operation Tipo de operação
 */
export function startTransaction(name: string, operation: string) {
  if (process.env.NODE_ENV !== 'production') {
    // Em dev, retornamos um mock de transação
    return {
      finish: () => {},
      setTag: () => {},
      setData: () => {},
    };
  }

  const transaction = Sentry.startTransaction({
    name,
    op: operation,
  });

  return transaction;
}