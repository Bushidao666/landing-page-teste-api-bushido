// ===================================================================
//
//  FACEBOOK CONVERSIONS API & PIXEL INTEGRATION WITH DEDUPLICATION
//  
// ===================================================================
//
// Sistema completo de eventos Facebook com:
// - Deduplicação Pixel + CAPI 
// - Envio para API de Conversões Railway
// - Gerenciamento de dados de usuário
// - Cache de eventos e otimizações
//
// ===================================================================

/**
 * CONFIGURAÇÃO PRINCIPAL
 */
const FACEBOOK_CONFIG = {
  currency: 'BRL',
  debugMode: true, // Altere para false em produção
  pixelId: '1226168308717459'
};

/**
 * UTILITY FUNCTIONS
 */

// Função para gerar UUID (Identificador Único Universal)
function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Função para obter o valor de um cookie
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return undefined;
}

// Função para obter parâmetros da URL atual
function getUrlParameters() {
  const params = {};
  const urlParams = new URLSearchParams(window.location.search);
  for (const [key, value] of urlParams) {
    params[key] = value;
  }
  return params;
}

// Função para obter/gerar o external_id e armazená-lo no localStorage
function getExternalId() {
  let externalId = localStorage.getItem('fb_external_id');
  if (!externalId) {
    externalId = generateUUID();
    localStorage.setItem('fb_external_id', externalId);
  }
  return externalId;
}

// Sistema de debug avançado
const FBDebug = {
  log: function(level, message, data) {
    if (!FACEBOOK_CONFIG.debugMode) return;
    
    const timestamp = new Date().toISOString();
    const prefix = `[FB ${level.toUpperCase()}] ${timestamp}`;
    
    switch(level) {
      case 'info':
        console.log(prefix, message, data || '');
        break;
      case 'warn':
        console.warn(prefix, message, data || '');
        break;
      case 'error':
        console.error(prefix, message, data || '');
        break;
    }
  },
  
  info: function(message, data) { this.log('info', message, data); },
  warn: function(message, data) { this.log('warn', message, data); },
  error: function(message, data) { this.log('error', message, data); }
};

/**
 * GERENCIAMENTO DE DADOS DO USUÁRIO
 */

// Dados globais do usuário, persistidos entre páginas
let globalUserData = {
  external_id: getExternalId(),
  fbp: getCookie('_fbp'),
  fbc: getCookie('_fbc') || (getUrlParameters().fbclid || undefined),
  em: undefined, // Email bruto (será hasheado pelo backend)
  ph: undefined, // Telefone bruto (será hasheado pelo backend)  
  fn: undefined, // Nome bruto (será hasheado pelo backend)
  ln: undefined  // Sobrenome bruto (será hasheado pelo backend)
};

// Função para carregar dados do usuário do localStorage
function loadUserData() {
  try {
    const storedData = localStorage.getItem('fb_user_data');
    if (storedData) {
      const parsed = JSON.parse(storedData);
      Object.assign(globalUserData, parsed);
      
      // Atualizar cookies do Facebook se disponíveis
      globalUserData.fbp = getCookie('_fbp') || globalUserData.fbp;
      globalUserData.fbc = getCookie('_fbc') || globalUserData.fbc;
      
      // Verificar fbclid na URL atual
      const currentFbclid = getUrlParameters().fbclid;
      if (currentFbclid) {
        globalUserData.fbc = currentFbclid;
      }
    }
    FBDebug.info('Dados do usuário carregados', globalUserData);
  } catch (error) {
    FBDebug.error('Erro ao carregar dados do localStorage', error);
  }
}

// Função para atualizar e salvar os dados do usuário
function updateUserData(newData) {
  Object.assign(globalUserData, newData);
  try {
    localStorage.setItem('fb_user_data', JSON.stringify(globalUserData));
    FBDebug.info('Dados do usuário atualizados', globalUserData);
  } catch (error) {
    FBDebug.error('Erro ao salvar dados no localStorage', error);
  }
}

/**
 * SISTEMA DE CACHE DE EVENTOS
 */
