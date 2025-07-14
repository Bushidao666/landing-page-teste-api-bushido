# Guia de Eventos Personalizados - Cliente: Meu Nome

Este documento fornece exemplos práticos de implementação para os 8 eventos personalizados do cliente "Meu Nome".

## 📋 Tabela de Eventos

| # | Evento               | Endpoint (env)                | event_name           | Disparo                                        |
|---|----------------------|-------------------------------|----------------------|------------------------------------------------|
| 1 | Preencheu Formulário | `${SUPABASE_FORM_ENDPOINT}`   | `PreencheuFormulario`  | Ao submeter o formulário de lead               |
| 2 | PageView             | `${CONVERSIONS_API_ENDPOINT}` | `PageView`             | Ao carregar a landing page                     |
| 3 | ViewContent          | `${CONVERSIONS_API_ENDPOINT}` | `ViewContent`          | Quando o usuário visualizar a seção `#lp-section-before-form` |
| 4 | Lead (FormSubmit)    | `${CONVERSIONS_API_ENDPOINT}` | `Lead`                 | Disparado junto com `PreencheuFormulario`      |
| 5 | Chamou no WhatsApp   | `${CONVERSIONS_API_ENDPOINT}` | `ChamouWhatsApp`       | Clique no botão de contato do WhatsApp         |
| 6 | Contrato Enviado     | `${CONVERSIONS_API_ENDPOINT}` | `ContratoEnviado`      | Ação interna (CRM/Backend)                     |
| 7 | Contrato Assinado    | `${CONVERSIONS_API_ENDPOINT}` | `ContratoAssinado`     | Ação interna (CRM/Backend)                     |
| 8 | Pagou Primeira Cobrança | `${CONVERSIONS_API_ENDPOINT}`| `PagouPrimeiraCobranca`| Ação interna (Webhook de Pagamento)            |

### Como configurar variáveis de ambiente

Crie (ou atualize) um arquivo `js/config.js` na raiz do seu projeto para desenvolvimento local, ou configure as variáveis de ambiente diretamente no seu provedor de hospedagem (Netlify, Vercel, etc.).

**Exemplo para `js/config.js` (desenvolvimento):**
```javascript
// js/config.js
window.ENV = {
  SUPABASE_FORM_ENDPOINT: "https://xyz.supabase.co/functions/v1/track-form",
  CONVERSIONS_API_ENDPOINT: "https://graph.facebook.com/v19.0/ID_DO_PIXEL/events?access_token=SEU_TOKEN"
};
```

**Exemplo para `.env.local` (se usar um framework como Next.js):**
```bash
NEXT_PUBLIC_SUPABASE_FORM_ENDPOINT="https://xyz.supabase.co/functions/v1/track-form"
NEXT_PUBLIC_CONVERSIONS_API_ENDPOINT="https://graph.facebook.com/v19.0/ID_DO_PIXEL/events?access_token=SEU_TOKEN"
```

---

## ✅ Checklist para N8n / Fluxo DevOps

| Passo | O que fazer                                       | Observação                                                                      |
|-------|---------------------------------------------------|---------------------------------------------------------------------------------|
| 1     | Comitar os dois `.md` atualizados                 | Eles viram referência para a IA                                                 |
| 2     | Criar `.env.example` com as duas variáveis        | Evita esquecimento em novos ambientes                                           |
| 3     | Ajustar o último nó do seu fluxo **N8n** para chamar o webhook do Supabase | O importante é que o payload enviado seja consistente com o esperado pela função. |
| 4     | Testar no **Facebook Test Events**                | Ver _PageView_, _ViewContent_ (apenas 1), _Lead_ chegando                       |
| 5     | Testar o webhook do Supabase via `curl`           | Confirma CORS e autenticação                                                    |

---

## 💡 Dicas Extras (Evita Dor de Cabeça)

