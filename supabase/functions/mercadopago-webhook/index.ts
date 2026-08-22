import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    const paymentId = payload.data?.id || payload.id;
    if (!paymentId) return new Response("ok");

    const token = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!token) return new Response("not configured", { status: 503 });

    // Payment details are queried server-side; never trust the browser return URL as proof of payment.
    const r = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const payment = await r.json();
    if (!r.ok) return new Response("provider error", { status: 502 });

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const ext = String(payment.external_reference || "");
    const [userId, productId] = ext.split(":");
    if (!userId || !productId) return new Response("ok");

    await admin.from("ai_purchases").update({
      provider_payment_id: String(payment.id),
      status: payment.status,
      purchased_at: payment.status === "approved" ? new Date().toISOString() : null
    }).eq("user_id", userId).eq("product_id", productId).eq("status", "pending");

    if (payment.status === "approved") {
      const { data: product } = await admin.from("ai_products")
        .select("*").eq("id", productId).single();

      const licenseKey = `AI-${String(payment.id).slice(-10).toUpperCase()}-${crypto.randomUUID().slice(0,8).toUpperCase()}`;

      await admin.from("ai_licenses").insert({
        user_id: userId,
        product_id: productId,
        licensed_version: product.version,
        license_type: "perpetual",
        status: "active",
        license_key: licenseKey,
        max_devices: 1
      });
    }
    return new Response("ok");
  } catch (e) {
    return new Response(String(e), { status: 500 });
  }
});