const EventCache = {
  sentEvents: new Set(),
  
  shouldSendEvent: function(eventType, identifier) {
    const key = `${eventType}_${identifier || 'default'}`;
    if (this.sentEvents.has(key)) {
      FBDebug.warn('Evento duplicado bloqueado', { eventType, identifier });
      return false;
    }
    this.sentEvents.add(key);
    return true;
  },
  
  markEventSent: function(eventType, identifier) {
    const key = `${eventType}_${identifier || 'default'}`;
    this.sentEvents.add(key);
  }
};

/**
 * FUNÇÃO PRINCIPAL DE ENVIO PARA CONVERSIONS API
 */

async function sendToConversionsAPI(eventName, eventData, eventId) {
  if (!window.ENV?.API_BASE_URL) {
    FBDebug.error('API_BASE_URL não configurada');
    return { success: false, error: 'Configuração ausente' };
  }
  
  // Sanitizar e validar a URL base
  let baseUrl = window.ENV.API_BASE_URL.trim();
  
  // Remover barra final se existir
  if (baseUrl.endsWith('/')) {
    baseUrl = baseUrl.slice(0, -1);
  }
  
  // Validar se é uma URL válida
  if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
    FBDebug.error('API_BASE_URL inválida - deve começar com http:// ou https://', baseUrl);
    return { success: false, error: 'URL inválida' };
  }
  
  const urlParameters = getUrlParameters();
  
  // Determinar endpoint baseado no tipo de evento
  const isCustomEvent = !['PageView', 'ViewContent', 'Lead', 'InitiateCheckout'].includes(eventName);
  const endpoint = isCustomEvent 
    ? `/api/track/custom/${eventName.toLowerCase()}` 
    : `/api/track/${eventName.toLowerCase()}`;
    
  // Preparar dados customizados
  const customData = { ...eventData };
  if (isCustomEvent) {
    customData.event_name = eventName;
  }
  
  // Construir payload para CAPI
  const payload = {
    eventId: eventId,
    userData: {
      external_id: globalUserData.external_id ? [globalUserData.external_id] : undefined,
      em: globalUserData.em ? [globalUserData.em] : undefined,
      ph: globalUserData.ph ? [globalUserData.ph] : undefined,
      fn: globalUserData.fn ? [globalUserData.fn] : undefined,
      ln: globalUserData.ln ? [globalUserData.ln] : undefined,
      fbc: globalUserData.fbc || (urlParameters.fbclid || undefined),
      fbp: globalUserData.fbp || undefined,
    },
    customData: customData,
    eventSourceUrl: window.location.href,
    urlParameters: urlParameters,
    actionSource: 'website'
  };
  
  // Limpar campos undefined
  Object.keys(payload.userData).forEach(key => {
    if (payload.userData[key] === undefined || payload.userData[key] === null) {
      delete payload.userData[key];
    }
  });
  
  try {
    // Construir URL corretamente usando a baseUrl sanitizada
    const fullUrl = `${baseUrl}${endpoint}`;
    FBDebug.info(`Enviando para CAPI: ${eventName}`, { url: fullUrl, payload });
    
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload),
      timeout: 10000 // 10 segundos timeout
    });
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Erro desconhecido');
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    const result = await response.json();
    
    FBDebug.info(`✅ CAPI ${eventName} enviado com sucesso`, { 
      eventId, 
      fbtrace_id: result.fbtrace_id,
      diagnostics: result.diagnostics 
    });
    
    return { success: true, result };
    
  } catch (error) {
    FBDebug.error(`❌ Erro no CAPI ${eventName}`, error);
    return { success: false, error: error.message };
  }
}

/**
 * FUNÇÃO DE ENVIO DUAL (PIXEL + CAPI) COM DEDUPLICAÇÃO
 */

