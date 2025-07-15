# 🔧 Variáveis de Ambiente - Configuração

Este documento lista todas as variáveis de ambiente necessárias para o funcionamento correto do sistema.

## 📋 Lista de Variáveis

### **API de Conversões do Facebook**
```bash
API_BASE_URL=https://api-de-conversoes-v2-production.up.railway.app
```
- **Descrição**: URL base da API de Conversões hospedada no Railway
- **Obrigatória**: ✅ Sim
- **Usado em**: Eventos PageView, ViewContent, Lead

### **Evolution API (Validação WhatsApp)**
```bash
EVOLUTION_API_URL=https://evoapi.meunomeok.uk/
EVOLUTION_INSTANCE_ID=F58C01AD8B31-4579-907C-6932946FFCEA
EVOLUTION_API_KEY=429683C4C977415CAAFCCE10F7D57E11
```
- **Descrição**: Configurações para validação de números WhatsApp
- **Obrigatória**: ✅ Sim
- **Usado em**: Validação do formulário

### **Supabase (Webhook Formulário)**
```bash
SUPABASE_FORM_ENDPOINT=https://xyz.supabase.co/functions/v1/track-form
```
- **Descrição**: Endpoint para evento "PreencheuFormulario"
- **Obrigatória**: ⚠️ Opcional (configure no Netlify)
- **Usado em**: Evento após validação do WhatsApp

### **Airtable (Armazenamento Leads)**
```bash
AIRTABLE_API_KEY=patdE3uO6gqHW2DwI.4b453abb475df06454fd19ecd320fcec230c29a6aee64bb3f069cc515ebed848
AIRTABLE_BASE_ID=appViUjy5hxH9RqCv
AIRTABLE_TABLE_ID=tbl4MQGVdHO4vWRBp
```
- **Descrição**: Configurações para armazenar leads no Airtable
- **Obrigatória**: ✅ Sim
- **Usado em**: Submissão do formulário

### **WhatsApp Validator (Legacy)**
```bash
WHATSAPP_VALIDATOR_WEBHOOK_URL=https://primary-production-d53a.up.railway.app/webhook/validadorpages
```
- **Descrição**: Webhook de validação WhatsApp (mantido para compatibilidade)
- **Obrigatória**: ❌ Não (substituído pela Evolution API)
- **Status**: Legado

## 🚀 Configuração no Netlify

### **Passo 1: Acessar Configurações**
1. Acesse seu site no Netlify
2. Vá em **Site Settings** > **Environment Variables**

### **Passo 2: Adicionar Variáveis**
Adicione cada variável com os valores corretos:

```
Key: API_BASE_URL
Value: https://api-de-conversoes-v2-production.up.railway.app

Key: EVOLUTION_API_URL  
Value: https://evoapi.meunomeok.uk/

Key: EVOLUTION_INSTANCE_ID
Value: F58C01AD8B31-4579-907C-6932946FFCEA

Key: EVOLUTION_API_KEY
Value: 429683C4C977415CAAFCCE10F7D57E11

Key: SUPABASE_FORM_ENDPOINT
Value: [SUA_URL_SUPABASE_AQUI]

Key: AIRTABLE_API_KEY
Value: patdE3uO6gqHW2DwI.4b453abb475df06454fd19ecd320fcec230c29a6aee64bb3f069cc515ebed848

Key: AIRTABLE_BASE_ID
Value: appViUjy5hxH9RqCv

Key: AIRTABLE_TABLE_ID
Value: tbl4MQGVdHO4vWRBp

Key: WHATSAPP_VALIDATOR_WEBHOOK_URL
Value: https://primary-production-d53a.up.railway.app/webhook/validadorpages
```

### **Passo 3: Deploy**
Após adicionar todas as variáveis, faça um novo deploy do site para aplicar as mudanças.

## 🔄 Como o Sistema Funciona

1. **Build Time**: O script `scripts/build-env.js` executa automaticamente
2. **Injeção**: As variáveis do Netlify são injetadas no arquivo `js/config.js`
3. **Runtime**: O JavaScript no navegador acessa via `window.ENV`

## ✅ Validação

O sistema inclui validação automática das configurações críticas:

- ✅ **API_BASE_URL** configurada
- ✅ **EVOLUTION_API_KEY** presente
- ⚠️ Avisos para configurações ausentes

## 🛠️ Desenvolvimento Local

Para desenvolvimento local, edite o arquivo `scripts/build-env.js` e altere os valores em `defaultConfig`.

## 📞 Suporte

Se encontrar problemas:

1. Verifique os logs no console do navegador
2. Confirme se todas as variáveis estão configuradas no Netlify
3. Teste um novo deploy após alterações

---

**✅ Sistema configurado em**: Janeiro 2025  
**🔗 API de Conversões**: Railway  
**📱 Validação WhatsApp**: Evolution API  
**🎯 Facebook Pixel ID**: 1226168308717459 