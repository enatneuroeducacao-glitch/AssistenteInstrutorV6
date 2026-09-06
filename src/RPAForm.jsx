import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { syncCompletedHSILesson } from "./lib/enatHub";

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
          .select("id, full_name, category, birth_date")
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
          .select("id, student_id, lesson_number, status, started_at, ended_at, km_start, km_end, cnh_category, objective, notes, pedagogical_evaluation, uf, municipality_code")
          .eq("user_id", user.id)
          .eq("student_id", currentStudent)
          .order("lesson_number", { ascending: true });
        if (lessonsError) throw lessonsError;
        const normalizedLessons = (lessonsData || []).filter((item) => String(item.status || "").toLowerCase() !== "exam_scheduled");
        setLessons(normalizedLessons);

        const report = (reportsData || []).find((item) => String(item.student_id) === String(currentStudent));
        setSynthesis(report?.latest_notes || "");
        setContinuityPlan(report?.continuity_plan || "");

        // Phase 2 integration bridge: reconcile completed HSI-DOTH-P lessons with Central.
        // Central idempotency is based on source_system_id + opaque source_record_id.
        const student = (studentsData || []).find((item) => String(item.id) === String(currentStudent));
        for (const lesson of normalizedLessons.filter((item) => String(item.status || "").toLowerCase() === "completed")) {
          try {
            await syncCompletedHSILesson(lesson, {
              studentBirthDate: student?.birth_date || null,
              uf: lesson.uf || null,
              municipalityCode: lesson.municipality_code || null,
            });
          } catch (syncError) {
            // Central availability must never block local NeuroDrive/RPA operation.
            console.warn("Sincronização HSI-DOTH-P com a Central pendente:", syncError);
          }
        }
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
      .select("id, student_id, lesson_number, status, started_at, ended_at, km_start, km_end, cnh_category, objective, notes, pedagogical_evaluation, uf, municipality_code")
      .eq("user_id", user.id)
      .eq("student_id", value)
      .order("lesson_number", { ascending: true });

    if (error) {
      setMsg(error.message);
      return;
    }
    const normalizedLessons = (data || []).filter((item) => String(item.status || "").toLowerCase() !== "exam_scheduled");
    setLessons(normalizedLessons);

    const student = students.find((item) => String(item.id) === String(value));
    for (const lesson of normalizedLessons.filter((item) => String(item.status || "").toLowerCase() === "completed")) {
      try {
        await syncCompletedHSILesson(lesson, {
          studentBirthDate: student?.birth_date || null,
          uf: lesson.uf || null,
          municipalityCode: lesson.municipality_code || null,
        });
      } catch (syncError) {
        console.warn("Sincronização HSI-DOTH-P com a Central pendente:", syncError);
      }
    }
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

  return (
    <div className="app">
      <main>
        <header>
          <div>
            <h1>RPA ÚNICO</h1>
            <small>Relatório Psicométrico de Aulas — acompanhamento desde a 1ª aula</small>
          </div>
          <button type="button" onClick={onBack}>VOLTAR</button>
        </header>

        <section className="panel">
          <h2>1. Seleção do aluno</h2>
          <p>O RPA é criado automaticamente quando a primeira aula é iniciada. Essa primeira aula funciona como linha de base para alimentar a evolução.</p>
          <label>Aluno
            <select value={selectedStudentId} onChange={(e) => changeStudent(e.target.value)}>
              <option value="">Selecione o aluno</option>
              {students.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.full_name}{item.category ? ` — CNH ${item.category}` : ""}
                </option>
              ))}
            </select>
          </label>
        </section>

        {!student && (
          <section className="panel">
            <h2>Nenhum aluno cadastrado</h2>
            <p>Cadastre um aluno e inicie a primeira aula para começar a alimentar o RPA.</p>
          </section>
        )}

        {student && (
          <>
            <section className="panel">
              <h2>2. Linha de base da 1ª aula</h2>
              {!report ? (
                <div style={{ padding: "14px", border: "1px solid #ffe082", borderRadius: "10px", background: "#fff8e1" }}>
                  <strong>RPA ainda não iniciado.</strong>
                  <p style={{ marginBottom: 0 }}>Inicie a primeira aula de {student.full_name} para criar automaticamente o RPA.</p>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "10px" }}>
                  <div><small>STATUS</small><strong style={{ display: "block" }}>{report.status || "EM FORMAÇÃO"}</strong></div>
                  <div><small>AULAS</small><strong style={{ display: "block" }}>{report.total_lessons || 0}</strong></div>
                  <div><small>HSI-DOTH-P</small><strong style={{ display: "block" }}>{report.latest_hsi_score != null ? `${Number(report.latest_hsi_score).toFixed(1)} / 100` : "—"}</strong></div>
                  <div><small>CNH</small><strong style={{ display: "block" }}>{report.baseline_cnh_category || student.category || "—"}</strong></div>
                  <div><small>INÍCIO DA LINHA DE BASE</small><strong style={{ display: "block" }}>{formatDate(report.baseline_at)}</strong></div>
                </div>
              )}

              {report && (
                <div style={{ marginTop: "14px", display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "12px" }}>
                  <div style={{ padding: "12px", border: "1px solid #dfe5ec", borderRadius: "10px" }}>
                    <strong>KM inicial da 1ª aula</strong>
                    <div style={{ marginTop: "6px" }}>{report.baseline_km_start ?? "—"}</div>
                  </div>
                  <div style={{ padding: "12px", border: "1px solid #dfe5ec", borderRadius: "10px" }}>
                    <strong>Objetivo inicial</strong>
                    <div style={{ marginTop: "6px" }}>{report.baseline_objective || "—"}</div>
                  </div>
                </div>
              )}
            </section>

            <section className="panel">
              <h2>3. Evolução das aulas</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "10px" }}>
                <div><small>TOTAL DE AULAS</small><strong style={{ display: "block", fontSize: "20px" }}>{lessons.length}</strong></div>
                <div><small>ÚLTIMA AULA</small><strong style={{ display: "block", fontSize: "20px" }}>{latestLesson?.lesson_number || "—"}</strong></div>
                <div><small>QUALIDADE</small><strong style={{ display: "block", fontSize: "20px" }}>{report?.latest_quality_score != null ? `${Number(report.latest_quality_score).toFixed(1)}%` : "—"}</strong></div>
                <div><small>MÉDIA ANDRAGÓGICA</small><strong style={{ display: "block", fontSize: "20px" }}>{report?.latest_average != null ? `${Number(report.latest_average).toFixed(2)}/5` : "—"}</strong></div>
              </div>

              {lessons.length > 0 && (
                <div style={{ marginTop: "14px", overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                    <thead><tr><th style={{ textAlign: "left", padding: "8px" }}>Aula</th><th style={{ textAlign: "left", padding: "8px" }}>Data</th><th style={{ textAlign: "left", padding: "8px" }}>CNH</th><th style={{ textAlign: "left", padding: "8px" }}>KM</th><th style={{ textAlign: "left", padding: "8px" }}>Status</th></tr></thead>
                    <tbody>
                      {lessons.map((item) => (
                        <tr key={item.id}>
                          <td style={{ padding: "8px", borderTop: "1px solid #edf0f4" }}>{item.lesson_number || "—"}</td>
                          <td style={{ padding: "8px", borderTop: "1px solid #edf0f4" }}>{formatDate(item.started_at)}</td>
                          <td style={{ padding: "8px", borderTop: "1px solid #edf0f4" }}>{item.cnh_category || student.category || "—"}</td>
                          <td style={{ padding: "8px", borderTop: "1px solid #edf0f4" }}>{item.km_start ?? "—"}{item.km_end != null ? ` → ${item.km_end}` : ""}</td>
                          <td style={{ padding: "8px", borderTop: "1px solid #edf0f4" }}>{item.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="panel">
              <h2>4. Registro complementar do RPA</h2>
              <label>Síntese / observações consolidadas
                <textarea rows="5" value={synthesis} onChange={(e) => setSynthesis(e.target.value)} placeholder="O sistema já alimenta automaticamente o RPA com os dados das aulas. Use este campo para complementar a síntese." />
              </label>
             <div style={{
  marginTop: "10px",
  width: "100%"
}}>
  <label style={{
    display: "block",
    marginBottom: "7px",
    fontWeight: 700,
    color: "#18345f"
  }}>
    Plano de continuidade
  </label>

  <div style={{
    minHeight: "118px",
    padding: "14px 16px",
    border: "1px solid #d8e4f4",
    borderRadius: "10px",
    background: "#f7faff",
    color: "#243b5a",
    fontSize: "13px",
    lineHeight: 1.6,
    whiteSpace: "pre-wrap",
    boxSizing: "border-box"
  }}>
    {continuityPlan || "Plano de continuidade ainda não gerado."}
  </div>
</div>

              {report?.latest_evaluation && (
                <div style={{ padding: "12px", border: "1px solid #dfe5ec", borderRadius: "10px", background: "#fbfcfe" }}>
                  <strong>Última avaliação andragógica</strong>
                  <p style={{ marginBottom: 0 }}>{report.latest_evaluation.classification?.label || "Avaliação registrada"} — média {report.latest_average ?? "—"}/5.</p>
                </div>
              )}

              <div style={{ marginTop: "14px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <button type="button" onClick={saveRpaNotes} disabled={saving || !report}>{saving ? "SALVANDO..." : "ATUALIZAR RPA"}</button>
                <button type="button" onClick={printRpa}>IMPRIMIR / GERAR PDF</button>
                <button type="button" onClick={loadRpa}>ATUALIZAR DADOS</button>
              </div>
              {msg && <p className="msg" style={{ marginTop: "12px" }}>{msg}</p>}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
