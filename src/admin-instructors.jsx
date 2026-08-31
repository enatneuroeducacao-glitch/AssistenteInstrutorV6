import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { createClient } from "@supabase/supabase-js";
import "./style.css";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = url && key ? createClient(url, key) : null;

const STATES = {
  AC:"Acre", AL:"Alagoas", AP:"Amapá", AM:"Amazonas", BA:"Bahia", CE:"Ceará",
  DF:"Distrito Federal", ES:"Espírito Santo", GO:"Goiás", MA:"Maranhão", MT:"Mato Grosso",
  MS:"Mato Grosso do Sul", MG:"Minas Gerais", PA:"Pará", PB:"Paraíba", PR:"Paraná",
  PE:"Pernambuco", PI:"Piauí", RJ:"Rio de Janeiro", RN:"Rio Grande do Norte", RS:"Rio Grande do Sul",
  RO:"Rondônia", RR:"Roraima", SC:"Santa Catarina", SP:"São Paulo", SE:"Sergipe", TO:"Tocantins"
};

const card = { background:"#fff", border:"1px solid #dfe7f2", borderRadius:16, padding:18, boxShadow:"0 8px 24px rgba(15,35,65,.05)" };
const initials = (name="") => name.trim().split(/\s+/).slice(0,2).map(x=>x[0]).join("").toUpperCase() || "I";

