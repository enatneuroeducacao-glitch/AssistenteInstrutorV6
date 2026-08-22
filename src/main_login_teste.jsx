import React,{useEffect,useState} from "react";
import {createRoot} from "react-dom/client";
import {createClient} from "@supabase/supabase-js";
import "./style.css";
const url=import.meta.env.VITE_SUPABASE_URL, key=import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase=createClient(url,key);

function Auth({onAuth}) {
 const [mode,setMode]=useState("login"),[email,setEmail]=useState(""),[pass,setPass]=useState(""),[name,setName]=useState(""),[msg,setMsg]=useState("");
 async function go(e){e.preventDefault();setMsg("");
  if(mode==="login"){const {data,error}=await supabase.auth.signInWithPassword({email,password:pass}); if(error)setMsg(error.message); else onAuth(data.user);}
  else {const {data,error}=await supabase.auth.signUp({email,password:pass,options:{data:{full_name:name}}}); if(error)setMsg(error.message); else {setMsg("Cadastro criado. Verifique o e-mail se a confirmação estiver ativada."); if(data.user)onAuth(data.user);}}
 }
 return <div className="auth"><div className="brand">ASSISTENTE <span>DO INSTRUTOR</span></div><div className="card">
  <h1>{mode==="login"?"Entrar":"Criar minha conta"}</h1>{mode==="signup"&&<input placeholder="Nome completo" value={name} onChange={e=>setName(e.target.value)}/>}
  <input placeholder="E-mail" type="email" value={email} onChange={e=>setEmail(e.target.value)}/>
  <input placeholder="Senha" type="password" value={pass} onChange={e=>setPass(e.target.value)}/>
  <button onClick={go}>{mode==="login"?"ENTRAR":"CRIAR CONTA"}</button>
  <button className="link" onClick={()=>setMode(mode==="login"?"signup":"login")}>{mode==="login"?"Ainda não sou assinante":"Já tenho conta"}</button>
  {msg&&<p className="msg">{msg}</p>}
 </div></div>
}

const phases=["Preparação","Desenvolvimento","Parada segura","Avaliação","Concluída"];
function App({user}) {
 const [tab,setTab]=useState("dashboard"),[students,setStudents]=useState([]),[profile,setProfile]=useState(null),[plans,setPlans]=useState([]),[lessons,setLessons]=useState([]);
 const load=async()=>{const uid=user.id;
  const [p,s,l,pl]=await Promise.all([supabase.from("ai_profiles").select("*").eq("id",uid).maybeSingle(),supabase.from("ai_students").select("*").order("created_at",{ascending:false}),supabase.from("ai_lessons").select("*").order("created_at",{ascending:false}),supabase.from("ai_plans").select("*").eq("active",true).order("price_cents")]);
  setProfile(p.data);setStudents(s.data||[]);setLessons(l.data||[]);setPlans(pl.data||[]);
 };
 useEffect(()=>{load()},[]);
 const rec=0,desp=0,qual=lessons.length?lessons.reduce((a,l)=>a+(["pontualidade","planejamento","seguranca","comunicacao","didatica","adaptacao","execucao","evolucao","registro","feedback"].reduce((x,k)=>x+(Number(l[k])||0),0)/10),0)/lessons.length:0;
 const finance=rec?Math.max(0,Math.min(100,(rec-desp)/rec*100)):0, geral=qual*.6+finance*.4;
 async function logout(){await supabase.auth.signOut();}
 return <div className="app"><aside><div className="brand small">AI <span>INSTRUTOR</span></div>{["dashboard","alunos","aulas","hsi","financeiro","custos","rpa","assinatura","perfil"].map(x=><button className={tab===x?"nav active":"nav"} onClick={()=>setTab(x)}>{x.toUpperCase()}</button>)}<button className="nav logout" onClick={logout}>SAIR</button></aside>
 <main><header><div><b>{profile?.full_name||user.email}</b><small>Assistente do Instrutor V7 Comercial</small></div><span className="pill">ONLINE</span></header>
 {tab==="dashboard"&&<Dashboard students={students} lessons={lessons} qual={qual} finance={finance} geral={geral}/>}
 {tab==="alunos"&&<Students user={user} students={students} reload={load}/>}
 {tab==="aulas"&&<Lessons user={user} students={students} reload={load}/>}
 {tab==="assinatura"&&<Plans plans={plans}/>}
 {tab==="perfil"&&<Profile user={user} profile={profile} reload={load}/>}
 {tab!=="dashboard"&&!["alunos","aulas","assinatura","perfil"].includes(tab)&&<Placeholder title={tab}/>}
 </main></div>
}
function Dashboard({students,lessons,qual,finance,geral}){return <section><h1>Dashboard</h1><div className="grid">{[["Alunos",students.length],["Aulas",lessons.length],["Qualidade das aulas",qual.toFixed(1)+"%"],["Qualidade financeira",finance.toFixed(1)+"%"],["Índice geral",geral.toFixed(1)+"%"]].map(x=><div className="metric"><small>{x[0]}</small><strong>{x[1]}</strong></div>)}</div><div className="panel"><h2>Fluxo profissional</h2><p>Aluno → Aula → Avaliação → HSI → Custo → Resultado → RPA ÚNICO</p><div className="phases">{phases.map((p,i)=><div><b>{i+1}</b>{p}</div>)}</div></div></section>}
function Students({user,students,reload}){const[n,setN]=useState(""),[cat,setCat]=useState("");
 async function add(){if(!n)return;await supabase.from("ai_students").insert({user_id:user.id,full_name:n,category:cat});setN("");setCat("");reload()}
 return <section><h1>Alunos</h1><div className="panel row"><input placeholder="Nome completo" value={n} onChange={e=>setN(e.target.value)}/><input placeholder="Categoria" value={cat} onChange={e=>setCat(e.target.value)}/><button onClick={add}>ADICIONAR</button></div><div className="panel"><table><thead><tr><th>Aluno</th><th>Categoria</th><th>Meta</th></tr></thead><tbody>{students.map(s=><tr><td>{s.full_name}</td><td>{s.category||"-"}</td><td>{s.lesson_goal||"-"}</td></tr>)}</tbody></table></div></section>}
