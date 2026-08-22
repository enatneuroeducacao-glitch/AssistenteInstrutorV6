import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { createClient } from "@supabase/supabase-js";
import "./style.css";
import RPAForm from "./RPAForm";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

function Auth({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [name, setName] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault(); setMsg("");
    if (!supabase) return setMsg("Supabase não está configurado. Verifique o arquivo .env.");
    if (!email || !pass || (mode === "signup" && !name)) return setMsg("Preencha todos os campos obrigatórios.");
    if (pass.length < 6) return setMsg("A senha deve ter pelo menos 6 caracteres.");
    setBusy(true);
    try {
      if (mode === "login") {
        const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: pass });
        if (error) throw error;
        if (data.user) onAuth(data.user);
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(), password: pass,
          options: { data: { full_name: name.trim() } }
        });
        if (error) throw error;
        if (data.session && data.user) onAuth(data.user);
        else setMsg("Conta criada. Verifique seu e-mail para confirmar o cadastro.");
      }
    } catch (err) {
      console.error("Erro de autenticação:", err); setMsg(err?.message || "Não foi possível concluir.");
    } finally { setBusy(false); }
  }

  async function forgot() {
    if (!supabase) return setMsg("Supabase não está configurado.");
    if (!email) return setMsg("Digite seu e-mail primeiro.");
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: window.location.origin });
      if (error) throw error;
      setMsg("Se o e-mail estiver cadastrado, enviaremos as instruções.");
    } catch (err) { setMsg(err?.message || "Não foi possível enviar o e-mail."); }
  }

  return <div className="auth">
    <div className="brand">ASSISTENTE <span>DO INSTRUTOR</span></div>
    <form className="card" onSubmit={submit}>
      <h1>{mode === "login" ? "Entrar" : "Criar conta"}</h1>
      {mode === "signup" && <input autoFocus placeholder="Nome completo" value={name} onChange={e => setName(e.target.value)} />}
      <input placeholder="E-mail" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} />
      <input placeholder="Senha" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} value={pass} onChange={e => setPass(e.target.value)} />
      <button type="submit" disabled={busy}>{busy ? "AGUARDE..." : mode === "login" ? "ENTRAR" : "CRIAR CONTA"}</button>
      {mode === "login" && <button type="button" className="link" onClick={forgot}>Esqueci minha senha</button>}
      <button type="button" className="link" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setMsg(""); }}>
        {mode === "login" ? "Ainda não tenho cadastro" : "Já tenho uma conta"}
      </button>
      {msg && <p className="msg">{msg}</p>}
    </form>
  </div>;
}
function StudentList({ user, onNewStudent, onSelectStudent }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  async function loadStudents() {
    setLoading(true);
    setMsg("");

    try {
      if (!supabase) {
        throw new Error("Supabase não está configurado.");
      }

      const { data, error } = await supabase
        .from("ai_students")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setStudents(data || []);
    } catch (error) {
      console.error("Erro ao carregar alunos:", error);
      setMsg(error?.message || "Não foi possível carregar os alunos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStudents();
  }, [user.id]);

  return (
    <>
      <div className="panel">
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
          flexWrap: "wrap"
        }}>
          <div>
            <h2>Alunos cadastrados</h2>
            <p>
              Selecione um aluno para utilizar nas próximas etapas.
            </p>
          </div>

          <button onClick={onNewStudent}>
            + NOVO ALUNO
          </button>
        </div>
      </div>

      {loading && (
        <div className="panel">
          <p>Carregando alunos...</p>
        </div>
      )}

      {msg && (
        <div className="panel">
          <p className="msg">{msg}</p>
        </div>
      )}

      {!loading && !msg && students.length === 0 && (
        <div className="panel">
          <h2>Nenhum aluno cadastrado</h2>
          <p>
            Cadastre o primeiro aluno para começar.
          </p>

          <button onClick={onNewStudent}>
            + NOVO ALUNO
          </button>
        </div>
      )}

      {!loading && students.length > 0 && (
        <div className="grid">
          {students.map(student => (
            <div className="panel" key={student.id}>
              <h2>{student.full_name}</h2>

              <p>
                <strong>CPF:</strong>{" "}
                {student.cpf || "Não informado"}
              </p>

              <p>
                <strong>Telefone:</strong>{" "}
                {student.phone || "Não informado"}
              </p>

              <p>
                <strong>Categoria:</strong>{" "}
                {student.category || "Não informada"}
              </p>

              <p>
                <strong>Aulas planejadas:</strong>{" "}
                {student.lesson_goal ?? "Não informado"}
              </p>

              <button
                onClick={() => onSelectStudent(student)}
              >
                SELECIONAR ALUNO
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
function LessonForm({ user, onBack, onStarted }) {
  const [students, setStudents] = useState([]);
  const [vehicles, setVehicles] = useState([]);

  const [studentId, setStudentId] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [kmStart, setKmStart] = useState("");
  const [objective, setObjective] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!supabase) return;

      const { data: studentsData, error: studentsError } =
        await supabase
          .from("ai_students")
          .select("id, full_name")
          .eq("user_id", user.id)
          .order("full_name");

      if (studentsError) {
        console.error(studentsError);
        setMsg("Erro ao carregar alunos.");
        return;
      }

      const { data: vehiclesData, error: vehiclesError } =
        await supabase
          .from("ai_vehicles")
          .select("id, brand, model, plate")
          .eq("user_id", user.id)
          .order("brand");

      if (vehiclesError) {
        console.error(vehiclesError);
        setMsg("Erro ao carregar veículos.");
        return;
      }

      setStudents(studentsData || []);
      setVehicles(vehiclesData || []);
    }

    loadData();
  }, [user]);

  async function startLesson(e) {
    e.preventDefault();
    setMsg("");

    if (!studentId) {
      setMsg("Selecione o aluno.");
      return;
    }

    if (!vehicleId) {
      setMsg("Selecione o veículo.");
      return;
    }

    if (!kmStart) {
      setMsg("Informe a quilometragem inicial.");
      return;
    }

    setBusy(true);

    try {
      const { data, error } = await supabase
        .from("ai_lessons")
        .insert({
          user_id: user.id,
          student_id: studentId,
          vehicle_id: vehicleId,
          started_at: new Date().toISOString(),
          status: "running",
          phase: 1,
          km_start: Number(kmStart),
          objective: objective.trim() || null
        })
        .select()
        .single();

      if (error) throw error;

      console.log("Aula criada:", data);

     setMsg("Aula iniciada com sucesso.");

setTimeout(() => {
  onStarted(data);
}, 500);

    } catch (error) {
      console.error("Erro ao iniciar aula:", error);
      setMsg(error?.message || "Não foi possível iniciar a aula.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h1>Nova Aula</h1>

      <div className="panel">
        <h2>Dados da aula</h2>

        <form onSubmit={startLesson}>

          <label>Aluno</label>

          <select
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
          >
            <option value="">Selecione o aluno</option>

            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.full_name}
              </option>
            ))}
          </select>


          <label>Veículo</label>

          <select
            value={vehicleId}
            onChange={(e) => setVehicleId(e.target.value)}
          >
            <option value="">Selecione o veículo</option>

            {vehicles.map((vehicle) => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.brand} {vehicle.model} — {vehicle.plate}
              </option>
            ))}
          </select>


          <label>KM inicial</label>

          <input
            type="number"
            min="0"
            step="0.1"
            value={kmStart}
            onChange={(e) => setKmStart(e.target.value)}
            placeholder="Ex.: 45230"
          />


          <label>Objetivo da aula</label>

          <textarea
            value={objective}
            onChange={(e) => setObjective(e.target.value)}
            placeholder="Descreva o objetivo desta aula"
          />


          <div style={{ marginTop: "20px" }}>

            <button type="submit" disabled={busy}>
              {busy ? "INICIANDO..." : "INICIAR AULA"}
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
            <p className="msg">
              {msg}
            </p>
          )}

        </form>
      </div>
    </div>
  );
}

const LESSON_PHASES = [
  { id: 1, label: "PREPARAÇÃO" },
  { id: 2, label: "DESLOCAMENTO" },
  { id: 3, label: "DESENVOLVIMENTO" },
  { id: 4, label: "AVALIAÇÃO" },
  { id: 5, label: "PARADA SEGURA" },
];

function lessonPhaseLabel(phase) {
  return LESSON_PHASES.find((item) => item.id === Number(phase))?.label || `FASE ${phase ?? "-"}`;
}

function getLessonPhaseClass(phase, currentPhase, status) {
  const p = Number(phase);
  const current = Number(currentPhase);

  if (status === "completed" || p < current) return "completed";
  if (p === current) return "current";
  return "next";
}


const PEDAGOGICAL_RULES = {
  attention: {
    label: "Atenção",
    recommendations: {
      low: "Reforçar atenção sustentada, seleção de estímulos relevantes e acompanhamento do ambiente durante a condução.",
      mid: "Consolidar atenção sustentada e ampliar gradualmente a complexidade dos estímulos observados.",
      high: "Manter exercícios de atenção e introduzir situações mais complexas para consolidar o desempenho.",
    },
  },
  risk_perception: {
    label: "Percepção de risco",
    recommendations: {
      low: "Priorizar identificação de riscos, antecipação de situações perigosas e leitura preventiva do ambiente.",
      mid: "Reforçar antecipação de riscos e leitura do ambiente em situações progressivamente mais complexas.",
      high: "Manter exercícios de antecipação e ampliar a exposição a cenários variados para consolidar a competência.",
    },
  },
  decision_making: {
    label: "Tomada de decisão",
    recommendations: {
      low: "Trabalhar decisões seguras em situações simples, reforçando análise das alternativas antes da ação.",
      mid: "Praticar tomada de decisão em situações progressivamente mais complexas, mantendo foco em respostas seguras.",
      high: "Consolidar a tomada de decisão com cenários mais complexos e variáveis.",
    },
  },
  vehicle_control: {
    label: "Controle do veículo",
    recommendations: {
      low: "Reforçar controle operacional do veículo em situações de baixa complexidade antes de aumentar a dificuldade.",
      mid: "Reforçar controle operacional e coordenação dos comandos em diferentes situações de condução.",
      high: "Consolidar o controle do veículo em situações variadas e progressivamente mais exigentes.",
    },
  },
  behavior: {
    label: "Comportamento",
    recommendations: {
      low: "Reforçar comportamento preventivo, autorregulação, cumprimento das orientações e responsabilidade durante a condução.",
      mid: "Trabalhar comportamento preventivo e autorregulação, mantendo as orientações de segurança.",
      high: "Consolidar comportamento preventivo e responsável em situações variadas.",
    },
  },
};