async function sendDualEvent(eventName, pixelData = {}, capiData = {}) {
  const eventId = generateUUID();
  
  // 1. Enviar para Facebook Pixel (client-side) se disponível
  if (typeof fbq !== 'undefined') {
    try {
      fbq('track', eventName, pixelData, { eventID: eventId });
      FBDebug.info(`✅ Pixel ${eventName} enviado`, { eventId, pixelData });
    } catch (error) {
      FBDebug.error(`❌ Erro no Pixel ${eventName}`, error);
    }
  } else {
    FBDebug.warn('Facebook Pixel não disponível');
  }
  
  // 2. Enviar para Conversions API (server-side)
  const capiResult = await sendToConversionsAPI(eventName, capiData, eventId);
  
  return {
    eventId,
    pixel: typeof fbq !== 'undefined',
    capi: capiResult.success,
    error: capiResult.error
  };
}

/**
 * EVENTOS ESPECÍFICOS
 */

// 1. PageView (Evento Padrão)
async function trackPageView() {
  const pageIdentifier = window.location.pathname;
  
  if (!EventCache.shouldSendEvent('PageView', pageIdentifier)) {
    return;
  }
  
  const pixelData = {};
  const capiData = {};
  
  const result = await sendDualEvent('PageView', pixelData, capiData);
  FBDebug.info('PageView tracking completo', result);
  
  return result;
}

// 2. ViewContent (Seção de Depoimentos)
async function trackViewContent(customData = {}) {
  const sectionIdentifier = 'video-testimonials';
  
  if (!EventCache.shouldSendEvent('ViewContent', sectionIdentifier)) {
    return;
  }
  
  const defaultData = {
    content_name: 'Depoimentos em Vídeo',
    content_category: 'social_proof',
    content_type: 'video_testimonials',
    value: 0,
    currency: FACEBOOK_CONFIG.currency
  };
  
  const pixelData = { ...defaultData, ...customData };
  const capiData = { ...defaultData, ...customData };
  
  const result = await sendDualEvent('ViewContent', pixelData, capiData);
  FBDebug.info('ViewContent tracking completo', result);
  
  return result;
}

// 3. Lead (Submissão do Formulário)
async function trackLead(formData = {}) {
  const leadId = `${Date.now()}_${globalUserData.external_id}`;
  
  if (!EventCache.shouldSendEvent('Lead', leadId)) {
    return;
  }
  
  // Atualizar dados do usuário com informações do formulário
  if (formData.email) updateUserData({ em: formData.email.trim().toLowerCase() });
  if (formData.phone) updateUserData({ ph: formData.phone.replace(/\D/g, '') });
  if (formData.name) {
    const nameParts = formData.name.trim().split(' ');
    const firstName = nameParts.shift();
    const lastName = nameParts.join(' ');
    updateUserData({ fn: firstName, ln: lastName });
  }
  
  const leadEventData = {
    content_name: 'Formulário de Análise Gratuita',
    content_category: 'lead_generation',
    form_type: 'landing_page_lead',
    source_page: window.location.pathname,
    value: 0,
    currency: FACEBOOK_CONFIG.currency,
    content_type: 'lead',
    contents: [{
      id: 'lead_form',
      quantity: 1,
      item_price: 0
    }],
    num_items: 1
  };
  
  const result = await sendDualEvent('Lead', leadEventData, leadEventData);
  FBDebug.info('Lead tracking completo', result);
  
  return result;
}

// 4. Evento para Supabase (Preencheu Formulário)
async function sendToSupabase(formData) {
  if (!window.ENV?.SUPABASE_FORM_ENDPOINT || window.ENV.SUPABASE_FORM_ENDPOINT === 'CONFIGURE_NO_NETLIFY') {
    FBDebug.warn('Endpoint Supabase não configurado');
    return { success: false, error: 'Endpoint não configurado' };
  }
  
  const payload = {
    ...formData,
    event: 'PreencheuFormulario',
    timestamp: Date.now(),
    external_id: globalUserData.external_id,
    url: window.location.href,
    utm_params: getUrlParameters()
  };
  
  try {
    FBDebug.info('Enviando para Supabase', payload);
    
    const response = await fetch(window.ENV.SUPABASE_FORM_ENDPOINT, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload),
      timeout: 8000 // 8 segundos timeout
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const result = await response.json();
    FBDebug.info('✅ Evento Supabase enviado com sucesso', result);
    
    return { success: true, result };
    
  } catch (error) {
    FBDebug.error('❌ Erro no evento Supabase', error);
    return { success: false, error: error.message };
  }
}

