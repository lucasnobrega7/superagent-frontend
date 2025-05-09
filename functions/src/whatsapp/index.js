/**
 * Exportação geral da funcionalidade de Agentes de Conversão WhatsApp
 */

// Clientes de API WhatsApp
export { ZAPIWhatsApp } from './z-api';
export { EvolutionAPIWhatsApp } from './evolution-api';

// Componentes de UI
export * from './components';

// Motor de fluxo de trabalho
export { WorkflowEngine } from './workflow';

// Processador de mensagens
export { WhatsAppProcessor } from './processor';

// Templates de fluxos
export * from './template-workflows';

// Utilitários de UI
export { OpenAIStyleUI } from './ui-components';