*   **Consolide o logger** – use `console.debug` dentro de cada função de evento para facilitar o QA.
*   **De-duplication** – gere um `eventId` único (você já faz) e envie-o no payload; o Facebook ignora eventos duplicados com o mesmo ID.
*   **Timeouts** – adote um `timeout: 4000` (4 segundos) no `fetch` para evitar que a requisição bloqueie a navegação em conexões lentas.
*   **LGPD** – para eventos como `PageView` e `ViewContent`, onde você pode não ter o consentimento explícito para PII, evite enviar dados de usuário não hasheados. O hashing deve ser feito preferencialmente no backend.

---

## 💻 Exemplos de Implementação Frontend

### Script Base (Inclua no `<head>` do seu site)

```html
<script>
// API Base URL - agora controlada por variável de ambiente em js/config.js
const API_BASE_URL = ''; // Vazio se no mesmo domínio

// Função para gerar UUID
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

// Função para obter cookies
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return undefined;
}

// Função para obter parâmetros da URL
function getUrlParameters() {
  const params = {};
  const urlParams = new URLSearchParams(window.location.search);
  for (const [key, value] of urlParams) {
    params[key] = value;
  }
  return params;
}

// Função para obter external_id do localStorage ou gerar novo
function getExternalId() {
  let externalId = localStorage.getItem('fb_external_id');
  if (!externalId) {
    externalId = generateUUID();
    localStorage.setItem('fb_external_id', externalId);
  }
  return externalId;
}

// Dados base do usuário (atualize conforme necessário)
let globalUserData = {
  external_id: getExternalId(),
  fbp: getCookie('_fbp'),
  fbc: getCookie('_fbc'),
  em: undefined, // Será preenchido quando disponível
  ph: undefined, // Será preenchido quando disponível
  fn: undefined, // Será preenchido quando disponível
  ln: undefined  // Será preenchido quando disponível
};

// Função para atualizar dados do usuário
function updateUserData(newData) {
  Object.assign(globalUserData, newData);
  localStorage.setItem('fb_user_data', JSON.stringify(globalUserData));
}

// Função base para enviar eventos personalizados
async function sendCustomEvent(endpoint, customData = {}) {
  const eventId = generateUUID();
  const urlParameters = getUrlParameters();

  const payload = {
    eventId: eventId,
    userData: {
      external_id: globalUserData.external_id ? [globalUserData.external_id] : undefined,
      em: globalUserData.em ? [globalUserData.em] : undefined,
      ph: globalUserData.ph ? [globalUserData.ph] : undefined,
      fn: globalUserData.fn ? [globalUserData.fn] : undefined,
      ln: globalUserData.ln ? [globalUserData.ln] : undefined,
      fbc: globalUserData.fbc || undefined,
      fbp: globalUserData.fbp || undefined,
    },
    customData: customData,
    eventSourceUrl: window.location.href,
    urlParameters: urlParameters,
    actionSource: 'website'
  };

  // Remove campos undefined
  Object.keys(payload.userData).forEach(key => {
    if (payload.userData[key] === undefined) {
      delete payload.userData[key];
    }
  });

  try {
    const response = await fetch(`${API_BASE_URL}/api/track/custom/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    
    if (result.success) {
      console.log(`✅ Evento ${endpoint} enviado com sucesso:`, eventId);
      return { success: true, eventId, fbtrace_id: result.fbtrace_id };
    } else {
      console.error(`❌ Erro no evento ${endpoint}:`, result.error);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error(`❌ Erro ao enviar evento ${endpoint}:`, error);
    return { success: false, error: error.message };
  }
}
</script>
```

### 1. Preencheu Formulário

```html
<script>
// Exemplo: Disparar quando formulário for submetido
function trackPreencheuFormulario(formData = {}) {
  // Atualizar dados do usuário se disponíveis no formulário
  if (formData.email) updateUserData({ em: formData.email });
  if (formData.telefone) updateUserData({ ph: formData.telefone });
  if (formData.nome) {
    const nomeParts = formData.nome.trim().split(' ');
    updateUserData({ 
      fn: nomeParts[0], 
      ln: nomeParts.slice(1).join(' ') 
    });
  }

  const customData = {
    content_name: formData.formName || 'Formulário de Lead',
    form_type: formData.formType || 'landing_page',
    source_page: window.location.pathname,
    lead_score: '0'
  };

  return sendCustomEvent('preencheu-formulario', customData);
}

