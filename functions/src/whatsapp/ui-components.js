/**
 * Componentes de UI para frontend dos Agentes de Conversão WhatsApp
 * Implementação JavaScript dos princípios estéticos baseados no estilo OpenAI
 */

// Configurações globais e utilitários
const UI_CONFIG = {
  transitionSpeed: {
    immersive: 300, // ms
    functional: 200, // ms
  },
  colors: {
    primary: '#0EA5E9',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    dark: '#000000',
    darkGray: '#202123',
    light: '#FFFFFF',
    lightGray: '#F5F5F5',
  },
  breakpoints: {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
  },
  particleDensity: {
    high: 1000,
    medium: 500,
    low: 200,
  },
};

/**
 * Inicializa as visualizações WebGL para os backgrounds imersivos
 * @param {string} containerId - ID do container HTML para a visualização
 * @param {Object} options - Opções de configuração
 */
function initializeVisualization(containerId, options = {}) {
  // Configurações padrão
  const config = {
    type: options.type || 'particles', // 'particles', 'mesh', 'waves'
    density: options.density || 'medium',
    color: options.color || UI_CONFIG.colors.primary,
    speed: options.speed || 1.0,
    interactive: options.interactive !== undefined ? options.interactive : true,
    ...options,
  };

  // Element container
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container ${containerId} not found`);
    return null;
  }

  // Verificar se Three.js está disponível
  if (typeof THREE === 'undefined') {
    console.warn('Three.js não encontrado, carregando visualização simplificada');
    return initializeSimpleVisualization(container, config);
  }

  // Configuração Three.js
  const width = container.offsetWidth;
  const height = container.offsetHeight;
  
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
  camera.position.z = 1.5;
  
  const renderer = new THREE.WebGLRenderer({ 
    alpha: true,
    antialias: true
  });
  renderer.setSize(width, height);
  renderer.setPixelRatio(window.devicePixelRatio);
  
  // Remover canvas existente se houver
  const existingCanvas = container.querySelector('canvas');
  if (existingCanvas) {
    container.removeChild(existingCanvas);
  }
  
  container.appendChild(renderer.domElement);
  
  // Determinar número de partículas com base na densidade
  let particleCount;
  switch (config.density) {
    case 'high':
      particleCount = UI_CONFIG.particleDensity.high;
      break;
    case 'medium':
      particleCount = UI_CONFIG.particleDensity.medium;
      break;
    case 'low':
      particleCount = UI_CONFIG.particleDensity.low;
      break;
    default:
      particleCount = typeof config.density === 'number' 
        ? config.density 
        : UI_CONFIG.particleDensity.medium;
  }
  
  // Criar visualização com base no tipo
  let visualization;
  switch (config.type) {
    case 'particles':
      visualization = createParticleVisualization(scene, particleCount, config);
      break;
    case 'mesh':
      visualization = createMeshVisualization(scene, particleCount, config);
      break;
    case 'waves':
      visualization = createWaveVisualization(scene, config);
      break;
    default:
      visualization = createParticleVisualization(scene, particleCount, config);
  }
  
  // Redimensionamento
  window.addEventListener('resize', () => {
    const newWidth = container.offsetWidth;
    const newHeight = container.offsetHeight;
    
    camera.aspect = newWidth / newHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(newWidth, newHeight);
  });
  
  // Interatividade com mouse se configurada
  if (config.interactive) {
    const mouse = new THREE.Vector2();
    const targetMouse = new THREE.Vector2();
    
    container.addEventListener('mousemove', (event) => {
      const rect = container.getBoundingClientRect();
      targetMouse.x = ((event.clientX - rect.left) / width) * 2 - 1;
      targetMouse.y = -((event.clientY - rect.top) / height) * 2 + 1;
    });
    
    // Suavização do movimento do mouse
    const updateMouse = () => {
      mouse.x += (targetMouse.x - mouse.x) * 0.1;
      mouse.y += (targetMouse.y - mouse.y) * 0.1;
      
      if (visualization.updateMouse) {
        visualization.updateMouse(mouse);
      }
    };
    
    const animate = () => {
      requestAnimationFrame(animate);
      updateMouse();
      visualization.update(config.speed);
      renderer.render(scene, camera);
    };
    
    animate();
  } else {
    const animate = () => {
      requestAnimationFrame(animate);
      visualization.update(config.speed);
      renderer.render(scene, camera);
    };
    
    animate();
  }
  
  // API para manipular a visualização
  return {
    setActivity: (level) => {
      if (visualization.setActivity) {
        visualization.setActivity(Math.max(0, Math.min(1, level)));
      }
    },
    setColor: (color) => {
      if (visualization.setColor) {
        visualization.setColor(color);
      }
    },
    cleanup: () => {
      // Limpar ouvintes e recursos
      window.removeEventListener('resize', () => {});
      renderer.dispose();
      if (visualization.dispose) {
        visualization.dispose();
      }
    }
  };
}

/**
 * Cria uma visualização de partículas para representar dados fluidos
 * @private
 */
function createParticleVisualization(scene, particleCount, config) {
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
  
  // Converter cor para formato Three.js
  const color = new THREE.Color(config.color);
  
  // Material de partícula
  const material = new THREE.PointsMaterial({
    color: color,
    size: 0.02,
    transparent: true,
    opacity: 0.6,
    depthWrite: false,
  });
  
  // Sistema de partículas
  const particleSystem = new THREE.Points(particles, material);
  scene.add(particleSystem);
  
  // Estado da visualização
  let activityLevel = 0.5; // Nível padrão de atividade (0-1)
  
  return {
    update: (speed) => {
      const positions = particles.attributes.position.array;
      
      for (let i = 0; i < particleCount; i++) {
        // Aplicar velocidade ajustada pelo nível de atividade e velocidade
        positions[i * 3] += velocities[i].x * speed * (1 + activityLevel);
        positions[i * 3 + 1] += velocities[i].y * speed * (1 + activityLevel);
        positions[i * 3 + 2] += velocities[i].z * speed * (1 + activityLevel);
        
        // Reposicionar se saírem da área visível
        if (Math.abs(positions[i * 3]) > 1) velocities[i].x *= -1;
        if (Math.abs(positions[i * 3 + 1]) > 1) velocities[i].y *= -1;
        if (Math.abs(positions[i * 3 + 2]) > 1) velocities[i].z *= -1;
      }
      
      particles.attributes.position.needsUpdate = true;
    },
    
    updateMouse: (mouse) => {
      // Adicionar influência do mouse se disponível
      const positions = particles.attributes.position.array;
      const attraction = 0.0001 * activityLevel;
      
      for (let i = 0; i < particleCount; i++) {
        // Sutilmente atrair partículas em direção ao mouse
        velocities[i].x += (mouse.x - positions[i * 3]) * attraction;
        velocities[i].y += (mouse.y - positions[i * 3 + 1]) * attraction;
      }
    },
    
    setActivity: (level) => {
      activityLevel = level;
      // Ajustar visualmente com base no nível de atividade
      material.size = 0.02 + level * 0.03;
      material.opacity = 0.4 + level * 0.6;
    },
    
    setColor: (newColor) => {
      material.color.set(newColor);
    },
    
    dispose: () => {
      particles.dispose();
      material.dispose();
      scene.remove(particleSystem);
    }
  };
}

/**
 * Cria uma visualização de malha geométrica para representar redes
 * @private
 */
function createMeshVisualization(scene, nodeCount, config) {
  // Implementação da malha geométrica
  const nodes = [];
  const edges = [];
  
  // Criar nós
  for (let i = 0; i < nodeCount; i++) {
    nodes.push({
      position: new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2
      ),
      connections: []
    });
  }
  
  // Criar conexões entre nós (não todos conectados a todos)
  const edgesGroup = new THREE.Group();
  scene.add(edgesGroup);
  
  // Material para nós e conexões
  const color = new THREE.Color(config.color);
  const nodeMaterial = new THREE.MeshBasicMaterial({ 
    color: color,
    transparent: true,
    opacity: 0.7
  });
  
  const edgeMaterial = new THREE.LineBasicMaterial({ 
    color: color,
    transparent: true,
    opacity: 0.3
  });
  
  // Criar geometria para os nós
  const nodeGeometry = new THREE.SphereGeometry(0.02, 8, 8);
  const nodeMeshes = [];
  
  nodes.forEach(node => {
    const mesh = new THREE.Mesh(nodeGeometry, nodeMaterial);
    mesh.position.copy(node.position);
    scene.add(mesh);
    nodeMeshes.push(mesh);
  });
  
  // Criar conexões (linhas) entre nós próximos
  const maxConnections = 3; // Máximo de conexões por nó
  const maxDistance = 0.8; // Distância máxima para conexão
  
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    
    // Encontrar nós próximos
    const potentialConnections = [];
    for (let j = 0; j < nodes.length; j++) {
      if (i === j) continue; // Não conectar a si mesmo
      
      const otherNode = nodes[j];
      const distance = node.position.distanceTo(otherNode.position);
      
      if (distance < maxDistance) {
        potentialConnections.push({ index: j, distance });
      }
    }
    
    // Ordenar por distância e pegar os mais próximos
    potentialConnections.sort((a, b) => a.distance - b.distance);
    const connections = potentialConnections.slice(0, maxConnections);
    
    // Criar linhas para as conexões
    connections.forEach(conn => {
      // Evitar conexões duplicadas
      if (i < conn.index) { // Só criar uma conexão entre dois nós
        const geometry = new THREE.BufferGeometry().setFromPoints([
          nodes[i].position,
          nodes[conn.index].position
        ]);
        
        const line = new THREE.Line(geometry, edgeMaterial);
        edgesGroup.add(line);
        edges.push({
          line,
          from: i,
          to: conn.index,
          original: {
            from: nodes[i].position.clone(),
            to: nodes[conn.index].position.clone()
          }
        });
      }
    });
  }
  
  // Estado da visualização
  let activityLevel = 0.5;
  
  return {
    update: (speed) => {
      // Movimento sutil dos nós
      nodeMeshes.forEach((mesh, index) => {
        mesh.position.x += (Math.random() - 0.5) * 0.002 * speed;
        mesh.position.y += (Math.random() - 0.5) * 0.002 * speed;
        mesh.position.z += (Math.random() - 0.5) * 0.002 * speed;
        
        // Limite de movimento
        if (Math.abs(mesh.position.x) > 1) mesh.position.x *= 0.98;
        if (Math.abs(mesh.position.y) > 1) mesh.position.y *= 0.98;
        if (Math.abs(mesh.position.z) > 1) mesh.position.z *= 0.98;
        
        nodes[index].position.copy(mesh.position);
      });
      
      // Atualizar posições das linhas
      edges.forEach(edge => {
        const points = [
          nodes[edge.from].position,
          nodes[edge.to].position
        ];
        
        edge.line.geometry.setFromPoints(points);
        edge.line.geometry.verticesNeedUpdate = true;
      });
    },
    
    updateMouse: (mouse) => {
      // Influência do mouse na malha
      const attraction = 0.01 * activityLevel;
      
      nodeMeshes.forEach((mesh, index) => {
        if (index % 3 === 0) { // Apenas alguns nós para evitar muito movimento
          mesh.position.x += (mouse.x - mesh.position.x) * attraction;
          mesh.position.y += (mouse.y - mesh.position.y) * attraction;
        }
      });
    },
    
    setActivity: (level) => {
      activityLevel = level;
      
      // Ajustar visualização com base no nível de atividade
      nodeMaterial.opacity = 0.5 + level * 0.5;
      edgeMaterial.opacity = 0.2 + level * 0.3;
      
      // Aumentar ou diminuir tamanho dos nós
      nodeMeshes.forEach(mesh => {
        mesh.scale.set(
          1 + level * 0.5,
          1 + level * 0.5,
          1 + level * 0.5
        );
      });
    },
    
    setColor: (newColor) => {
      const color = new THREE.Color(newColor);
      nodeMaterial.color.set(color);
      edgeMaterial.color.set(color);
    },
    
    dispose: () => {
      nodeGeometry.dispose();
      nodeMaterial.dispose();
      edgeMaterial.dispose();
      
      nodeMeshes.forEach(mesh => {
        scene.remove(mesh);
      });
      
      edgesGroup.traverse(object => {
        if (object instanceof THREE.Line) {
          object.geometry.dispose();
        }
      });
      
      scene.remove(edgesGroup);
    }
  };
}

/**
 * Cria uma visualização de ondas para representar processamento
 * @private
 */
function createWaveVisualization(scene, config) {
  // Implementação simplificada de ondas harmônicas
  const waveResolution = 128; // Resolução da onda
  const color = new THREE.Color(config.color);
  
  // Material para as ondas
  const material = new THREE.LineBasicMaterial({
    color: color,
    transparent: true,
    opacity: 0.6
  });
  
  // Criar geometria para várias ondas
  const waveCount = 3;
  const waves = [];
  
  for (let w = 0; w < waveCount; w++) {
    const wavePoints = [];
    
    for (let i = 0; i < waveResolution; i++) {
      const x = (i / (waveResolution - 1)) * 2 - 1; // -1 a 1
      const y = 0;
      const z = (w * 0.1) - 0.1; // Espaçar as ondas
      
      wavePoints.push(new THREE.Vector3(x, y, z));
    }
    
    const geometry = new THREE.BufferGeometry().setFromPoints(wavePoints);
    const line = new THREE.Line(geometry, material);
    scene.add(line);
    
    waves.push({
      line,
      points: wavePoints,
      offset: Math.random() * Math.PI * 2, // Deslocamento inicial aleatório
      frequency: 0.5 + Math.random() * 2, // Frequência aleatória
      amplitude: 0.05 + Math.random() * 0.1 // Amplitude aleatória
    });
  }
  
  // Estado da visualização
  let activityLevel = 0.5;
  let time = 0;
  
  return {
    update: (speed) => {
      time += 0.01 * speed;
      
      waves.forEach(wave => {
        for (let i = 0; i < wave.points.length; i++) {
          const x = wave.points[i].x;
          
          // Calcular altura da onda baseada em uma combinação de senos
          const waveHeight = 
            Math.sin(time * wave.frequency + wave.offset + x * 5) * wave.amplitude * (1 + activityLevel) +
            Math.sin(time * wave.frequency * 0.5 + wave.offset + x * 3) * wave.amplitude * 0.5 * (1 + activityLevel);
          
          wave.points[i].y = waveHeight;
        }
        
        wave.line.geometry.setFromPoints(wave.points);
        wave.line.geometry.verticesNeedUpdate = true;
      });
    },
    
    updateMouse: (mouse) => {
      // Adicionar perturbação na onda baseada na posição do mouse
      waves.forEach(wave => {
        const perturbation = 0.1 * activityLevel;
        const center = Math.max(-0.9, Math.min(0.9, mouse.x)); // Limitar entre -0.9 e 0.9
        
        for (let i = 0; i < wave.points.length; i++) {
          const x = wave.points[i].x;
          const distance = Math.abs(x - center);
          
          if (distance < 0.2) {
            // Adicionar uma pequena perturbação nas ondas próximas ao cursor
            wave.points[i].y += perturbation * (1 - distance / 0.2) * (Math.random() - 0.5);
          }
        }
      });
    },
    
    setActivity: (level) => {
      activityLevel = level;
      
      // Ajustar opacidade
      material.opacity = 0.4 + level * 0.6;
      
      // Ajustar frequências das ondas
      waves.forEach(wave => {
        wave.frequency = (0.5 + Math.random() * 2) * (1 + level);
      });
    },
    
    setColor: (newColor) => {
      material.color.set(newColor);
    },
    
    dispose: () => {
      material.dispose();
      
      waves.forEach(wave => {
        wave.line.geometry.dispose();
        scene.remove(wave.line);
      });
    }
  };
}

/**
 * Inicializa uma visualização de fallback para navegadores sem WebGL
 * @private
 */
function initializeSimpleVisualization(container, config) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  canvas.width = container.offsetWidth;
  canvas.height = container.offsetHeight;
  
  // Remover canvas existente se houver
  const existingCanvas = container.querySelector('canvas');
  if (existingCanvas) {
    container.removeChild(existingCanvas);
  }
  
  container.appendChild(canvas);
  
  // Configurar estilo
  canvas.style.position = 'absolute';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  
  // Criar partículas simples
  const particles = [];
  const particleCount = config.density === 'high' ? 100 : 
                        config.density === 'medium' ? 50 : 20;
  
  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 2 + 1,
      color: config.color,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2
    });
  }
  
  // Estado
  let activityLevel = 0.5;
  let mouseX = null;
  let mouseY = null;
  let running = true;
  
  // Interatividade
  if (config.interactive) {
    container.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    });
    
    container.addEventListener('mouseleave', () => {
      mouseX = null;
      mouseY = null;
    });
  }
  
  // Animação
  function animate() {
    if (!running) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Desenhar partículas
    particles.forEach(particle => {
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      ctx.fillStyle = particle.color;
      ctx.globalAlpha = 0.6;
      ctx.fill();
      
      // Movimento com base na atividade
      particle.x += particle.vx * config.speed * (1 + activityLevel);
      particle.y += particle.vy * config.speed * (1 + activityLevel);
      
      // Verificar limites
      if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
      if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;
      
      // Interação com mouse
      if (mouseX !== null && mouseY !== null) {
        const dx = mouseX - particle.x;
        const dy = mouseY - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 100) {
          particle.vx += dx * 0.0001 * activityLevel;
          particle.vy += dy * 0.0001 * activityLevel;
        }
      }
    });
    
    requestAnimationFrame(animate);
  }
  
  // Iniciar animação
  animate();
  
  // Redimensionamento
  window.addEventListener('resize', () => {
    canvas.width = container.offsetWidth;
    canvas.height = container.offsetHeight;
  });
  
  // API pública
  return {
    setActivity: (level) => {
      activityLevel = level;
    },
    setColor: (color) => {
      particles.forEach(particle => {
        particle.color = color;
      });
    },
    cleanup: () => {
      running = false;
      window.removeEventListener('resize', () => {});
      container.removeChild(canvas);
    }
  };
}

/**
 * Realiza transição entre modos claro (funcional) e escuro (imersivo)
 * @param {string} fromSelector - Seletor do elemento a transicionar
 * @param {string} toSelector - Seletor do elemento de destino
 * @param {Object} options - Opções da transição
 */
function transitionContext(fromSelector, toSelector, options = {}) {
  const defaults = {
    direction: 'vertical', // 'vertical' ou 'horizontal'
    type: 'immersive',     // 'immersive' ou 'functional'
    onComplete: () => {}   // Callback após conclusão
  };
  
  const config = { ...defaults, ...options };
  
  // Elementos
  const fromElement = document.querySelector(fromSelector);
  const toElement = document.querySelector(toSelector);
  
  if (!fromElement || !toElement) {
    console.error('Elementos para transição não encontrados');
    return;
  }
  
  // Duração da transição baseada no tipo
  const duration = config.type === 'immersive' 
    ? UI_CONFIG.transitionSpeed.immersive 
    : UI_CONFIG.transitionSpeed.functional;
  
  // Configuração inicial do elemento de destino
  toElement.style.opacity = '0';
  toElement.style.display = 'block';
  toElement.style.transition = `opacity ${duration}ms ease-out, transform ${duration}ms ease-out`;
  
  // Transformação baseada na direção
  const transform = config.direction === 'vertical' 
    ? `translateY(${config.type === 'immersive' ? '20px' : '-20px'})` 
    : `translateX(${config.type === 'immersive' ? '20px' : '-20px'})`;
    
  toElement.style.transform = transform;
  
  // Animação de saída
  fromElement.style.transition = `opacity ${duration}ms ease-out`;
  fromElement.style.opacity = '0';
  
  // Após metade do tempo, iniciar animação de entrada
  setTimeout(() => {
    toElement.style.opacity = '1';
    toElement.style.transform = 'translate(0)';
    
    // Após a transição completa
    setTimeout(() => {
      fromElement.style.display = 'none';
      config.onComplete();
    }, duration);
  }, duration / 2);
}

/**
 * Cria um efeito de confirmação visual para feedback do usuário
 * @param {string} elementSelector - Seletor do elemento para aplicar efeito
 * @param {string} type - Tipo de confirmação: 'success', 'error', 'completion'
 */
function createConfirmationEffect(elementSelector, type = 'success') {
  const element = document.querySelector(elementSelector);
  if (!element) return;
  
  // Remover classes de efeito existentes
  element.classList.remove('confirmation-success', 'confirmation-error', 'confirmation-complete');
  
  // Aplicar classe de efeito baseado no tipo
  switch (type) {
    case 'success':
      element.classList.add('confirmation-success');
      setTimeout(() => element.classList.remove('confirmation-success'), 1000);
      break;
    case 'error':
      element.classList.add('confirmation-error');
      setTimeout(() => element.classList.remove('confirmation-error'), 800);
      break;
    case 'completion':
      element.classList.add('confirmation-complete');
      setTimeout(() => element.classList.remove('confirmation-complete'), 1200);
      break;
  }
}

/**
 * Adiciona estilos CSS necessários para os efeitos visuais
 */
function injectStyles() {
  const styleId = 'openai-style-effects';
  
  // Verificar se os estilos já foram injetados
  if (document.getElementById(styleId)) return;
  
  const styleElement = document.createElement('style');
  styleElement.id = styleId;
  
  styleElement.textContent = `
    /* Efeitos de confirmação */
    .confirmation-success {
      animation: success-pulse 1s ease-out;
    }
    
    .confirmation-error {
      animation: error-pulse 0.8s ease-out;
    }
    
    .confirmation-complete {
      animation: complete-expand 1.2s ease-out;
    }
    
    @keyframes success-pulse {
      0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
      30% { box-shadow: 0 0 0 8px rgba(16, 185, 129, 0.3); }
      100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
    }
    
    @keyframes error-pulse {
      0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
      20% { box-shadow: 0 0 0 8px rgba(239, 68, 68, 0.3); }
      100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
    }
    
    @keyframes complete-expand {
      0% { transform: scale(1); }
      30% { transform: scale(1.05); }
      60% { transform: scale(0.98); }
      100% { transform: scale(1); }
    }
    
    /* Animação de carregamento para simular "pensamento" do agente */
    .thinking-indicator {
      opacity: 0;
      animation: pulse 2s infinite;
    }
    
    @keyframes pulse {
      0% { opacity: 0.3; transform: scale(0.97); }
      50% { opacity: 0.7; transform: scale(1); }
      100% { opacity: 0.3; transform: scale(0.97); }
    }
    
    /* Redução de movimento */
    @media (prefers-reduced-motion: reduce) {
      .confirmation-success,
      .confirmation-error,
      .confirmation-complete,
      .thinking-indicator {
        animation: none !important;
        transition: none !important;
      }
    }
  `;
  
  document.head.appendChild(styleElement);
}

// Exportar API pública
export const OpenAIStyleUI = {
  initializeVisualization,
  transitionContext,
  createConfirmationEffect,
  injectStyles,
  config: UI_CONFIG
};