function Lessons({user,students,reload}){const[student,setStudent]=useState(""),[km,setKm]=useState(""),[obj,setObj]=useState(""),[phase,setPhase]=useState(1),[running,setRunning]=useState(false);
 async function start(){if(!student||running)return;await supabase.from("ai_lessons").insert({user_id:user.id,student_id:student,status:"running",phase:1,km_start:Number(km),objective:obj});setRunning(true);reload()}
 async function advance(){if(phase<5){setPhase(phase+1); if(student)await supabase.from("ai_lessons").update({phase:phase+1}).eq("user_id",user.id).eq("student_id",student).eq("status","running")}}
 async function finish(){const kmend=prompt("KM final");if(kmend===null)return;await supabase.from("ai_lessons").update({phase:5,status:"completed",ended_at:new Date().toISOString(),km_end:Number(kmend)}).eq("user_id",user.id).eq("student_id",student).eq("status","running");setRunning(false);setPhase(1);reload()}
 return <section><h1>Nova aula</h1><div className="panel"><select value={student} onChange={e=>setStudent(e.target.value)}><option value="">Selecione o aluno</option>{students.map(s=><option value={s.id}>{s.full_name}</option>)}</select><input placeholder="KM inicial" value={km} onChange={e=>setKm(e.target.value)}/><input placeholder="Objetivo" value={obj} onChange={e=>setObj(e.target.value)}/><button onClick={start} disabled={running}>▶ INICIAR AULA</button></div><div className="panel"><h2>Estado da aula</h2>{phases.map((p,i)=><div className={i+1<phase?"phase done":i+1===phase?"phase current":"phase"}>{i+1}. {p}</div>)}<div className="row"><button onClick={advance}>AVANÇAR</button><button onClick={()=>setPhase(3)}>PARADA SEGURA</button><button onClick={finish}>CONCLUIR</button></div></div></section>}
function Plans({plans}){
 const [busy,setBusy]=useState(false);
 async function buy(){
  setBusy(true);
  const {data:{session}}=await supabase.auth.getSession();
  const {data,error}=await supabase.functions.invoke("create-subscription",{body:{product_code:"assistant_v1"},headers:{Authorization:`Bearer ${session?.access_token}`}});
  setBusy(false);
  if(error||!data?.init_point){alert(error?.message||data?.error||"Não foi possível iniciar o pagamento.");return;}
  window.location.href=data.init_point;
 }
 return <section><h1>Comprar licença</h1>
  <div className="panel"><h2>Assistente do Instrutor — V1.0</h2>
   <div className="price">R$ 50,00</div>
   <p>Pagamento único. Licença permanente da versão adquirida.</p>
   <ul><li>Uso em 1 computador</li><li>Cadastro do instrutor e alunos</li><li>Registro e avaliação de aulas</li><li>HSI-DOTH-P</li><li>Financeiro e custos</li><li>RPA ÚNICO</li><li>Dashboard e indicadores</li></ul>
   <p className="muted">Atualizações futuras não estão incluídas e poderão ser adquiridas separadamente.</p>
   <button onClick={buy} disabled={busy}>{busy?"ABRINDO CHECKOUT...":"COMPRAR POR R$ 50,00"}</button>
  </div>
 </section>
}
function Profile({user,profile,reload}){const[n,setN]=useState(profile?.full_name||"");async function save(){await supabase.from("ai_profiles").update({full_name:n}).eq("id",user.id);reload()}return <section><h1>Meu cadastro</h1><div className="panel"><label>Nome completo</label><input value={n} onChange={e=>setN(e.target.value)}/><label>E-mail</label><input value={user.email||""} disabled/><button onClick={save}>SALVAR</button></div></section>}
function Placeholder({title}){return <section><h1>{title}</h1><div className="panel"><h2>Módulo preparado</h2><p>Este módulo faz parte da V7 comercial e será conectado às tabelas Supabase já criadas.</p></div></section>}
function Root(){const[u,setU]=useState(null);useEffect(()=>{supabase.auth.getSession().then(({data})=>setU(data.session?.user||null));const {data}=supabase.auth.onAuthStateChange((_e,s)=>setU(s?.user||null));return()=>data.subscription.unsubscribe()},[]);return u?<App user={u}/>:<Auth onAuth={setU}/>};createRoot(document.getElementById("root")).render(<Root/>);