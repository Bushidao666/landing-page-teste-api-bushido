// Configura��o
const AIRTABLE_API_KEY = 'patdE3uO6gqHW2DwI.4b453abb475df06454fd19ecd320fcec230c29a6aee64bb3f069cc515ebed848';
const AIRTABLE_BASE_ID = 'appViUjy5hxH9RqCv';
const AIRTABLE_TABLE_ID = 'tbl4MQGVdHO4vWRBp';
const WEBHOOK_URL = 'https://primary-production-d53a.up.railway.app/webhook/validadorpages';

// Estado da aplica��o
let hasSubmitted = localStorage.getItem('hasSubmitted') === 'true';
let phoneValidated = false;

// Fun��es do popup
function openPopup() {
    if (hasSubmitted) {
        alert('J� recebemos seus dados, nossa atendente Vera L�cia Nogueira ir� brevemente entrar em contato com voc� via WhatsApp. Fique atento!');
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

// M�scara de telefone
function phoneMask(value) {
    value = value.replace(/\D/g, '');
    value = value.replace(/^(\d{2})(\d)/g, '$1 $2');
    value = value.replace(/(\d)(\d{4})$/, '$1-$2');
    return value;
}

// Valida��o de WhatsApp via webhook
async function validateWhatsApp(phone) {
    const cleanPhone = phone.replace(/\D/g, '');
    
    if (cleanPhone.length !== 11) {
        return false;
    }
    
    try {
        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ phone: cleanPhone })
        });
        
        const data = await response.json();
        return data.exists === true;
    } catch (error) {
        console.error('Erro ao validar WhatsApp:', error);
        return false;
    }
}

// Captura par�metros UTM
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
        const response = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
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
    
    // Aplicar m�scara ao telefone
    phoneInput.addEventListener('input', async function(e) {
        e.target.value = phoneMask(e.target.value);
        
        const cleanPhone = e.target.value.replace(/\D/g, '');
        
        if (cleanPhone.length === 11) {
            phoneError.textContent = 'Validando WhatsApp...';
            phoneError.style.color = '#666';
            
            const isValid = await validateWhatsApp(e.target.value);
            
            if (isValid) {
                phoneError.textContent = '';
                submitButton.disabled = false;
                phoneValidated = true;
            } else {
                phoneError.textContent = 'WhatsApp inv�lido';
                phoneError.style.color = '#e74c3c';
                submitButton.disabled = true;
                phoneValidated = false;
            }
        } else {
            phoneError.textContent = '';
            submitButton.disabled = true;
            phoneValidated = false;
        }
    });
    
    // Submiss�o do formul�rio
    leadForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (!phoneValidated) {
            alert('Por favor, insira um WhatsApp v�lido.');
            return;
        }
        
        const formData = {
            name: document.getElementById('name').value,
            phone: document.getElementById('phone').value,
            email: document.getElementById('email').value
        };

        // Disparar evento do Facebook Conversions API
        if (typeof trackPreencheuFormulario === 'function') {
            trackPreencheuFormulario(formData);
        }
        
        submitButton.disabled = true;
        submitButton.textContent = 'Enviando...';
        
        try {
            await sendToAirtable(formData);
            
            // Marcar como enviado
            localStorage.setItem('hasSubmitted', 'true');
            hasSubmitted = true;
            
            // Redirecionar para p�gina de obrigado
            window.location.href = '/obrigado';
        } catch (error) {
            alert('Erro ao enviar seus dados. Por favor, tente novamente.');
            submitButton.disabled = false;
            submitButton.textContent = 'Solicitar An�lise';
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