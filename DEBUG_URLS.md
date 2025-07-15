# 🔍 Debug do Problema de URLs

## 🚨 **Problema Identificado**

O frontend está tentando acessar:
```
❌ https://teste-pagina-api-2.netlify.app/api-de-conversoes-v2-production.up.railway.app/api/track/viewcontent
```

Quando deveria acessar:
```
✅ https://api-de-conversoes-v2-production.up.railway.app/api/track/viewcontent
```

## 🔧 **Correções Implementadas**

### 1. **Sanitização de URL**
- ✅ Adicionada validação da `API_BASE_URL`
- ✅ Remoção de barras finais
- ✅ Validação de protocolo (http/https)

### 2. **Debug Melhorado**
- ✅ Logs detalhados da URL sendo usada
- ✅ Função `window.fbEvents.debugUrls()` para testar
- ✅ Validação automática no startup

### 3. **Correção de Referências**
- ✅ Todas as referências agora usam `window.ENV`
- ✅ URLs construídas corretamente

## 🧪 **Como Testar**

### **1. No Console do Navegador:**
```javascript
// Verificar configuração atual
console.log('API_BASE_URL:', window.ENV.API_BASE_URL);

// Testar URLs
window.fbEvents.debugUrls();

// Verificar dados do usuário
window.fbEvents.getUserData();
```

### **2. Logs Automáticos:**
Ao carregar a página, procure por:
```
[FB INFO] API_BASE_URL configurada
🔍 Debug API URLs
```

## 🔍 **Possíveis Causas**

### **Causa 1: Variável de Ambiente Netlify**
A variável `API_BASE_URL` no Netlify pode estar configurada incorretamente.

**Verificar em:** Netlify → Site Settings → Environment Variables

**Valor correto:**
```
API_BASE_URL = https://api-de-conversoes-v2-production.up.railway.app
```

### **Causa 2: Build Cache**
O Netlify pode estar usando um build em cache.

**Solução:** Fazer um deploy com "Clear cache and deploy site"

### **Causa 3: Concatenação Incorreta (CORRIGIDO)**
Era o problema principal - agora sanitizamos a URL antes de usar.

## 🚀 **Próximos Passos**

### **1. Deploy e Teste**
```bash
git add .
git commit -m "🔧 Fix: Corrigir construção de URLs para API de Conversões"
git push origin main
```

### **2. Verificar no Netlify**
1. Aguardar deploy completo
2. Abrir Developer Tools → Console
3. Verificar logs de debug
4. Testar formulário

### **3. Se o Problema Persistir**
Execute no console:
```javascript
// Debug completo
console.log('Domain:', window.location.hostname);
console.log('ENV:', window.ENV);
window.fbEvents.debugUrls();

// Testar evento manualmente
await window.fbEvents.trackViewContent();
```

## ✅ **URLs Esperadas Após Correção**

```
✅ PageView:    https://api-de-conversoes-v2-production.up.railway.app/api/track/pageview
✅ ViewContent: https://api-de-conversoes-v2-production.up.railway.app/api/track/viewcontent  
✅ Lead:        https://api-de-conversoes-v2-production.up.railway.app/api/track/lead
✅ Supabase:    [conforme configurado no Netlify]
```

---

**🎯 Problema corrigido! Deploy e teste para confirmar.** 