# Meu Nome Ok - Landing Page

Landing page para servi�os de renegocia��o de d�vidas de empr�stimo consignado.

## Estrutura do Projeto

```
   index.html                    # P�gina principal
   css/
      styles.css               # Estilos principais
   js/
      main.js                 # JavaScript principal
   images/                      # Imagens do site
   termos-de-uso.html           # P�gina de termos
   politica-de-privacidade.html # P�gina de privacidade
   obrigado.html                # P�gina de agradecimento
   back-redirect.html           # P�gina para usu�rios que j� enviaram dados
   _redirects                   # Configura��o de redirects Netlify
   netlify.toml                # Configura��o Netlify
   robots.txt                  # Configurado para noindex
```

## Funcionalidades Implementadas

###  Componentes Funcionais
- **Google Tag Manager**: Container GTM-P69X36NC implementado
- **Formul�rio � Airtable**: Integra��o com API Airtable
- **Pop-up em todos os CTAs**: Formul�rio centralizado
- **Valida��o WhatsApp**: Via webhook com m�scara 00 0 0000-0000
- **Preven��o de envio duplicado**: LocalStorage + mensagem personalizada
- **Redirects Netlify**: Configura��o completa
- **Privacidade/SEO**: noindex, nofollow + robots.txt

###  Estrutura de Conte�do
- **Hero Section**: Headline + sub-headline + CTA
- **Old Way**: Problemas atuais
- **New Way**: Solu��o proposta
- **Evid�ncias**: Depoimentos + v�deos + men��es na m�dia
- **Estat�sticas**: Resultados num�ricos
- **CTA Final**: Chamada para a��o

###  Design
- **Cores**: Roxo/lavanda + amarelo + azul (conforme especifica��o)
- **Tipografia**: Sans-serif moderna
- **Responsivo**: Layout adapt�vel
- **Anima��es**: Transi��es suaves

## Imagens Necess�rias

Para finalizar a landing page, adicione as seguintes imagens na pasta `images/`:

### Obrigat�rias
- `hero-bg.jpg` - Imagem hero (pessoas aliviadas)
- `shield-icon.svg` - �cone de prote��o LGPD

### Logos de Confian�a
- `inss-logo.png`
- `bb-logo.png` (Banco do Brasil)
- `caixa-logo.png`
- `bradesco-logo.png`

### Logos de M�dia
- `valor-economico.png`
- `portal-ig.png`
- `globo.png`

## Deploy no Netlify

1. **Conectar reposit�rio**:
   - Fa�a push deste projeto para GitHub
   - Conecte o reposit�rio no Netlify

2. **Configura��es de build**:
   - Build command: `echo 'Build complete'`
   - Publish directory: `.`
   - O arquivo `netlify.toml` j� est� configurado

3. **Vari�veis de ambiente** (se necess�rio):
   - Nenhuma vari�vel adicional requerida
   - API keys est�o no c�digo conforme solicita��o

## Configura��es Importantes

### Integra��o Airtable
- **Base ID**: `appViUjy5hxH9RqCv`
- **Tabela**: `tbl4MQGVdHO4vWRBp`
- **Campos**: Nome do lead, Telefone do lead, Email do lead + UTMs

### Valida��o WhatsApp
- **Webhook**: `https://primary-production-d53a.up.railway.app/webhook/validadorpages`
- **Formato**: 11 d�gitos (11 9 9999-9999)

### V�deos
- **Iframe 1**: `panda-afd35ee7-3477-4f15-9456-2b3af4e50f4c`
- **Iframe 2**: `panda-d09bc440-eefa-4391-99a8-cdb58a695b7c`

### Links de M�dia
- **Valor Econ�mico**: Configurado
- **Portal IG**: Configurado
- **Globo.com**: Configurado

## Testes Recomendados

1. **Formul�rio**: Testar valida��o de WhatsApp
2. **Responsividade**: Testar em diferentes dispositivos
3. **Redirects**: Testar todas as rotas (/obrigado, /termos-de-uso, etc.)
4. **GTM**: Verificar se o tracking est� funcionando
5. **Integra��o**: Testar envio para Airtable

## Suporte

Esta landing page est� pronta para produ��o com todos os componentes funcionais implementados conforme especifica��o.