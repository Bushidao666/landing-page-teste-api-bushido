# 🔍 DEBUG: Problema URL da API de Conversões

## Problema Identificado

A página está fazendo requisições para:
```
https://teste-pagina-api-2.netlify.app/api-de-conversoes-v2-production.up.railway.app/api/track/viewcontent
```

Quando deveria fazer para:
```
https://api-de-conversoes-v2-production.up.railway.app/api/track/viewcontent
```

## Passos de Debug

### 1. Abrir o Console do Navegador

1. Abra a página no navegador
2. Pressione F12 para abrir DevTools
3. Vá para a aba Console

### 2. Verificar Configuração

Execute no console:
```javascript
console.log('ENV:', window.ENV);
console.log('API_BASE_URL:', window.ENV?.API_BASE_URL);
```

**Resultado esperado:**
```
API_BASE_URL: "https://api-de-conversoes-v2-production.up.railway.app"
```

### 3. Testar Construção da URL

Execute no console:
```javascript
debugUrlConstruction();
```

Isso vai mostrar como a URL está sendo construída.

### 4. Teste Manual da API

Execute no console:
```javascript
await testApiUrl();
```

Isso vai testar a construção e requisição real.

### 5. Verificar Network Tab

1. Vá para a aba Network no DevTools
2. Recarregue a página
3. Procure por requisições que começam com "api"
4. Verifique a URL completa da requisição

## Possíveis Causas

### 1. **Base Tag no HTML**
Verificar se existe uma tag `<base>` no HTML que está afetando URLs relativas:
```html
<!-- Se existir algo assim, pode ser o problema -->
<base href="https://teste-pagina-api-2.netlify.app/">
```

### 2. **Proxy/Redirect do Netlify**
Verificar se existe configuração de proxy no `netlify.toml` ou `_redirects`.

### 3. **Modificação da URL em Runtime**
Algum código pode estar modificando `window.ENV.API_BASE_URL` após o carregamento.

### 4. **Cache do Browser**
Limpar cache e cookies do navegador.

## Soluções Implementadas

### ✅ Validação de URL Absoluta
- Verificação se a URL começa com `http://` ou `https://`
- Uso de `new URL()` para construção correta
- Debug detalhado no console

### ✅ Detecção de Problema
- Verificação se a URL final contém 'netlify.app'
- Logs detalhados de cada etapa

### ✅ Testes Manuais
- Função `testApiUrl()` disponível globalmente
- Debug automático no carregamento da página

## Como Verificar a Correção

1. Recarregue a página
2. Verifique o console para logs de debug
3. Execute `await testApiUrl()` no console
4. Monitore a aba Network para ver as requisições reais

## Relatório de Bug

Se o problema persistir, cole no console:
```javascript
console.log('=== RELATÓRIO DE BUG ===');
console.log('URL window.location:', window.location.href);
console.log('ENV completo:', JSON.stringify(window.ENV, null, 2));
console.log('User Agent:', navigator.userAgent);
```

E envie o resultado para análise. 