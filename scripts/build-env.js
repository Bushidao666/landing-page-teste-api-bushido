#!/usr/bin/env node

/**
 * ===================================================================
 * BUILD ENVIRONMENT VARIABLES PROCESSOR
 * ===================================================================
 * 
 * Este script processa as variáveis de ambiente do Netlify e gera
 * o arquivo js/config.js com as configurações corretas para produção.
 * 
 * Variáveis esperadas no Netlify:
 * - API_BASE_URL
 * - EVOLUTION_API_URL  
 * - EVOLUTION_INSTANCE_ID
 * - EVOLUTION_API_KEY
 * - SUPABASE_FORM_ENDPOINT
 * - AIRTABLE_API_KEY
 * - AIRTABLE_BASE_ID
 * - AIRTABLE_TABLE_ID
 * - WHATSAPP_VALIDATOR_WEBHOOK_URL
 * ===================================================================
 */

const fs = require('fs');
const path = require('path');

// Valores padrão para desenvolvimento local
const defaultConfig = {
  API_BASE_URL: 'https://api-de-conversoes-v2-production.up.railway.app',
  EVOLUTION_API_URL: 'https://evoapi.meunomeok.uk/',
  EVOLUTION_INSTANCE_ID: 'F58C01AD8B31-4579-907C-6932946FFCEA',
  EVOLUTION_API_KEY: '429683C4C977415CAAFCCE10F7D57E11',
  SUPABASE_FORM_ENDPOINT: 'CONFIGURE_NO_NETLIFY',
  AIRTABLE_API_KEY: 'patdE3uO6gqHW2DwI.4b453abb475df06454fd19ecd320fcec230c29a6aee64bb3f069cc515ebed848',
  AIRTABLE_BASE_ID: 'appViUjy5hxH9RqCv',
  AIRTABLE_TABLE_ID: 'tbl4MQGVdHO4vWRBp',
  WHATSAPP_VALIDATOR_WEBHOOK_URL: 'https://primary-production-d53a.up.railway.app/webhook/validadorpages'
};

function generateConfigFile() {
  console.log('🔧 Processando variáveis de ambiente...');
  
  // Obter variáveis de ambiente ou usar padrões
  const config = {};
  for (const [key, defaultValue] of Object.entries(defaultConfig)) {
    config[key] = process.env[key] || defaultValue;
    
    // Log para debug (sem mostrar chaves sensíveis)
    if (key.includes('KEY') || key.includes('TOKEN')) {
      console.log(`  ✓ ${key}: ${'*'.repeat(8)}${config[key].slice(-4)}`);
    } else {
      console.log(`  ✓ ${key}: ${config[key]}`);
    }
  }
  
  // Gerar conteúdo do arquivo JavaScript
  const configContent = `// ===================================================================
//
//               ARQUIVO DE CONFIGURAÇÃO (GERADO AUTOMATICAMENTE)
//
// ===================================================================
//
// Este arquivo é gerado automaticamente durante o build.
// As variáveis são injetadas a partir das configurações do Netlify.
// Para desenvolvimento local, edite scripts/build-env.js
//
// Gerado em: ${new Date().toISOString()}
//
// ===================================================================

window.ENV = {
  // --- API de Conversões do Facebook ---
  API_BASE_URL: '${config.API_BASE_URL}',
  
  // --- Evolution API (Validação WhatsApp) ---
  EVOLUTION_API_URL: '${config.EVOLUTION_API_URL}',
  EVOLUTION_INSTANCE_ID: '${config.EVOLUTION_INSTANCE_ID}',
  EVOLUTION_API_KEY: '${config.EVOLUTION_API_KEY}',
  
  // --- Supabase (Webhook Formulário) ---
  SUPABASE_FORM_ENDPOINT: '${config.SUPABASE_FORM_ENDPOINT}',
  
  // --- Airtable (Armazenamento Leads) ---
  AIRTABLE_API_KEY: '${config.AIRTABLE_API_KEY}',
  AIRTABLE_BASE_ID: '${config.AIRTABLE_BASE_ID}',
  AIRTABLE_TABLE_ID: '${config.AIRTABLE_TABLE_ID}',
  
  // --- WhatsApp Validator (Legacy) ---
  WHATSAPP_VALIDATOR_WEBHOOK_URL: '${config.WHATSAPP_VALIDATOR_WEBHOOK_URL}'
};

// Validação das configurações críticas
(function validateConfig() {
  const critical = ['API_BASE_URL', 'EVOLUTION_API_KEY'];
  const missing = critical.filter(key => 
    !window.ENV[key] || 
    window.ENV[key] === 'CONFIGURE_NO_NETLIFY' ||
    window.ENV[key].includes('_AQUI')
  );
  
  if (missing.length > 0) {
    console.error('❌ Configurações críticas ausentes:', missing);
    console.error('Configure as variáveis de ambiente no Netlify!');
  } else {
    console.log('✅ Todas as configurações críticas foram carregadas');
  }
})();
`;

  // Criar diretório js se não existir
  const jsDir = path.join(process.cwd(), 'js');
  if (!fs.existsSync(jsDir)) {
    fs.mkdirSync(jsDir, { recursive: true });
  }
  
  // Escrever arquivo de configuração
  const configPath = path.join(jsDir, 'config.js');
  fs.writeFileSync(configPath, configContent, 'utf8');
  
  console.log('✅ Arquivo js/config.js gerado com sucesso!');
  console.log(`📁 Localização: ${configPath}`);
}

// Executar se chamado diretamente
if (require.main === module) {
  try {
    generateConfigFile();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao gerar configuração:', error);
    process.exit(1);
  }
}

module.exports = { generateConfigFile }; 