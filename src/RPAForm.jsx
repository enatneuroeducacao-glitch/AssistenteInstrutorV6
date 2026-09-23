import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import "./lib/enatHub";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("pt-BR");
}

export default function RPAForm({ user, onBack }) {
  const [students, setStudents] = useState([]);
  const [reports, setReports] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [lessons, setLessons] = useState([]);
  const [synthesis, setSynthesis] = useState("");
  const [continuityPlan, setContinuityPlan] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function loadRpa() {
    if (!supabase || !user?.id) return;
    setLoading(true);
    setMsg("");

    try {
      const [{ data: studentsData, error: studentsError }, { data: reportsData, error: reportsError }] = await Promise.all([
        supabase
          .from("ai_students")
          .select("id, full_name, category")
          .eq("user_id", user.id)
          .order("full_name"),
        supabase
          .from("ai_rpa_reports")
          .select("*")
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false })
      ]);

      if (studentsError) throw studentsError;
      if (reportsError) throw reportsError;

      setStudents(studentsData || []);
      setReports(reportsData || []);

      const currentStudent = selectedStudentId || (reportsData || [])[0]?.student_id || (studentsData || [])[0]?.id || "";
      setSelectedStudentId(currentStudent);

      if (currentStudent) {
        const { data: lessonsData, error: lessonsError } = await supabase
          .from("ai_lessons")
          .select("id, student_id, lesson_number, status, started_at, ended_at, km_start, km_end, cnh_category, objective, notes, pedagogical_evaluation")
          .eq("user_id", user.id)
          .eq("student_id", currentStudent)
          .order("lesson_number", { ascending: true });
        if (lessonsError) throw lessonsError;
        setLessons((lessonsData || []).filter((item) => String(item.status || "").toLowerCase() !== "exam_scheduled"));

        const report = (reportsData || []).find((item) => String(item.student_id) === String(currentStudent));
        setSynthesis(report?.latest_notes || "");
        setContinuityPlan(report?.continuity_plan || "");
      } else {
        setLessons([]);
      }
    } catch (error) {
      console.error("Erro ao carregar RPA:", error);
      setMsg(error?.message || "Não foi possível carregar o RPA.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRpa();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    const handleRefresh = () => loadRpa();
    window.addEventListener("enat:refresh", handleRefresh);
    return () => window.removeEventListener("enat:refresh", handleRefresh);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, selectedStudentId]);

  useEffect(() => {
    if (!selectedStudentId || !reports.length) return;
    const report = reports.find((item) => String(item.student_id) === String(selectedStudentId));
    setSynthesis(report?.latest_notes || "");
    setContinuityPlan(report?.continuity_plan || "");
  }, [selectedStudentId, reports]);

  async function changeStudent(value) {
    setSelectedStudentId(value);
    if (!supabase || !value) {
      setLessons([]);
      return;
    }

    const { data, error } = await supabase
      .from("ai_lessons")
      .select("id, student_id, lesson_number, status, started_at, ended_at, km_start, km_end, cnh_category, objective, notes, pedagogical_evaluation")
      .eq("user_id", user.id)
      .eq("student_id", value)
      .order("lesson_number", { ascending: true });

    if (error) {
      setMsg(error.message);
      return;
    }
    setLessons((data || []).filter((item) => String(item.status || "").toLowerCase() !== "exam_scheduled"));
  }

  const report = reports.find((item) => String(item.student_id) === String(selectedStudentId));
  const student = students.find((item) => String(item.id) === String(selectedStudentId));
  const firstLesson = lessons[0];
  const latestLesson = lessons[lessons.length - 1];

  async function saveRpaNotes() {
    if (!selectedStudentId) {
      setMsg("Selecione um aluno com RPA iniciado pela primeira aula.");
      return;
    }
    if (!report) {
      setMsg("O RPA ainda não foi iniciado. Inicie a primeira aula deste aluno para criar a linha de base.");
      return;
    }

    setSaving(true);
    setMsg("");
    try {
      const { error } = await supabase
        .from("ai_rpa_reports")
        .update({
          latest_notes: synthesis.trim() || null,
          continuity_plan: continuityPlan.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq("id", report.id)
        .eq("user_id", user.id);

      if (error) throw error;
      setMsg("RPA atualizado com sucesso.");
      await loadRpa();
    } catch (error) {
      console.error(error);
      setMsg(error?.message || "Não foi possível atualizar o RPA.");
    } finally {
      setSaving(false);
    }
  }

  function printRpa() {
    window.print();
  }

  if (loading) {
    return <div className="panel"><h1>RPA ÚNICO</h1><p>Carregando dados do RPA...</p></div>;
  }

  const card = {
    border: "1px solid #dce5ef",
    borderRadius: "12px",
    background: "#fff",
    padding: "14px 16px"
  };
  const muted = { color: "#60738d", fontSize: "12px" };
  const metric = { ...card, padding: "11px 13px" };

  return (
    <div className="app">
      <main>
        <header style={{ marginBottom: "10px" }}>
          <div>
            <small style={{ color: "#5b7696", fontWeight: 800, letterSpacing: ".06em" }}>RPA / ACOMPANHAMENTO</small>
            <h1 style={{ margin: "3px 0" }}>RPA Único</h1>
            <small>Relatório Psicométrico de Aulas — evolução do aluno desde a 1ª aula</small>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button type="button" onClick={loadRpa}>↻ ATUALIZAR</button>
            <button type="button" onClick={onBack}>VOLTAR</button>
          </div>
        </header>

        <section style={{ ...card, marginBottom: "10px", display: "flex", gap: "14px", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 320px" }}>
            <small style={muted}>ALUNO</small>
            <select style={{ marginTop: "5px" }} value={selectedStudentId} onChange={(e) => changeStudent(e.target.value)}>
              <option value="">Selecione o aluno</option>
              {students.map((item) => (
                <option key={item.id} value={item.id}>{item.full_name}{item.category ? ` — CNH ${item.category}` : ""}</option>
              ))}
            </select>
          </div>
          {student && (
            <div style={{ ...metric, minWidth: "150px" }}>
              <small style={muted}>STATUS RPA</small>
              <strong style={{ display: "block", marginTop: "4px" }}>{report?.status || "NÃO INICIADO"}</strong>
            </div>
          )}
          {student && report && (
            <div style={{ ...metric, minWidth: "130px" }}>
              <small style={muted}>HSI-DOTH-P</small>
              <strong style={{ display: "block", marginTop: "4px" }}>{report.latest_hsi_score != null ? `${Number(report.latest_hsi_score).toFixed(1)} / 100` : "—"}</strong>
            </div>
          )}
        </section>

        {!student && (
          <section style={{ ...card }}>
            <strong>Nenhum aluno selecionado</strong>
            <p style={{ ...muted, marginBottom: 0 }}>Cadastre um aluno e inicie a primeira aula para começar a alimentar o RPA.</p>
          </section>
        )}

        {student && (
          <>
            {!report ? (
              <section style={{ ...card, marginBottom: "10px", background: "#fffaf0", borderColor: "#f2d38b" }}>
                <strong>RPA ainda não iniciado</strong>
                <p style={{ ...muted, marginBottom: 0 }}>Inicie a primeira aula de {student.full_name} para criar automaticamente a linha de base.</p>
              </section>
            ) : (
              <>
                <section style={{ marginBottom: "10px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "8px" }}>
                    <div style={metric}><small style={muted}>AULAS</small><strong style={{ display: "block", fontSize: "19px", marginTop: "3px" }}>{lessons.length}</strong></div>
                    <div style={metric}><small style={muted}>ÚLTIMA AULA</small><strong style={{ display: "block", fontSize: "19px", marginTop: "3px" }}>{latestLesson?.lesson_number || "—"}</strong></div>
                    <div style={metric}><small style={muted}>QUALIDADE</small><strong style={{ display: "block", fontSize: "19px", marginTop: "3px" }}>{report.latest_quality_score != null ? `${Number(report.latest_quality_score).toFixed(1)}%` : "—"}</strong></div>
                    <div style={metric}><small style={muted}>MÉDIA ANDRAGÓGICA</small><strong style={{ display: "block", fontSize: "19px", marginTop: "3px" }}>{report.latest_average != null ? `${Number(report.latest_average).toFixed(2)}/5` : "—"}</strong></div>
                  </div>
                </section>

                <section style={{ ...card, marginBottom: "10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                    <div>
                      <small style={{ color: "#5b7696", fontWeight: 800 }}>LINHA DE BASE</small>
                      <h2 style={{ margin: "3px 0", fontSize: "18px" }}>1ª aula</h2>
                    </div>
                    <span style={{ ...muted }}>Início: {formatDate(report.baseline_at)}</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "8px" }}>
                    <div style={metric}><small style={muted}>CNH</small><strong style={{ display: "block", marginTop: "3px" }}>{report.baseline_cnh_category || student.category || "—"}</strong></div>
                    <div style={metric}><small style={muted}>KM INICIAL</small><strong style={{ display: "block", marginTop: "3px" }}>{report.baseline_km_start ?? "—"}</strong></div>
                    <div style={metric}><small style={muted}>OBJETIVO</small><strong style={{ display: "block", marginTop: "3px" }}>{report.baseline_objective || "—"}</strong></div>
                  </div>
                </section>

                <section style={{ ...card, marginBottom: "10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <div>
                      <small style={{ color: "#5b7696", fontWeight: 800 }}>EVOLUÇÃO</small>
                      <h2 style={{ margin: "3px 0", fontSize: "18px" }}>Histórico das aulas</h2>
                    </div>
                    <span style={muted}>{lessons.length} registro(s)</span>
                  </div>
                  {lessons.length ? (
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                        <thead><tr><th style={{ textAlign: "left", padding: "7px" }}>Aula</th><th style={{ textAlign: "left", padding: "7px" }}>Data</th><th style={{ textAlign: "left", padding: "7px" }}>CNH</th><th style={{ textAlign: "left", padding: "7px" }}>KM</th><th style={{ textAlign: "left", padding: "7px" }}>Status</th></tr></thead>
                        <tbody>{lessons.map((item) => (
                          <tr key={item.id}>
                            <td style={{ padding: "7px", borderTop: "1px solid #edf0f4" }}>{item.lesson_number || "—"}</td>
                            <td style={{ padding: "7px", borderTop: "1px solid #edf0f4" }}>{formatDate(item.started_at)}</td>
                            <td style={{ padding: "7px", borderTop: "1px solid #edf0f4" }}>{item.cnh_category || student.category || "—"}</td>
                            <td style={{ padding: "7px", borderTop: "1px solid #edf0f4" }}>{item.km_start ?? "—"}{item.km_end != null ? ` → ${item.km_end}` : ""}</td>
                            <td style={{ padding: "7px", borderTop: "1px solid #edf0f4" }}>{item.status}</td>
                          </tr>
                        ))}</tbody>
                      </table>
                    </div>
                  ) : <p style={muted}>Nenhuma aula registrada.</p>}
                </section>

                <section style={{ ...card, marginBottom: "10px" }}>
                  <div style={{ marginBottom: "10px" }}>
                    <small style={{ color: "#5b7696", fontWeight: 800 }}>ANÁLISE</small>
                    <h2 style={{ margin: "3px 0", fontSize: "18px" }}>Síntese e continuidade</h2>
                  </div>
                  {report.latest_evaluation && (
                    <div style={{ ...metric, marginBottom: "9px" }}>
                      <strong>Última avaliação</strong>
                      <span style={{ ...muted, marginLeft: "8px" }}>{report.latest_evaluation.classification?.label || "Avaliação registrada"} — média {report.latest_average ?? "—"}/5</span>
                    </div>
                  )}
                  <label>Síntese / observações
                    <textarea rows="4" value={synthesis} onChange={(e) => setSynthesis(e.target.value)} placeholder="Complemento da síntese do acompanhamento." />
                  </label>
                  <label style={{ marginTop: "9px" }}>Plano de continuidade
                    <div style={{ minHeight: "80px", marginTop: "5px", padding: "11px 13px", border: "1px solid #d8e4f4", borderRadius: "10px", background: "#f7faff", color: "#243b5a", fontSize: "13px", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
                      {continuityPlan || "Plano de continuidade ainda não gerado."}
                    </div>
                  </label>
                  <div style={{ marginTop: "11px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <button type="button" onClick={saveRpaNotes} disabled={saving || !report}>{saving ? "SALVANDO..." : "SALVAR RPA"}</button>
                    <button type="button" onClick={printRpa}>IMPRIMIR / PDF</button>
                  </div>
                  {msg && <p className="msg" style={{ marginTop: "9px" }}>{msg}</p>}
                </section>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