// Uso em formulário
document.getElementById('meuFormulario').addEventListener('submit', function(e) {
  const formData = {
    email: document.getElementById('email').value,
    telefone: document.getElementById('telefone').value,
    nome: document.getElementById('nome').value,
    formName: 'Formulário Principal',
    formType: 'landing_page'
  };
  
  trackPreencheuFormulario(formData);
});
</script>
```

### 2. Chamou no WhatsApp

```html
<script>
function trackChamouWhatsApp(tempoNaPagina = 0) {
  const customData = {
    contact_method: 'whatsapp',
    lead_temperature: 'warm',
    time_to_contact: Math.floor(tempoNaPagina / 1000 / 60), // em minutos
    page_referrer: document.referrer
  };

  return sendCustomEvent('chamou-whatsapp', customData);
}

// Uso em botão do WhatsApp
document.querySelectorAll('.btn-whatsapp').forEach(button => {
  button.addEventListener('click', function() {
    const tempoNaPagina = Date.now() - performance.timing.navigationStart;
    trackChamouWhatsApp(tempoNaPagina);
  });
});
</script>
```

### 3. Vácuo

```html
<script>
// Usado tipicamente por automação backend, mas pode ser frontend
function trackVacuo(diasSemContato = 1, tentativasContato = 1) {
  const customData = {
    vacuum_stage: 'primeira_tentativa',
    days_since_contact: diasSemContato.toString(),
    contact_attempts: tentativasContato.toString(),
    last_interaction: localStorage.getItem('last_interaction_date') || 'unknown'
  };

  return sendCustomEvent('vacuo', customData);
}
</script>
```

### 4. Lead Qualificado

```html
<script>
// Usado tipicamente por CRM/backend, mas pode ser frontend
function trackLeadQualificado(scoreObtido = 75, metodoQualificacao = 'human_call') {
  const customData = {
    qualification_method: metodoQualificacao,
    lead_score: scoreObtido.toString(),
    qualification_date: new Date().toISOString().split('T')[0],
    qualified_by: 'sistema' // ou ID do atendente
  };

  return sendCustomEvent('lead-qualificado', customData);
}
</script>
```

### 5. Lead Recuperado

```html
<script>
function trackLeadRecuperado(diasNoVacuo = 3, metodoRecuperacao = 'ai_automation') {
  const customData = {
    recovery_method: metodoRecuperacao,
    days_in_vacuum: diasNoVacuo.toString(),
    recovery_success: 'true',
    recovery_date: new Date().toISOString().split('T')[0]
  };

  return sendCustomEvent('lead-recuperado', customData);
}
</script>
```

### 6. Contrato Enviado

```html
<script>
function trackContratoEnviado(valorContrato = 0, tipoServico = 'servico_digital', closerId = 'closer_001') {
  const customData = {
    contract_type: tipoServico,
    contract_value: valorContrato.toString(),
    closer_id: closerId,
    sent_date: new Date().toISOString().split('T')[0],
    value: valorContrato, // Para Facebook tracking
    currency: 'BRL'
  };

  return sendCustomEvent('contrato-enviado', customData);
}

