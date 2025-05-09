import { createClient } from '@supabase/supabase-js';

// Verificar se as variáveis de ambiente estão definidas
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.error(
    'NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY devem ser definidos nas variáveis de ambiente'
  );
}

// Configurações do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Criar cliente Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Interface para conversas
 */
export interface Conversation {
  id?: string;
  user_id: string;
  title: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Interface para mensagens
 */
export interface Message {
  id?: string;
  conversation_id: string;
  role: 'user' | 'agent' | 'system';
  content: string;
  agent_id?: string;
  metadata?: any;
  created_at?: string;
}

/**
 * Interface para agentes
 */
export interface Agent {
  id?: string;
  user_id: string;
  name: string;
  description: string;
  avatar_url?: string;
  config?: any;
  is_public?: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Interface para itens de conhecimento do agente
 */
export interface AgentKnowledgeItem {
  id?: string;
  agent_id: string;
  content_type: 'text' | 'file' | 'url';
  content: string;
  file_name?: string;
  metadata?: any;
  created_at?: string;
}

/**
 * Obtém todas as conversas de um usuário
 */
export const getConversations = async (userId: string) => {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });
    
  if (error) {
    console.error('Erro ao buscar conversas:', error);
    throw error;
  }
  
  return data || [];
};

/**
 * Obtém uma conversa pelo ID
 */
export const getConversation = async (conversationId: string) => {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .single();
    
  if (error) {
    console.error('Erro ao buscar conversa:', error);
    throw error;
  }
  
  return data;
};

/**
 * Cria uma nova conversa
 */
export const createConversation = async (conversation: Conversation) => {
  const { data, error } = await supabase
    .from('conversations')
    .insert(conversation)
    .select()
    .single();
    
  if (error) {
    console.error('Erro ao criar conversa:', error);
    throw error;
  }
  
  return data;
};

/**
 * Atualiza o título de uma conversa
 */
export const updateConversationTitle = async (conversationId: string, title: string) => {
  const { data, error } = await supabase
    .from('conversations')
    .update({ title, updated_at: new Date().toISOString() })
    .eq('id', conversationId)
    .select()
    .single();
    
  if (error) {
    console.error('Erro ao atualizar título da conversa:', error);
    throw error;
  }
  
  return data;
};

/**
 * Exclui uma conversa
 */
export const deleteConversation = async (conversationId: string) => {
  // Primeiro excluir todas as mensagens relacionadas
  await supabase
    .from('messages')
    .delete()
    .eq('conversation_id', conversationId);
    
  // Depois excluir a conversa
  const { error } = await supabase
    .from('conversations')
    .delete()
    .eq('id', conversationId);
    
  if (error) {
    console.error('Erro ao excluir conversa:', error);
    throw error;
  }
  
  return true;
};

/**
 * Obtém todas as mensagens de uma conversa
 */
export const getMessages = async (conversationId: string) => {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });
    
  if (error) {
    console.error('Erro ao buscar mensagens:', error);
    throw error;
  }
  
  return data || [];
};

/**
 * Adiciona uma mensagem a uma conversa
 */
export const addMessage = async (message: Message) => {
  const { data, error } = await supabase
    .from('messages')
    .insert(message)
    .select()
    .single();
    
  if (error) {
    console.error('Erro ao adicionar mensagem:', error);
    throw error;
  }
  
  // Atualizar o timestamp da conversa
  await supabase
    .from('conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', message.conversation_id);
    
  return data;
};

/**
 * Obtém todos os agentes de um usuário
 */
export const getAgents = async (userId: string) => {
  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error('Erro ao buscar agentes:', error);
    throw error;
  }
  
  return data || [];
};

/**
 * Obtém todos os agentes públicos
 */
export const getPublicAgents = async () => {
  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .eq('is_public', true)
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error('Erro ao buscar agentes públicos:', error);
    throw error;
  }
  
  return data || [];
};

/**
 * Obtém um agente pelo ID
 */
export const getAgent = async (agentId: string) => {
  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .eq('id', agentId)
    .single();
    
  if (error) {
    console.error('Erro ao buscar agente:', error);
    throw error;
  }
  
  return data;
};

/**
 * Cria um novo agente
 */
export const createAgent = async (agent: Agent) => {
  const { data, error } = await supabase
    .from('agents')
    .insert(agent)
    .select()
    .single();
    
  if (error) {
    console.error('Erro ao criar agente:', error);
    throw error;
  }
  
  return data;
};

/**
 * Atualiza um agente
 */
export const updateAgent = async (agentId: string, updates: Partial<Agent>) => {
  const { data, error } = await supabase
    .from('agents')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', agentId)
    .select()
    .single();
    
  if (error) {
    console.error('Erro ao atualizar agente:', error);
    throw error;
  }
  
  return data;
};

/**
 * Exclui um agente
 */
export const deleteAgent = async (agentId: string) => {
  // Primeiro excluir todo o conhecimento relacionado
  await supabase
    .from('agent_knowledge')
    .delete()
    .eq('agent_id', agentId);
    
  // Depois excluir o agente
  const { error } = await supabase
    .from('agents')
    .delete()
    .eq('id', agentId);
    
  if (error) {
    console.error('Erro ao excluir agente:', error);
    throw error;
  }
  
  return true;
};

/**
 * Adiciona um item de conhecimento a um agente
 */
export const addAgentKnowledge = async (item: AgentKnowledgeItem) => {
  const { data, error } = await supabase
    .from('agent_knowledge')
    .insert(item)
    .select()
    .single();
    
  if (error) {
    console.error('Erro ao adicionar conhecimento ao agente:', error);
    throw error;
  }
  
  return data;
};

/**
 * Obtém todo o conhecimento de um agente
 */
export const getAgentKnowledge = async (agentId: string) => {
  const { data, error } = await supabase
    .from('agent_knowledge')
    .select('*')
    .eq('agent_id', agentId)
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error('Erro ao buscar conhecimento do agente:', error);
    throw error;
  }
  
  return data || [];
};

/**
 * Exclui um item de conhecimento
 */
export const deleteAgentKnowledgeItem = async (itemId: string) => {
  const { error } = await supabase
    .from('agent_knowledge')
    .delete()
    .eq('id', itemId);
    
  if (error) {
    console.error('Erro ao excluir item de conhecimento:', error);
    throw error;
  }
  
  return true;
};

/**
 * Faz upload de um arquivo para o Storage do Supabase
 */
export const uploadFile = async (
  bucket: string,
  path: string,
  file: File
): Promise<string> => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: true
    });
    
  if (error) {
    console.error('Erro ao fazer upload de arquivo:', error);
    throw error;
  }
  
  // Obter URL pública do arquivo
  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(data?.path || path);
    
  return urlData.publicUrl;
};

// Exportar funções e cliente
export default {
  supabase,
  getConversations,
  getConversation,
  createConversation,
  updateConversationTitle,
  deleteConversation,
  getMessages,
  addMessage,
  getAgents,
  getPublicAgents,
  getAgent,
  createAgent,
  updateAgent,
  deleteAgent,
  addAgentKnowledge,
  getAgentKnowledge,
  deleteAgentKnowledgeItem,
  uploadFile
};