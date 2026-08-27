import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

function getQueryValue(url: URL, key: string) {
  return url.searchParams.get(key) || "";
}

async function sha256Hex(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, "0")).join("");
}

async function validateSignature(req: Request, dataId: string) {
  const secret = Deno.env.get("MERCADOPAGO_WEBHOOK_SECRET");
  if (!secret) return true; // Permite primeiro teste; produção deve configurar a chave.

  const xSignature = req.headers.get("x-signature") || "";
  const xRequestId = req.headers.get("x-request-id") || "";
  const ts = xSignature.match(/(?:^|,)ts=([^,]+)/)?.[1];
  const v1 = xSignature.match(/(?:^|,)v1=([^,]+)/)?.[1];
  if (!ts || !v1 || !dataId || !xRequestId) return false;

  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
  const expected = await sha256Hex(`${manifest}${secret}`);
  return expected === v1;
}

async function fetchProvider(url: string, token: string) {
  const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const data = await r.json();
  if (!r.ok) throw new Error(`Mercado Pago ${r.status}: ${JSON.stringify(data)}`);
  return data;
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

    const payload = await req.json();
    const url = new URL(req.url);
    const topic = String(payload.type || payload.topic || getQueryValue(url, "type") || getQueryValue(url, "topic") || "");
    const resourceId = String(payload.data?.id || payload.id || getQueryValue(url, "data.id") || "");

    if (!resourceId) return new Response("ok", { status: 200 });

    const token = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!token) return new Response("not configured", { status: 503 });

    if (!(await validateSignature(req, resourceId))) {
      return new Response("invalid signature", { status: 401 });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    await admin.from("ai_subscription_events").insert({
      provider: "mercadopago",
      event_type: topic,
      action: String(payload.action || ""),
      provider_resource_id: resourceId,
      payload
    });

    // Assinatura: criação/alteração de preapproval.
    if (topic === "subscription_preapproval" || topic === "preapproval") {
      const sub = await fetchProvider(`https://api.mercadopago.com/preapproval/${resourceId}`, token);
      await syncSubscription(admin, sub);
      return new Response("ok", { status: 200 });
    }

    // Pagamentos recorrentes: sincronizamos o pagamento e, em seguida,
    // consultamos a assinatura para garantir que o acesso reflita o estado atual.
    if (topic === "subscription_authorized_payment" || topic === "payment") {
      let subscriptionId = "";
      let payment = null;

      if (topic === "subscription_authorized_payment") {
        payment = await fetchProvider(`https://api.mercadopago.com/authorized_payments/${resourceId}`, token);
        subscriptionId = String(payment.preapproval_id || payment.subscription_id || "");
      } else {
        payment = await fetchProvider(`https://api.mercadopago.com/v1/payments/${resourceId}`, token);
        subscriptionId = String(payment.preapproval_id || payment.subscription_id || "");
      }

      if (subscriptionId) {
        const sub = await fetchProvider(`https://api.mercadopago.com/preapproval/${subscriptionId}`, token);
        await syncSubscription(admin, sub, payment);
      }

      return new Response("ok", { status: 200 });
    }

    return new Response("ok", { status: 200 });
  } catch (e) {
    console.error(e);
    return new Response(String(e), { status: 500 });
  }
});

async function syncSubscription(admin: any, sub: any, payment: any = null) {
  const providerId = String(sub.id || "");
  if (!providerId) return;

  const status = normalizeStatus(sub.status);
  const auto = sub.auto_recurring || {};
  const externalReference = String(sub.external_reference || "");
  const userIdFromRef = externalReference.startsWith("enat:") ? externalReference.split(":")[1] : "";

  let userId = userIdFromRef;
  if (!userId) {
    const { data: current } = await admin
      .from("ai_subscriptions")
      .select("user_id")
      .eq("provider_subscription_id", providerId)
      .maybeSingle();
    userId = current?.user_id || "";
  }
  if (!userId) return;

  await admin.from("ai_subscriptions").upsert({
    user_id: userId,
    provider: "mercadopago",
    plan_code: "enat_profissional_50_mensal",
    provider_subscription_id: providerId,
    provider_customer_id: sub.payer_id ? String(sub.payer_id) : null,
    checkout_url: sub.init_point || null,
    status,
    amount_cents: Math.round(Number(auto.transaction_amount || 50) * 100),
    currency: String(auto.currency_id || "BRL"),
    frequency: Number(auto.frequency || 1),
    frequency_type: String(auto.frequency_type || "months"),
    current_period_start: sub.date_created || null,
    current_period_end: sub.next_payment_date || null,
    next_due_date: sub.next_payment_date || null,
    last_payment_id: payment?.id ? String(payment.id) : null,
    last_payment_status: payment?.status ? String(payment.status) : null,
    last_payment_at: payment?.date_approved || payment?.date_created || null,
    canceled_at: status === "canceled" ? new Date().toISOString() : null,
    paused_at: status === "paused" ? new Date().toISOString() : null,
    metadata: { external_reference: externalReference }
  }, { onConflict: "provider_subscription_id" });
}

function normalizeStatus(value: string) {
  const status = String(value || "pending").toLowerCase();
  if (["authorized", "active"].includes(status)) return "active";
  if (["paused"].includes(status)) return "paused";
  if (["cancelled", "canceled"].includes(status)) return "canceled";
  if (["expired"].includes(status)) return "expired";
  return "pending";
}
