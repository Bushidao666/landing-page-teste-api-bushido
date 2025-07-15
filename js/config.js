// ===================================================================
//
//               ARQUIVO DE CONFIGURAÇÃO (GERADO AUTOMATICAMENTE)
//
// ===================================================================
//
// Este arquivo é gerado automaticamente durante o build.
// As variáveis são injetadas a partir das configurações do Netlify.
// Para desenvolvimento local, edite scripts/build-env.js
//
// Gerado em: 2025-01-03T14:30:00.000Z
//
// ===================================================================

window.ENV = {
  // --- API de Conversões do Facebook ---
  API_BASE_URL: 'https://api-de-conversoes-v2-production.up.railway.app',
  
  // --- Evolution API (Validação WhatsApp) ---
  EVOLUTION_API_URL: 'https://evoapi.meunomeok.uk/',
  EVOLUTION_INSTANCE_ID: 'F58C01AD8B31-4579-907C-6932946FFCEA',
  EVOLUTION_API_KEY: '429683C4C977415CAAFCCE10F7D57E11',
  
  // --- Supabase (Webhook Formulário) ---
  SUPABASE_FORM_ENDPOINT: 'CONFIGURE_NO_NETLIFY',
  
  // --- Airtable (Armazenamento Leads) ---
  AIRTABLE_API_KEY: 'patdE3uO6gqHW2DwI.4b453abb475df06454fd19ecd320fcec230c29a6aee64bb3f069cc515ebed848',
  AIRTABLE_BASE_ID: 'appViUjy5hxH9RqCv',
  AIRTABLE_TABLE_ID: 'tbl4MQGVdHO4vWRBp',
  
  // --- WhatsApp Validator (Legacy) ---
  WHATSAPP_VALIDATOR_WEBHOOK_URL: 'https://primary-production-d53a.up.railway.app/webhook/validadorpages'
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