function getPedagogicalBand(average) {
  const value = Number(average);
  if (!Number.isFinite(value)) return { key: "incomplete", label: "INCOMPLETA", description: "Avaliação ainda não concluída." };
  if (value < 2) return { key: "critical", label: "CRÍTICO", description: "Necessita intervenção pedagógica prioritária." };
  if (value < 3) return { key: "developing", label: "EM DESENVOLVIMENTO", description: "Necessita reforço dos fatores com menor desempenho." };
  if (value < 3.5) return { key: "adequate", label: "ADEQUADO", description: "Desempenho satisfatório, com pontos a aperfeiçoar." };
  if (value < 4.5) return { key: "good", label: "BOM", description: "Bom domínio, recomendando-se consolidação." };
  return { key: "excellent", label: "EXCELENTE", description: "Desempenho consolidado, recomendando-se manutenção e progressão." };
}

function getScoreBand(score) {
  const value = Number(score);
  if (value < 2) return "low";
  if (value < 4) return "mid";
  return "high";
}

function buildPedagogicalAnalysis(evaluationItems, evaluation) {
  const complete = evaluationItems.every(
    (item) => Number(evaluation[item.key]) >= 1 && Number(evaluation[item.key]) <= 5
  );

  if (!complete) {
    return {
      complete: false,
      average: null,
      classification: getPedagogicalBand(null),
      strengths: [],
      development: [],
      priorities: [],
      diagnosis: "A avaliação pedagógica está incompleta.",
      next_lesson_recommendation: "Concluir os cinco fatores antes de gerar a recomendação para a próxima aula.",
      next_lesson_objective: "Completar a avaliação pedagógica e identificar os principais fatores de desenvolvimento.",
    };
  }

  const average =
    evaluationItems.reduce((sum, item) => sum + Number(evaluation[item.key]), 0) /
    evaluationItems.length;

  const classification = getPedagogicalBand(average);
  const entries = evaluationItems.map((item) => ({
    key: item.key,
    label: item.label,
    score: Number(evaluation[item.key]),
  }));

  const strengths = entries
    .filter((item) => item.score >= 4)
    .sort((a, b) => b.score - a.score);

  const development = entries
    .filter((item) => item.score <= 3)
    .sort((a, b) => a.score - b.score);

  const minScore = Math.min(...entries.map((item) => item.score));
  const priorities = entries.filter((item) => item.score === minScore);

  const strengthsText = strengths.length
    ? strengths.map((item) => `${item.label} (${item.score}/5)`).join(", ")
    : "Nenhum fator atingiu nota 4 ou 5 nesta aula.";

  const developmentText = development.length
    ? development.map((item) => `${item.label} (${item.score}/5)`).join(", ")
    : "Nenhum fator apresentou nota igual ou inferior a 3.";

  const priorityText = priorities.map((item) => item.label).join(", ");

  const diagnosis =
    `O aluno apresentou desempenho ${classification.label.toLowerCase()} na aula, ` +
    `com média ${average.toFixed(2)}/5. ` +
    `Pontos fortes: ${strengthsText}. ` +
    `Pontos de desenvolvimento: ${developmentText}. ` +
    `A prioridade pedagógica para a próxima aula é ${priorityText}.`;

  const recommendationParts = priorities.map((item) => {
    const rule = PEDAGOGICAL_RULES[item.key];
    return `${rule.label}: ${rule.recommendations[getScoreBand(item.score)]}`;
  });

  const nextLessonRecommendation =
    recommendationParts.join(" ") ||
    "Manter o desenvolvimento das competências observadas e reavaliar os cinco fatores na próxima aula.";

  const nextLessonObjective =
    priorities.length === 1
      ? `Priorizar o desenvolvimento de ${priorityText}, mantendo os demais fatores em consolidação.`
      : `Priorizar ${priorityText}, mantendo os demais fatores em consolidação.`;

  return {
    complete: true,
    average: Number(average.toFixed(2)),
    classification,
    strengths,
    development,
    priorities,
    diagnosis,
    next_lesson_recommendation: nextLessonRecommendation,
    next_lesson_objective: nextLessonObjective,
  };
}

