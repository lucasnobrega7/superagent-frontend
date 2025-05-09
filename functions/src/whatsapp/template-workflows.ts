/**
 * Templates para Workflows de Agentes de Vendas
 * Contém exemplos pré-configurados de fluxos de conversação para WhatsApp
 */
import { Workflow, Node } from './workflow';

/**
 * Cria um template de workflow de boas-vindas simples
 */
export function createWelcomeTemplate(name: string, description?: string): Omit<Workflow, 'id' | 'createdAt' | 'updatedAt'> {
  // Criar IDs únicos
  const welcomeNodeId = 'welcome_msg';
  const inputNameNodeId = 'input_name';
  const confirmationNodeId = 'confirmation_msg';
  const questionNodeId = 'question_msg';
  const finalNodeId = 'final_msg';
  
  // Criar nós do fluxo
  const nodes: Node[] = [
    {
      id: welcomeNodeId,
      type: 'message',
      content: {
        text: 'Olá! 👋 Sou um assistente virtual de vendas. Como posso ajudar você hoje?'
      },
      next: [{ id: inputNameNodeId }]
    },
    {
      id: inputNameNodeId,
      type: 'input',
      content: {
        prompt: 'Qual é o seu nome?',
        variableName: 'nome_cliente'
      },
      next: [{ id: confirmationNodeId }]
    },
    {
      id: confirmationNodeId,
      type: 'message',
      content: {
        text: 'Prazer em conhecê-lo, {{nome_cliente}}! 😊 Estou aqui para ajudar com qualquer dúvida sobre nossos produtos e serviços.'
      },
      next: [{ id: questionNodeId }]
    },
    {
      id: questionNodeId,
      type: 'input',
      content: {
        prompt: 'Você está procurando algum produto específico hoje?',
        variableName: 'interesse'
      },
      next: [{ id: finalNodeId }]
    },
    {
      id: finalNodeId,
      type: 'message',
      content: {
        text: 'Entendi! Vou ajudar você a encontrar informações sobre {{interesse}}. Vou repassar para um de nossos especialistas que entrará em contato em breve. Obrigado pelo interesse!'
      }
    }
  ];
  
  // Criar o workflow completo
  return {
    name: name || 'Fluxo de Boas-vindas',
    description: description || 'Workflow de boas-vindas para novos clientes',
    nodes,
    startNodeId: welcomeNodeId,
    isPublic: true,
    version: 1,
    tags: ['boas-vindas', 'iniciante']
  };
}

/**
 * Cria um template de workflow para prospecção de clientes
 */
export function createProspectingTemplate(name: string, description?: string): Omit<Workflow, 'id' | 'createdAt' | 'updatedAt'> {
  // Criar IDs únicos
  const startNodeId = 'start';
  const nameNodeId = 'get_name';
  const interestNodeId = 'interest_check';
  const productInfoNodeId = 'product_info';
  const contactNodeId = 'contact_info';
  const scheduleNodeId = 'schedule';
  const endNodeId = 'end';
  const noInterestNodeId = 'no_interest';
  
  // Criar nós do fluxo
  const nodes: Node[] = [
    {
      id: startNodeId,
      type: 'message',
      content: {
        text: 'Olá! Sou o assistente virtual da [Nome da Empresa]. Estamos com uma campanha especial para nossos produtos e gostaria de compartilhar algumas informações com você!'
      },
      next: [{ id: nameNodeId }]
    },
    {
      id: nameNodeId,
      type: 'input',
      content: {
        prompt: 'Como posso chamar você?',
        variableName: 'nome_cliente'
      },
      next: [{ id: interestNodeId }]
    },
    {
      id: interestNodeId,
      type: 'input',
      content: {
        prompt: '{{nome_cliente}}, você tem interesse em conhecer nossas soluções para aumentar suas vendas?',
        variableName: 'interesse_inicial'
      },
      next: [
        { id: productInfoNodeId, condition: 'interesse_inicial == sim' },
        { id: productInfoNodeId, condition: 'interesse_inicial == Sim' },
        { id: noInterestNodeId }
      ]
    },
    {
      id: productInfoNodeId,
      type: 'message',
      content: {
        text: 'Ótimo! Nossa solução ajuda empresas a aumentarem suas vendas em até 40% usando inteligência artificial e automação. Temos planos a partir de R$ 197/mês com 7 dias de teste grátis.'
      },
      next: [{ id: contactNodeId }]
    },
    {
      id: contactNodeId,
      type: 'input',
      content: {
        prompt: 'Qual é o melhor e-mail para enviarmos mais informações?',
        variableName: 'email'
      },
      next: [{ id: scheduleNodeId }]
    },
    {
      id: scheduleNodeId,
      type: 'input',
      content: {
        prompt: 'Podemos agendar uma demonstração rápida de 15 minutos? Qual o melhor dia da semana para você?',
        variableName: 'dia_demo'
      },
      next: [{ id: endNodeId }]
    },
    {
      id: endNodeId,
      type: 'message',
      content: {
        text: 'Perfeito, {{nome_cliente}}! Vou agendar uma demonstração para {{dia_demo}}. Um de nossos consultores entrará em contato para confirmar o horário. Enquanto isso, enviaremos mais informações para {{email}}. Obrigado pelo interesse em nossa solução!'
      }
    },
    {
      id: noInterestNodeId,
      type: 'message',
      content: {
        text: 'Sem problemas, {{nome_cliente}}! Agradecemos seu tempo. Caso mude de ideia ou precise de informações no futuro, estamos à disposição. Tenha um ótimo dia!'
      }
    }
  ];
  
  // Criar o workflow completo
  return {
    name: name || 'Fluxo de Prospecção',
    description: description || 'Workflow para prospecção de novos clientes',
    nodes,
    startNodeId,
    isPublic: true,
    version: 1,
    tags: ['prospecção', 'vendas', 'intermediário']
  };
}

