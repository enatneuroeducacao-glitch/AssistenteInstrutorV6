# Mercado Pago webhook hardening

Production Edge Function `mercadopago-webhook` was updated to fail closed when `MERCADOPAGO_WEBHOOK_SECRET` is absent.

Previous behavior: missing webhook secret caused signature validation to return `true`.

Current behavior: missing webhook secret causes signature validation to fail and the webhook returns HTTP 401.

This is intentionally documented as an operational hardening note because the Edge Function source is maintained/deployed through the Supabase function deployment workflow rather than the SQL migration system.