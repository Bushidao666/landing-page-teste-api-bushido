// ===================================================================
//
//              EVOLUTION API - VALIDAÇÃO DE WHATSAPP
//
// ===================================================================
//
// Módulo responsável por validar números de WhatsApp usando a Evolution API
// Inclui: cache, retry automático, normalização de números e tratamento de erros
//
// ===================================================================

/**
 * Classe para validação de números WhatsApp via Evolution API
 */
class EvolutionValidator {
  constructor() {
    this.cache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutos
    this.maxRetries = 2;
    this.retryDelay = 1000; // 1 segundo
    
    // Validar configurações necessárias
    this.validateConfig();
  }
  
  /**
   * Valida se as configurações necessárias estão disponíveis
   */
  validateConfig() {
    const required = ['EVOLUTION_API_URL', 'EVOLUTION_INSTANCE_ID', 'EVOLUTION_API_KEY'];
    const missing = required.filter(key => !window.ENV || !window.ENV[key]);
    
    if (missing.length > 0) {
      console.error('❌ [Evolution] Configurações ausentes:', missing);
      throw new Error(`Configurações Evolution API ausentes: ${missing.join(', ')}`);
    }
    
    console.log('✅ [Evolution] Configurações validadas');
  }
  
  /**
   * Normaliza número de telefone para formato internacional
   * @param {string} phone - Número de telefone
   * @returns {string} - Número normalizado
   */
  normalizePhone(phone) {
    if (!phone) return null;
    
    // Remove todos os caracteres não numéricos
    let digits = phone.replace(/\D/g, '');
    
    // Aplicar regras de normalização para Brasil
    if (digits.length === 11) {
      // Número com 11 dígitos: adicionar código do país
      digits = `55${digits}`;
    } else if (digits.length === 10) {
      // Número com 10 dígitos: adicionar 9 + código do país
      digits = `559${digits}`;
    } else if (digits.length === 13 && digits.startsWith('55')) {
      // Já está no formato correto
      digits = digits;
    } else if (digits.length === 12 && !digits.startsWith('55')) {
      // Número sem código do país
      digits = `55${digits}`;
    }
    
    // Retornar no formato internacional
    const normalized = `+${digits}`;
    console.log(`[Evolution] Número normalizado: ${phone} → ${normalized}`);
    return normalized;
  }
  
  /**
   * Verifica se o número está no cache e se ainda é válido
   * @param {string} phone - Número normalizado
   * @returns {Object|null} - Resultado do cache ou null
   */
  getCachedResult(phone) {
    const cached = this.cache.get(phone);
    if (!cached) return null;
    
    const now = Date.now();
    if (now - cached.timestamp > this.cacheExpiry) {
      this.cache.delete(phone);
      return null;
    }
    
    console.log(`[Evolution] Cache hit para ${phone}`);
    return cached.result;
  }
  
  /**
   * Armazena resultado no cache
   * @param {string} phone - Número normalizado
   * @param {Object} result - Resultado da validação
   */
  setCachedResult(phone, result) {
    this.cache.set(phone, {
      result: result,
      timestamp: Date.now()
    });
    console.log(`[Evolution] Resultado armazenado no cache para ${phone}`);
  }
  
  /**
   * Faz chamada para a Evolution API
   * @param {string} phone - Número normalizado
   * @returns {Promise<Object>} - Resultado da API
   */
  async callEvolutionAPI(phone) {
    const url = `${window.ENV.EVOLUTION_API_URL}chat/whatsappNumbers/${window.ENV.EVOLUTION_INSTANCE_ID}`;
    
    const payload = {
      numbers: [phone]
    };
    
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': window.ENV.EVOLUTION_API_KEY
      },
      body: JSON.stringify(payload)
    };
    
    console.log(`[Evolution] Chamando API: ${url}`);
    console.log(`[Evolution] Payload:`, payload);
    
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Erro desconhecido');
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    console.log(`[Evolution] Resposta da API:`, data);
    
    return data;
  }
  
  /**
   * Valida um número com retry automático
   * @param {string} phone - Número a ser validado
   * @param {number} attempt - Tentativa atual (interno)
   * @returns {Promise<Object>} - Resultado da validação
   */
  async validateWithRetry(phone, attempt = 1) {
    try {
      const data = await this.callEvolutionAPI(phone);
      
      // Processar resposta da API
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('Resposta da API inválida ou vazia');
      }
      
      const result = data[0];
      const validation = {
        phone: phone,
        exists: Boolean(result.exists),
        jid: result.jid || null,
        validated: true,
        timestamp: new Date().toISOString(),
        source: 'evolution_api'
      };
      
      return validation;
      
    } catch (error) {
      console.error(`[Evolution] Erro na tentativa ${attempt}:`, error.message);
      
      if (attempt < this.maxRetries) {
        console.log(`[Evolution] Tentando novamente em ${this.retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        return this.validateWithRetry(phone, attempt + 1);
      }
      
      // Retornar erro estruturado após esgotar tentativas
      return {
        phone: phone,
        exists: false,
        error: error.message,
        validated: false,
        timestamp: new Date().toISOString(),
        source: 'evolution_api'
      };
    }
  }
  
  /**
   * Método principal para validar número WhatsApp
   * @param {string} phone - Número de telefone
   * @returns {Promise<Object>} - Resultado da validação
   */
  async validate(phone) {
    console.log(`[Evolution] Iniciando validação: ${phone}`);
    
    // Normalizar número
    const normalizedPhone = this.normalizePhone(phone);
    if (!normalizedPhone) {
      return {
        phone: phone,
        exists: false,
        error: 'Número inválido',
        validated: false,
        timestamp: new Date().toISOString(),
        source: 'validation'
      };
    }
    
    // Verificar cache
    const cachedResult = this.getCachedResult(normalizedPhone);
    if (cachedResult) {
      return cachedResult;
    }
    
    // Validar via API
    const result = await this.validateWithRetry(normalizedPhone);
    
    // Armazenar no cache apenas se validação foi bem-sucedida
    if (result.validated) {
      this.setCachedResult(normalizedPhone, result);
    }
    
    console.log(`[Evolution] Validação finalizada:`, result);
    return result;
  }
  
  /**
   * Limpa o cache de validações
   */
  clearCache() {
    this.cache.clear();
    console.log('[Evolution] Cache limpo');
  }
  
  /**
   * Obtém estatísticas do cache
   */
  getCacheStats() {
    const now = Date.now();
    const entries = Array.from(this.cache.entries());
    const valid = entries.filter(([_, data]) => now - data.timestamp <= this.cacheExpiry);
    
    return {
      total: entries.length,
      valid: valid.length,
      expired: entries.length - valid.length
    };
  }
}

// Instância global do validador
window.evolutionValidator = new EvolutionValidator();

// Função de conveniência para validação
window.validateWhatsApp = async function(phone) {
  try {
    return await window.evolutionValidator.validate(phone);
  } catch (error) {
    console.error('[Evolution] Erro na validação:', error);
    return {
      phone: phone,
      exists: false,
      error: error.message,
      validated: false,
      timestamp: new Date().toISOString(),
      source: 'error'
    };
  }
};

console.log('✅ [Evolution] Módulo de validação carregado'); 