/**
 * Cria um template de workflow para qualificação de leads
 */
export function createLeadQualificationTemplate(name: string, description?: string): Omit<Workflow, 'id' | 'createdAt' | 'updatedAt'> {
  // Criar IDs únicos
  const startNodeId = 'start';
  const nameNodeId = 'get_name';
  const companyNodeId = 'get_company';
  const roleNodeId = 'get_role';
  const teamSizeNodeId = 'get_team_size';
  const budgetNodeId = 'get_budget';
  const timelineNodeId = 'get_timeline';
  const qualifyNodeId = 'qualify_lead';
  const highPriorityNodeId = 'high_priority';
  const mediumPriorityNodeId = 'medium_priority';
  const lowPriorityNodeId = 'low_priority';
  
  // Criar nós do fluxo
  const nodes: Node[] = [
    {
      id: startNodeId,
      type: 'message',
      content: {
        text: 'Olá! Obrigado pelo seu interesse em nossos produtos. Para que possamos atendê-lo melhor, gostaria de fazer algumas perguntas rápidas.'
      },
      next: [{ id: nameNodeId }]
    },
    {
      id: nameNodeId,
      type: 'input',
      content: {
        prompt: 'Como posso chamar você?',
        variableName: 'nome_cliente'
      },
      next: [{ id: companyNodeId }]
    },
    {
      id: companyNodeId,
      type: 'input',
      content: {
        prompt: 'Qual é o nome da sua empresa, {{nome_cliente}}?',
        variableName: 'empresa'
      },
      next: [{ id: roleNodeId }]
    },
    {
      id: roleNodeId,
      type: 'input',
      content: {
        prompt: 'Qual é o seu cargo na {{empresa}}?',
        variableName: 'cargo'
      },
      next: [{ id: teamSizeNodeId }]
    },
    {
      id: teamSizeNodeId,
      type: 'input',
      content: {
        prompt: 'Aproximadamente, quantos funcionários trabalham na sua empresa?',
        variableName: 'tamanho_equipe'
      },
      next: [{ id: budgetNodeId }]
    },
    {
      id: budgetNodeId,
      type: 'input',
      content: {
        prompt: 'Qual é o orçamento aproximado que você tem disponível para investir nessa solução? (Ex: Até R$1.000, Entre R$1.000 e R$5.000, Acima de R$5.000)',
        variableName: 'orcamento'
      },
      next: [{ id: timelineNodeId }]
    },
    {
      id: timelineNodeId,
      type: 'input',
      content: {
        prompt: 'Qual é o seu prazo estimado para implementar essa solução?',
        variableName: 'prazo'
      },
      next: [{ id: qualifyNodeId }]
    },
    {
      id: qualifyNodeId,
      type: 'condition',
      content: {
        description: 'Qualificação do lead baseada nas respostas'
      },
      next: [
        { id: highPriorityNodeId, condition: 'orcamento == Acima de R$5.000' },
        { id: mediumPriorityNodeId, condition: 'orcamento == Entre R$1.000 e R$5.000' },
        { id: lowPriorityNodeId }
      ]
    },
    {
      id: highPriorityNodeId,
      type: 'message',
      content: {
        text: 'Obrigado pelas informações, {{nome_cliente}}! Com base no que você compartilhou, nosso time de consultores especializados entrará em contato com você nas próximas 2 horas para discutir como podemos atender às necessidades da {{empresa}}. Aguarde nosso contato!'
      }
    },
    {
      id: mediumPriorityNodeId,
      type: 'message',
      content: {
        text: 'Obrigado pelas informações, {{nome_cliente}}! Com base no que você compartilhou, um de nossos consultores entrará em contato com você até o final do próximo dia útil para discutir as melhores opções para a {{empresa}}. Enquanto isso, enviaremos para você por e-mail alguns materiais sobre nossas soluções.'
      }
    },
    {
      id: lowPriorityNodeId,
      type: 'message',
      content: {
        text: 'Obrigado pelas informações, {{nome_cliente}}! Enviamos para você por e-mail materiais sobre nossas soluções que podem ser adequadas para a {{empresa}}. Caso tenha interesse, temos consultores disponíveis para agendamento de uma demonstração gratuita. É só responder este contato solicitando um horário!'
      }
    }
  ];
  
  // Criar o workflow completo
  return {
    name: name || 'Qualificação de Leads',
    description: description || 'Workflow para qualificar leads e priorizar atendimento',
    nodes,
    startNodeId,
    isPublic: true,
    version: 1,
    tags: ['qualificação', 'leads', 'vendas', 'avançado']
  };
}

