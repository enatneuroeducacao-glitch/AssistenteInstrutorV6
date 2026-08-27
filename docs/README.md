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

## V6 — consolidação operacional

Para a revisão consolidada, execute primeiro `supabase/consolidacao_v6.sql` no projeto Supabase e siga `CONSOLIDACAO_V6.md`.

O pacote fonte não inclui o `.env` com credenciais. Use `.env.example` como modelo.


## V6.2 — reparos e orientação de uso

Esta revisão também inclui:

- correção do carregamento de contas bancárias, que estava referenciando estado fora do componente correto;
- correção do cálculo de média usado na evolução pedagógica histórica;
- página **CURSOS** com fluxo recomendado, orientação operacional e dúvidas rápidas;
- tela **LICENÇA / CONTATO ENAT**, alinhada ao modelo de pagamento único;
- migration `supabase/v6_2_schema_gap_repair.sql` para as lacunas de `ai_vehicles`, `ai_finance_accounts` e colunas de vínculo usadas pelo frontend.

Antes da publicação, execute a migration V6.2 no Supabase e valide as políticas RLS no projeto.
