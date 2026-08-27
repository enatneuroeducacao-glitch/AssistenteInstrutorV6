import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const PLAN_CODE = "enat_profissional_50_mensal";
const AMOUNT_CENTS = 5000;

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

    const auth = req.headers.get("Authorization");
    if (!auth) return new Response("Unauthorized", { status: 401 });

    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: auth } } }
    );

    const { data: { user }, error: userError } = await sb.auth.getUser();
    if (userError || !user) return new Response("Unauthorized", { status: 401 });

    const { data: existing } = await sb
      .from("ai_subscriptions")
      .select("id, provider_subscription_id, checkout_url, status, amount_cents")
      .eq("user_id", user.id)
      .in("status", ["pending", "authorized", "active", "paused"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing?.status === "authorized" || existing?.status === "active") {
      return Response.json({
        already_active: true,
        status: existing.status,
        subscription_id: existing.provider_subscription_id
      });
    }

    if (existing?.status === "pending" && existing.checkout_url) {
      return Response.json({
        already_pending: true,
        status: existing.status,
        subscription_id: existing.provider_subscription_id,
        init_point: existing.checkout_url
      });
    }

    const token = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!token) {
      return Response.json({ error: "Mercado Pago não configurado no servidor." }, { status: 503 });
    }

    const base = Deno.env.get("PUBLIC_APP_URL");
    if (!base) {
      return Response.json({ error: "PUBLIC_APP_URL não configurada no servidor." }, { status: 503 });
    }

    const webhookBase = Deno.env.get("MERCADOPAGO_WEBHOOK_URL") ||
      `${Deno.env.get("SUPABASE_URL")}/functions/v1/mercadopago-webhook`;

    const externalReference = `enat:${user.id}:${crypto.randomUUID()}`;

    // Assinatura sem plano associado e com pagamento pendente.
    // O Mercado Pago gera o link para o assinante concluir a autorização.
    const subscription = {
      reason: "ENAT — Assistente do Instrutor | Plano Profissional",
      external_reference: externalReference,
      payer_email: user.email,
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        transaction_amount: AMOUNT_CENTS / 100,
        currency_id: "BRL"
      },
      back_url: `${base}/#/assinatura`,
      notification_url: `${webhookBase}?source_news=webhooks`,
      status: "pending"
    };

    const r = await fetch("https://api.mercadopago.com/preapproval", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(subscription)
    });

    const data = await r.json();
    if (!r.ok) return Response.json(data, { status: r.status });

    const checkoutUrl = data.init_point || data.sandbox_init_point || null;
    if (!checkoutUrl) {
      return Response.json({ error: "Mercado Pago não retornou o link da assinatura.", provider_response: data }, { status: 502 });
    }

    await sb.from("ai_subscriptions").insert({
      user_id: user.id,
      provider: "mercadopago",
      plan_code: PLAN_CODE,
      provider_subscription_id: String(data.id),
      checkout_url: checkoutUrl,
      status: String(data.status || "pending"),
      amount_cents: AMOUNT_CENTS,
      currency: "BRL",
      frequency: 1,
      frequency_type: "months",
      next_due_date: data.next_payment_date || null,
      metadata: {
        external_reference: externalReference,
        provider_response: data
      }
    });

    return Response.json({
      subscription_id: data.id,
      status: data.status || "pending",
      init_point: checkoutUrl
    });
  } catch (e) {
    console.error(e);
    return Response.json({ error: String(e) }, { status: 500 });
  }
});
