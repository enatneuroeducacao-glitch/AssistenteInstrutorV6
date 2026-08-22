import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return new Response("Unauthorized", { status: 401 });

    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: auth } } }
    );
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return new Response("Unauthorized", { status: 401 });

    const { product_code = "assistant_v1" } = await req.json();
    const { data: product } = await sb.from("ai_products")
      .select("*").eq("code", product_code).eq("active", true).single();
    if (!product) return Response.json({ error: "Produto não encontrado" }, { status: 404 });

    const token = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!token) return Response.json({ error: "Mercado Pago não configurado no servidor" }, { status: 503 });

    const base = Deno.env.get("PUBLIC_APP_URL")!;
    const preference = {
      items: [{
        id: product.code,
        title: `${product.name} — versão ${product.version}`,
        description: product.description || "Licença permanente",
        quantity: 1,
        currency_id: "BRL",
        unit_price: Number(product.price_cents) / 100
      }],
      payer: { email: user.email },
      external_reference: `${user.id}:${product.id}`,
      back_urls: {
        success: `${base}/#/pagamento/sucesso`,
        failure: `${base}/#/pagamento/falha`,
        pending: `${base}/#/pagamento/pendente`
      },
      auto_return: "approved"
    };

    const r = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(preference)
    });
    const data = await r.json();
    if (!r.ok) return Response.json(data, { status: r.status });

    await sb.from("ai_purchases").insert({
      user_id: user.id,
      product_id: product.id,
      provider: "mercadopago",
      provider_preference_id: data.id,
      amount_cents: product.price_cents,
      status: "pending"
    });

    return Response.json({ preference_id: data.id, init_point: data.init_point });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
});
