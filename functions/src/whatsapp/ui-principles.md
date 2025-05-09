# Princípios de UI/UX para Agentes de Conversão WhatsApp

Este documento define os princípios de design visual e interação para a implementação frontend da plataforma Agentes de Conversão WhatsApp, seguindo a estética OpenAI.

## Princípios Fundamentais

### 1. Minimalismo Intencional
- Cada tela contém apenas os elementos absolutamente necessários
- Espaço em branco generoso e tipografia precisa
- Remoção de elementos decorativos que não comunicam função

### 2. Alternância Contextual
- **Contexto Claro (Funcional)**
  - Fundo branco/cinza claro (#FFFFFF, #F5F5F5)
  - Usado para áreas de trabalho e interação direta
  - Tipografia escura de alta legibilidade
- **Contexto Escuro (Imersivo)**
  - Fundo preto ou gradientes escuros profundos (#000000, #0A0A0A)
  - Usado para visualizações, análises e áreas imersivas
  - Elementos visuais abstratos que representam IA e processamento

### 3. Visualizações Abstratas
As visualizações mudam contextualmente e representam conceitos de IA:

#### Fluxo de Partículas
```javascript
// Canvas WebGL implementation
function createParticleFlow(canvas, density = 100) {
  // Implementação que representa dados em movimento
  // Densidade e velocidade refletem volume de atividade
}
```

#### Malha Geométrica
```javascript
// Canvas WebGL implementation
function createKnowledgeGraph(canvas, connections = 50) {
  // Implementação que representa base de conhecimento
  // Expande e contrai baseado no escopo de conhecimento
}
```

### 4. Transições Significativas
- Transições suaves (300ms) ao entrar em modo imersivo
- Transições levemente mais rápidas (200ms) ao retornar ao modo funcional
- Movimento direcional que indica mudança de contexto

## Sistema de Design

### Tipografia
- Família: Inter (substituto da OpenAI Sans)
- Pesos: Regular (400), Medium (500), SemiBold (600)
- Hierarquia:
  - Títulos: 24px/SemiBold
  - Subtítulos: 18px/Medium
  - Corpo: 16px/Regular
  - Secundário: 14px/Regular
  - Micro: 12px/Medium

### Paleta de Cores

#### Cores Base
- Preto Puro: #000000 (fundos imersivos)
- Branco Puro: #FFFFFF (áreas funcionais)
- Cinza Neutro: #F5F5F5 (áreas secundárias)
- Cinza Escuro: #202123 (elementos da interface em modo escuro)

#### Acentos
- Azul Primário: #0EA5E9 (elementos de ação, seleções)
- Verde Sucesso: #10B981 (indicadores positivos)
- Âmbar Alerta: #F59E0B (atenção)
- Vermelho Erro: #EF4444 (apenas para erros críticos)

#### Gradientes
- Gradiente Azul-Púrpura: linear-gradient(135deg, #0EA5E9 0%, #8B5CF6 100%)
- Gradiente Escuro: linear-gradient(135deg, #000000 0%, #0A0A0A 100%)

## Componentes Principais

### 1. Dashboard Híbrido
```jsx
<div className="flex flex-col h-screen">
  {/* Header Imersivo */}
  <header className="bg-black text-white p-4 h-24 relative overflow-hidden">
    {/* Visualização abstrata que reage à atividade dos agentes */}
    <canvas id="header-visualization" className="absolute inset-0"></canvas>
    
    <div className="relative z-10 flex justify-between items-center">
      <h1 className="text-2xl font-semibold">Agentes de Conversão</h1>
      <div className="flex items-center space-x-4">
        {/* Profile e notificações */}
      </div>
    </div>
  </header>

  {/* Área principal funcional */}
  <main className="flex-1 bg-white p-6">
    {/* Conteúdo do dashboard */}
  </main>
</div>
```

### 2. Editor de Fluxo
```jsx
<div className="grid grid-cols-3 gap-4 h-[calc(100vh-10rem)]">
  {/* Editor (Contexto Claro) */}
  <div className="col-span-2 bg-white rounded-lg shadow p-4">
    <h2 className="text-lg font-medium mb-4">Editor de Fluxo</h2>
    <div className="h-full border border-gray-200 rounded-lg">
      {/* Implementação do editor de fluxo */}
    </div>
  </div>

  {/* Preview (Contexto Escuro) */}
  <div className="col-span-1 bg-black rounded-lg text-white p-4">
    <h2 className="text-lg font-medium mb-4">Visualização</h2>
    <div className="h-full relative">
      {/* Visualização abstrata do agente e fluxo */}
      <canvas id="agent-visualization" className="absolute inset-0"></canvas>
      
      {/* Preview de chat sobreposto */}
      <div className="relative z-10 mt-4 bg-opacity-50 bg-gray-900 rounded-lg p-4 mx-auto max-w-sm">
        {/* Preview de mensagens */}
      </div>
    </div>
  </div>
</div>
```

### 3. Analytics (Contexto Escuro)
```jsx
<div className="bg-black text-white min-h-screen p-6">
  <h1 className="text-2xl font-semibold mb-6">Analytics & Desempenho</h1>
  
  {/* Visualização imersiva de dados */}
  <div className="relative h-64 mb-8">
    <canvas id="analytics-visualization" className="absolute inset-0"></canvas>
    <div className="relative z-10 grid grid-cols-3 gap-6">
      {/* Métricas principais sobrepostas à visualização */}
      <div className="bg-gray-900 bg-opacity-70 p-4 rounded-lg">
        <h3 className="text-sm font-medium text-gray-400">Taxa de Conversão</h3>
        <p className="text-3xl font-semibold">24.8%</p>
        <p className="text-green-500 text-sm">↑ 3.2%</p>
      </div>
      {/* Outras métricas */}
    </div>
  </div>
  
  {/* Dados detalhados em cartões com fundo semi-transparente */}
  <div className="grid grid-cols-2 gap-6">
    {/* Cartões de dados */}
  </div>
</div>
```

### 4. Simulador de Chat WhatsApp
```jsx
<div className="flex h-[calc(100vh-6rem)]">
  {/* Chat (Contexto Claro) */}
  <div className="w-2/3 bg-white rounded-lg shadow-lg overflow-hidden flex flex-col">
    {/* Header do WhatsApp */}
    <div className="bg-green-700 text-white p-4">
      <h3 className="font-medium">Simulador WhatsApp</h3>
    </div>
    
    {/* Área de mensagens */}
    <div className="flex-1 bg-[#e5ddd5] p-4 overflow-y-auto flex flex-col space-y-3">
      {/* Mensagens */}
      <div className="bg-white p-3 rounded-lg self-start max-w-[70%]">
        <p>Olá! Como posso ajudar?</p>
      </div>
      <div className="bg-green-100 p-3 rounded-lg self-end max-w-[70%]">
        <p>Gostaria de saber mais sobre seus produtos</p>
      </div>
      {/* Mais mensagens */}
    </div>
    
    {/* Input */}
    <div className="p-3 border-t">
      <div className="flex rounded-full bg-gray-100 p-2">
        <input 
          type="text" 
          className="flex-1 bg-transparent outline-none px-2" 
          placeholder="Digite uma mensagem..."
        />
        <button className="rounded-full bg-green-700 text-white p-2">
          <span>Enviar</span>
        </button>
      </div>
    </div>
  </div>
  
  {/* Estado do Agente (Contexto Escuro) */}
  <div className="w-1/3 bg-black text-white ml-4 rounded-lg p-4">
    <h3 className="font-medium mb-4">Estado do Agente</h3>
    
    {/* Visualização do "pensamento" do agente */}
    <div className="relative h-60 mb-4">
      <canvas id="agent-thinking" className="absolute inset-0"></canvas>
      <div className="relative z-10 p-2">
        <h4 className="text-sm font-medium text-gray-400">Processando</h4>
        <p className="text-sm text-gray-300">Identificando intenção...</p>
      </div>
    </div>
    
    {/* Fluxo ativo */}
    <div>
      <h4 className="text-sm font-medium text-gray-400 mb-2">Nó Atual</h4>
      <div className="bg-gray-800 rounded p-3">
        <p className="text-sm">Coleta de Informações do Produto</p>
        <div className="mt-2 h-1 bg-gray-700 rounded-full">
          <div className="h-1 bg-blue-500 rounded-full w-[30%]"></div>
        </div>
      </div>
    </div>
  </div>
</div>
```

## Microinterações e Feedback

### 1. Feedback de Progresso
```css
/* Estilo para elementos visualizando "pensamento" */
.thinking-indicator {
  opacity: 0;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { opacity: 0.3; transform: scale(0.97); }
  50% { opacity: 0.7; transform: scale(1); }
  100% { opacity: 0.3; transform: scale(0.97); }
}
```

### 2. Confirmações de Ação
```javascript
function showConfirmation(type, element) {
  // Elemento alvo para efeito visual
  const target = document.querySelector(element);
  
  switch(type) {
    case 'success':
      // Efeito de sucesso: Ondulação suave de fora para dentro
      target.classList.add('confirmation-success');
      setTimeout(() => target.classList.remove('confirmation-success'), 1000);
      break;
    case 'error':
      // Efeito de erro: Breve flash vermelho na borda
      target.classList.add('confirmation-error');
      setTimeout(() => target.classList.remove('confirmation-error'), 800);
      break;
    case 'completion':
      // Efeito de conclusão: Expansão e contração
      target.classList.add('confirmation-complete');
      setTimeout(() => target.classList.remove('confirmation-complete'), 1200);
      break;
  }
}
```

## Implementação Técnica

### 1. Visualizações WebGL
Para as visualizações abstratas, utilizaremos Three.js para renderização WebGL otimizada:

```javascript
import * as THREE from 'three';

// Criação da visualização de partículas
function initParticleVisualization(containerId, particleCount = 1000) {
  const container = document.getElementById(containerId);
  if (!container) return null;
  
  // Setup básico Three.js
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ alpha: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);
  
  // Criar partículas
  const particles = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const velocities = [];
  
  for (let i = 0; i < particleCount; i++) {
    // Posições iniciais aleatórias
    positions[i * 3] = (Math.random() - 0.5) * 2;     // x
    positions[i * 3 + 1] = (Math.random() - 0.5) * 2; // y
    positions[i * 3 + 2] = (Math.random() - 0.5) * 2; // z
    
    // Velocidades
    velocities.push({
      x: (Math.random() - 0.5) * 0.01,
      y: (Math.random() - 0.5) * 0.01,
      z: (Math.random() - 0.5) * 0.01
    });
  }
  
  particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  
  // Material de partícula
  const material = new THREE.PointsMaterial({
    color: 0x0EA5E9,
    size: 0.02,
    transparent: true,
    opacity: 0.6
  });
  
  // Sistema de partículas
  const particleSystem = new THREE.Points(particles, material);
  scene.add(particleSystem);
  
  camera.position.z = 1.5;
  
  // Animação
  function animate() {
    requestAnimationFrame(animate);
    
    const positions = particles.attributes.position.array;
    
    for (let i = 0; i < particleCount; i++) {
      // Atualizando posições com velocidades
      positions[i * 3] += velocities[i].x;
      positions[i * 3 + 1] += velocities[i].y;
      positions[i * 3 + 2] += velocities[i].z;
      
      // Reposicionar se saírem da área visível
      if (Math.abs(positions[i * 3]) > 1) velocities[i].x *= -1;
      if (Math.abs(positions[i * 3 + 1]) > 1) velocities[i].y *= -1;
      if (Math.abs(positions[i * 3 + 2]) > 1) velocities[i].z *= -1;
    }
    
    particles.attributes.position.needsUpdate = true;
    
    renderer.render(scene, camera);
  }
  
  animate();
  
  // Redimensionamento responsivo
  window.addEventListener('resize', () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  });
  
  return {
    updateActivity: (level) => {
      // Ajusta velocidade das partículas baseado no nível de atividade (0-1)
      for (let i = 0; i < particleCount; i++) {
        velocities[i].x *= 1 + level * 0.5;
        velocities[i].y *= 1 + level * 0.5;
        velocities[i].z *= 1 + level * 0.5;
      }
      
      // Ajusta cor e tamanho das partículas
      material.size = 0.02 + level * 0.03;
      material.opacity = 0.6 + level * 0.4;
    }
  };
}
```

### 2. Transições Contextuais
```javascript
function transitionToImmersive(fromElement, toElement, direction = 'vertical') {
  // Elemento de origem (contexto claro)
  const from = document.querySelector(fromElement);
  // Elemento de destino (contexto escuro)
  const to = document.querySelector(toElement);
  
  if (!from || !to) return;
  
  // Esconder o elemento de destino inicialmente
  to.style.opacity = '0';
  to.style.display = 'block';
  
  // Adicionar uma transformação baseada na direção
  const transform = direction === 'vertical' 
    ? 'translateY(20px)' 
    : 'translateX(20px)';
  to.style.transform = transform;
  
  // Animação de saída (contexto claro)
  from.style.transition = 'opacity 300ms ease-out';
  from.style.opacity = '0';
  
  // Após 150ms, iniciar a animação de entrada (contexto escuro)
  setTimeout(() => {
    to.style.transition = 'opacity 300ms ease-out, transform 300ms ease-out';
    to.style.opacity = '1';
    to.style.transform = 'translate(0)';
    
    // Após a transição completa, ocultar o elemento de origem
    setTimeout(() => {
      from.style.display = 'none';
      // Inicializar visualizações no novo contexto
      initVisualizations();
    }, 300);
  }, 150);
}

function transitionToFunctional(fromElement, toElement, direction = 'vertical') {
  // Similar à função anterior, mas com tempos de transição mais rápidos (200ms)
  // e direção de movimento inversa
}
```

## Adaptação para Dispositivos Móveis

Para manter a estética OpenAI em dispositivos móveis, implementamos um sistema de degradação elegante:

```css
/* Exemplo de Media Queries para adaptar visualizações */
@media (max-width: 768px) {
  .visualization-container {
    height: 140px; /* Reduzir altura das visualizações */
  }
  
  .metrics-grid {
    grid-template-columns: 1fr 1fr; /* 2 colunas em vez de 3 */
  }
  
  .context-switch {
    flex-direction: column; /* Empilhar áreas claras/escuras em vez de lado a lado */
  }
}

@media (max-width: 480px) {
  .visualization-container {
    height: 100px; /* Ainda mais compacto */
  }
  
  .metrics-grid {
    grid-template-columns: 1fr; /* 1 coluna apenas */
  }
  
  /* Simplificar visualizações */
  .particle-count {
    --particle-density: 0.5; /* 50% das partículas em telas pequenas */
  }
}
```

---

## Considerações de Acessibilidade

Mesmo mantendo a estética visual distintiva da OpenAI, garantimos que a interface seja acessível:

- **Contraste**: Assegurar boa legibilidade em ambos os contextos (claro/escuro)
- **Tamanho do texto**: Mínimo de 14px para texto principal, 16px preferível
- **Foco visível**: Estado de foco claramente visível em todos os elementos interativos
- **Alternativas para visualizações**: Dados numéricos e textuais disponíveis como alternativa às visualizações abstratas
- **Modo Reduzido de Movimento**: Opção para reduzir ou desativar animações

## Conclusão

Este documento define os princípios estéticos e funcionais para implementação da interface do usuário do sistema de Agentes de Conversão WhatsApp, seguindo o estilo visual distintivo da OpenAI. A alternância intencional entre contextos claros (funcionais) e escuros (imersivos) cria uma experiência que é simultaneamente sofisticada e utilizável, mantendo o equilíbrio entre estética e usabilidade.