import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = url && key ? createClient(url, key) : null;

function PredictiveCard({ data, onClose }) {
  const risk = String(data?.riskLevel || "").toLowerCase();
  const riskColor = risk.includes("alto") || risk.includes("crítico") ? "#b71c1c" : risk.includes("moder") ? "#8a5a00" : "#1b5e20";

  return (
    <div style={{
      position: "fixed", right: 18, bottom: 18, zIndex: 99999, width: "min(390px, calc(100vw - 36px))",
      background: "#07101b", color: "#fff", border: "1px solid rgba(85,191,239,.45)",
      borderRadius: 16, boxShadow: "0 18px 45px rgba(0,0,0,.35)", padding: 18,
      fontFamily: "Arial, sans-serif", boxSizing: "border-box"
    }}>
      <div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"flex-start"}}>
        <div>
          <div style={{fontSize:11,fontWeight:800,letterSpacing:".08em",color:"#55BFEF"}}>ENAT • INTELIGÊNCIA PREDITIVA</div>
          <div style={{fontSize:20,fontWeight:900,marginTop:5}}>IA Preditiva do Instrutor</div>
        </div>
        <button onClick={onClose} style={{background:"transparent",border:0,color:"#fff",fontSize:18,cursor:"pointer"}}>×</button>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginTop:14}}>
        <div style={{background:"rgba(255,255,255,.06)",padding:10,borderRadius:10}}><small>HSI ATUAL</small><strong style={{display:"block",fontSize:20,marginTop:4}}>{data.hsi ?? "—"}</strong></div>
        <div style={{background:"rgba(255,255,255,.06)",padding:10,borderRadius:10}}><small>PROJETADO</small><strong style={{display:"block",fontSize:20,marginTop:4}}>{data.projectedHsi ?? "—"}</strong></div>
        <div style={{background:"rgba(255,255,255,.06)",padding:10,borderRadius:10}}><small>RISCO</small><strong style={{display:"block",fontSize:16,marginTop:7,color:riskColor}}>{data.riskLevel || "—"}</strong></div>
      </div>

      <div style={{marginTop:12,padding:12,borderRadius:10,background:"rgba(85,191,239,.08)"}}>
        <div style={{fontSize:11,opacity:.7}}>TENDÊNCIA</div>
        <div style={{fontWeight:800,marginTop:3}}>{data.trend || "Aguardando histórico"}</div>
      </div>

      {data.factors?.length > 0 && <div style={{marginTop:12}}><div style={{fontSize:11,fontWeight:800,opacity:.7}}>PRINCIPAIS FATORES</div><div style={{marginTop:6,lineHeight:1.6}}>{data.factors.slice(0,3).map((f,i)=><div key={i}>• {typeof f === "string" ? f : f.label || f.factor || JSON.stringify(f)}</div>)}</div></div>}
      {data.recommendations?.length > 0 && <div style={{marginTop:12}}><div style={{fontSize:11,fontWeight:800,opacity:.7}}>RECOMENDAÇÃO</div><div style={{marginTop:6,lineHeight:1.45}}>{typeof data.recommendations[0] === "string" ? data.recommendations[0] : data.recommendations[0]?.text || JSON.stringify(data.recommendations[0])}</div></div>}
      <div style={{fontSize:10,opacity:.5,marginTop:12}}>Modelo experimental — tendência de risco comportamental; não prevê acidentes nem constitui diagnóstico clínico.</div>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [data, setData] = useState(null);
  const [closed, setClosed] = useState(false);

  async function load(userId) {
    if (!supabase || !userId) return;
    const { data: students } = await supabase.from("ai_students").select("id").eq("user_id", userId).limit(100);
    const ids = (students || []).map(s => s.id).filter(Boolean);
    if (!ids.length) { setData(null); return; }
    const { data: prediction } = await supabase.from("hsi_predictive_predictions").select("hsi_current,hsi_projected,risk_score,risk_level,trend,top_factors,recommendations,created_at").in("subject_id", ids).order("created_at", { ascending:false }).limit(1).maybeSingle();
    if (prediction) setData({ hsi: prediction.hsi_current, projectedHsi: prediction.hsi_projected, riskLevel: prediction.risk_level, riskScore: prediction.risk_score, trend: prediction.trend, factors: prediction.top_factors || [], recommendations: prediction.recommendations || [] });
  }

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => { setUser(data?.session?.user || null); if (data?.session?.user) load(data.session.user.id); });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => { setUser(session?.user || null); if (session?.user) { setClosed(false); load(session.user.id); } else setData(null); });
    return () => listener?.subscription?.unsubscribe();
  }, []);

  if (!user || closed || !data) return null;
  return <PredictiveCard data={data} onClose={() => setClosed(true)} />;
}

const host = document.createElement("div");
host.id = "enat-predictive-ai-overlay";
document.body.appendChild(host);
createRoot(host).render(<App />);
