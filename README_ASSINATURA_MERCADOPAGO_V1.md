# ENAT Assistente do Instrutor — Assinatura Mercado Pago v1

## Modelo comercial
- Plano Profissional: **R$ 50,00 por mês**.
- Assinatura recorrente, não compra única.
- Cursos e certificados ficam disponíveis para assinantes ativos.
- O catálogo pode permanecer visível para não assinantes, mas o acesso ao conteúdo é bloqueado até a assinatura ser ativada.

## Arquivos
- `supabase/assinatura_mercadopago_v1.sql` — tabelas, RLS e view de assinatura.
- `supabase/functions/create-subscription/index.ts` — cria a assinatura pendente no Mercado Pago e devolve o link de checkout.
- `supabase/functions/mercadopago-webhook/index.ts` — recebe eventos, consulta o Mercado Pago no servidor e atualiza o status local.

## Segredos no Supabase
Configurar como secrets da Edge Function:

- `MERCADOPAGO_ACCESS_TOKEN` — Access Token da aplicação Mercado Pago.
- `MERCADOPAGO_WEBHOOK_SECRET` — chave secreta do Webhook, quando disponível/configurada.
- `PUBLIC_APP_URL` — URL pública do Assistente, por exemplo `https://seu-dominio.com`.
- `MERCADOPAGO_WEBHOOK_URL` — opcional; se omitido, usa `SUPABASE_URL/functions/v1/mercadopago-webhook`.

**Nunca coloque `MERCADOPAGO_ACCESS_TOKEN` no `.env` do frontend, no React ou no Git.**

## Deploy Supabase
Depois de instalar/login no Supabase CLI e selecionar o projeto:

```bash
supabase db push
supabase functions deploy create-subscription
supabase functions deploy mercadopago-webhook --no-verify-jwt
supabase secrets set MERCADOPAGO_ACCESS_TOKEN="SEU_ACCESS_TOKEN"
supabase secrets set MERCADOPAGO_WEBHOOK_SECRET="SUA_CHAVE_WEBHOOK"
supabase secrets set PUBLIC_APP_URL="https://SEU_DOMINIO"
```

O Webhook é público por definição porque é chamado pelo Mercado Pago; a autenticação do evento deve ser feita pela assinatura secreta do Webhook e, adicionalmente, pela consulta server-side ao recurso no Mercado Pago.

## Configuração Mercado Pago
A API oficial permite criar assinaturas recorrentes pelo endpoint `/preapproval`. Para uma assinatura sem plano associado e com pagamento pendente, o Mercado Pago orienta criar a assinatura com `status: pending`; depois o cliente conclui o meio de pagamento pelo link da assinatura.

Na aplicação Mercado Pago, configure os eventos de assinaturas e pagamentos conforme a documentação atual do produto:
- `subscription_preapproval`
- `subscription_authorized_payment`
- `payment`

O código também envia `notification_url` na criação da assinatura.

## Segurança
- O frontend nunca decide que o usuário pagou.
- O retorno do navegador não libera acesso.
- A liberação depende do status salvo no Supabase.
- O Webhook consulta a assinatura/pagamento diretamente na API do Mercado Pago antes de atualizar o banco.
- O acesso premium deve considerar `status = active`.

## Teste
1. Execute a migration no Supabase.
2. Configure credenciais de teste do Mercado Pago.
3. Faça login no Assistente.
4. Abra `ASSINATURA`.
5. Clique em `ASSINAR POR R$ 50,00/MÊS`.
6. Conclua o fluxo com usuário/cartão de teste do Mercado Pago.
7. Verifique a chegada do Webhook.
8. Confirme no Supabase que `ai_subscriptions.status` passou para `active`.
9. Recarregue o Assistente e confirme que ALUNOS, AGENDA, AULAS, HSI-DOTH-P, RPA ÚNICO, FINANCEIRO e conteúdo dos CURSOS foram liberados.

## Contato ENAT
O formulário de solicitação de cursos usa:

`enat.neuroeducacao@gmail.com`

O endereço é mantido no frontend apenas como destino de `mailto`; nenhum segredo de pagamento é exposto.
