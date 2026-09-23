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
function parseEvaluationText(value) {
  if (!value) return null;
  const text = String(value).trim();
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace < 0 || lastBrace <= firstBrace) return null;
  try {
    return JSON.parse(text.slice(firstBrace, lastBrace + 1));
  } catch {
    return null;
  }
}

function buildAutomaticSynthesis(lessons, report, student) {
  const completed = (lessons || [])
    .filter((item) => String(item.status || "").toLowerCase() === "completed")
    .sort((a, b) => Number(a.lesson_number || 0) - Number(b.lesson_number || 0));

  const evaluations = completed.map((lesson) => ({
    lesson,
    evaluation: parseEvaluationText(lesson.notes || "")
  })).filter((item) => item.evaluation);

  const latest = evaluations[evaluations.length - 1]?.evaluation || report?.latest_evaluation;
  const previous = evaluations.length > 1 ? evaluations[evaluations.length - 2].evaluation : null;

  if (!completed.length && !latest) {
    return "A síntese será gerada automaticamente após a realização das aulas e o registro das avaliações.";
  }

  const first = completed[0];
  const last = completed[completed.length - 1];
  const kmStart = first?.km_start;
  const kmEnd = last?.km_end;
  const kmText = kmStart != null && kmEnd != null
    ? ` O acompanhamento registra evolução de ${kmStart} km para ${kmEnd} km.`
    : "";

  if (!latest) {
    return `${student?.full_name || "O aluno"} possui ${completed.length} aula(s) concluída(s).${kmText} Ainda não há avaliação andragógica registrada para gerar a análise de desenvolvimento.`;
  }

  const label = latest.classification?.label || "Avaliação registrada";
  const average = latest.average != null ? Number(latest.average) : null;
  const averageText = average != null ? `${average.toFixed(1)}/5` : "—";

  let evolution = "Não foi possível comparar a evolução entre aulas porque ainda não há duas avaliações registradas.";
  let instructorGuidance = "";

  if (previous && average != null && previous.average != null) {
    const delta = Number(average) - Number(previous.average);
    const previousText = Number(previous.average).toFixed(1);

    if (delta > 0.09) {
      evolution = `EVOLUÇÃO POSITIVA: a média passou de ${previousText}/5 para ${averageText} (+${delta.toFixed(1)} ponto).`;
    } else if (delta < -0.09) {
      evolution = `REGRESSÃO: a média passou de ${previousText}/5 para ${averageText} (${delta.toFixed(1)} ponto).`;
    } else {
      evolution = `ESTAGNAÇÃO: a média permaneceu praticamente estável em torno de ${averageText}.`;
    }

    const labels = {
      attention: "Atenção",
      risk_perception: "Percepção de risco",
      decision_making: "Tomada de decisão",
      vehicle_control: "Controle do veículo",
      behavior: "Comportamento"
    };
    const changes = Object.keys(labels).map((key) => ({
      label: labels[key],
      delta: Number(latest[key] ?? 0) - Number(previous[key] ?? 0)
    })).filter((item) => item.delta !== 0);

    const declines = changes.filter((item) => item.delta < 0).sort((a, b) => a.delta - b.delta);
    const improvements = changes.filter((item) => item.delta > 0).sort((a, b) => b.delta - a.delta);

    if (delta < -0.09) {
      const observed = declines.length
        ? declines.slice(0, 3).map((item) => `${item.label} (${item.delta.toFixed(0)})`).join(", ")
        : "os fatores avaliados";
      instructorGuidance = `Na próxima aula, observar especialmente ${observed}, procurando identificar se a queda ocorreu por dificuldade técnica, tomada de decisão, atenção ao ambiente ou autorregulação antes de aumentar a complexidade da atividade.`;
    } else if (Math.abs(delta) <= 0.09) {
      const persistent = (latest.development || latest.priorities || [])
        .slice(0, 3)
        .map((item) => item.label || item.key)
        .join(", ");
      instructorGuidance = `Na próxima aula, observar a consolidação de ${persistent || "os fatores com menor desempenho"}, utilizando situações graduais e verificando se o desempenho se mantém estável antes de avançar a complexidade.`;
    } else if (declines.length) {
      instructorGuidance = `Apesar da evolução geral, observar na próxima aula ${declines.slice(0, 2).map((item) => item.label).join(" e ")}, que apresentaram queda na comparação com a aula anterior.`;
    } else {
      instructorGuidance = improvements.length
        ? `Na próxima aula, confirmar a consolidação dos ganhos observados, especialmente em ${improvements.slice(0, 3).map((item) => item.label).join(", ")}.`
        : "Na próxima aula, confirmar a manutenção do desempenho e avançar gradualmente a complexidade das situações.";
    }
  }

  const strengths = Array.isArray(latest.strengths) && latest.strengths.length
    ? latest.strengths.map((x) => `${x.label || x.key} (${x.score}/5)`).join(", ")
    : "nenhum ponto forte destacado";
  const priorities = Array.isArray(latest.priorities) && latest.priorities.length
    ? latest.priorities.map((x) => `${x.label || x.key} (${x.score}/5)`).join(", ")
    : "nenhuma prioridade específica registrada";

  return `${student?.full_name || "O aluno"} concluiu ${completed.length} aula(s) no acompanhamento.${kmText} ${evolution} Na avaliação mais recente, apresenta classificação ${label}, com média ${averageText}. Ponto forte: ${strengths}. Prioridades de desenvolvimento: ${priorities}. ${instructorGuidance || "A evolução será comparada automaticamente após a próxima avaliação."}`;
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
        setSynthesis(buildAutomaticSynthesis((lessonsData || []).filter((item) => String(item.status || "").toLowerCase() !== "exam_scheduled"), report, studentsData?.find((item) => String(item.id) === String(currentStudent))));
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
    setSynthesis(buildAutomaticSynthesis(lessons, report, student));
    setContinuityPlan(report?.continuity_plan || "");
  }, [selectedStudentId, reports, lessons, students]);

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
    padding: "12px 14px"
  };
  const muted = { color: "#60738d", fontSize: "12px" };
  const metric = { ...card, padding: "9px 11px" };

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
            <div style={{ ...metric, minWidth: "145px", padding: "10px 12px" }}>
              <small style={muted}>STATUS RPA</small>
              <strong style={{ display: "block", marginTop: "4px" }}>{report?.status || "NÃO INICIADO"}</strong>
            </div>
          )}
          {student && report && (
            <div style={{ ...metric, minWidth: "125px", padding: "10px 12px" }}>
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
                            <td style={{ padding: "7px", borderTop: "1px solid #edf0f4" }}>{String(item.status || "").toLowerCase() === "completed" ? "Concluída" : String(item.status || "").toLowerCase() === "running" ? "Em andamento" : String(item.status || "").toLowerCase() === "paused" ? "Pausada" : (item.status || "—")}</td>
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
                    <div style={{ ...metric, marginBottom: "10px", background: "#f7faff" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                        <strong>Última avaliação</strong>
                        <span style={{ ...muted }}>{report.latest_evaluation.classification?.label || "Avaliação registrada"} · média {report.latest_average ?? "—"}/5</span>
                      </div>
                    </div>
                  )}
                  <div style={{ display: "block" }}><span style={{ fontWeight: 800, color: "#18375d" }}>Síntese automática do acompanhamento</span><small style={{ ...muted, display: "block", marginTop: "3px" }}>Gerada automaticamente a partir das aulas concluídas e da avaliação mais recente.</small>
                    <div style={{ marginTop: "7px", padding: "12px 14px", border: "1px solid #d8e4f4", borderRadius: "10px", background: "#f7faff", color: "#243b5a", fontSize: "13px", lineHeight: 1.55 }}>{synthesis}</div>
                  </div>
                  <label style={{ display: "block", marginTop: "12px" }}><span style={{ fontWeight: 800, color: "#18375d" }}>Próximas ações</span>
                    <div style={{ minHeight: "76px", width: "100%", boxSizing: "border-box", marginTop: "5px", padding: "10px 12px", border: "1px solid #d8e4f4", borderRadius: "10px", background: "#f7faff", color: "#243b5a", fontSize: "13px", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
                      {continuityPlan || "Plano de continuidade ainda não gerado."}
                    </div>
                  </label>
                  <div style={{ marginTop: "11px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <button type="button" onClick={loadRpa}>↻ ATUALIZAR DADOS</button>
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
