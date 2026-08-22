import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { createClient } from "@supabase/supabase-js";
import "./style.css";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

function Auth({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [name, setName] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setMsg("");
    setBusy(true);
    try {
      if (!email || !pass || (mode === "signup" && !name)) {
        setMsg("Preencha todos os campos obrigatÃ³rios.");
        return;
      }
      if (mode === "login") {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
        if (error) throw error;
        onAuth(data.user);
      } else {
        const { data, error } = await supabase.auth.signUp({
          email, password: pass, options: { data: { full_name: name } }
        });
        if (error) throw error;
        if (data.session && data.user) onAuth(data.user);
        setMsg(data.session ? "Conta criada." : "Conta criada. Verifique seu e-mail.");
      }
    } catch (err) {
      setMsg(err?.message || "NÃ£o foi possÃ­vel concluir.");
    } finally {
      setBusy(false);
    }
  }

  async function forgot() {
    if (!email) return setMsg("Digite seu e-mail primeiro.");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin
    });
    setMsg(error ? error.message : "Se o e-mail estiver cadastrado, enviaremos as instruÃ§Ãµes.");
  }

  return <div className="auth">
    <div className="brand">ASSISTENTE <span>DO INSTRUTOR</span></div>
    <form className="card" onSubmit={submit}>
      <h1>{mode === "login" ? "Entrar" : "Criar conta"}</h1>
      {mode === "signup" && <input autoFocus placeholder="Nome completo" value={name} onChange={e=>setName(e.target.value)} />}
      <input placeholder="E-mail" type="email" value={email} onChange={e=>setEmail(e.target.value)} />
      <input placeholder="Senha" type="password" value={pass} onChange={e=>setPass(e.target.value)} />
      <button type="submit" disabled={busy}>{busy ? "AGUARDE..." : mode === "login" ? "ENTRAR" : "CRIAR CONTA"}</button>
      {mode === "login" && <button type="button" className="link" onClick={forgot}>Esqueci minha senha</button>}
      <button type="button" className="link" onClick={()=>{setMode(mode==="login"?"signup":"login");setMsg("")}}>
        {mode === "login" ? "Ainda nÃ£o tenho cadastro" : "JÃ¡ tenho uma conta"}
      </button>
      {msg && <p className="msg">{msg}</p>}
    </form>
  </div>;
}

function Dashboard({ user, onLogout }) {
  return <div className="app">
    <aside>
      <div className="brand small">AI <span>INSTRUTOR</span></div>
      {["DASHBOARD","ALUNOS","AULAS","HSI","FINANCEIRO","CUSTOS","RPA","ASSINATURA","PERFIL"].map((x,i)=>
        <button key={x} className={i===0?"nav active":"nav"}>{x}</button>
      )}
      <button className="nav logout" onClick={onLogout}>SAIR</button>
    </aside>
    <main>
      <header><div><b>{user?.email}</b><small>Assistente do Instrutor â€” acesso autenticado</small></div><span className="pill">AUTENTICADO</span></header>
      <section>
        <h1>Dashboard</h1>
        <div className="panel"><h2>Login funcionando</h2><p>VocÃª estÃ¡ autenticado pelo Supabase. Clique em <strong>SAIR</strong> para testar novamente a tela de login.</p></div>
        <div className="panel"><h2>Fluxo comercial</h2><div className="phases">
          {["LOGIN","CADASTRO","LICENÃ‡A","DASHBOARD","ALUNO","AULA","HSI","FINANCEIRO"].map((p,i)=><div key={p}><b>{i+1}</b> {p}</div>)}
        </div></div>
      </section>
    </main>
  </div>;
}

function Root() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadProfile(currentUser) {
    if (!currentUser) {
      setProfile(null);
      return;
    }

    const { data, error } = await supabase
      .from("ai_profiles")
      .select("*")
      .eq("id", currentUser.id)
      .maybeSingle();

    if (error) {
      console.error("Erro ao carregar perfil:", error);
      setProfile(null);
      return;
    }

    setProfile(data);
  }

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;

      const currentUser = data.session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        await loadProfile(currentUser);
      }

      setLoading(false);
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        await loadProfile(currentUser);
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }

  if (loading) {
    return (
      <div className="auth">
        <div className="card">
          <h1>Assistente do Instrutor</h1>
          <p>Verificando acesso...</p>
        </div>
      </div>
    );
  }

  return user ? (
    <Dashboard
      user={user}
      profile={profile}
      refreshProfile={() => loadProfile(user)}
      onLogout={logout}
    />
  ) : (
    <Auth onAuth={setUser} />
  );
}
