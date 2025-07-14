// ===================================================================
//
//  FACEBOOK CONVERSIONS API & CUSTOM EVENTS INTEGRATION SCRIPT
//  Baseado nas documentações: FRONTEND_INTEGRATION.md e EVENTOS_PERSONALIZADOS_GUIA.md
//
// ===================================================================

// --- CONFIGURAÇÃO PRINCIPAL ---
// ⚠️ SUBSTITUA PELOS SEUS DADOS REAIS
const API_BASE_URL = 'URL_DA_SUA_API_AQUI'; // Ex: 'https://sua-api.up.railway.app'
const FACEBOOK_CONFIG = {
  currency: 'BRL',
  debugMode: true, // Mude para false em produção
};
// ---------------------------------

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

// Objeto para log de debug
function debugLog(message, data) {
    if (FACEBOOK_CONFIG.debugMode) {
      console.log(`[FB CAPI] ${message}`, data);
    }
}

/**
 * GERENCIAMENTO DE DADOS DO USUÁRIO
 */

// Dados globais do usuário, persistidos entre páginas
let globalUserData = {
  external_id: getExternalId(),
  fbp: getCookie('_fbp'),
  fbc: getCookie('_fbc') || (getUrlParameters().fbclid || undefined),
  em: undefined,
  ph: undefined,
  fn: undefined,
  ln: undefined
};

// Função para carregar dados do usuário do localStorage
function loadUserData() {
  try {
    const storedData = localStorage.getItem('fb_user_data');
    if (storedData) {
      Object.assign(globalUserData, JSON.parse(storedData));
    }
    debugLog('Dados do usuário carregados', globalUserData);
  } catch (error) {
    console.error('Erro ao carregar dados do usuário do localStorage:', error);
  }
}

// Função para atualizar e salvar os dados do usuário
function updateUserData(newData) {
  Object.assign(globalUserData, newData);
  try {
    localStorage.setItem('fb_user_data', JSON.stringify(globalUserData));
    debugLog('Dados do usuário atualizados e salvos', globalUserData);
  } catch (error) {
    console.error('Erro ao salvar dados do usuário no localStorage:', error);
  }
}

/**
 * FUNÇÃO PRINCIPAL DE ENVIO DE EVENTOS
 */

// Função genérica para enviar eventos para a API de Conversões
async function sendFbEvent(eventType, eventName, customData = {}, eventSourceUrl) {
  if (!API_BASE_URL || API_BASE_URL === 'URL_DA_SUA_API_AQUI') {
    console.error('URL da API de Conversões do Facebook (API_BASE_URL) não configurada em js/fb-events.js');
    return;
  }
  
  const eventId = generateUUID();
  const urlParameters = getUrlParameters();
  
  // O endpoint varia se o evento é padrão ou customizado
  const endpoint = eventType === 'standard' 
    ? `/api/track/${eventName.toLowerCase()}` 
    : `/api/track/custom/${eventName.toLowerCase()}`;
    
  // Adiciona o event_name para eventos customizados
  if (eventType === 'custom') {
    customData.event_name = eventName;
  }

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
    eventSourceUrl: eventSourceUrl || window.location.href,
    urlParameters: urlParameters,
    actionSource: 'website'
  };

  // Limpa campos de userData que não foram preenchidos
  for (const key in payload.userData) {
    if (payload.userData[key] === undefined || payload.userData[key] === null) {
      delete payload.userData[key];
    }
  }

  try {
    debugLog(`Enviando evento: ${eventName}`, payload);
    
    // Envia o evento para o Pixel do Facebook (se existir) para deduplicação
    if (typeof fbq !== 'undefined') {
      fbq('track', eventName, customData, { eventID: eventId });
    }
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    
    if (response.ok && result.success) {
      debugLog(`✅ Evento ${eventName} enviado com sucesso`, { eventId, fbtrace_id: result.fbtrace_id, diagnostics: result.diagnostics });
    } else {
      console.error(`❌ Erro no evento ${eventName}:`, result.error || result);
    }
  } catch (error) {
    console.error(`❌ Erro de rede ao enviar evento ${eventName}:`, error);
  }
}


/**
 * FUNÇÕES DE RASTREAMENTO DE EVENTOS
 */

// 1. PageView (Evento Padrão)
function trackPageView() {
  sendFbEvent('standard', 'PageView', {}, window.location.href);
}

// 2. PreencheuFormulario (Evento Customizado)
function trackPreencheuFormulario(formData = {}) {
  // Atualiza os dados globais com as informações do formulário
  if (formData.email) updateUserData({ em: formData.email.trim().toLowerCase() });
  if (formData.phone) updateUserData({ ph: formData.phone.replace(/\D/g, '') });
  if (formData.name) {
    const nameParts = formData.name.trim().split(' ');
    const firstName = nameParts.shift();
    const lastName = nameParts.join(' ');
    updateUserData({ fn: firstName, ln: lastName });
  }

  const customData = {
    content_name: 'Formulário de Análise Gratuita',
    form_type: 'landing_page_lead',
    source_page: window.location.pathname,
    // Adicionar valor e moeda se aplicável, ex:
    // value: 0.0,
    // currency: FACEBOOK_CONFIG.currency,
  };

  sendFbEvent('custom', 'PreencheuFormulario', customData);
}


/**
 * INICIALIZAÇÃO
 */
document.addEventListener('DOMContentLoaded', function() {
  loadUserData();
  // Dispara o PageView para cada página carregada
  // Adiciona um pequeno delay para garantir que o fbc/fbp do cookie do pixel seja lido
  setTimeout(() => {
    trackPageView();
  }, 500);
}); 