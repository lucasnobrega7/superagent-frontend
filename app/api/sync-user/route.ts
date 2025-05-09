import { clerkClient } from "@clerk/nextjs";
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/app/lib/supabase";
import { auth } from "@clerk/nextjs";

/**
 * API Route para sincronizar o usuário do Clerk com o Supabase
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    // Obter dados do corpo da requisição
    const body = await request.json();
    const targetUserId = body.userId;

    // Garantir que o usuário só possa sincronizar seu próprio perfil
    if (userId !== targetUserId) {
      return NextResponse.json(
        { error: "Operação não permitida" },
        { status: 403 }
      );
    }

    // Obter dados do usuário do Clerk
    const user = await clerkClient.users.getUser(userId);
    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // Preparar dados do perfil
    const profileData = {
      user_id: user.id,
      full_name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
      avatar_url: user.imageUrl,
      updated_at: new Date().toISOString(),
    };

    // Verificar se o perfil já existe
    const { data: existingProfile, error: fetchError } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    let result;
    if (fetchError && fetchError.code === "PGRST116") {
      // Perfil não encontrado, criar novo
      const { data, error } = await supabase
        .from("profiles")
        .insert([profileData])
        .select()
        .single();

      if (error) {
        console.error("Erro ao criar perfil:", error);
        return NextResponse.json(
          { error: "Falha ao criar perfil" },
          { status: 500 }
        );
      }

      result = data;
    } else if (fetchError) {
      // Outro erro na busca
      console.error("Erro ao buscar perfil:", fetchError);
      return NextResponse.json(
        { error: "Falha ao verificar perfil existente" },
        { status: 500 }
      );
    } else {
      // Perfil existe, atualizar
      const { data, error } = await supabase
        .from("profiles")
        .update(profileData)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) {
        console.error("Erro ao atualizar perfil:", error);
        return NextResponse.json(
          { error: "Falha ao atualizar perfil" },
          { status: 500 }
        );
      }

      result = data;
    }

    return NextResponse.json({ success: true, profile: result });
  } catch (error) {
    console.error("Erro ao sincronizar usuário:", error);
    return NextResponse.json(
      { error: "Falha interna do servidor" },
      { status: 500 }
    );
  }
}