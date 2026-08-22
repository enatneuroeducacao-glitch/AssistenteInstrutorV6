import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

export default function RPAForm({ user, onBack }) {
  const [studentId, setStudentId] = useState("");
  const [lessonId, setLessonId] = useState("");
  const [synthesis, setSynthesis] = useState("");
  const [continuityPlan, setContinuityPlan] = useState("");
  const [qualityScore, setQualityScore] = useState("");
  const [hsiScore, setHsiScore] = useState("");
  const [msg, setMsg] = useState("");

  async function saveRpa() {
    setMsg("");

    if (!studentId) {
      setMsg("Informe o aluno.");
      return;
    }

    const { error } = await supabase
      .from("ai_rpa_reports")
      .insert({
        user_id: user.id,
        student_id: studentId,
        lesson_id: lessonId || null,
        synthesis: synthesis || null,
        continuity_plan: continuityPlan || null,
        quality_score: qualityScore ? Number(qualityScore) : null,
        hsi_score: hsiScore ? Number(hsiScore) : null
      });

    if (error) {
      console.error(error);
      setMsg(error.message);
      return;
    }

    setMsg("RPA registrado com sucesso.");
  }

  function printRpa() {
    window.print();
  }

  return (
    <div className="app">
      <main>
        <header>
          <div>
            <h1>RPA ÚNICO</h1>
            <small>
              Relatório Psicométrico de Aulas
            </small>
          </div>
        </header>

        <section className="panel">
          <h2>Ficha de acompanhamento da aula</h2>

          <p>
            Preencha esta ficha durante o processo de aula.
            O formulário também pode ser impresso para utilização em papel.
          </p>

          <label>Aluno</label>
          <input
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            placeholder="ID do aluno"
          />

          <label>ID da aula</label>
          <input
            value={lessonId}
            onChange={(e) => setLessonId(e.target.value)}
            placeholder="ID da aula, se houver"
          />

          <h3>Observação do instrutor</h3>

          <label>Síntese da aula</label>
          <textarea
            rows="6"
            value={synthesis}
            onChange={(e) => setSynthesis(e.target.value)}
            placeholder="Registre os principais comportamentos observados..."
          />

          <label>Plano de continuidade</label>
          <textarea
            rows="6"
            value={continuityPlan}
            onChange={(e) => setContinuityPlan(e.target.value)}
            placeholder="Registre os pontos que deverão ser trabalhados nas próximas aulas..."
          />

          <h3>Indicadores</h3>

          <label>Qualidade da aula</label>
          <input
            type="number"
            min="0"
            max="100"
            value={qualityScore}
            onChange={(e) => setQualityScore(e.target.value)}
            placeholder="0 a 100"
          />

          <label>HSI-DOTH-P</label>
          <input
            type="number"
            min="0"
            max="100"
            value={hsiScore}
            onChange={(e) => setHsiScore(e.target.value)}
            placeholder="0 a 100"
          />

          <div style={{ marginTop: "20px" }}>
            <button type="button" onClick={saveRpa}>
              SALVAR RPA
            </button>

            <button
              type="button"
              onClick={printRpa}
              style={{ marginLeft: "10px" }}
            >
              IMPRIMIR / GERAR PDF
            </button>

            <button
              type="button"
              onClick={onBack}
              style={{ marginLeft: "10px" }}
            >
              VOLTAR
            </button>
          </div>

          {msg && (
            <p className="msg" style={{ marginTop: "20px" }}>
              {msg}
            </p>
          )}
        </section>
      </main>
    </div>
  );
}