/**
 * INTERSECTION OBSERVER PARA VIEWCONTENT
 */

function setupViewContentObserver() {
  const targetSection = document.querySelector('.video-testimonials');
  
  if (!targetSection) {
    FBDebug.warn('Seção .video-testimonials não encontrada');
    return;
  }
  
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          FBDebug.info('Seção de depoimentos visualizada');
          trackViewContent();
          observer.disconnect(); // Disparar apenas uma vez
        }
      });
    },
    { 
      threshold: 0.5, // 50% da seção visível
      rootMargin: '0px 0px -100px 0px' // Margem para garantir visualização efetiva
    }
  );
  
  observer.observe(targetSection);
  FBDebug.info('Observer ViewContent configurado');
}

/**
 * VALIDAÇÃO E INICIALIZAÇÃO
 */

function validateFacebookConfig() {
  const issues = [];
  
  if (!globalUserData.external_id) {
    issues.push('external_id não foi gerado');
  }
  
  if (!globalUserData.fbp && !globalUserData.fbc) {
    issues.push('Nenhum identificador do Facebook encontrado (fbp/fbc)');
  }
  
  if (!window.ENV?.API_BASE_URL) {
    issues.push('API_BASE_URL não configurada');
  } else {
    // Debug detalhado da URL
    FBDebug.info('API_BASE_URL configurada', {
      raw: window.ENV.API_BASE_URL,
      length: window.ENV.API_BASE_URL.length,
      startsWithHttp: window.ENV.API_BASE_URL.startsWith('http'),
      domain: window.location.hostname
    });
  }
  
  if (issues.length > 0) {
    FBDebug.warn('Problemas de configuração encontrados', issues);
  } else {
    FBDebug.info('Configuração validada com sucesso');
  }
  
  return issues.length === 0;
}

/**
 * INICIALIZAÇÃO AUTOMÁTICA
 */

document.addEventListener('DOMContentLoaded', function() {
  FBDebug.info('Inicializando sistema Facebook Events');
  
  // Carregar dados do usuário
  loadUserData();
  
  // Validar configuração
  validateFacebookConfig();
  
  // Debug das URLs (apenas em modo debug)
  if (FACEBOOK_CONFIG.debugMode) {
    debugApiUrls();
  }
  
  // Configurar observer para ViewContent
  setupViewContentObserver();
  
  FBDebug.info('Sistema Facebook Events inicializado com sucesso');
});

// PageView automático após carregamento completo
window.addEventListener('load', function() {
  // Delay para garantir que cookies do Pixel sejam carregados
  setTimeout(() => {
    // Atualizar cookies do Facebook mais recentes
    globalUserData.fbp = getCookie('_fbp') || globalUserData.fbp;
    globalUserData.fbc = getCookie('_fbc') || globalUserData.fbc;
    
    // Disparar PageView
    trackPageView();
  }, 1000);
});

// Função de debug para testar URLs
function debugApiUrls() {
  const eventTypes = ['pageview', 'viewcontent', 'lead'];
  const baseUrl = window.ENV?.API_BASE_URL || 'NOT_CONFIGURED';
  
  console.group('🔍 Debug API URLs');
  console.log('Base URL:', baseUrl);
  console.log('Current Domain:', window.location.hostname);
  
  eventTypes.forEach(eventType => {
    const endpoint = `/api/track/${eventType}`;
    const fullUrl = `${baseUrl}${endpoint}`;
    console.log(`${eventType.toUpperCase()}:`, fullUrl);
  });
  
  console.groupEnd();
}

// Exposer funções globais para uso externo
window.fbEvents = {
  trackPageView,
  trackViewContent,
  trackLead,
  sendToSupabase,
  updateUserData,
  getUserData: () => ({ ...globalUserData }),
  clearCache: () => EventCache.sentEvents.clear(),
  debug: FBDebug,
  debugUrls: debugApiUrls
};

FBDebug.info('✅ Facebook Events carregado com deduplicação ativa'); 