function LessonRunning({ user, lesson, onCompleted, onBack, readOnly = false }) {
  const [currentLesson, setCurrentLesson] = useState(lesson);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [kmFinal, setKmFinal] = useState(lesson?.km_end ?? "");
  const [notes, setNotes] = useState(lesson?.notes ?? "");

  const [evaluation, setEvaluation] = useState({
    attention: Number(lesson?.pedagogical_evaluation?.attention || 0),
    risk_perception: Number(lesson?.pedagogical_evaluation?.risk_perception || 0),
    decision_making: Number(lesson?.pedagogical_evaluation?.decision_making || 0),
    vehicle_control: Number(lesson?.pedagogical_evaluation?.vehicle_control || 0),
    behavior: Number(lesson?.pedagogical_evaluation?.behavior || 0),
  });


  useEffect(() => {
    setCurrentLesson(lesson);
    setKmFinal(lesson?.km_end ?? "");
    setNotes(lesson?.notes ?? "");
    setEvaluation({
      attention: Number(lesson?.pedagogical_evaluation?.attention || 0),
      risk_perception: Number(lesson?.pedagogical_evaluation?.risk_perception || 0),
      decision_making: Number(lesson?.pedagogical_evaluation?.decision_making || 0),
      vehicle_control: Number(lesson?.pedagogical_evaluation?.vehicle_control || 0),
      behavior: Number(lesson?.pedagogical_evaluation?.behavior || 0),
    });
    setMessage("");
  }, [lesson]);

  const currentPhase = Number(currentLesson?.phase || 1);
  const status = currentLesson?.status || "running";
  const isFinished = status === "completed" || status === "canceled";

  function formatDate(value) {
    if (!value) return "Não informado";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString("pt-BR");
  }

  function elapsedMinutes() {
    if (!currentLesson?.started_at) return null;
    const start = new Date(currentLesson.started_at).getTime();
    const endValue = currentLesson.ended_at
      ? new Date(currentLesson.ended_at).getTime()
      : Date.now();
    if (!Number.isFinite(start) || !Number.isFinite(endValue)) return null;
    return Math.max(0, Math.round((endValue - start) / 60000));
  }

  async function updateLesson(patch, successMessage) {
    if (readOnly || busy) return;

    setBusy(true);
    setMessage("");

    try {
      const { data, error } = await supabase
        .from("ai_lessons")
        .update(patch)
        .eq("id", currentLesson.id)
        .eq("user_id", user.id)
        .select("*")
        .single();

      if (error) throw error;

      setCurrentLesson(data);
      if (successMessage) setMessage(successMessage);
      return data;
    } catch (error) {
      console.error("Erro ao atualizar aula:", error);
      setMessage(error?.message || "Não foi possível atualizar a aula.");
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function advancePhase() {
    if (readOnly || busy || isFinished) return;

    if (currentPhase >= 5) {
      setMessage("A última fase é a Parada Segura. Para concluir, informe o KM final e finalize a aula.");
      return;
    }

    const nextPhase = currentPhase + 1;
    await updateLesson(
      { phase: nextPhase, status: "running" },
      `Fase atualizada para ${lessonPhaseLabel(nextPhase)}.`
    );
  }

  async function pauseLesson() {
    if (readOnly || busy || isFinished) return;
    await updateLesson({ status: "paused" }, "Aula pausada.");
  }

  async function resumeLesson() {
    if (readOnly || busy || isFinished) return;
    await updateLesson({ status: "running" }, "Aula retomada.");
  }


  const evaluationItems = [
    { key: "attention", label: "Atenção", description: "Mantém foco e acompanha as informações relevantes." },
    { key: "risk_perception", label: "Percepção de risco", description: "Identifica riscos e antecipa situações de perigo." },
    { key: "decision_making", label: "Tomada de decisão", description: "Escolhe respostas adequadas diante das situações." },
    { key: "vehicle_control", label: "Controle do veículo", description: "Executa comandos e mantém domínio do veículo." },
    { key: "behavior", label: "Comportamento", description: "Demonstra postura segura, responsável e adequada." },
  ];

  const evaluationComplete = evaluationItems.every(
    (item) => Number(evaluation[item.key]) >= 1 && Number(evaluation[item.key]) <= 5
  );

  const evaluationAverage = evaluationComplete
    ? evaluationItems.reduce((sum, item) => sum + Number(evaluation[item.key]), 0) / evaluationItems.length
    : null;

  const pedagogicalAnalysis = buildPedagogicalAnalysis(evaluationItems, evaluation);

  function setEvaluationValue(key, value) {
    if (readOnly || busy) return;
    setEvaluation((current) => ({
      ...current,
      [key]: Number(value),
    }));
  }

  async function completeLesson() {
    if (readOnly || busy || isFinished) return;

    if (currentPhase !== 5) {
      setMessage("A aula só pode ser concluída após a fase 5 — Parada Segura.");
      return;
    }

    if (!evaluationComplete) {
      setMessage("Preencha todos os itens da avaliação pedagógica antes de concluir a aula.");
      return;
    }

    if (kmFinal === "") {
      setMessage("Informe o KM final antes de concluir a aula.");
      return;
    }

    const initialKm = Number(currentLesson.km_start);
    const finalKm = Number(kmFinal);

    if (!Number.isFinite(finalKm)) {
      setMessage("O KM final deve ser numérico.");
      return;
    }

    if (Number.isFinite(initialKm) && finalKm < initialKm) {
      setMessage("O KM final não pode ser menor que o KM inicial.");
      return;
    }

    const endedAt = new Date().toISOString();
    const duration = currentLesson.started_at
      ? Math.max(
          0,
          Math.round(
            (new Date(endedAt).getTime() - new Date(currentLesson.started_at).getTime()) / 60000
          )
        )
      : null;

    const pedagogicalEvaluation = {
      ...evaluation,
      average: Number(evaluationAverage.toFixed(2)),
      scale: "1-5",
      classification: pedagogicalAnalysis.classification,
      strengths: pedagogicalAnalysis.strengths,
      development: pedagogicalAnalysis.development,
      priorities: pedagogicalAnalysis.priorities,
      diagnosis: pedagogicalAnalysis.diagnosis,
      next_lesson_recommendation: pedagogicalAnalysis.next_lesson_recommendation,
      next_lesson_objective: pedagogicalAnalysis.next_lesson_objective,
      completed_at: endedAt,
    };

    const evaluationNote = `[AVALIAÇÃO PEDAGÓGICA] ${JSON.stringify(pedagogicalEvaluation)}`;
    const mergedNotes = [notes, evaluationNote]
      .filter(Boolean)
      .join("\n\n");

    const patch = {
      phase: 5,
      status: "completed",
      km_end: finalKm,
      ended_at: endedAt,
      duration_minutes: duration,
      notes: mergedNotes || null,
    };

    const updated = await updateLesson(patch);

    if (updated && onCompleted) {
      onCompleted(updated);
    }
  }

  const distance =
    currentLesson?.km_start != null && kmFinal !== ""
      ? Number(kmFinal) - Number(currentLesson.km_start)
      : null;

  return (
    <div>
      <div className="panel">
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
          flexWrap: "wrap"
        }}>
          <div>
            <h2>{readOnly ? "Visualização da aula" : "Aula em andamento"}</h2>
            <p>
              {readOnly
                ? "Modo somente leitura."
                : "A aula deve seguir as cinco fases na ordem."}
            </p>
          </div>

          <button type="button" onClick={onBack} disabled={busy}>
            VOLTAR
          </button>
        </div>
      </div>

      <div className="panel">
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: "10px"
        }}>
          <div>
            <div style={{ fontSize: "11px", opacity: 0.65 }}>STATUS</div>
            <strong>{status === "completed" ? "CONCLUÍDA" : status === "paused" ? "PAUSADA" : "EM ANDAMENTO"}</strong>
          </div>
          <div>
            <div style={{ fontSize: "11px", opacity: 0.65 }}>INÍCIO</div>
            <strong>{formatDate(currentLesson?.started_at)}</strong>
          </div>
          <div>
            <div style={{ fontSize: "11px", opacity: 0.65 }}>DURAÇÃO</div>
            <strong>{elapsedMinutes() != null ? `${elapsedMinutes()} min` : "—"}</strong>
          </div>
          <div>
            <div style={{ fontSize: "11px", opacity: 0.65 }}>KM INICIAL</div>
            <strong>{currentLesson?.km_start ?? "—"}</strong>
          </div>
        </div>
      </div>

      <div className="panel">
        <h2>Fases da aula</h2>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
          gap: "10px"
        }}>
          {LESSON_PHASES.map((phase) => {
            const phaseClass = getLessonPhaseClass(
              phase.id,
              currentPhase,
              status
            );

            const styles = {
              completed: {
                background: "#e8f5e9",
                border: "2px solid #66bb6a",
                color: "#1b5e20"
              },
              current: {
                background: "#fff8e1",
                border: "2px solid #f9a825",
                color: "#8a5a00"
              },
              next: {
                background: "#ffebee",
                border: "2px solid #ef9a9a",
                color: "#b71c1c"
              }
            };

            return (
              <div
                key={phase.id}
                style={{
                  ...styles[phaseClass],
                  borderRadius: "10px",
                  padding: "14px",
                  minHeight: "64px",
                  boxSizing: "border-box"
                }}
              >
                <div style={{ fontSize: "10px", fontWeight: 700 }}>
                  FASE {phase.id}
                </div>
                <div style={{ marginTop: "5px", fontWeight: 700 }}>
                  {phase.label}
                </div>
                <div style={{ marginTop: "5px", fontSize: "10px" }}>
                  {phaseClass === "completed"
                    ? "CONCLUÍDA"
                    : phaseClass === "current"
                    ? "ATUAL"
                    : "PRÓXIMA"}
                </div>
              </div>
            );
          })}
        </div>

        {!readOnly && (
          <div style={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
            marginTop: "16px"
          }}>
            {status === "paused" ? (
              <button type="button" onClick={resumeLesson} disabled={busy}>
                RETOMAR AULA
              </button>
            ) : (
              <button type="button" onClick={pauseLesson} disabled={busy || isFinished}>
                PAUSAR AULA
              </button>
            )}

            <button
              type="button"
              onClick={advancePhase}
              disabled={busy || isFinished || status === "paused" || currentPhase >= 5}
            >
              AVANÇAR FASE
            </button>
          </div>
        )}
      </div>

      <div className="panel">
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "12px",
          flexWrap: "wrap"
        }}>
          <div>
            <h2>Avaliação pedagógica</h2>
            <p>
              Avalie o desempenho observado durante a aula em uma escala de 1 a 5.
              Esta avaliação será a base para o HSI-DOTH-P.
            </p>
          </div>

          <div style={{
            padding: "8px 12px",
            borderRadius: "8px",
            background: evaluationComplete ? "#e8f5e9" : "#fff8e1",
            color: evaluationComplete ? "#1b5e20" : "#8a5a00",
            border: evaluationComplete ? "1px solid #a5d6a7" : "1px solid #ffe082",
            fontSize: "12px",
            fontWeight: 700
          }}>
            {evaluationComplete
              ? `MÉDIA: ${evaluationAverage.toFixed(2)} / 5`
              : "AVALIAÇÃO INCOMPLETA"}
          </div>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "12px",
          marginTop: "14px"
        }}>
          {evaluationItems.map((item) => (
            <div
              key={item.key}
              style={{
                border: "1px solid #dfe5ec",
                borderRadius: "10px",
                padding: "14px",
                background: "#fff"
              }}
            >
              <div style={{ fontWeight: 700 }}>
                {item.label}
              </div>

              <div style={{
                fontSize: "11px",
                opacity: 0.7,
                marginTop: "4px",
                minHeight: "32px"
              }}>
                {item.description}
              </div>

              <div style={{
                display: "flex",
                gap: "6px",
                marginTop: "12px",
                flexWrap: "wrap"
              }}>
                {[1, 2, 3, 4, 5].map((value) => {
                  const selected = Number(evaluation[item.key]) === value;

                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setEvaluationValue(item.key, value)}
                      disabled={readOnly || busy || isFinished}
                      aria-label={`${item.label}: ${value}`}
                      style={{
                        minWidth: "38px",
                        padding: "8px 10px",
                        borderRadius: "7px",
                        border: selected ? "2px solid #2457a6" : "1px solid #ccd4df",
                        background: selected ? "#e8f0ff" : "#fff",
                        color: "#18345f",
                        fontWeight: selected ? 800 : 600,
                        cursor: readOnly || busy || isFinished ? "default" : "pointer"
                      }}
                    >
                      {value}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div style={{
          marginTop: "14px",
          padding: "10px 12px",
          borderRadius: "8px",
          background: "#f5f7fa",
          fontSize: "12px"
        }}>
          <strong>Escala:</strong> 1 = necessita desenvolvimento · 3 = adequado · 5 = desempenho muito bom.
          <br />
          <strong>Uso:</strong> resultado pedagógico da aula; não substitui o HSI-DOTH-P.
        </div>

        {evaluationComplete && (
          <div style={{
            marginTop: "14px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "12px"
          }}>
            <div style={{
              border: "1px solid #dfe5ec",
              borderRadius: "10px",
              padding: "14px",
              background: "#fff"
            }}>
              <div style={{ fontWeight: 800 }}>Diagnóstico da aula</div>
              <div style={{
                marginTop: "8px",
                fontSize: "12px",
                lineHeight: 1.55
              }}>
                <strong>{pedagogicalAnalysis.classification.label}</strong>
                {" — "}
                {pedagogicalAnalysis.diagnosis}
              </div>
            </div>

            <div style={{
              border: "1px solid #dfe5ec",
              borderRadius: "10px",
              padding: "14px",
              background: "#fff"
            }}>
              <div style={{ fontWeight: 800 }}>Recomendação para a próxima aula</div>
              <div style={{
                marginTop: "8px",
                fontSize: "12px",
                lineHeight: 1.55
              }}>
                {pedagogicalAnalysis.next_lesson_recommendation}
              </div>
              <div style={{
                marginTop: "10px",
                paddingTop: "10px",
                borderTop: "1px solid #edf0f4"
              }}>
                <strong>Objetivo sugerido:</strong>{" "}
                {pedagogicalAnalysis.next_lesson_objective}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="panel">
        <h2>Encerramento</h2>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "12px"
        }}>
          <div>
            <label>KM final</label>
            <input
              type="number"
              min={currentLesson?.km_start ?? 0}
              step="0.1"
              value={kmFinal}
              onChange={(e) => setKmFinal(e.target.value)}
              disabled={readOnly || busy || isFinished}
            />
          </div>

          <div>
            <label>Distância</label>
            <div style={{
              padding: "10px 12px",
              border: "1px solid #ddd",
              borderRadius: "6px",
              minHeight: "20px"
            }}>
              {Number.isFinite(distance) ? `${distance.toFixed(1)} km` : "—"}
            </div>
          </div>
        </div>

        <div style={{ marginTop: "12px" }}>
          <label>Observações da aula</label>
          <textarea
            rows="4"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={readOnly || busy || isFinished}
          />
        </div>

        {!readOnly && (
          <button
            type="button"
            onClick={completeLesson}
            disabled={busy || isFinished || status === "paused" || currentPhase !== 5}
            style={{ marginTop: "14px" }}
          >
            CONCLUIR AULA
          </button>
        )}

        {isFinished && (
          <p style={{ marginTop: "12px" }}>
            Esta aula está encerrada e não pode ser alterada por esta tela.
          </p>
        )}
      </div>

      {message && (
        <div className="panel">
          <p className="msg">{message}</p>
        </div>
      )}
    </div>
  );
}

function LessonHistory({ user, onBack, onSelect }) {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [layoutMode, setLayoutMode] = useState("columns");

  async function loadLessons() {
    setLoading(true);
    setMsg("");

    try {
      if (!supabase) throw new Error("Supabase não está configurado.");

      const { data, error } = await supabase
        .from("ai_lessons")
        .select(`
          *,
          ai_students(full_name),
          ai_vehicles(brand, model, plate)
        `)
        .eq("user_id", user.id)
        .order("started_at", { ascending: false });

      if (error) throw error;
      setLessons(data || []);
    } catch (error) {
      console.error("Erro ao carregar histórico de aulas:", error);
      setMsg(error?.message || "Não foi possível carregar o histórico de aulas.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLessons();
  }, [user.id]);

  function formatDate(value) {
    if (!value) return "Não informado";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString("pt-BR");
  }

  function shortDate(value) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString("pt-BR");
  }

  function shortTime(value) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function statusLabel(status) {
    const labels = {
      running: "EM ANDAMENTO",
      paused: "PAUSADA",
      completed: "CONCLUÍDA",
      canceled: "CANCELADA",
    };
    return labels[status] || status || "NÃO INFORMADO";
  }

  function statusStyle(status) {
    if (status === "completed") {
      return {
        background: "#e8f5e9",
        color: "#1b5e20",
        border: "1px solid #a5d6a7"
      };
    }

    if (status === "running") {
      return {
        background: "#fff8e1",
        color: "#8a5a00",
        border: "1px solid #ffe082"
      };
    }

    if (status === "paused") {
      return {
        background: "#e3f2fd",
        color: "#0d47a1",
        border: "1px solid #90caf9"
      };
    }

    if (status === "canceled") {
      return {
        background: "#ffebee",
        color: "#b71c1c",
        border: "1px solid #ef9a9a"
      };
    }

    return {
      background: "#f5f5f5",
      color: "#424242",
      border: "1px solid #ddd"
    };
  }

  function phaseLabel(phase) {
    const labels = {
      1: "PREPARAÇÃO",
      2: "DESLOCAMENTO",
      3: "DESENVOLVIMENTO",
      4: "AVALIAÇÃO",
      5: "PARADA SEGURA",
    };
    return labels[Number(phase)] || `FASE ${phase ?? "-"}`;
  }

  function phaseStyle(phase) {
    const styles = {
      1: { background: "#ffebee", color: "#b71c1c", border: "1px solid #ef9a9a" },
      2: { background: "#fff8e1", color: "#8a5a00", border: "1px solid #ffe082" },
      3: { background: "#fff8e1", color: "#8a5a00", border: "1px solid #ffe082" },
      4: { background: "#e3f2fd", color: "#0d47a1", border: "1px solid #90caf9" },
      5: { background: "#e8f5e9", color: "#1b5e20", border: "1px solid #a5d6a7" }
    };
    return styles[Number(phase)] || {
      background: "#f5f5f5",
      color: "#424242",
      border: "1px solid #ddd"
    };
  }

  const historyLayout = layoutMode === "columns"
    ? {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))",
        gap: "14px",
        alignItems: "stretch"
      }
    : {
        display: "block",
        overflowX: "auto",
        border: "1px solid #dfe5ec",
        borderRadius: "12px",
        background: "#fff"
      };

  return (
    <div>
      <div className="panel">
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
          flexWrap: "wrap"
        }}>
          <div>
            <h2>Histórico de aulas</h2>
            <p>Visualização das aulas registradas para o instrutor autenticado.</p>
          </div>
          <button type="button" onClick={onBack}>VOLTAR</button>
        </div>
      </div>

      {!loading && !msg && lessons.length > 0 && (
        <div className="panel" style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
          flexWrap: "wrap"
        }}>
          <div>
            <strong>{lessons.length} aula{lessons.length === 1 ? "" : "s"} registrada{lessons.length === 1 ? "" : "s"}</strong>
            <p style={{ margin: "4px 0 0" }}>
              Alterne entre cartões e tabela para consultar o histórico.
            </p>
          </div>

          <div style={{
            display: "flex",
            gap: "8px",
            flexWrap: "wrap"
          }}>
            <button
              type="button"
              onClick={() => setLayoutMode("columns")}
              style={{
                opacity: layoutMode === "columns" ? 1 : 0.65,
                fontWeight: layoutMode === "columns" ? 700 : 400
              }}
            >
              COLUNAS
            </button>

            <button
              type="button"
              onClick={() => setLayoutMode("rows")}
              style={{
                opacity: layoutMode === "rows" ? 1 : 0.65,
                fontWeight: layoutMode === "rows" ? 700 : 400
              }}
            >
              LINHAS
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div className="panel"><p>Carregando aulas...</p></div>
      )}

      {msg && (
        <div className="panel"><p className="msg">{msg}</p></div>
      )}

      {!loading && !msg && lessons.length === 0 && (
        <div className="panel">
          <h2>Nenhuma aula encontrada</h2>
          <p>As aulas registradas aparecerão aqui.</p>
        </div>
      )}

      {!loading && !msg && lessons.length > 0 && layoutMode === "columns" && (
        <div style={historyLayout}>
          {lessons.map((lesson) => {
            const student = Array.isArray(lesson.ai_students)
              ? lesson.ai_students[0]
              : lesson.ai_students;
            const vehicle = Array.isArray(lesson.ai_vehicles)
              ? lesson.ai_vehicles[0]
              : lesson.ai_vehicles;

            return (
              <div className="panel" key={lesson.id} style={{
                width: "100%",
                boxSizing: "border-box",
                margin: 0,
                padding: "18px"
              }}>
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: "10px",
                  marginBottom: "14px"
                }}>
                  <div style={{ minWidth: 0 }}>
                    <h2 style={{
                      margin: 0,
                      fontSize: "18px",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis"
                    }}>
                      {student?.full_name || "Aluno não informado"}
                    </h2>
                    <div style={{
                      marginTop: "4px",
                      fontSize: "12px",
                      opacity: 0.75
                    }}>
                      {shortDate(lesson.started_at)} · {shortTime(lesson.started_at)}
                    </div>
                  </div>

                  <span style={{
                    ...statusStyle(lesson.status),
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "5px 8px",
                    borderRadius: "999px",
                    fontSize: "10px",
                    fontWeight: 700,
                    whiteSpace: "nowrap"
                  }}>
                    {statusLabel(lesson.status)}
                  </span>
                </div>

                <div style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "10px",
                  marginBottom: "14px"
                }}>
                  <div>
                    <div style={{ fontSize: "11px", opacity: 0.65 }}>VEÍCULO</div>
                    <div style={{ fontWeight: 600, marginTop: "3px" }}>
                      {vehicle
                        ? `${vehicle.brand || ""} ${vehicle.model || ""}`.trim()
                        : "Não informado"}
                    </div>
                    {vehicle?.plate && (
                      <div style={{ fontSize: "12px", opacity: 0.75 }}>
                        {vehicle.plate}
                      </div>
                    )}
                  </div>

                  <div>
                    <div style={{ fontSize: "11px", opacity: 0.65 }}>FASE</div>
                    <span style={{
                      ...phaseStyle(lesson.phase),
                      display: "inline-flex",
                      marginTop: "4px",
                      padding: "4px 7px",
                      borderRadius: "6px",
                      fontSize: "10px",
                      fontWeight: 700
                    }}>
                      {phaseLabel(lesson.phase)}
                    </span>
                  </div>
                </div>

                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "8px",
                  padding: "10px 0",
                  borderTop: "1px solid #edf0f3",
                  borderBottom: "1px solid #edf0f3",
                  marginBottom: "12px"
                }}>
                  <div>
                    <div style={{ fontSize: "10px", opacity: 0.65 }}>KM INICIAL</div>
                    <strong>{lesson.km_start ?? "—"}</strong>
                  </div>
                  <div>
                    <div style={{ fontSize: "10px", opacity: 0.65 }}>KM FINAL</div>
                    <strong>{lesson.km_end ?? "—"}</strong>
                  </div>
                  <div>
                    <div style={{ fontSize: "10px", opacity: 0.65 }}>DURAÇÃO</div>
                    <strong>
                      {lesson.duration_minutes != null
                        ? `${lesson.duration_minutes} min`
                        : "—"}
                    </strong>
                  </div>
                </div>

                <div style={{
                  fontSize: "12px",
                  lineHeight: 1.45,
                  minHeight: "34px",
                  marginBottom: "12px"
                }}>
                  <strong>Objetivo:</strong>{" "}
                  {lesson.objective || "Não informado"}
                </div>

                <button
                  type="button"
                  onClick={() => onSelect(lesson)}
                  style={{ width: "100%" }}
                >
                  VISUALIZAR AULA
                </button>
              </div>
            );
          })}
        </div>
      )}

      {!loading && !msg && lessons.length > 0 && layoutMode === "rows" && (
        <div style={historyLayout}>
          <table style={{
            width: "100%",
            minWidth: "980px",
            borderCollapse: "collapse",
            fontSize: "12px"
          }}>
            <thead>
              <tr style={{
                background: "#f5f7fa",
                borderBottom: "1px solid #dfe5ec"
              }}>
                {[
                  "DATA",
                  "ALUNO",
                  "VEÍCULO",
                  "STATUS",
                  "FASE",
                  "KM INICIAL",
                  "KM FINAL",
                  "DURAÇÃO",
                  "OBJETIVO",
                  "AÇÃO"
                ].map((heading) => (
                  <th
                    key={heading}
                    style={{
                      padding: "12px 10px",
                      textAlign: heading === "ALUNO" || heading === "VEÍCULO" || heading === "OBJETIVO" ? "left" : "center",
                      fontSize: "10px",
                      letterSpacing: "0.04em",
                      whiteSpace: "nowrap"
                    }}
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {lessons.map((lesson, index) => {
                const student = Array.isArray(lesson.ai_students)
                  ? lesson.ai_students[0]
                  : lesson.ai_students;
                const vehicle = Array.isArray(lesson.ai_vehicles)
                  ? lesson.ai_vehicles[0]
                  : lesson.ai_vehicles;

                return (
                  <tr
                    key={lesson.id}
                    style={{
                      borderBottom: "1px solid #edf0f3",
                      background: index % 2 === 0 ? "#fff" : "#fafbfc"
                    }}
                  >
                    <td style={{ padding: "11px 10px", textAlign: "center", whiteSpace: "nowrap" }}>
                      <div>{shortDate(lesson.started_at)}</div>
                      <div style={{ fontSize: "10px", opacity: 0.65 }}>
                        {shortTime(lesson.started_at)}
                      </div>
                    </td>

                    <td style={{
                      padding: "11px 10px",
                      fontWeight: 600,
                      maxWidth: "180px"
                    }}>
                      {student?.full_name || "Aluno não informado"}
                    </td>

                    <td style={{ padding: "11px 10px", maxWidth: "180px" }}>
                      <div>{vehicle ? `${vehicle.brand || ""} ${vehicle.model || ""}`.trim() : "Não informado"}</div>
                      {vehicle?.plate && (
                        <div style={{ fontSize: "10px", opacity: 0.65 }}>
                          {vehicle.plate}
                        </div>
                      )}
                    </td>

                    <td style={{ padding: "11px 10px", textAlign: "center" }}>
                      <span style={{
                        ...statusStyle(lesson.status),
                        display: "inline-flex",
                        padding: "4px 7px",
                        borderRadius: "999px",
                        fontSize: "9px",
                        fontWeight: 700,
                        whiteSpace: "nowrap"
                      }}>
                        {statusLabel(lesson.status)}
                      </span>
                    </td>

                    <td style={{ padding: "11px 10px", textAlign: "center" }}>
                      <span style={{
                        ...phaseStyle(lesson.phase),
                        display: "inline-flex",
                        padding: "4px 7px",
                        borderRadius: "6px",
                        fontSize: "9px",
                        fontWeight: 700,
                        whiteSpace: "nowrap"
                      }}>
                        {phaseLabel(lesson.phase)}
                      </span>
                    </td>

                    <td style={{ padding: "11px 10px", textAlign: "center" }}>
                      {lesson.km_start ?? "—"}
                    </td>

                    <td style={{ padding: "11px 10px", textAlign: "center" }}>
                      {lesson.km_end ?? "—"}
                    </td>

                    <td style={{ padding: "11px 10px", textAlign: "center", whiteSpace: "nowrap" }}>
                      {lesson.duration_minutes != null
                        ? `${lesson.duration_minutes} min`
                        : "—"}
                    </td>

                    <td style={{
                      padding: "11px 10px",
                      maxWidth: "220px",
                      whiteSpace: "normal"
                    }}>
                      {lesson.objective || "Não informado"}
                    </td>

                    <td style={{ padding: "11px 10px", textAlign: "center" }}>
                      <button
                        type="button"
                        onClick={() => onSelect(lesson)}
                        style={{ whiteSpace: "nowrap" }}
                      >
                        VISUALIZAR
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function LessonDetails({ lesson, onBack }) {
  const [evolution, setEvolution] = useState(null);
  const [evolutionLoading, setEvolutionLoading] = useState(true);

  function formatDate(value) {
    if (!value) return "Não informado";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString("pt-BR");
  }

  function statusLabel(status) {
    const labels = {
      running: "EM ANDAMENTO",
      paused: "PAUSADA",
      completed: "CONCLUÍDA",
      canceled: "CANCELADA",
    };
    return labels[status] || status || "NÃO INFORMADO";
  }

  function phaseLabel(phase) {
    const labels = {
      1: "PREPARAÇÃO",
      2: "DESLOCAMENTO",
      3: "DESENVOLVIMENTO",
      4: "AVALIAÇÃO",
      5: "PARADA SEGURA",
    };
    return labels[Number(phase)] || `FASE ${phase ?? "-"}`;
  }

  const student = Array.isArray(lesson.ai_students)
    ? lesson.ai_students[0]
    : lesson.ai_students;
  const vehicle = Array.isArray(lesson.ai_vehicles)
    ? lesson.ai_vehicles[0]
    : lesson.ai_vehicles;

  let pedagogicalEvaluation = null;
  try {
    const match = String(lesson.notes || "").match(/\[AVALIAÇÃO PEDAGÓGICA\]\s*(\{[\s\S]*\})/);
    if (match) pedagogicalEvaluation = JSON.parse(match[1]);
  } catch {
    pedagogicalEvaluation = null;
  }

  const evaluationLabels = {
    attention: "Atenção",
    risk_perception: "Percepção de risco",
    decision_making: "Tomada de decisão",
    vehicle_control: "Controle do veículo",
    behavior: "Comportamento",
  };

  // Compatibilidade com avaliações já existentes:
  // se o registro tiver apenas as cinco notas, o diagnóstico é calculado
  // em tempo de visualização, sem alterar o banco ou as notas históricas.
  const historicalEvaluation = pedagogicalEvaluation
    ? {
        attention: Number(pedagogicalEvaluation.attention || 0),
        risk_perception: Number(pedagogicalEvaluation.risk_perception || 0),
        decision_making: Number(pedagogicalEvaluation.decision_making || 0),
        vehicle_control: Number(pedagogicalEvaluation.vehicle_control || 0),
        behavior: Number(pedagogicalEvaluation.behavior || 0),
      }
    : null;

  const historicalAnalysis = historicalEvaluation
    ? buildPedagogicalAnalysis(
        Object.entries(evaluationLabels).map(([key, label]) => ({ key, label })),
        historicalEvaluation
      )
    : null;

  const resolvedPedagogicalEvaluation = pedagogicalEvaluation
    ? {
        ...pedagogicalEvaluation,
        average:
          pedagogicalEvaluation.average != null
            ? Number(pedagogicalEvaluation.average)
            : historicalAnalysis?.average,
        classification:
          pedagogicalEvaluation.classification || historicalAnalysis?.classification,
        strengths:
          pedagogicalEvaluation.strengths || historicalAnalysis?.strengths || [],
        development:
          pedagogicalEvaluation.development || historicalAnalysis?.development || [],
        priorities:
          pedagogicalEvaluation.priorities || historicalAnalysis?.priorities || [],
        diagnosis:
          pedagogicalEvaluation.diagnosis || historicalAnalysis?.diagnosis || null,
        next_lesson_recommendation:
          pedagogicalEvaluation.next_lesson_recommendation ||
          historicalAnalysis?.next_lesson_recommendation ||
          null,
        next_lesson_objective:
          pedagogicalEvaluation.next_lesson_objective ||
          historicalAnalysis?.next_lesson_objective ||
          null,
      }
    : null;

  const pedagogicalBand = resolvedPedagogicalEvaluation?.classification || null;
  const pedagogicalDiagnosis = resolvedPedagogicalEvaluation?.diagnosis || null;
  const nextLessonRecommendation =
    resolvedPedagogicalEvaluation?.next_lesson_recommendation || null;
  const nextLessonObjective =
    resolvedPedagogicalEvaluation?.next_lesson_objective || null;

  useEffect(() => {
    let active = true;

    async function loadEvolution() {
      setEvolutionLoading(true);
      setEvolution(null);

      try {
        if (!supabase || !lesson?.student_id) {
          if (active) setEvolutionLoading(false);
          return;
        }

        const { data: userData } = await supabase.auth.getUser();
        const currentUser = userData?.user;
        if (!currentUser) {
          if (active) setEvolutionLoading(false);
          return;
        }

        const { data: lessons, error } = await supabase
          .from("ai_lessons")
          .select("id, student_id, started_at, ended_at, status, notes")
          .eq("user_id", currentUser.id)
          .eq("student_id", lesson.student_id)
          .order("started_at", { ascending: false })
          .limit(30);

        if (error) throw error;

        const evaluationItems = Object.entries(evaluationLabels).map(([key, label]) => ({ key, label }));

        function extractEvaluation(notes) {
          try {
            const match = String(notes || "").match(/\[AVALIAÇÃO PEDAGÓGICA\]\s*(\{[\s\S]*\})/);
            if (!match) return null;
            const parsed = JSON.parse(match[1]);
            const scores = {};
            for (const item of evaluationItems) {
              const value = Number(parsed?.[item.key]);
              if (Number.isFinite(value) && value >= 1 && value <= 5) scores[item.key] = value;
            }
            if (Object.keys(scores).length !== evaluationItems.length) return null;
            return {
              ...scores,
              average: Number(
                (evaluationItems.reduce((sum, item) => sum + scores[item.key], 0) / evaluationItems.length).toFixed(2)
              ),
            };
          } catch {
            return null;
          }
        }

        const ordered = (lessons || []).filter((item) => item.id !== lesson.id);
        const previousLesson = ordered.find((item) => extractEvaluation(item.notes));
        const currentEvaluation = extractEvaluation(lesson.notes) || historicalEvaluation;
        const previousEvaluation = previousLesson ? extractEvaluation(previousLesson.notes) : null;

        if (!currentEvaluation || !previousEvaluation) {
          if (active) setEvolution({ available: false });
          return;
        }

        const deltas = evaluationItems.map((item) => ({
          key: item.key,
          label: item.label,
          previous: previousEvaluation[item.key],
          current: currentEvaluation[item.key],
          delta: Number((currentEvaluation[item.key] - previousEvaluation[item.key]).toFixed(2)),
        }));

        const overallDelta = Number((currentEvaluation.average - previousEvaluation.average).toFixed(2));
        const improved = deltas.filter((item) => item.delta > 0);
        const stable = deltas.filter((item) => item.delta === 0);
        const declined = deltas.filter((item) => item.delta < 0);

        let direction = "ESTÁVEL";
        if (overallDelta > 0) direction = "EVOLUÇÃO POSITIVA";
        if (overallDelta < 0) direction = "ATENÇÃO — QUEDA DE DESEMPENHO";

        if (active) {
          setEvolution({
            available: true,
            previousLesson,
            previousEvaluation,
            currentEvaluation,
            deltas,
            overallDelta,
            direction,
            improved,
            stable,
            declined,
          });
        }
      } catch (error) {
        console.error("Erro ao calcular evolução pedagógica:", error);
        if (active) setEvolution({ available: false, error: true });
      } finally {
        if (active) setEvolutionLoading(false);
      }
    }

    loadEvolution();
    return () => { active = false; };
  }, [lesson?.id, lesson?.student_id, lesson?.notes]);

  return (
    <div style={{ width: "100%", maxWidth: "1400px", margin: "0 auto", boxSizing: "border-box" }}>
      <div className="panel" style={{ padding: "24px" }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "16px",
          flexWrap: "wrap"
        }}>
          <div>
            <h2 style={{ marginBottom: "6px" }}>Visualização da aula</h2>
            <p style={{ margin: 0, opacity: 0.72 }}>
              Modo somente leitura. Nenhum dado será alterado.
            </p>
          </div>

          <button type="button" onClick={onBack}>
            VOLTAR AO HISTÓRICO
          </button>
        </div>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
        gap: "14px",
        width: "100%",
        boxSizing: "border-box"
      }}>
        <section className="panel" style={{ margin: 0, minWidth: 0 }}>
          <h2>Identificação</h2>
          <p style={{ overflowWrap: "anywhere" }}>
            <strong>ID da aula:</strong> {lesson.id}
          </p>
          <p>
            <strong>Aluno:</strong> {student?.full_name || "Não informado"}
          </p>
          <p>
            <strong>Veículo:</strong>{" "}
            {vehicle
              ? `${vehicle.brand || ""} ${vehicle.model || ""}${vehicle.plate ? ` — ${vehicle.plate}` : ""}`.trim()
              : "Não informado"}
          </p>
        </section>

        <section className="panel" style={{ margin: 0, minWidth: 0 }}>
          <h2>Status da aula</h2>
          <p><strong>Status:</strong> {statusLabel(lesson.status)}</p>
          <p><strong>Fase:</strong> {phaseLabel(lesson.phase)}</p>
          <p><strong>Início:</strong> {formatDate(lesson.started_at)}</p>
          <p><strong>Término:</strong> {formatDate(lesson.ended_at)}</p>
        </section>

        <section className="panel" style={{ margin: 0, minWidth: 0 }}>
          <h2>Quilometragem e duração</h2>
          <p><strong>KM inicial:</strong> {lesson.km_start ?? "Não informado"}</p>
          <p><strong>KM final:</strong> {lesson.km_end ?? "Não informado"}</p>
          <p>
            <strong>Distância:</strong>{" "}
            {lesson.km_start != null && lesson.km_end != null
              ? `${Number(lesson.km_end) - Number(lesson.km_start)} km`
              : "Não calculada"}
          </p>
          <p>
            <strong>Duração:</strong>{" "}
            {lesson.duration_minutes != null
              ? `${lesson.duration_minutes} min`
              : "Não informada"}
          </p>
        </section>
      </div>

      <section className="panel" style={{ marginTop: "14px", minWidth: 0 }}>
        <h2>Objetivo da aula</h2>
        <div style={{
          border: "1px solid #dfe5ec",
          borderRadius: "10px",
          padding: "14px",
          background: "#fff",
          overflowWrap: "anywhere"
        }}>
          {lesson.objective || "Não informado"}
        </div>
      </section>

      <section className="panel" style={{ marginTop: "14px", minWidth: 0 }}>
        <h2>Avaliação pedagógica</h2>

        {resolvedPedagogicalEvaluation ? (
          <>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
              gap: "10px"
            }}>
              {Object.entries(evaluationLabels).map(([key, label]) => (
                <div key={key} style={{
                  border: "1px solid #dfe5ec",
                  borderRadius: "10px",
                  padding: "14px",
                  background: "#fff"
                }}>
                  <div style={{ fontWeight: 700 }}>{label}</div>
                  <div style={{
                    fontSize: "24px",
                    fontWeight: 800,
                    marginTop: "8px"
                  }}>
                    {resolvedPedagogicalEvaluation[key] ?? "—"}<span style={{ fontSize: "12px", opacity: 0.65 }}> / 5</span>
                  </div>
                </div>
              ))}
            </div>

            <div style={{
              marginTop: "12px",
              padding: "14px",
              borderRadius: "10px",
              background: "#f5f7fa",
              display: "flex",
              justifyContent: "space-between",
              gap: "12px",
              flexWrap: "wrap"
            }}>
              <strong>Média pedagógica</strong>
              <strong>
                {resolvedPedagogicalEvaluation.average != null
                  ? `${Number(resolvedPedagogicalEvaluation.average).toFixed(2)} / 5`
                  : "Não informada"}
              </strong>
            </div>

            {(pedagogicalBand || pedagogicalDiagnosis) && (
              <div style={{
                marginTop: "12px",
                padding: "14px",
                borderRadius: "10px",
                background: "#fff",
                border: "1px solid #dfe5ec"
              }}>
                <div style={{ fontWeight: 800 }}>Diagnóstico pedagógico</div>
                <p style={{ marginBottom: "8px" }}>
                  <strong>Classificação:</strong>{" "}
                  {pedagogicalBand?.label || "Não informada"}
                </p>
                <p style={{ marginBottom: 0, lineHeight: 1.55 }}>
                  {pedagogicalDiagnosis || "Não informado."}
                </p>
              </div>
            )}

            {(nextLessonRecommendation || nextLessonObjective) && (
              <div style={{
                marginTop: "12px",
                padding: "14px",
                borderRadius: "10px",
                background: "#fff",
                border: "1px solid #dfe5ec"
              }}>
                <div style={{ fontWeight: 800 }}>Recomendação para a próxima aula</div>
                <p style={{ lineHeight: 1.55 }}>
                  {nextLessonRecommendation || "Não informada."}
                </p>
                <p style={{ marginBottom: 0, lineHeight: 1.55 }}>
                  <strong>Objetivo sugerido:</strong>{" "}
                  {nextLessonObjective || "Não informado."}
                </p>
              </div>
            )}
          </>
        ) : (
          <p>Nenhuma avaliação pedagógica estruturada encontrada.</p>
        )}
      </section>

      <section className="panel" style={{ marginTop: "14px", minWidth: 0 }}>
        <h2>Evolução entre aulas</h2>
        {evolutionLoading ? (
          <p>Calculando evolução a partir do histórico do aluno...</p>
        ) : !evolution?.available ? (
          <p style={{ marginBottom: 0 }}>
            A evolução será exibida quando houver pelo menos uma aula anterior do mesmo aluno com avaliação pedagógica completa.
          </p>
        ) : (
          <>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "10px"
            }}>
              <div style={{ border: "1px solid #dfe5ec", borderRadius: "10px", padding: "14px", background: "#fff" }}>
                <div style={{ fontWeight: 700 }}>Aula anterior</div>
                <div style={{ marginTop: "6px" }}>{formatDate(evolution.previousLesson?.started_at)}</div>
              </div>
              <div style={{ border: "1px solid #dfe5ec", borderRadius: "10px", padding: "14px", background: "#fff" }}>
                <div style={{ fontWeight: 700 }}>Média anterior</div>
                <div style={{ fontSize: "24px", fontWeight: 800, marginTop: "6px" }}>{evolution.previousEvaluation.average.toFixed(2)} / 5</div>
              </div>
              <div style={{ border: "1px solid #dfe5ec", borderRadius: "10px", padding: "14px", background: "#fff" }}>
                <div style={{ fontWeight: 700 }}>Média atual</div>
                <div style={{ fontSize: "24px", fontWeight: 800, marginTop: "6px" }}>{evolution.currentEvaluation.average.toFixed(2)} / 5</div>
              </div>
              <div style={{ border: "1px solid #dfe5ec", borderRadius: "10px", padding: "14px", background: "#fff" }}>
                <div style={{ fontWeight: 700 }}>Resultado</div>
                <div style={{ fontSize: "18px", fontWeight: 800, marginTop: "8px" }}>{evolution.direction}</div>
                <div style={{ marginTop: "4px" }}>Variação: {evolution.overallDelta > 0 ? "+" : ""}{evolution.overallDelta.toFixed(2)}</div>
              </div>
            </div>

            <div style={{ marginTop: "12px", overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "650px" }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", padding: "10px", borderBottom: "1px solid #dfe5ec" }}>Fator</th>
                    <th style={{ textAlign: "center", padding: "10px", borderBottom: "1px solid #dfe5ec" }}>Anterior</th>
                    <th style={{ textAlign: "center", padding: "10px", borderBottom: "1px solid #dfe5ec" }}>Atual</th>
                    <th style={{ textAlign: "center", padding: "10px", borderBottom: "1px solid #dfe5ec" }}>Evolução</th>
                  </tr>
                </thead>
                <tbody>
                  {evolution.deltas.map((item) => (
                    <tr key={item.key}>
                      <td style={{ padding: "10px", borderBottom: "1px solid #eef1f4", fontWeight: 700 }}>{item.label}</td>
                      <td style={{ textAlign: "center", padding: "10px", borderBottom: "1px solid #eef1f4" }}>{item.previous} / 5</td>
                      <td style={{ textAlign: "center", padding: "10px", borderBottom: "1px solid #eef1f4" }}>{item.current} / 5</td>
                      <td style={{ textAlign: "center", padding: "10px", borderBottom: "1px solid #eef1f4", fontWeight: 800 }}>
                        {item.delta > 0 ? "+" : ""}{item.delta.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: "12px", padding: "14px", borderRadius: "10px", background: "#f5f7fa" }}>
              <p style={{ marginTop: 0 }}><strong>Melhoras:</strong> {evolution.improved.length ? evolution.improved.map((item) => `${item.label} (+${item.delta.toFixed(2)})`).join(", ") : "Nenhum fator apresentou melhora."}</p>
              <p><strong>Estáveis:</strong> {evolution.stable.length ? evolution.stable.map((item) => item.label).join(", ") : "Nenhum fator permaneceu estável."}</p>
              <p style={{ marginBottom: 0 }}><strong>Quedas:</strong> {evolution.declined.length ? evolution.declined.map((item) => `${item.label} (${item.delta.toFixed(2)})`).join(", ") : "Nenhum fator apresentou queda."}</p>
            </div>
          </>
        )}
      </section>

      <section className="panel" style={{ marginTop: "14px", minWidth: 0 }}>
        <h2>Observações</h2>
        <div style={{
          border: "1px solid #dfe5ec",
          borderRadius: "10px",
          padding: "14px",
          background: "#fff",
          whiteSpace: "pre-wrap",
          overflowWrap: "anywhere"
        }}>
          {String(lesson.notes || "")
            .replace(/\[AVALIAÇÃO PEDAGÓGICA\]\s*\{[\s\S]*\}/, "")
            .trim() || "Nenhuma observação adicional registrada."}
        </div>
      </section>
    </div>
  );
}

function Dashboard({ user, onLogout }) {
function StudentForm({ user, onBack }) {
  const [form, setForm] = useState({
    full_name: "",
    cpf: "",
    phone: "",
    category: "",
    start_date: "",
    lesson_goal: "",
    student_objective: "",
    contract_amount: "",
    notes: ""
  });

  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  function updateField(field, value) {
    setForm(prev => ({
      ...prev,
      [field]: value
    }));
  }

  async function saveStudent(e) {
    e.preventDefault();
    setMsg("");

    if (!supabase) {
      setMsg("Supabase não está configurado.");
      return;
    }

    if (!form.full_name.trim()) {
      setMsg("Informe o nome completo do aluno.");
      return;
    }

    if (
      form.lesson_goal &&
      (!Number.isInteger(Number(form.lesson_goal)) || Number(form.lesson_goal) <= 0)
    ) {
      setMsg("Informe uma quantidade inteira de aulas planejadas.");
      return;
    }

    setBusy(true);

    try {
      const { error } = await supabase
        .from("ai_students")
        .insert({
          user_id: user.id,
          full_name: form.full_name.trim(),
          cpf: form.cpf.trim() || null,
          phone: form.phone.trim() || null,
          category: form.category.trim() || null,
          start_date: form.start_date || null,
          lesson_goal: form.lesson_goal ? Number(form.lesson_goal) : null,
          contract_amount: form.contract_amount
            ? Number(form.contract_amount)
            : null,
          notes: [
            form.student_objective.trim()
              ? `Objetivo do aluno: ${form.student_objective.trim()}`
              : "",
            form.notes.trim()
              ? `Observações: ${form.notes.trim()}`
              : ""
          ].filter(Boolean).join("\n\n") || null
        });

      if (error) throw error;

      setMsg("Aluno cadastrado com sucesso.");

      setForm({
        full_name: "",
        cpf: "",
        phone: "",
        category: "",
        start_date: "",
        lesson_goal: "",
        student_objective: "",
        contract_amount: "",
        notes: ""
      });

    } catch (error) {
      console.error("Erro ao cadastrar aluno:", error);
      setMsg(error?.message || "Não foi possível cadastrar o aluno.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="app">
      <aside>
        <div className="brand small">
          AI <span>INSTRUTOR</span>
        </div>

        <button className="nav active">
          ALUNOS
        </button>

        <button className="nav" onClick={onBack}>
          VOLTAR
        </button>
      </aside>

      <main>
        <header>
          <div>
            <b>{user?.email}</b>
            <small>Cadastro de aluno</small>
          </div>

          <span className="pill">
            ALUNOS
          </span>
        </header>

        <section>
          <h1>Novo Aluno</h1>

          <form className="panel" onSubmit={saveStudent}>

            <h2>Dados do aluno</h2>

            <label>
              Nome completo
              <input
                value={form.full_name}
                onChange={e =>
                  updateField("full_name", e.target.value)
                }
                placeholder="Nome completo do aluno"
              />
            </label>

            <label>
              CPF
              <input
                value={form.cpf}
                onChange={e =>
                  updateField("cpf", e.target.value)
                }
                placeholder="CPF"
              />
            </label>

            <label>
              Telefone
              <input
                value={form.phone}
                onChange={e =>
                  updateField("phone", e.target.value)
                }
                placeholder="Telefone"
              />
            </label>

            <label>
              Categoria
              <input
                value={form.category}
                onChange={e =>
                  updateField("category", e.target.value)
                }
                placeholder="Ex.: B"
              />
            </label>

            <label>
              Data de início
              <input
                type="date"
                value={form.start_date}
                onChange={e =>
                  updateField("start_date", e.target.value)
                }
              />
            </label>

            <label>
              Quantidade planejada de aulas
              <input
                type="number"
                min="1"
                step="1"
                value={form.lesson_goal}
                onChange={e =>
                  updateField("lesson_goal", e.target.value)
                }
                placeholder="Ex.: 20"
              />
            </label>

            <label>
              Objetivo textual do aluno
              <textarea
                value={form.student_objective}
                onChange={e =>
                  updateField("student_objective", e.target.value)
                }
                placeholder="Ex.: preparação para exame"
              />
            </label>

            <label>
              Valor contratado
              <input
                type="number"
                step="0.01"
                value={form.contract_amount}
                onChange={e =>
                  updateField("contract_amount", e.target.value)
                }
                placeholder="0,00"
              />
            </label>

            <label>
              Observações
              <textarea
                value={form.notes}
                onChange={e =>
                  updateField("notes", e.target.value)
                }
                placeholder="Observações sobre o aluno"
              />
            </label>

            <div>
              <button type="submit" disabled={busy}>
                {busy ? "SALVANDO..." : "SALVAR ALUNO"}
              </button>

              <button
                type="button"
                className="link"
                onClick={onBack}
              >
                VOLTAR
              </button>
            </div>

            {msg && (
              <p className="msg">
                {msg}
              </p>
            )}

          </form>
        </section>
      </main>
    </div>
  );
}
  const [tab, setTab] = useState("dashboard");
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [activeLesson, setActiveLesson] = useState(null);
  const [showLessonHistory, setShowLessonHistory] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [showStudentForm, setShowStudentForm] = useState(false);
  const name = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Instrutor";
  const [selectedStudent, setSelectedStudent] = useState(null);
  const menu = [
    ["dashboard", "DASHBOARD"], ["alunos", "ALUNOS"], ["aulas", "AULAS"], ["hsi", "HSI-DOTH-P"],
    ["financeiro", "FINANCEIRO"], ["custos", "CUSTOS"], ["rpa", "RPA ÚNICO"], ["assinatura", "ASSINATURA"], ["perfil", "PERFIL"]
  ];
if (tab === "custos" && showVehicleForm) {
  return (
    <VehicleForm
      user={user}
      onBack={() => setShowVehicleForm(false)}
    />
  );
}
if (tab === "aulas" && showLessonForm) {
  return (
    <LessonForm
      user={user}
      onBack={() => setShowLessonForm(false)}
      onStarted={(lesson) => {
        setActiveLesson(lesson);
        setShowLessonForm(false);
      }}
    />
  );
}
if (tab === "aulas" && showLessonHistory && selectedLesson) {
  return (
    <LessonDetails
      lesson={selectedLesson}
      onBack={() => setSelectedLesson(null)}
    />
  );
}

if (tab === "aulas" && showLessonHistory) {
  return (
    <LessonHistory
      user={user}
      onBack={() => setShowLessonHistory(false)}
      onSelect={(lesson) => setSelectedLesson(lesson)}
    />
  );
}

if (tab === "aulas" && activeLesson) {
  return (
    <LessonRunning
      user={user}
      lesson={activeLesson}
      readOnly={false}
      onBack={() => {
        setActiveLesson(null);
        setTab("aulas");
      }}
      onCompleted={() => {
        setActiveLesson(null);
        setTab("aulas");
      }}
    />
  );
}
if (tab === "alunos" && showStudentForm) {
  return (
    <StudentForm
      user={user}
      onBack={() => setShowStudentForm(false)}
    />
  );
}
if (tab === "alunos" && !showStudentForm) {
  return (
    <div className="app">
      <aside>
        <div className="brand small">
          AI <span>INSTRUTOR</span>
        </div>

        {menu.map(([key, label]) => (
          <button
            key={key}
            className={tab === key ? "nav active" : "nav"}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}

        <button className="nav logout" onClick={onLogout}>
          SAIR
        </button>
      </aside>

      <main>
        <header>
          <div>
            <b>{user?.email}</b>
            <small>
              Assistente do Instrutor — acesso autenticado
            </small>
          </div>

          <span className="pill">
            ALUNOS
          </span>
        </header>

        <section>
          <h1>Alunos</h1>

          <StudentList
            user={user}
            onNewStudent={() => setShowStudentForm(true)}
            onSelectStudent={(student) => {
              setSelectedStudent(student);
              setTab("aulas");
            }}
          />
        </section>
      </main>
    </div>
  );
}
  function content() {
    const pages = {
  alunos: [
    "Alunos",
    "Cadastro, histórico de aulas e evolução do aluno.",
    "+ NOVO ALUNO"
  ],

  aulas: [
    "Aulas",
    "Início, término, quilometragem, avaliação e observações.",
    "+ INICIAR AULA"
  ],

  hsi: [
    "HSI-DOTH-P",
    "Avaliação dos fatores de decisão, organização, tempo, humanização e psicocomportamental.",
    "AGUARDANDO AVALIAÇÃO"
  ],

  financeiro: [
    "Financeiro",
    "Receitas, despesas e indicador de qualidade financeira.",
    "R$ 0,00"
  ],

  rpa: [
    "RPA ÚNICO",
    "Consolidação das aulas, desempenho, HSI-DOTH-P, qualidade pedagógica e indicadores financeiros.",
    "GERAR RELATÓRIO"
  ],

  assinatura: [
    "Assinatura e Licença",
    "Pagamento único planejado de R$ 50,00 para liberar a versão adquirida; atualizações serão tratadas separadamente.",
    "CONFIGURAR COMPRA"
  ]
};
if (tab === "rpa") {
  return (
    <RPAForm
      user={user}
      onBack={() => setTab("dashboard")}
    />
  );
}
    if (tab === "dashboard") return <><h1>Dashboard</h1><div className="grid">
      <div className="panel"><h2>Bem-vindo</h2><p>Olá, <strong>{name}</strong>.</p><p>Login e acesso autenticado pelo Supabase estão funcionando.</p></div>
      <div className="panel"><h2>Status da licença</h2><div className="metric">TESTE</div><p>Ambiente de desenvolvimento.</p></div>
      <div className="panel"><h2>Indicadores</h2><p>Qualidade das aulas: —</p><p>Qualidade financeira: —</p><p>Índice geral: —</p></div>
      <div className="panel"><h2>Próximas etapas</h2><ol><li>Cadastro profissional</li><li>Veículo</li><li>Aluno</li><li>Aula</li><li>HSI-DOTH-P</li><li>Financeiro</li><li>Licença</li></ol></div>
    </div></>;
    if (tab === "perfil") return <ProfileForm user={user} />;
if (tab === "custos") {
  return (
    <>
      <h1>Custos do Instrutor</h1>

      <div className="panel">
        <h2>Veículo e operação</h2>

        <p>
          Cadastre o veículo utilizado nas aulas para calcular
          automaticamente os custos operacionais.
        </p>

        <button onClick={() => setShowVehicleForm(true)}>
          + CADASTRAR VEÍCULO
        </button>
      </div>
    </>
  );
}
    const p = pages[tab];

if (p) {
  return (
    <>
      <h1>{p[0]}</h1>

      <div className="panel">
        <h2>{p[0]}</h2>

        <p>{p[1]}</p>

        {tab === "aulas" ? (
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button onClick={() => setShowLessonForm(true)}>
              + INICIAR AULA
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedLesson(null);
                setShowLessonHistory(true);
              }}
            >
              HISTÓRICO DE AULAS
            </button>
          </div>
        ) : tab === "custos" ? (
          <button onClick={() => setShowVehicleForm(true)}>
            + CADASTRAR VEÍCULO
          </button>
        ) : (
          <div className="metric">
            {p[2]}
          </div>
        )}
      </div>
    </>
  );
}

return null;
    return null;
  }

  return <div className="app"><aside><div className="brand small">AI <span>INSTRUTOR</span></div>
    {menu.map(([key, label]) => <button key={key} className={tab === key ? "nav active" : "nav"} onClick={() => setTab(key)}>{label}</button>)}
    <button className="nav logout" onClick={onLogout}>SAIR</button>
  </aside><main><header><div><b>{user?.email}</b><small>Assistente do Instrutor — acesso autenticado</small></div><span className="pill">AUTENTICADO</span></header><section>{content()}</section></main></div>;
}
function ProfileForm({ user }) {
  const [form, setForm] = useState({
    full_name: user?.user_metadata?.full_name || "",
    cpf: "",
    birth_date: "",
    phone: "",
    city: "",
    uf: "",
    credential: "",
    credential_uf: "",
    category: ""
  });

  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      setLoading(true);
      setMsg("");

      if (!supabase) {
        if (active) {
          setMsg("Supabase não está configurado.");
          setLoading(false);
        }
        return;
      }

      const { data, error } = await supabase
        .from("ai_profiles")
        .select("full_name, cpf, birth_date, phone, city, uf, credential, credential_uf, category")
        .eq("id", user.id)
        .maybeSingle();

      if (!active) return;

      if (error) {
        setMsg(error.message || "Não foi possível carregar o perfil.");
      } else if (!data) {
        setMsg("Perfil não encontrado. Nenhum registro foi criado automaticamente.");
      } else {
        setForm({
          full_name: data.full_name || user?.user_metadata?.full_name || "",
          cpf: data.cpf || "",
          birth_date: data.birth_date || "",
          phone: data.phone || "",
          city: data.city || "",
          uf: data.uf || "",
          credential: data.credential || "",
          credential_uf: data.credential_uf || "",
          category: data.category || ""
        });
      }

      setLoading(false);
    }

    loadProfile();
    return () => { active = false; };
  }, [user.id]);

  function updateField(field, value) {
    setForm(prev => ({
      ...prev,
      [field]: value
    }));
  }

  async function saveProfile(e) {
    e.preventDefault();
    setMsg("");

    if (!supabase) {
      setMsg("Supabase não está configurado.");
      return;
    }

    if (!form.full_name.trim()) {
      setMsg("Informe o nome completo.");
      return;
    }

    setBusy(true);

    try {
      const { error } = await supabase
        .from("ai_profiles")
        .update({
          full_name: form.full_name.trim(),
          cpf: form.cpf || null,
          birth_date: form.birth_date || null,
          phone: form.phone || null,
          city: form.city || null,
          uf: form.uf || null,
          credential: form.credential || null,
          credential_uf: form.credential_uf || null,
          category: form.category || null
        })
        .eq("id", user.id)
        .select("id")
        .single();

      if (error) throw error;

      setMsg("Cadastro salvo com sucesso.");
    } catch (error) {
      console.error("Erro ao salvar perfil:", error);
      setMsg(error?.message || "Não foi possível salvar o cadastro.");
    } finally {
      setBusy(false);
    }
  }

  const ufs = [
    "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA",
    "MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN",
    "RS","RO","RR","SC","SP","SE","TO"
  ];

  return (
    <>
      <h1>Perfil do Instrutor</h1>

      {loading && <div className="panel"><p>Carregando perfil...</p></div>}

      <form onSubmit={saveProfile}>

        <div className="panel">
          <h2>Dados da conta</h2>

          <p>
            <strong>E-mail:</strong> {user?.email}
          </p>

          <p>
            <strong>ID:</strong> {user?.id}
          </p>
        </div>

        <div className="panel">
          <h2>Dados pessoais</h2>

          <label>Nome completo</label>
          <input
            type="text"
            value={form.full_name}
            onChange={e => updateField("full_name", e.target.value)}
            placeholder="Nome completo"
          />

          <label>CPF</label>
          <input
            type="text"
            value={form.cpf}
            onChange={e => updateField("cpf", e.target.value)}
            placeholder="000.000.000-00"
          />

          <label>Data de nascimento</label>
          <input
            type="date"
            value={form.birth_date}
            onChange={e => updateField("birth_date", e.target.value)}
          />

          <label>Telefone</label>
          <input
            type="tel"
            value={form.phone}
            onChange={e => updateField("phone", e.target.value)}
            placeholder="(00) 00000-0000"
          />

          <label>Cidade</label>
          <input
            type="text"
            value={form.city}
            onChange={e => updateField("city", e.target.value)}
            placeholder="Cidade"
          />

          <label>UF</label>
          <select
            value={form.uf}
            onChange={e => updateField("uf", e.target.value)}
          >
            <option value="">Selecione</option>
            {ufs.map(uf => (
              <option key={uf} value={uf}>
                {uf}
              </option>
            ))}
          </select>
        </div>

        <div className="panel">
          <h2>Dados profissionais</h2>

          <label>Credencial do Instrutor</label>
          <input
            type="text"
            value={form.credential}
            onChange={e => updateField("credential", e.target.value)}
            placeholder="Número da credencial"
          />

          <label>UF da credencial</label>
          <select
            value={form.credential_uf}
            onChange={e => updateField("credential_uf", e.target.value)}
          >
            <option value="">Selecione</option>
            {ufs.map(uf => (
              <option key={uf} value={uf}>
                {uf}
              </option>
            ))}
          </select>

          <label>Categoria</label>
          <select
            value={form.category}
            onChange={e => updateField("category", e.target.value)}
          >
            <option value="">Selecione</option>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="A/B">A/B</option>
            <option value="C">C</option>
            <option value="D">D</option>
            <option value="E">E</option>
          </select>

          <br />

          <button type="submit" disabled={busy || loading}>
            {busy ? "SALVANDO..." : loading ? "CARREGANDO..." : "SALVAR CADASTRO"}
          </button>

          {msg && (
            <p className="msg">
              {msg}
            </p>
          )}
        </div>

      </form>
    </>
  );
}
function VehicleForm({ user, onBack }) {
  const [form, setForm] = useState({
    brand: "",
    model: "",
    year: "",
    plate: "",
    fuel: "",
    consumption: "",
    current_km: "",
    purchase_value: "",
    current_value: "",
    ipva_year: "",
    licensing_year: "",
    insurance_year: "",
    maintenance_year: "",
    tires_year: "",
    other_costs_year: ""
  });

  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  function update(field, value) {
    setForm(prev => ({
      ...prev,
      [field]: value
    }));
  }

  async function saveVehicle(e) {
    e.preventDefault();
    setMsg("");

    if (!supabase) {
      setMsg("Supabase não está configurado.");
      return;
    }

    if (!form.brand || !form.model || !form.year || !form.plate) {
      setMsg("Preencha marca, modelo, ano e placa.");
      return;
    }

    setBusy(true);

    try {
      const { error } = await supabase
        .from("ai_vehicles")
        .insert({
          user_id: user.id,
          brand: form.brand,
model: form.model,
model_year: form.year ? Number(form.year) : null,
plate: form.plate.toUpperCase(),
fuel_type: form.fuel || null,
consumption_km_l: form.consumption
  ? Number(form.consumption)
  : null,
current_km: form.current_km
  ? Number(form.current_km)
  : null,
insurance_annual: form.insurance_year
  ? Number(form.insurance_year)
  : 0,
taxes_annual: (
  Number(form.ipva_year || 0) +
  Number(form.licensing_year || 0)
),
other_annual: (
  Number(form.maintenance_year || 0) +
  Number(form.tires_year || 0) +
  Number(form.other_costs_year || 0)
)
        });
      if (error) throw error;

      setMsg("Veículo cadastrado com sucesso.");

      setForm({
        brand: "",
        model: "",
        year: "",
        plate: "",
        fuel: "",
        consumption: "",
        current_km: "",
        purchase_value: "",
        current_value: "",
        ipva_year: "",
        licensing_year: "",
        insurance_year: "",
        maintenance_year: "",
        tires_year: "",
        other_costs_year: ""
      });

    } catch (error) {
      console.error("Erro ao cadastrar veículo:", error);
      setMsg(error?.message || "Não foi possível cadastrar o veículo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <h1>Cadastro do Veículo</h1>

      <form onSubmit={saveVehicle}>

        <div className="panel">
          <h2>Identificação</h2>

          <label>Marca</label>
          <input
            value={form.brand}
            onChange={e => update("brand", e.target.value)}
            placeholder="Ex.: Toyota"
          />

          <label>Modelo</label>
          <input
            value={form.model}
            onChange={e => update("model", e.target.value)}
            placeholder="Ex.: Yaris"
          />

          <label>Ano</label>
          <input
            type="number"
            value={form.year}
            onChange={e => update("year", e.target.value)}
            placeholder="2026"
          />

          <label>Placa</label>
          <input
            value={form.plate}
            onChange={e => update("plate", e.target.value)}
            placeholder="ABC1D23"
          />
        </div>

        <div className="panel">
          <h2>Operação</h2>

          <label>Combustível</label>
          <select
            value={form.fuel}
            onChange={e => update("fuel", e.target.value)}
          >
            <option value="">Selecione</option>
            <option value="Gasolina">Gasolina</option>
            <option value="Etanol">Etanol</option>
            <option value="Flex">Flex</option>
            <option value="Diesel">Diesel</option>
            <option value="GNV">GNV</option>
            <option value="Elétrico">Elétrico</option>
            <option value="Híbrido">Híbrido</option>
          </select>

          <label>Consumo médio (km/L)</label>
          <input
            type="number"
            step="0.01"
            value={form.consumption}
            onChange={e => update("consumption", e.target.value)}
          />

          <label>Quilometragem atual</label>
          <input
            type="number"
            value={form.current_km}
            onChange={e => update("current_km", e.target.value)}
          />
        </div>

        <div className="panel">
          <h2>Custos anuais</h2>

          <label>Valor de aquisição</label>
          <input
            type="number"
            step="0.01"
            value={form.purchase_value}
            onChange={e => update("purchase_value", e.target.value)}
          />

          <label>Valor atual estimado</label>
          <input
            type="number"
            step="0.01"
            value={form.current_value}
            onChange={e => update("current_value", e.target.value)}
          />

          <label>IPVA anual</label>
          <input
            type="number"
            step="0.01"
            value={form.ipva_year}
            onChange={e => update("ipva_year", e.target.value)}
          />

          <label>Licenciamento anual</label>
          <input
            type="number"
            step="0.01"
            value={form.licensing_year}
            onChange={e => update("licensing_year", e.target.value)}
          />

          <label>Seguro anual</label>
          <input
            type="number"
            step="0.01"
            value={form.insurance_year}
            onChange={e => update("insurance_year", e.target.value)}
          />

          <label>Manutenção anual</label>
          <input
            type="number"
            step="0.01"
            value={form.maintenance_year}
            onChange={e => update("maintenance_year", e.target.value)}
          />

          <label>Pneus anual</label>
          <input
            type="number"
            step="0.01"
            value={form.tires_year}
            onChange={e => update("tires_year", e.target.value)}
          />

          <label>Outros custos anuais</label>
          <input
            type="number"
            step="0.01"
            value={form.other_costs_year}
            onChange={e => update("other_costs_year", e.target.value)}
          />
        </div>

        <div className="panel">
          <button type="submit" disabled={busy}>
            {busy ? "SALVANDO..." : "SALVAR VEÍCULO"}
          </button>

          <button
            type="button"
            className="link"
            onClick={onBack}
          >
            VOLTAR
          </button>

          {msg && (
            <p className="msg">
              {msg}
            </p>
          )}
        </div>

      </form>
    </>
  );
}
function Root() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [configError, setConfigError] = useState("");

  useEffect(() => {
    let mounted = true;
    if (!supabase) { setConfigError("Supabase não configurado. Verifique VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env."); setLoading(false); return; }
    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return;
      if (error) console.error("Erro ao recuperar sessão:", error);
      setUser(data?.session?.user ?? null); setLoading(false);
    }).catch(error => { console.error("Erro Supabase:", error); if (mounted) { setUser(null); setLoading(false); } });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => { if (mounted) { setUser(session?.user ?? null); setLoading(false); } });
    return () => { mounted = false; subscription?.unsubscribe(); };
  }, []);

  async function logout() { if (supabase) await supabase.auth.signOut(); setUser(null); }
  if (loading) return <div className="auth"><div className="card"><h1>Assistente do Instrutor</h1><p>Verificando acesso...</p></div></div>;
  if (configError) return <div className="auth"><div className="card"><h1>Configuração necessária</h1><p className="msg">{configError}</p></div></div>;
  return user ? <Dashboard user={user} onLogout={logout} /> : <Auth onAuth={setUser} />;
}

const rootElement = document.getElementById("root");
if (!rootElement) {
  document.body.innerHTML = '<div style="padding:40px;font-family:Arial"><h1>Erro</h1><p>Elemento #root não encontrado.</p></div>';
} else {
  createRoot(rootElement).render(<React.StrictMode><Root /></React.StrictMode>);
}