/**
 * Cria um template de workflow para atendimento de suporte pós-venda
 */
export function createSupportTemplate(name: string, description?: string): Omit<Workflow, 'id' | 'createdAt' | 'updatedAt'> {
  // Criar IDs únicos
  const startNodeId = 'start';
  const nameNodeId = 'get_name';
  const issueTypeNodeId = 'issue_type';
  const technicalNodeId = 'technical_support';
  const billingNodeId = 'billing_support';
  const generalNodeId = 'general_support';
  const urgencyNodeId = 'check_urgency';
  const highUrgencyNodeId = 'high_urgency';
  const lowUrgencyNodeId = 'low_urgency';
  const feedbackNodeId = 'get_feedback';
  const endNodeId = 'end';
  
  // Criar nós do fluxo
  const nodes: Node[] = [
    {
      id: startNodeId,
      type: 'message',
      content: {
        text: 'Olá! Sou o assistente de suporte. Estou aqui para ajudar você com qualquer problema ou dúvida sobre nossos produtos e serviços.'
      },
      next: [{ id: nameNodeId }]
    },
    {
      id: nameNodeId,
      type: 'input',
      content: {
        prompt: 'Como posso chamar você?',
        variableName: 'nome_cliente'
      },
      next: [{ id: issueTypeNodeId }]
    },
    {
      id: issueTypeNodeId,
      type: 'input',
      content: {
        prompt: '{{nome_cliente}}, com o que você precisa de ajuda hoje? (Responda com "técnico" para problemas com o produto, "faturamento" para questões de pagamento, ou "geral" para outras dúvidas)',
        variableName: 'tipo_problema'
      },
      next: [
        { id: technicalNodeId, condition: 'tipo_problema == técnico' },
        { id: billingNodeId, condition: 'tipo_problema == faturamento' },
        { id: generalNodeId }
      ]
    },
    {
      id: technicalNodeId,
      type: 'input',
      content: {
        prompt: 'Entendi que você está enfrentando um problema técnico. Pode descrever o problema com mais detalhes?',
        variableName: 'descricao_problema'
      },
      next: [{ id: urgencyNodeId }]
    },
    {
      id: billingNodeId,
      type: 'input',
      content: {
        prompt: 'Entendi que você tem uma questão relacionada a faturamento ou pagamento. Pode explicar em detalhes qual é a questão?',
        variableName: 'descricao_problema'
      },
      next: [{ id: urgencyNodeId }]
    },
    {
      id: generalNodeId,
      type: 'input',
      content: {
        prompt: 'Como posso ajudar você hoje? Por favor, descreva sua dúvida ou solicitação.',
        variableName: 'descricao_problema'
      },
      next: [{ id: urgencyNodeId }]
    },
    {
      id: urgencyNodeId,
      type: 'input',
      content: {
        prompt: 'Essa questão está impedindo você de usar o produto/serviço neste momento? (Responda com "sim" ou "não")',
        variableName: 'urgencia'
      },
      next: [
        { id: highUrgencyNodeId, condition: 'urgencia == sim' },
        { id: highUrgencyNodeId, condition: 'urgencia == Sim' },
        { id: lowUrgencyNodeId }
      ]
    },
    {
      id: highUrgencyNodeId,
      type: 'message',
      content: {
        text: 'Entendo a urgência da situação. Estou encaminhando seu caso para um especialista que entrará em contato nos próximos 15 minutos. Por favor, fique disponível no número de telefone ou e-mail cadastrado.'
      },
      next: [{ id: feedbackNodeId }]
    },
    {
      id: lowUrgencyNodeId,
      type: 'message',
      content: {
        text: 'Obrigado pelas informações. Um especialista da nossa equipe analisará seu caso e entrará em contato em até 24 horas com uma solução ou orientações adicionais.'
      },
      next: [{ id: feedbackNodeId }]
    },
    {
      id: feedbackNodeId,
      type: 'input',
      content: {
        prompt: 'Enquanto isso, há mais alguma informação relevante que você gostaria de adicionar?',
        variableName: 'feedback_adicional'
      },
      next: [{ id: endNodeId }]
    },
    {
      id: endNodeId,
      type: 'message',
      content: {
        text: 'Registramos seu caso com o número de protocolo #{{sessionId}}. Você pode utilizar esse número para consultar o status do seu atendimento posteriormente. Obrigado pelo contato, {{nome_cliente}}!'
      }
    }
  ];
  
  // Criar o workflow completo
  return {
    name: name || 'Atendimento de Suporte',
    description: description || 'Workflow para atendimento de suporte pós-venda',
    nodes,
    startNodeId,
    isPublic: true,
    version: 1,
    tags: ['suporte', 'atendimento', 'pós-venda']
  };
}

/**
 * Exportar todos os templates
 */
export const templates = {
  welcome: createWelcomeTemplate,
  prospecting: createProspectingTemplate,
  leadQualification: createLeadQualificationTemplate,
  support: createSupportTemplate
};