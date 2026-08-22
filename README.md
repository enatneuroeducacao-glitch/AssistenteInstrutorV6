# Assistente do Instrutor — V7.1 Licença Permanente

## Modelo comercial

A V7.1 foi desenhada para **pagamento único**, sem assinatura recorrente:

- **Assistente do Instrutor V1.0 — R$ 50,00**
- licença permanente da versão adquirida;
- 1 dispositivo inicialmente;
- atualizações futuras não incluídas;
- atualizações podem ser vendidas separadamente.

Exemplo:
- V1.0: R$ 50
- Atualização V1.0 → V1.1: preço definido pelo administrador
- Atualização V1.1 → V2.0: preço definido pelo administrador

O sistema não deve bloquear a versão já adquirida apenas porque existe uma atualização nova.

## Fluxo

Cadastro → Checkout Mercado Pago → pagamento aprovado → webhook → licença permanente → ativação.

A criação da preferência de pagamento deve ocorrer no backend. O Mercado Pago documenta o Checkout Pro como uma preferência criada no servidor e retornando uma URL para iniciar o checkout. Não coloque o Access Token no frontend.

## Configuração
Secrets do Supabase:
- MERCADOPAGO_ACCESS_TOKEN
- MERCADOPAGO_WEBHOOK_SECRET
- SUPABASE_SERVICE_ROLE_KEY
- PUBLIC_APP_URL

Frontend:
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY

## Executar
npm install
npm run dev

## Produção
npm run build
publicar `dist`.

## Segurança
- Service Role somente no backend/Edge Functions.
- Access Token Mercado Pago somente no backend.
- A confirmação da compra deve vir do servidor/webhook.
- A licença fica vinculada ao usuário e ao produto/versão.
