import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { createClient } from "@supabase/supabase-js";
import "./style.css";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = url && key ? createClient(url, key) : null;

function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let mounted = true;
    if (!supabase) {
      setMessage("Supabase não configurado.");
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      if (data?.session) window.location.replace("/admin-access");
      else setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  async function login(e) {
    e.preventDefault();
    if (!email.trim() || !password) {
      setMessage("Informe e-mail e senha.");
      return;
    }
    if (!supabase) {
      setMessage("Supabase não configurado.");
      return;
    }
    setBusy(true);
    setMessage("");
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) {
      setMessage(error.message === "Invalid login credentials" ? "E-mail ou senha inválidos." : error.message);
      setBusy(false);
      return;
    }

    // The protected admin panel performs the final authorization check.
    if (data?.session) window.location.replace("/admin-access");
    else {
      setMessage("Não foi possível iniciar a sessão.");
      setBusy(false);
    }
  }

  if (loading) {
    return <div className="auth"><div className="card"><h1>ENAT — Administração</h1><p>Verificando sessão...</p></div></div>;
  }

  return (
    <div className="auth">
      <div className="card" style={{ width: "min(440px, calc(100vw - 32px))" }}>
        <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: ".08em", color: "#4772a8" }}>ENAT ADMIN</div>
        <h1 style={{ marginBottom: 8 }}>Acesso administrativo</h1>
        <p style={{ opacity: .7, marginTop: 0 }}>Entre com sua conta autorizada para acessar o painel profissional.</p>
        <form onSubmit={login}>
          <label>E-mail
            <input type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@enat.com.br" autoFocus />
          </label>
          <label>Senha
            <input type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
          </label>
          <button type="submit" disabled={busy} style={{ width: "100%", marginTop: 8 }}>{busy ? "ENTRANDO..." : "ENTRAR NO ADMIN"}</button>
        </form>
        {message && <p className="msg" role="alert">{message}</p>}
        <a href="/" style={{ display: "inline-block", marginTop: 12 }}>Voltar ao Assistente</a>
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<React.StrictMode><AdminLogin /></React.StrictMode>);