// Uso quando contrato for enviado
document.getElementById('enviarContrato').addEventListener('click', function() {
  const valorContrato = parseFloat(document.getElementById('valorContrato').value) || 0;
  trackContratoEnviado(valorContrato, 'consultoria_digital', 'closer_001');
});
</script>
```

### 7. Contrato Assinado

```html
<script>
function trackContratoAssinado(valorContrato = 0, metodoPagamento = 'pix', duracaoMeses = 12) {
  const customData = {
    contract_value: valorContrato.toString(),
    payment_method: metodoPagamento,
    contract_duration: duracaoMeses.toString(),
    signed_date: new Date().toISOString().split('T')[0],
    value: valorContrato, // Para Facebook tracking
    currency: 'BRL'
  };

  return sendCustomEvent('contrato-assinado', customData);
}
</script>
```

### 8. Pagou Primeira Cobrança

```html
<script>
function trackPagouPrimeiraCobranca(valorPago = 0, metodoPagamento = 'pix') {
  const customData = {
    payment_value: valorPago.toString(),
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: metodoPagamento,
    subscription_status: 'active',
    value: valorPago, // Para Facebook tracking
    currency: 'BRL'
  };

  return sendCustomEvent('pagou-primeira-cobranca', customData);
}

// Exemplo: Webhook de pagamento ou confirmação de pagamento
function handlePagamentoConfirmado(dadosPagamento) {
  trackPagouPrimeiraCobranca(
    dadosPagamento.valor, 
    dadosPagamento.metodo
  );
}
</script>
```

## 🧪 Exemplo de Teste Completo

```html
<!DOCTYPE html>
<html>
<head>
    <title>Teste Eventos Personalizados</title>
    <!-- Incluir script base aqui -->
</head>
<body>
    <h1>Teste dos Eventos Personalizados</h1>
    
    <button onclick="testarEventos()">Testar Todos os Eventos</button>
    
    <script>
    async function testarEventos() {
        console.log('🧪 Iniciando teste dos eventos personalizados...');
        
        // Simular dados do usuário
        updateUserData({
            em: 'teste@email.com',
            ph: '11999999999',
            fn: 'João',
            ln: 'Silva'
        });
        
        // Testar cada evento
        const eventos = [
            () => trackPreencheuFormulario({ 
                email: 'teste@email.com', 
                nome: 'João Silva', 
                formName: 'Teste Form' 
            }),
            () => trackChamouWhatsApp(60000),
            () => trackVacuo(2, 1),
            () => trackLeadQualificado(85, 'human_call'),
            () => trackLeadRecuperado(3, 'ai_automation'),
            () => trackContratoEnviado(5000, 'consultoria', 'closer_001'),
            () => trackContratoAssinado(5000, 'pix', 12),
            () => trackPagouPrimeiraCobranca(5000, 'pix')
        ];
        
        for (let i = 0; i < eventos.length; i++) {
            console.log(`📤 Testando evento ${i + 1}/8...`);
            await eventos[i]();
            await new Promise(resolve => setTimeout(resolve, 1000)); // Aguardar 1s entre eventos
        }
        
        console.log('✅ Teste completo finalizado!');
    }
    </script>
</body>
</html>
```

## 🔧 Validação e Debugging

### Verificar no Facebook Events Manager

1. Acesse o **Events Manager** do Facebook
2. Vá na seção **Test Events**
3. Monitore se os eventos estão sendo recebidos corretamente
4. Verifique a **qualidade dos dados** de cada evento

### Logs de Debug

Os endpoints geram logs detalhados. Para debugar:

```javascript
// Ativar logs de debug no console
const FACEBOOK_CONVERSIONS_CONFIG = {
  debugMode: true // Ativa logs detalhados
};
```

### Validação dos Parâmetros

Cada evento valida automaticamente:
- ✅ **event_name** correto
- ✅ **userData** com hash automático de PII
- ✅ **customData** com defaults inteligentes
- ✅ **geolocalização** automática via IP
- ✅ **UTMs** capturados automaticamente

## 📊 Próximos Passos

1. **Implementar no site**: Copie os exemplos relevantes
2. **Testar cada evento**: Use o exemplo de teste completo
3. **Validar no Facebook**: Monitore no Events Manager
4. **Configurar campanhas**: Use os eventos para otimização
5. **Monitorar performance**: Acompanhe quality score dos eventos

---

**✅ Implementação Concluída em:** ${new Date().toLocaleDateString('pt-BR')}  
**🎯 Total de Eventos:** 8 eventos personalizados + 4 eventos padrão = 12 eventos totais 