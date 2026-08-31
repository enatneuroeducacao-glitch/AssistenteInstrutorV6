import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { createClient } from "@supabase/supabase-js";
import "./style.css";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = url && key ? createClient(url, key) : null;

function AdminAccess() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [users, setUsers] = useState([]);
  const [email, setEmail] = useState("");
  const [expires, setExpires] = useState("");
  const [note, setNote] = useState("");
  const [search, setSearch] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function loadUsers(term = "") {
    if (!supabase) return;
    const { data, error } = await supabase.rpc("admin_list_access_users", { p_search: term || null });
    if (error) { setMsg(error.message); return; }
    setUsers(data || []);
  }

  useEffect(() => {
    let mounted = true;
    if (!supabase) { setMsg("Supabase não configurado."); setLoading(false); return; }
    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      const current = data?.session || null;
      setSession(current);
      if (!current?.user) { setLoading(false); return; }
      const { data: adminUsers, error } = await supabase.rpc("admin_list_access_users", { p_search: "" });
      if (!mounted) return;
      if (error) { setMsg(error.message); setLoading(false); return; }
      const me = (adminUsers || []).find(x => String(x.email || "").toLowerCase() === String(current.user.email || "").toLowerCase());
      if (!me) { setMsg("Acesso administrativo não autorizado."); setLoading(false); return; }
      setAuthorized(true);
      setUsers(adminUsers || []);
      setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  async function grant() {
    if (!email.trim()) return setMsg("Informe o e-mail da conta.");
    setBusy(true); setMsg("");
    const expiresAt = expires ? new Date(`${expires}T23:59:59`).toISOString() : null;
    const { error } = await supabase.rpc("admin_grant_free_access", { p_email: email.trim(), p_expires_at: expiresAt, p_note: note.trim() || null });
    if (error) setMsg(error.message);
    else { setMsg("Acesso livre concedido com sucesso."); setEmail(""); setExpires(""); setNote(""); await loadUsers(search); }
    setBusy(false);
  }

  async function revoke(userId) {
    if (!window.confirm("Revogar o acesso livre deste usuário?")) return;
    setBusy(true); setMsg("");
    const { error } = await supabase.rpc("admin_revoke_free_access", { p_user_id: userId });
    if (error) setMsg(error.message); else { setMsg("Acesso revogado."); await loadUsers(search); }
    setBusy(false);
  }

  if (loading) return <div className="auth"><div className="card"><h1>ENAT — Administração</h1><p>Verificando acesso administrativo...</p></div></div>;
  if (!session) return <div className="auth"><div className="card"><h1>ENAT — Administração</h1><p className="msg">Faça login no Assistente do Instrutor antes de acessar este painel.</p><a href="/">Voltar ao Assistente</a></div></div>;
  if (!authorized) return <div className="auth"><div className="card"><h1>ENAT — Administração</h1><p className="msg">{msg || "Acesso administrativo não autorizado."}</p><a href="/">Voltar ao Assistente</a></div></div>;

  return <div className="app">
    <aside><div className="brand small"><span style={{color:"#55BFEF",fontWeight:900}}>ENAT</span> ADMIN</div><button className="nav active">ACESSO LIVRE</button><button className="nav" onClick={()=>window.location.href="/"}>ASSISTENTE</button></aside>
    <main>
      <header><div><b>Administração ENAT</b><small>Gestão de acesso profissional</small></div><span className="pill">ADMIN</span></header>
      <section>
        <div className="panel"><h1>Conceder acesso livre</h1><p>Libere ou limite o acesso profissional sem editar código ou assinatura manualmente.</p><div className="grid"><label>E-mail da conta<input value={email} onChange={e=>setEmail(e.target.value)} placeholder="usuario@email.com" /></label><label>Validade (opcional)<input type="date" value={expires} onChange={e=>setExpires(e.target.value)} /></label></div><label>Observação<input value={note} onChange={e=>setNote(e.target.value)} placeholder="Ex.: Instrutor beta ENAT" /></label><button disabled={busy} onClick={grant}>{busy ? "PROCESSANDO..." : "CONCEDER ACESSO"}</button>{msg && <p className="msg">{msg}</p>}</div>
        <div className="panel"><div style={{display:"flex",gap:"10px",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap"}}><div><h2>Contas e acessos</h2><small>Pesquisa por nome ou e-mail.</small></div><input value={search} onChange={e=>{setSearch(e.target.value);loadUsers(e.target.value)}} placeholder="Pesquisar..." style={{maxWidth:"300px"}} /></div><div style={{overflowX:"auto",marginTop:"14px"}}><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr><th style={{textAlign:"left",padding:"8px"}}>Nome</th><th style={{textAlign:"left",padding:"8px"}}>E-mail</th><th style={{padding:"8px"}}>Acesso</th><th style={{padding:"8px"}}>Validade</th><th style={{padding:"8px"}}></th></tr></thead><tbody>{users.map(u=><tr key={u.user_id} style={{borderTop:"1px solid #e5eaf0"}}><td style={{padding:"8px"}}>{u.full_name||"—"}</td><td style={{padding:"8px"}}>{u.email||"—"}</td><td style={{padding:"8px",textAlign:"center",fontWeight:800}}>{u.access_active?"LIVRE":"—"}</td><td style={{padding:"8px",textAlign:"center"}}>{u.expires_at?new Date(u.expires_at).toLocaleDateString("pt-BR"):(u.access_active?"PERMANENTE":"—")}</td><td style={{padding:"8px",textAlign:"right"}}>{u.access_active&&<button className="link" disabled={busy} onClick={()=>revoke(u.user_id)}>REVOGAR</button>}</td></tr>)}</tbody></table></div></div>
      </section>
    </main>
  </div>;
}

createRoot(document.getElementById("root")).render(<React.StrictMode><AdminAccess /></React.StrictMode>);
