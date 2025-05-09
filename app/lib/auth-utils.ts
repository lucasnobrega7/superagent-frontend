import { User } from '@clerk/nextjs/server';
import { supabase } from './supabase';

/**
 * Sincroniza o usuário do Clerk com o Supabase
 * Esta função deve ser chamada sempre que o usuário fizer login ou atualizar seu perfil
 */
export async function syncUserWithSupabase(clerkUser: User) {
  if (!clerkUser || !clerkUser.id) {
    console.error("Usuário do Clerk inválido");
    return null;
  }

  try {
    // Verificar se o perfil já existe no Supabase
    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', clerkUser.id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 é o código para "não encontrado"
      console.error("Erro ao buscar perfil existente:", fetchError);
      return null;
    }

    // Preparar dados do perfil
    const profileData = {
      user_id: clerkUser.id,
      full_name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim(),
      avatar_url: clerkUser.imageUrl,
      updated_at: new Date().toISOString()
    };

    // Criar ou atualizar perfil
    if (!existingProfile) {
      // Criar novo perfil
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert([profileData])
        .select()
        .single();

      if (insertError) {
        console.error("Erro ao criar perfil:", insertError);
        return null;
      }

      console.log("Perfil criado com sucesso:", newProfile);
      return newProfile;
    } else {
      // Atualizar perfil existente
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('user_id', clerkUser.id)
        .select()
        .single();

      if (updateError) {
        console.error("Erro ao atualizar perfil:", updateError);
        return null;
      }

      console.log("Perfil atualizado com sucesso:", updatedProfile);
      return updatedProfile;
    }
  } catch (error) {
    console.error("Erro ao sincronizar usuário com Supabase:", error);
    return null;
  }
}

/**
 * Obtém o token JWT do Clerk para ser enviado ao backend
 * Esta função deve ser usada no lado do cliente
 */
export async function getAuthToken() {
  // Em um ambiente cliente real, você usaria o Clerk SDK
  // Isso é um placeholder para o método real
  try {
    // @ts-ignore - Isso é apenas um placeholder
    const token = await window.Clerk?.session?.getToken();
    return token;
  } catch (error) {
    console.error("Erro ao obter token de autenticação:", error);
    return null;
  }
}

/**
 * Configuração de fetch com autenticação para APIs do backend
 */
export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = await getAuthToken();
  
  const headers = {
    ...options.headers,
    'Content-Type': 'application/json',
  };

  // Adicionar token de autenticação se disponível
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return fetch(url, {
    ...options,
    headers
  });
}

/**
 * Hook personalizado para obter o token JWT e informações do usuário
 * (Para ser usado com React hooks)
 */
export function useAuthToken() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    const fetchToken = async () => {
      try {
        setLoading(true);
        const authToken = await getAuthToken();
        setToken(authToken);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        setLoading(false);
      }
    };
    
    fetchToken();
  }, []);
  
  return { token, loading, error };
}

// Adicionar importação do React
import { useState, useEffect } from 'react';