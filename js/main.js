// Configuração
// As configurações foram movidas para js/config.js

// Estado da aplicação
let hasSubmitted = localStorage.getItem('hasSubmitted') === 'true';
let phoneValidated = false;

// Funções do popup
function openPopup() {
    if (hasSubmitted) {
        alert('Já recebemos seus dados, nossa atendente Vera Lícia Nogueira irá brevemente entrar em contato com você via WhatsApp. Fique atento!');
        return;
    }
    document.getElementById('popup-overlay').classList.add('active');
}

function closePopup() {
    document.getElementById('popup-overlay').classList.remove('active');
}

function closeExitPopup() {
    document.getElementById('exit-popup').classList.remove('active');
}

// Máscara de telefone
function phoneMask(value) {
    value = value.replace(/\D/g, '');
    value = value.replace(/^(\d{2})(\d)/g, '$1 $2');
    value = value.replace(/(\d)(\d{4})$/, '$1-$2');
    return value;
}

// Validação de WhatsApp via Evolution API (substituindo webhook legado)
async function validateWhatsApp(phone) {
    const cleanPhone = phone.replace(/\D/g, '');
    
    if (cleanPhone.length < 10 || cleanPhone.length > 11) {
        return { exists: false, error: 'Número deve ter 10 ou 11 dígitos' };
    }
    
    try {
        // Usar o novo validador Evolution API
        const result = await window.validateWhatsApp(phone);
        return result;
    } catch (error) {
        console.error('[Main] Erro ao validar WhatsApp:', error);
        return { 
            exists: false, 
            error: 'Erro na validação', 
            validated: false,
            phone: phone
        };
    }
}

// Captura parâmetros UTM
function getUTMParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        utm_source: params.get('utm_source') || '',
        utm_medium: params.get('utm_medium') || '',
        utm_campaign: params.get('utm_campaign') || '',
        utm_term: params.get('utm_term') || '',
        utm_content: params.get('utm_content') || ''
    };
}

// Envio para Airtable
async function sendToAirtable(formData) {
    const utmParams = getUTMParams();
    
    const airtableData = {
        fields: {
            'Nome do lead': formData.name,
            'Telefone do lead': formData.phone,
            'Email do lead': formData.email,
            'utm_source': utmParams.utm_source,
            'utm_medium': utmParams.utm_medium,
            'utm_campaign': utmParams.utm_campaign,
            'utm_term': utmParams.utm_term,
            'utm_content': utmParams.utm_content
        }
    };
    
    try {
        const response = await fetch(`https://api.airtable.com/v0/${window.ENV.AIRTABLE_BASE_ID}/${window.ENV.AIRTABLE_TABLE_ID}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${window.ENV.AIRTABLE_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(airtableData)
        });
        
        if (!response.ok) {
            throw new Error(`Erro ao enviar dados: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Erro ao enviar para Airtable:', error);
        throw error;
    }
}

// Listeners
document.addEventListener('DOMContentLoaded', function() {
    const phoneInput = document.getElementById('phone');
    const phoneError = document.getElementById('phone-error');
    const submitButton = document.getElementById('submit-button');
    const leadForm = document.getElementById('lead-form');
    
    console.log('[Main] Inicializando manipulação do formulário');
    
    // Aplicar máscara ao telefone com validação Evolution API
    let validationTimeout;
    
    phoneInput.addEventListener('input', async function(e) {
        e.target.value = phoneMask(e.target.value);
        
        const cleanPhone = e.target.value.replace(/\D/g, '');
        
        // Limpar timeout anterior
        if (validationTimeout) {
            clearTimeout(validationTimeout);
        }
        
        // Reset do estado de validação
        phoneValidated = false;
        submitButton.disabled = true;
        
        if (cleanPhone.length >= 10 && cleanPhone.length <= 11) {
            phoneError.textContent = 'Validando WhatsApp...';
            phoneError.style.color = '#3498db';
            phoneError.className = 'error-message validating';
            
            // Debounce da validação (aguardar 800ms após parar de digitar)
            validationTimeout = setTimeout(async () => {
                try {
                    const validationResult = await validateWhatsApp(e.target.value);
                    
                    if (validationResult.validated && validationResult.exists) {
                        phoneError.textContent = '✓ WhatsApp válido';
                        phoneError.style.color = '#27ae60';
                        phoneError.className = 'error-message valid';
                        submitButton.disabled = false;
                        phoneValidated = true;
                        
                        // Disparar evento para Supabase após validação bem-sucedida
                        const formData = {
                            name: document.getElementById('name').value,
                            phone: e.target.value,
                            email: document.getElementById('email').value
                        };
                        
                        if (formData.name && formData.email) {
                            console.log('[Main] Enviando evento PreencheuFormulario para Supabase');
                            window.fbEvents?.sendToSupabase(formData);
                        }
                        
                    } else {
                        const errorMsg = validationResult.error || 'WhatsApp não encontrado';
                        phoneError.textContent = `✗ ${errorMsg}`;
                        phoneError.style.color = '#e74c3c';
                        phoneError.className = 'error-message invalid';
                        submitButton.disabled = true;
                        phoneValidated = false;
                    }
                } catch (error) {
                    console.error('[Main] Erro na validação:', error);
                    phoneError.textContent = '⚠ Erro na validação. Tente novamente.';
                    phoneError.style.color = '#f39c12';
                    phoneError.className = 'error-message error';
                    submitButton.disabled = true;
                    phoneValidated = false;
                }
            }, 800);
            
        } else if (cleanPhone.length > 0) {
            phoneError.textContent = 'Digite um número válido (10 ou 11 dígitos)';
            phoneError.style.color = '#95a5a6';
            phoneError.className = 'error-message info';
        } else {
            phoneError.textContent = '';
            phoneError.className = 'error-message';
        }
    });
    
    // Submissão do formulário
    leadForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (!phoneValidated) {
            alert('Por favor, insira um WhatsApp válido.');
            return;
        }
        
        const formData = {
            name: document.getElementById('name').value,
            phone: document.getElementById('phone').value,
            email: document.getElementById('email').value
        };

        // Disparar evento Lead para Facebook Conversions API
        if (window.fbEvents && typeof window.fbEvents.trackLead === 'function') {
            console.log('[Main] Enviando evento Lead para Facebook CAPI');
            await window.fbEvents.trackLead(formData);
        }
        
        submitButton.disabled = true;
        submitButton.textContent = 'Enviando...';
        
        try {
            await sendToAirtable(formData);
            
            // Marcar como enviado
            localStorage.setItem('hasSubmitted', 'true');
            hasSubmitted = true;
            
            // Redirecionar para página de obrigado
            window.location.href = '/obrigado';
        } catch (error) {
            alert('Erro ao enviar seus dados. Por favor, tente novamente.');
            submitButton.disabled = false;
            submitButton.textContent = 'Solicitar Análise';
        }
    });
    
    // Exit intent popup
    let exitIntentShown = false;
    document.addEventListener('mouseleave', function(e) {
        if (e.clientY <= 0 && !exitIntentShown && !hasSubmitted) {
            document.getElementById('exit-popup').classList.add('active');
            exitIntentShown = true;
        }
    });
});

// Fechar popups ao clicar fora
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('popup-overlay')) {
        e.target.classList.remove('active');
    }
});