function AdminInstructors(){
  const [session,setSession]=useState(null);
  const [loading,setLoading]=useState(true);
  const [authorized,setAuthorized]=useState(false);
  const [ufs,setUfs]=useState([]);
  const [selectedUf,setSelectedUf]=useState("");
  const [instructors,setInstructors]=useState([]);
  const [selected,setSelected]=useState(null);
  const [profile,setProfile]=useState(null);
  const [search,setSearch]=useState("");
  const [msg,setMsg]=useState("");

  async function loadUfs(){
    if(!supabase)return;
    const {data,error}=await supabase.rpc("admin_list_instructor_ufs");
    if(error){setMsg(error.message);return;}
    setUfs(data||[]);
  }
  async function loadUf(uf){
    setSelectedUf(uf); setSelected(null); setProfile(null); setSearch(""); setMsg("");
    const {data,error}=await supabase.rpc("admin_list_instructors_by_uf",{p_uf:uf});
    if(error){setMsg(error.message);setInstructors([]);return;}
    setInstructors(data||[]);
  }
  async function loadProfile(id){
    setSelected(id); setProfile(null); setMsg("");
    const {data,error}=await supabase.rpc("admin_get_instructor_profile",{p_user_id:id});
    if(error){setMsg(error.message);return;}
    setProfile(data||{});
  }

  useEffect(()=>{
    let mounted=true;
    if(!supabase){setMsg("Supabase não configurado.");setLoading(false);return;}
    supabase.auth.getSession().then(async ({data})=>{
      if(!mounted)return;
      const current=data?.session||null; setSession(current);
      if(!current?.user){setLoading(false);return;}
      const {data:ok,error}=await supabase.rpc("is_ai_admin");
      if(error || !ok){setMsg(error?.message||"Acesso administrativo não autorizado.");setLoading(false);return;}
      setAuthorized(true); await loadUfs(); setLoading(false);
    });
    return()=>{mounted=false};
  },[]);

  const filtered=useMemo(()=>{
    const q=search.trim().toLowerCase();
    if(!q)return instructors;
    return instructors.filter(x=>[x.full_name,x.email,x.city,x.acting_city,x.credential,x.category].some(v=>String(v||"").toLowerCase().includes(q)));
  },[instructors,search]);
  const total=ufs.reduce((n,x)=>n+Number(x.instructor_count||0),0);
  const currentState=selectedUf ? (STATES[selectedUf] || selectedUf) : "Brasil";

  if(loading)return <div className="auth"><div className="card"><h1>ENAT — Instrutores</h1><p>Verificando acesso administrativo...</p></div></div>;
  if(!session || !authorized)return <div className="auth"><div className="card"><h1>ENAT — Instrutores</h1><p className="msg">{msg||"Acesso administrativo não autorizado."}</p><a href="/admin-login">Voltar ao login</a></div></div>;

  return <div className="app">
    <aside>
      <div className="brand small"><span style={{color:"#55BFEF",fontWeight:900}}>ENAT</span> ADMIN</div>
      <button className="nav" onClick={()=>window.location.href="/admin-access"}>PAINEL</button>
      <button className="nav active">INSTRUTORES</button>
      <button className="nav" onClick={()=>window.location.href="/"}>ASSISTENTE</button>
    </aside>
    <main>
      <header><div><b>Painel Nacional de Instrutores</b><small>Brasil → UF → instrutores → perfil profissional</small></div><span className="pill">ADMIN</span></header>
      <section style={{maxWidth:1400,margin:"0 auto",padding:"24px"}}>
        <div style={{display:"flex",justifyContent:"space-between",gap:18,alignItems:"end",flexWrap:"wrap"}}>
          <div><div className="eyebrow">ENAT • REDE PROFISSIONAL</div><h1 style={{margin:"4px 0",fontSize:34}}>Instrutores por estado</h1><p style={{margin:0,color:"#687b91"}}>Clique em uma UF para abrir os instrutores cadastrados naquele estado.</p></div>
          <div style={{...card,minWidth:210,padding:"14px 18px"}}><small style={{color:"#687b91"}}>TOTAL NACIONAL</small><strong style={{display:"block",fontSize:28,color:"#17315d",marginTop:3}}>{total}</strong><small>instrutores cadastrados</small></div>
        </div>

        {!selectedUf ? <>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))",gap:12,marginTop:20}}>
            {ufs.map(x=><button key={x.uf||"NI"} onClick={()=>x.uf&&loadUf(x.uf)} style={{...card,textAlign:"left",cursor:x.uf?"pointer":"default",border:"1px solid #dfe7f2",background:"#fff"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><strong style={{fontSize:22,color:"#17315d"}}>{x.uf||"—"}</strong><span style={{fontSize:11,fontWeight:800,color:"#4772a8"}}>ABRIR →</span></div>
              <div style={{marginTop:6,fontSize:13,color:"#687b91"}}>{x.state_name}</div>
              <div style={{marginTop:14,fontSize:25,fontWeight:900,color:"#1675d1"}}>{x.instructor_count}</div>
              <small style={{color:"#687b91"}}>instrutor(es)</small>
            </button>)}
          </div>
          {!ufs.length && <div style={{...card,marginTop:18}}>Nenhum instrutor cadastrado foi encontrado.</div>}
        </> : <>
          <div style={{display:"flex",alignItems:"center",gap:10,marginTop:18,flexWrap:"wrap"}}>
            <button className="link" onClick={()=>{setSelectedUf("");setInstructors([]);setSelected(null);setProfile(null)}}>← VOLTAR PARA ESTADOS</button>
            <span style={{color:"#9aa9b8"}}>/</span><strong>{selectedUf} — {currentState}</strong>
          </div>

          <div style={{...card,marginTop:14,display:"flex",justifyContent:"space-between",gap:14,alignItems:"center",flexWrap:"wrap"}}>
            <div><div className="eyebrow">UF SELECIONADA</div><h2 style={{margin:"3px 0",color:"#17315d"}}>{currentState} ({selectedUf})</h2><small style={{color:"#687b91"}}>{instructors.length} instrutor(es) carregado(s)</small></div>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Pesquisar nome, e-mail, cidade..." style={{width:"min(420px,100%)",minHeight:46,padding:"12px 14px",border:"1px solid #d5e0eb",borderRadius:11}} />
          </div>

          <div style={{display:"grid",gridTemplateColumns:"minmax(0,1fr) 350px",gap:16,marginTop:16,alignItems:"start"}}>
            <div style={{...card,padding:0,overflow:"hidden"}}>
              <div style={{padding:"15px 18px",borderBottom:"1px solid #e5eaf0",fontWeight:900,color:"#17315d"}}>Instrutores cadastrados</div>
              <div style={{overflowX:"auto"}}><table><thead><tr><th>Instrutor</th><th>E-mail</th><th>Cidade</th><th>Credencial</th><th>Categoria</th><th></th></tr></thead><tbody>
                {filtered.map(x=><tr key={x.user_id} onClick={()=>loadProfile(x.user_id)} style={{cursor:"pointer"}}>
                  <td><div style={{display:"flex",alignItems:"center",gap:10}}><span style={{width:34,height:34,borderRadius:"50%",display:"grid",placeItems:"center",background:"#edf5fc",color:"#1675d1",fontWeight:900}}>{initials(x.full_name)}</span><b>{x.full_name||"Sem nome"}</b></div></td>
                  <td>{x.email||"—"}</td><td>{x.acting_city||x.city||"—"}</td><td>{x.credential||"—"}</td><td>{x.category||"—"}</td><td style={{textAlign:"right",color:"#1675d1",fontWeight:800}}>VER →</td>
                </tr>)}
                {!filtered.length&&<tr><td colSpan="6" style={{padding:24,textAlign:"center",color:"#687b91"}}>Nenhum instrutor encontrado.</td></tr>}
              </tbody></table></div>
            </div>

            <div style={{...card,position:"sticky",top:92}}>
              {!selected ? <div style={{padding:"18px 4px",textAlign:"center",color:"#687b91"}}><div style={{fontSize:36,marginBottom:8}}>👤</div><b style={{color:"#17315d"}}>Selecione um instrutor</b><p style={{fontSize:13}}>Clique em uma linha para visualizar o perfil profissional.</p></div> : profile?.profile ? <>
                <div style={{display:"flex",alignItems:"center",gap:12,borderBottom:"1px solid #e6edf4",paddingBottom:16}}><span style={{width:52,height:52,borderRadius:"50%",display:"grid",placeItems:"center",background:"#edf5fc",color:"#1675d1",fontWeight:900,fontSize:18}}>{initials(profile.profile.full_name)}</span><div><h2 style={{margin:0,color:"#17315d",fontSize:19}}>{profile.profile.full_name||"Sem nome"}</h2><small style={{color:"#687b91"}}>{profile.profile.email||"—"}</small></div></div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:16}}>{[["Alunos",profile.students],["Aulas",profile.lessons],["RPA ÚNICO",profile.rpa_reports],["UF",profile.profile.uf]].map(([l,v])=><div key={l} style={{padding:11,border:"1px solid #e4ebf2",borderRadius:10}}><small style={{color:"#687b91"}}>{l}</small><strong style={{display:"block",fontSize:20,color:"#17315d",marginTop:3}}>{v??"—"}</strong></div>)}</div>
                <div style={{marginTop:16}}><Info label="Telefone" value={profile.profile.phone}/><Info label="Cidade de atuação" value={profile.profile.acting_city||profile.profile.city}/><Info label="Credencial" value={profile.profile.credential}/><Info label="UF da credencial" value={profile.profile.credential_uf}/><Info label="Categoria" value={profile.profile.category}/><Info label="Tipo de atuação" value={profile.profile.teaching_type||profile.profile.employment_type}/></div>
                {profile.profile.email && <a href={`mailto:${profile.profile.email}`} style={{display:"block",marginTop:16,textAlign:"center",padding:"11px",borderRadius:10,background:"#1675d1",color:"#fff",fontWeight:800,textDecoration:"none"}}>✉ ENVIAR E-MAIL</a>}
              </> : <div>Carregando perfil...</div>}
            </div>
          </div>
        </>}
        {msg && <p className="msg" style={{marginTop:16}}>{msg}</p>}
      </section>
    </main>
  </div>;
}
function Info({label,value}){return <div style={{padding:"8px 0",borderBottom:"1px solid #eef2f6"}}><small style={{display:"block",color:"#687b91"}}>{label}</small><b style={{color:"#17315d"}}>{value||"—"}</b></div>}
createRoot(document.getElementById("root")).render(<React.StrictMode><AdminInstructors/></React.StrictMode>);
