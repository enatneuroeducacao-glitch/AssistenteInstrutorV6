import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { createClient } from "@supabase/supabase-js";
import "./style.css";
import RPAForm from "./RPAForm";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

function ENATLogo({ compact = false }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: compact ? "2px" : "5px",
        lineHeight: 1,
        userSelect: "none"
      }}
      aria-label="ENAT"
    >
      <img
        src="/enat-logo.png"
        alt="ENAT — Ensino Neuroeducacional Aplicado ao Trânsito"
        style={{
          display: "block",
          width: compact ? "108px" : "210px",
          maxWidth: "100%",
          height: "auto",
          objectFit: "contain"
        }}
      />
      {!compact && (
        <div
          style={{
            fontSize: "10px",
            fontWeight: 800,
            letterSpacing: "0.08em",
            color: "#55BFEF",
            textAlign: "center",
            textTransform: "uppercase"
          }}
        >
          Ensino Neuroeducacional Aplicado ao Trânsito
        </div>
      )}
    </div>
  );
}

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
    <div
      style={{
        width: "100%",
        maxWidth: "420px",
        padding: "20px 22px 18px",
        borderRadius: "16px",
        background: "#05080d",
        border: "1px solid rgba(85,191,239,0.22)",
        boxShadow: "0 14px 36px rgba(0,0,0,0.18)",
        marginBottom: "14px",
        boxSizing: "border-box"
      }}
    >
      <ENATLogo />
      <div style={{
        marginTop: "10px",
        textAlign: "center",
        color: "#fff",
        fontSize: "17px",
        fontWeight: 900,
        letterSpacing: "0.01em"
      }}>
        ENAT - Assistente do Instrutor
      </div>
    </div>
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
      <div className="panel" style={{
        background: "linear-gradient(135deg, #f7faff 0%, #ffffff 70%)",
        border: "1px solid #dfe7f2"
      }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "16px",
          flexWrap: "wrap"
        }}>
          <div>
            <div style={{ fontSize: "11px", fontWeight: 800, letterSpacing: "0.08em", opacity: 0.65 }}>
              AULAS / NOVA AULA
            </div>
            <h1 style={{ marginBottom: "6px" }}>Iniciar nova aula</h1>
            <p style={{ margin: 0 }}>Preencha os dados abaixo. Depois, o sistema conduzirá você pelas cinco fases da aula.</p>
          </div>
          <button type="button" onClick={onBack}>VOLTAR</button>
        </div>
      </div>

      <div className="panel">
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: "10px"
        }}>
          {[
            ["1", "ALUNO", "Selecione quem fará a aula"],
            ["2", "VEÍCULO", "Escolha o veículo utilizado"],
            ["3", "QUILOMETRAGEM", "Informe o KM inicial"]
          ].map(([number, title, description]) => (
            <div key={number} style={{
              padding: "12px",
              border: "1px solid #e1e7ef",
              borderRadius: "10px",
              background: "#fbfcfe"
            }}>
              <div style={{ fontSize: "11px", fontWeight: 800, opacity: 0.6 }}>ETAPA {number}</div>
              <div style={{ marginTop: "4px", fontWeight: 800 }}>{title}</div>
              <div style={{ marginTop: "4px", fontSize: "11px", opacity: 0.7 }}>{description}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="panel">
        <h2 style={{ marginBottom: "4px" }}>1. Identificação da aula</h2>
        <p style={{ marginTop: 0 }}>Defina aluno e veículo antes de iniciar.</p>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: "14px"
        }}>
          <div>
            <label>Aluno</label>
            <select value={studentId} onChange={(e) => setStudentId(e.target.value)}>
              <option value="">Selecione o aluno</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>{student.full_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label>Veículo</label>
            <select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
              <option value="">Selecione o veículo</option>
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.brand} {vehicle.model} — {vehicle.plate}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="panel">
        <h2 style={{ marginBottom: "4px" }}>2. Quilometragem</h2>
        <p style={{ marginTop: 0 }}>Registre o odômetro no momento do início da aula.</p>
        <div style={{ maxWidth: "360px" }}>
          <label>KM inicial</label>
          <input
            type="number"
            min="0"
            step="0.1"
            value={kmStart}
            onChange={(e) => setKmStart(e.target.value)}
            placeholder="Ex.: 45230"
          />
        </div>
      </div>

      <div className="panel">
        <h2 style={{ marginBottom: "4px" }}>3. Objetivo da aula</h2>
        <p style={{ marginTop: 0 }}>Defina o foco principal que deverá ser observado durante a aula.</p>
        <textarea
          rows="4"
          value={objective}
          onChange={(e) => setObjective(e.target.value)}
          placeholder="Ex.: trabalhar baliza, saída em aclive, percepção de risco..."
        />
      </div>

      <div className="panel" style={{
        background: "#f7faff",
        border: "1px solid #d8e4f4"
      }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
          flexWrap: "wrap"
        }}>
          <div>
            <div style={{ fontWeight: 800 }}>Pronto para começar?</div>
            <div style={{ fontSize: "12px", marginTop: "4px", opacity: 0.75 }}>
              A aula será criada na fase 1 — Preparação.
            </div>
          </div>
          <button type="button" onClick={startLesson} disabled={busy}>
            {busy ? "INICIANDO..." : "INICIAR AULA"}
          </button>
        </div>

        {msg && <p className="msg" style={{ marginBottom: 0 }}>{msg}</p>}
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
  if (value < 2) return { key: "critical", label: "CRÍTICO", description: "Necessita intervenção andragógica prioritária." };
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
      diagnosis: "A avaliação andragógica está incompleta.",
      next_lesson_recommendation: "Concluir os cinco fatores antes de gerar a recomendação para a próxima aula.",
      next_lesson_objective: "Completar a avaliação andragógica e identificar os principais fatores de desenvolvimento.",
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
    `A prioridade andragógica para a próxima aula é ${priorityText}.`;

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
      setMessage("Preencha todos os itens da avaliação andragógica antes de concluir a aula.");
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

    const evaluationNote = `[AVALIAÇÃO ANDRAGÓGICA] ${JSON.stringify(pedagogicalEvaluation)}`;
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
      <div className="panel" style={{
        background: "linear-gradient(135deg, #f7faff 0%, #ffffff 70%)",
        border: "1px solid #dfe7f2"
      }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "16px",
          flexWrap: "wrap"
        }}>
          <div>
            <div style={{ fontSize: "11px", fontWeight: 800, letterSpacing: "0.08em", opacity: 0.65 }}>
              AULAS / {readOnly ? "VISUALIZAÇÃO" : "AULA EM ANDAMENTO"}
            </div>
            <h1 style={{ marginBottom: "6px" }}>{readOnly ? "Visualização da aula" : "Aula em andamento"}</h1>
            <p style={{ margin: 0 }}>
              {readOnly ? "Consulta somente leitura dos registros da aula." : "Siga as fases na ordem e finalize com a avaliação andragógica."}
            </p>
          </div>
          <button type="button" onClick={onBack} disabled={busy}>VOLTAR</button>
        </div>
      </div>

      <div className="panel">
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, minmax(120px, 1fr))",
          gap: "10px"
        }}>
          {[
            ["ALUNO", currentLesson?.ai_students?.full_name || currentLesson?.student_name || "Aluno selecionado"],
            ["VEÍCULO", currentLesson?.ai_vehicles ? `${currentLesson.ai_vehicles.brand || ""} ${currentLesson.ai_vehicles.model || ""}`.trim() : "Veículo selecionado"],
            ["STATUS", status === "completed" ? "CONCLUÍDA" : status === "paused" ? "PAUSADA" : "EM ANDAMENTO"],
            ["KM INICIAL", currentLesson?.km_start ?? "—"],
            ["DURAÇÃO", elapsedMinutes() != null ? `${elapsedMinutes()} min` : "—"]
          ].map(([label, value]) => (
            <div key={label} style={{
              padding: "12px",
              border: "1px solid #e1e7ef",
              borderRadius: "10px",
              background: "#fbfcfe"
            }}>
              <div style={{ fontSize: "10px", fontWeight: 800, opacity: 0.6 }}>{label}</div>
              <div style={{ marginTop: "5px", fontWeight: 800, fontSize: "13px" }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="panel">
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
          flexWrap: "wrap"
        }}>
          <div>
            <h2 style={{ marginBottom: "4px" }}>Progresso da aula</h2>
            <p style={{ marginTop: 0 }}>A fase amarela é a atual; verde indica concluída; vermelho indica a próxima.</p>
          </div>
          <div style={{
            padding: "8px 12px",
            borderRadius: "999px",
            background: "#fff8e1",
            border: "1px solid #ffe082",
            fontSize: "11px",
            fontWeight: 800
          }}>
            FASE {currentPhase} DE 5
          </div>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, minmax(125px, 1fr))",
          gap: "8px",
          overflowX: "auto",
          paddingBottom: "4px"
        }}>
          {LESSON_PHASES.map((phase) => {
            const phaseClass = getLessonPhaseClass(phase.id, currentPhase, status);
            const styles = {
              completed: { background: "#e8f5e9", border: "2px solid #66bb6a", color: "#1b5e20" },
              current: { background: "#fff8e1", border: "2px solid #f9a825", color: "#8a5a00" },
              next: { background: "#ffebee", border: "2px solid #ef9a9a", color: "#b71c1c" }
            };
            return (
              <div key={phase.id} style={{
                ...styles[phaseClass],
                borderRadius: "10px",
                padding: "12px",
                minWidth: "125px"
              }}>
                <div style={{ fontSize: "10px", fontWeight: 800 }}>FASE {phase.id}</div>
                <div style={{ marginTop: "4px", fontWeight: 800, fontSize: "12px" }}>{phase.label}</div>
                <div style={{ marginTop: "4px", fontSize: "10px" }}>
                  {phaseClass === "completed" ? "✓ CONCLUÍDA" : phaseClass === "current" ? "● ATUAL" : "○ PRÓXIMA"}
                </div>
              </div>
            );
          })}
        </div>

        {!readOnly && (
          <div style={{
            marginTop: "14px",
            padding: "12px",
            borderRadius: "10px",
            background: "#f7faff",
            border: "1px solid #d8e4f4"
          }}>
            <div style={{ fontSize: "10px", fontWeight: 800, opacity: 0.65 }}>AÇÃO DA FASE ATUAL</div>
            <div style={{ marginTop: "4px", fontWeight: 800 }}>{lessonPhaseLabel(currentPhase)}</div>
            <div style={{ marginTop: "4px", fontSize: "11px", opacity: 0.75 }}>
              {currentPhase < 5 ? "Conclua esta etapa para liberar a próxima fase." : "Complete a avaliação, informe o KM final e conclua a aula."}
            </div>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "10px" }}>
              {status === "paused" ? (
                <button type="button" onClick={resumeLesson} disabled={busy}>RETOMAR AULA</button>
              ) : (
                <button type="button" onClick={pauseLesson} disabled={busy || isFinished}>PAUSAR AULA</button>
              )}
              <button
                type="button"
                onClick={advancePhase}
                disabled={busy || isFinished || status === "paused" || currentPhase >= 5}
              >
                {currentPhase < 5 ? `CONCLUIR ${lessonPhaseLabel(currentPhase)}` : "FASE FINAL"}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="panel">
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
          flexWrap: "wrap"
        }}>
          <div>
            <h2 style={{ marginBottom: "4px" }}>Avaliação andragógica</h2>
            <p style={{ marginTop: 0 }}>Avalie os cinco fatores de 1 a 5. Este resultado alimenta o diagnóstico da aula.</p>
          </div>
          <div style={{
            padding: "9px 13px",
            borderRadius: "10px",
            background: evaluationComplete ? "#e8f5e9" : "#fff8e1",
            color: evaluationComplete ? "#1b5e20" : "#8a5a00",
            border: evaluationComplete ? "1px solid #a5d6a7" : "1px solid #ffe082",
            fontWeight: 800,
            fontSize: "12px"
          }}>
            {evaluationComplete ? `MÉDIA ${evaluationAverage.toFixed(2)} / 5` : "PREENCHIMENTO PENDENTE"}
          </div>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, minmax(150px, 1fr))",
          gap: "10px",
          overflowX: "auto",
          paddingBottom: "4px"
        }}>
          {evaluationItems.map((item) => (
            <div key={item.key} style={{
              border: "1px solid #dfe5ec",
              borderRadius: "10px",
              padding: "12px",
              background: "#fff",
              minWidth: "150px"
            }}>
              <div style={{ fontWeight: 800, fontSize: "12px" }}>{item.label}</div>
              <div style={{ fontSize: "10px", opacity: 0.65, marginTop: "4px", minHeight: "30px" }}>{item.description}</div>
              <div style={{ display: "flex", gap: "5px", marginTop: "10px" }}>
                {[1,2,3,4,5].map((value) => {
                  const selected = Number(evaluation[item.key]) === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setEvaluationValue(item.key, value)}
                      disabled={readOnly || busy || isFinished}
                      style={{
                        minWidth: "30px",
                        padding: "7px 5px",
                        borderRadius: "7px",
                        border: selected ? "2px solid #2457a6" : "1px solid #ccd4df",
                        background: selected ? "#e8f0ff" : "#fff",
                        color: "#18345f",
                        fontWeight: selected ? 800 : 600
                      }}
                    >{value}</button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {evaluationComplete && (
          <div style={{
            marginTop: "12px",
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: "12px"
          }}>
            <div style={{ border: "1px solid #dfe5ec", borderRadius: "10px", padding: "13px", background: "#fbfcfe" }}>
              <div style={{ fontWeight: 800 }}>Diagnóstico da aula</div>
              <div style={{ marginTop: "7px", fontSize: "12px", lineHeight: 1.5 }}>
                <strong>{pedagogicalAnalysis.classification.label}</strong>{" — "}{pedagogicalAnalysis.diagnosis}
              </div>
            </div>
            <div style={{ border: "1px solid #dfe5ec", borderRadius: "10px", padding: "13px", background: "#fbfcfe" }}>
              <div style={{ fontWeight: 800 }}>Preparar próxima aula</div>
              <div style={{ marginTop: "7px", fontSize: "12px", lineHeight: 1.5 }}>{pedagogicalAnalysis.next_lesson_recommendation}</div>
              <div style={{ marginTop: "8px", paddingTop: "8px", borderTop: "1px solid #edf0f4", fontSize: "12px" }}>
                <strong>Objetivo:</strong> {pedagogicalAnalysis.next_lesson_objective}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="panel">
        <h2 style={{ marginBottom: "4px" }}>Finalização da aula</h2>
        <p style={{ marginTop: 0 }}>Na Parada Segura, informe o KM final e registre observações.</p>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: "14px"
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
            <label>Distância percorrida</label>
            <div style={{
              padding: "10px 12px",
              border: "1px solid #ddd",
              borderRadius: "6px",
              minHeight: "20px",
              background: "#fbfcfe"
            }}>
              {Number.isFinite(distance) ? `${distance.toFixed(1)} km` : "—"}
            </div>
          </div>
        </div>

        <div style={{ marginTop: "12px" }}>
          <label>Observações da aula</label>
          <textarea rows="4" value={notes} onChange={(e) => setNotes(e.target.value)} disabled={readOnly || busy || isFinished} />
        </div>

        {!readOnly && (
          <div style={{ marginTop: "14px", display: "flex", justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={completeLesson}
              disabled={busy || isFinished || status === "paused" || currentPhase !== 5}
            >
              CONCLUIR AULA
            </button>
          </div>
        )}

        {isFinished && <p style={{ marginTop: "12px" }}>Esta aula está encerrada e não pode ser alterada por esta tela.</p>}
      </div>

      {message && <div className="panel"><p className="msg">{message}</p></div>}
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
    const match = String(lesson.notes || "").match(/\[AVALIAÇÃO ANDRAGÓGICA\]\s*(\{[\s\S]*\})/);
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
            const match = String(notes || "").match(/\[AVALIAÇÃO ANDRAGÓGICA\]\s*(\{[\s\S]*\})/);
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
        console.error("Erro ao calcular evolução andragógica:", error);
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

      <section className="panel" style={{ margin: 0, minWidth: 0 }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "minmax(240px, 1.4fr) repeat(4, minmax(130px, 1fr))",
          gap: "12px",
          alignItems: "stretch"
        }}>
          <div style={{ padding: "4px 6px" }}>
            <div style={{ fontSize: "12px", opacity: 0.65, fontWeight: 700 }}>ALUNO</div>
            <div style={{ fontSize: "20px", fontWeight: 800, marginTop: "5px" }}>
              {student?.full_name || "Não informado"}
            </div>
            <div style={{ marginTop: "6px", opacity: 0.78 }}>
              {vehicle
                ? `${vehicle.brand || ""} ${vehicle.model || ""}${vehicle.plate ? ` — ${vehicle.plate}` : ""}`.trim()
                : "Veículo não informado"}
            </div>
          </div>
          <div style={{ padding: "10px", borderLeft: "1px solid #e5e9ef" }}>
            <div style={{ fontSize: "11px", opacity: 0.65, fontWeight: 700 }}>STATUS</div>
            <strong>{statusLabel(lesson.status)}</strong>
          </div>
          <div style={{ padding: "10px", borderLeft: "1px solid #e5e9ef" }}>
            <div style={{ fontSize: "11px", opacity: 0.65, fontWeight: 700 }}>FASE</div>
            <strong>{phaseLabel(lesson.phase)}</strong>
          </div>
          <div style={{ padding: "10px", borderLeft: "1px solid #e5e9ef" }}>
            <div style={{ fontSize: "11px", opacity: 0.65, fontWeight: 700 }}>DISTÂNCIA</div>
            <strong>{lesson.km_start != null && lesson.km_end != null
              ? `${Number(lesson.km_end) - Number(lesson.km_start)} km`
              : "—"}</strong>
          </div>
          <div style={{ padding: "10px", borderLeft: "1px solid #e5e9ef" }}>
            <div style={{ fontSize: "11px", opacity: 0.65, fontWeight: 700 }}>DURAÇÃO</div>
            <strong>{lesson.duration_minutes != null ? `${lesson.duration_minutes} min` : "—"}</strong>
          </div>
        </div>
        <div style={{
          marginTop: "14px",
          paddingTop: "12px",
          borderTop: "1px solid #e5e9ef",
          display: "flex",
          gap: "24px",
          flexWrap: "wrap",
          fontSize: "14px"
        }}>
          <span><strong>KM inicial:</strong> {lesson.km_start ?? "Não informado"}</span>
          <span><strong>KM final:</strong> {lesson.km_end ?? "Não informado"}</span>
          <span><strong>Início:</strong> {formatDate(lesson.started_at)}</span>
          <span><strong>Término:</strong> {formatDate(lesson.ended_at)}</span>
        </div>
      </section>

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

      <section className="panel" style={{
        marginTop: "14px",
        minWidth: 0,
        background: "linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)"
      }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "14px",
          flexWrap: "wrap",
          marginBottom: "16px"
        }}>
          <div>
            <div style={{
              fontSize: "11px",
              fontWeight: 800,
              letterSpacing: "0.08em",
              color: "#2457a6",
              marginBottom: "4px"
            }}>
              RESULTADO ANDRAGÓGICO
            </div>
            <h2 style={{ margin: 0 }}>Avaliação andragógica</h2>
            <p style={{ margin: "5px 0 0", opacity: 0.7 }}>
              Leitura rápida dos cinco fatores observados durante a aula.
            </p>
          </div>

          {resolvedPedagogicalEvaluation && (
            <div style={{
              minWidth: "150px",
              padding: "10px 14px",
              borderRadius: "12px",
              background: "#eef4ff",
              border: "1px solid #cddcf7",
              textAlign: "center"
            }}>
              <div style={{ fontSize: "10px", fontWeight: 800, opacity: 0.65 }}>
                MÉDIA DA AULA
              </div>
              <div style={{
                marginTop: "3px",
                fontSize: "22px",
                fontWeight: 900,
                color: "#18345f"
              }}>
                {resolvedPedagogicalEvaluation.average != null
                  ? `${Number(resolvedPedagogicalEvaluation.average).toFixed(2)} / 5`
                  : "—"}
              </div>
            </div>
          )}
        </div>

        {resolvedPedagogicalEvaluation ? (
          <>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(175px, 1fr))",
              gap: "10px"
            }}>
              {Object.entries(evaluationLabels).map(([key, label]) => {
                const score = Number(resolvedPedagogicalEvaluation[key] || 0);
                const percentage = Math.max(0, Math.min(100, score * 20));
                const isStrong = score >= 4;
                const isDevelopment = score <= 3;

                return (
                  <div key={key} style={{
                    border: `1px solid ${isStrong ? "#c8e6c9" : isDevelopment ? "#ffe0b2" : "#dfe5ec"}`,
                    borderRadius: "12px",
                    padding: "14px",
                    background: isStrong ? "#f5fff6" : isDevelopment ? "#fffaf3" : "#ffffff",
                    boxSizing: "border-box"
                  }}>
                    <div style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: "8px"
                    }}>
                      <div style={{ fontWeight: 800, fontSize: "12px" }}>{label}</div>
                      <div style={{
                        fontSize: "18px",
                        lineHeight: 1,
                        fontWeight: 900,
                        color: isStrong ? "#2e7d32" : isDevelopment ? "#b26a00" : "#18345f"
                      }}>
                        {score}<span style={{ fontSize: "10px", opacity: 0.65 }}> / 5</span>
                      </div>
                    </div>

                    <div style={{
                      height: "7px",
                      marginTop: "12px",
                      borderRadius: "999px",
                      background: "#e9eef5",
                      overflow: "hidden"
                    }}>
                      <div style={{
                        width: `${percentage}%`,
                        height: "100%",
                        borderRadius: "999px",
                        background: isStrong
                          ? "#66bb6a"
                          : isDevelopment
                            ? "#f9a825"
                            : "#5c86c7"
                      }} />
                    </div>

                    <div style={{
                      marginTop: "8px",
                      fontSize: "10px",
                      fontWeight: 700,
                      opacity: 0.68
                    }}>
                      {isStrong ? "PONTO FORTE" : isDevelopment ? "DESENVOLVIMENTO" : "CONSOLIDAÇÃO"}
                    </div>
                  </div>
                );
              })}
            </div>

            {(pedagogicalBand || pedagogicalDiagnosis) && (
              <div style={{
                marginTop: "14px",
                display: "grid",
                gridTemplateColumns: "minmax(180px, 0.7fr) minmax(0, 2.3fr)",
                gap: "12px",
                alignItems: "stretch"
              }}>
                <div style={{
                  padding: "16px",
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, #18345f 0%, #2457a6 100%)",
                  color: "#fff",
                  boxSizing: "border-box"
                }}>
                  <div style={{
                    fontSize: "10px",
                    fontWeight: 800,
                    letterSpacing: "0.08em",
                    opacity: 0.78
                  }}>
                    CLASSIFICAÇÃO
                  </div>
                  <div style={{
                    fontSize: "24px",
                    fontWeight: 900,
                    marginTop: "8px"
                  }}>
                    {pedagogicalBand?.label || "NÃO INFORMADA"}
                  </div>
                  <div style={{
                    fontSize: "11px",
                    lineHeight: 1.45,
                    marginTop: "8px",
                    opacity: 0.82
                  }}>
                    {pedagogicalBand?.description || "Resultado andragógico da aula."}
                  </div>
                </div>

                <div style={{
                  padding: "16px",
                  borderRadius: "12px",
                  background: "#ffffff",
                  border: "1px solid #dfe5ec",
                  boxSizing: "border-box"
                }}>
                  <div style={{
                    fontWeight: 900,
                    fontSize: "13px",
                    color: "#18345f"
                  }}>
                    DIAGNÓSTICO DA AULA
                  </div>
                  <p style={{
                    margin: "8px 0 0",
                    lineHeight: 1.6,
                    fontSize: "13px"
                  }}>
                    {pedagogicalDiagnosis || "Não informado."}
                  </p>
                </div>
              </div>
            )}

            {(nextLessonRecommendation || nextLessonObjective) && (
              <div style={{
                marginTop: "14px",
                padding: "16px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #fffaf0 0%, #fff 100%)",
                border: "1px solid #f1d28a"
              }}>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "9px",
                  fontWeight: 900,
                  color: "#7a5200"
                }}>
                  <span style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "26px",
                    height: "26px",
                    borderRadius: "50%",
                    background: "#fff0c2",
                    fontSize: "14px"
                  }}>
                    →
                  </span>
                  PRÓXIMA AULA
                </div>

                <div style={{
                  marginTop: "12px",
                  display: "grid",
                  gridTemplateColumns: "minmax(0, 1.6fr) minmax(220px, 0.9fr)",
                  gap: "12px"
                }}>
                  <div style={{
                    padding: "13px",
                    borderRadius: "10px",
                    background: "#fff",
                    border: "1px solid #f0e3bf"
                  }}>
                    <div style={{ fontSize: "10px", fontWeight: 800, opacity: 0.62 }}>
                      RECOMENDAÇÃO
                    </div>
                    <div style={{
                      marginTop: "6px",
                      fontSize: "13px",
                      lineHeight: 1.6
                    }}>
                      {nextLessonRecommendation || "Não informada."}
                    </div>
                  </div>

                  <div style={{
                    padding: "13px",
                    borderRadius: "10px",
                    background: "#fff",
                    border: "1px solid #f0e3bf"
                  }}>
                    <div style={{ fontSize: "10px", fontWeight: 800, opacity: 0.62 }}>
                      OBJETIVO SUGERIDO
                    </div>
                    <div style={{
                      marginTop: "6px",
                      fontSize: "13px",
                      lineHeight: 1.6,
                      fontWeight: 700,
                      color: "#18345f"
                    }}>
                      {nextLessonObjective || "Não informado."}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div style={{
            padding: "18px",
            borderRadius: "12px",
            background: "#fff8e1",
            border: "1px solid #ffe082"
          }}>
            <strong>Avaliação ainda não disponível.</strong>
            <div style={{ marginTop: "5px", fontSize: "12px", opacity: 0.75 }}>
              Nenhuma avaliação andragógica estruturada foi encontrada nesta aula.
            </div>
          </div>
        )}
      </section>

      <section className="panel" style={{
        marginTop: "14px",
        minWidth: 0,
        background: "linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)"
      }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "14px",
          flexWrap: "wrap",
          marginBottom: "16px"
        }}>
          <div>
            <div style={{
              fontSize: "11px",
              fontWeight: 800,
              letterSpacing: "0.08em",
              color: "#2457a6",
              marginBottom: "4px"
            }}>
              ACOMPANHAMENTO
            </div>
            <h2 style={{ margin: 0 }}>Evolução entre aulas</h2>
            <p style={{ margin: "5px 0 0", opacity: 0.7 }}>
              Comparação automática com a avaliação andragógica anterior do mesmo aluno.
            </p>
          </div>

          {evolution?.available && (
            <div style={{
              padding: "9px 13px",
              borderRadius: "999px",
              background: evolution.overallDelta > 0
                ? "#e8f5e9"
                : evolution.overallDelta < 0
                  ? "#ffebee"
                  : "#f5f7fa",
              color: evolution.overallDelta > 0
                ? "#1b5e20"
                : evolution.overallDelta < 0
                  ? "#b71c1c"
                  : "#424242",
              border: evolution.overallDelta > 0
                ? "1px solid #a5d6a7"
                : evolution.overallDelta < 0
                  ? "1px solid #ef9a9a"
                  : "1px solid #dfe5ec",
              fontWeight: 900,
              fontSize: "11px"
            }}>
              {evolution.direction}
            </div>
          )}
        </div>

        {evolutionLoading ? (
          <div style={{
            padding: "18px",
            borderRadius: "12px",
            background: "#f5f7fa",
            border: "1px solid #e1e6ed"
          }}>
            Calculando evolução a partir do histórico do aluno...
          </div>
        ) : !evolution?.available ? (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "16px",
            borderRadius: "12px",
            background: "#f7faff",
            border: "1px solid #d8e4f4"
          }}>
            <div style={{
              width: "38px",
              height: "38px",
              borderRadius: "50%",
              background: "#e8f0ff",
              color: "#2457a6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 900,
              flexShrink: 0
            }}>
              i
            </div>
            <div>
              <strong>A evolução será liberada após a próxima comparação.</strong>
              <div style={{ marginTop: "4px", fontSize: "12px", opacity: 0.72 }}>
                É necessário ter pelo menos uma aula anterior do mesmo aluno com avaliação andragógica completa.
              </div>
            </div>
          </div>
        ) : (
          <>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(175px, 1fr))",
              gap: "10px"
            }}>
              <div style={{
                padding: "14px",
                borderRadius: "12px",
                background: "#fff",
                border: "1px solid #dfe5ec"
              }}>
                <div style={{ fontSize: "10px", fontWeight: 800, opacity: 0.62 }}>
                  AULA ANTERIOR
                </div>
                <div style={{ marginTop: "6px", fontWeight: 800, fontSize: "13px" }}>
                  {formatDate(evolution.previousLesson?.started_at)}
                </div>
              </div>

              <div style={{
                padding: "14px",
                borderRadius: "12px",
                background: "#fff",
                border: "1px solid #dfe5ec"
              }}>
                <div style={{ fontSize: "10px", fontWeight: 800, opacity: 0.62 }}>
                  MÉDIA ANTERIOR
                </div>
                <div style={{ marginTop: "4px", fontSize: "24px", fontWeight: 900, color: "#18345f" }}>
                  {evolution.previousEvaluation.average.toFixed(2)}
                  <span style={{ fontSize: "11px", opacity: 0.6 }}> / 5</span>
                </div>
              </div>

              <div style={{
                padding: "14px",
                borderRadius: "12px",
                background: "#fff",
                border: "1px solid #dfe5ec"
              }}>
                <div style={{ fontSize: "10px", fontWeight: 800, opacity: 0.62 }}>
                  MÉDIA ATUAL
                </div>
                <div style={{ marginTop: "4px", fontSize: "24px", fontWeight: 900, color: "#18345f" }}>
                  {evolution.currentEvaluation.average.toFixed(2)}
                  <span style={{ fontSize: "11px", opacity: 0.6 }}> / 5</span>
                </div>
              </div>

              <div style={{
                padding: "14px",
                borderRadius: "12px",
                background: evolution.overallDelta > 0 ? "#f4fff5" : evolution.overallDelta < 0 ? "#fff7f7" : "#f8fafc",
                border: evolution.overallDelta > 0
                  ? "1px solid #b9dfbc"
                  : evolution.overallDelta < 0
                    ? "1px solid #efb0b0"
                    : "1px solid #dfe5ec"
              }}>
                <div style={{ fontSize: "10px", fontWeight: 800, opacity: 0.62 }}>
                  VARIAÇÃO GERAL
                </div>
                <div style={{
                  marginTop: "4px",
                  fontSize: "24px",
                  fontWeight: 900,
                  color: evolution.overallDelta > 0
                    ? "#2e7d32"
                    : evolution.overallDelta < 0
                      ? "#b71c1c"
                      : "#424242"
                }}>
                  {evolution.overallDelta > 0 ? "+" : ""}
                  {evolution.overallDelta.toFixed(2)}
                </div>
              </div>
            </div>

            <div style={{
              marginTop: "14px",
              border: "1px solid #dfe5ec",
              borderRadius: "12px",
              background: "#fff",
              overflow: "hidden"
            }}>
              {evolution.deltas.map((item, index) => {
                const deltaColor = item.delta > 0
                  ? "#2e7d32"
                  : item.delta < 0
                    ? "#b71c1c"
                    : "#6b7280";

                return (
                  <div key={item.key} style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(150px, 1.2fr) minmax(90px, 1fr) minmax(80px, 0.7fr) 70px",
                    gap: "12px",
                    alignItems: "center",
                    padding: "12px 14px",
                    borderBottom: index === evolution.deltas.length - 1 ? "none" : "1px solid #edf0f4"
                  }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: "12px" }}>{item.label}</div>
                      <div style={{
                        marginTop: "5px",
                        height: "5px",
                        borderRadius: "999px",
                        background: "#edf1f6",
                        overflow: "hidden"
                      }}>
                        <div style={{
                          width: `${Math.max(0, Math.min(100, item.current * 20))}%`,
                          height: "100%",
                          borderRadius: "999px",
                          background: deltaColor
                        }} />
                      </div>
                    </div>

                    <div style={{ fontSize: "12px", textAlign: "center" }}>
                      <span style={{ opacity: 0.6 }}>Anterior </span>
                      <strong>{item.previous}/5</strong>
                    </div>

                    <div style={{ fontSize: "12px", textAlign: "center" }}>
                      <span style={{ opacity: 0.6 }}>Atual </span>
                      <strong>{item.current}/5</strong>
                    </div>

                    <div style={{
                      textAlign: "right",
                      fontWeight: 900,
                      color: deltaColor
                    }}>
                      {item.delta > 0 ? "+" : ""}
                      {item.delta.toFixed(2)}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{
              marginTop: "14px",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
              gap: "10px"
            }}>
              <div style={{
                padding: "13px",
                borderRadius: "10px",
                background: "#f4fff5",
                border: "1px solid #c8e6c9"
              }}>
                <div style={{ fontSize: "10px", fontWeight: 800, color: "#2e7d32" }}>MELHORAS</div>
                <div style={{ marginTop: "6px", fontSize: "12px", lineHeight: 1.5 }}>
                  {evolution.improved.length
                    ? evolution.improved.map((item) => `${item.label} (+${item.delta.toFixed(2)})`).join(", ")
                    : "Nenhum fator apresentou melhora."}
                </div>
              </div>

              <div style={{
                padding: "13px",
                borderRadius: "10px",
                background: "#f7faff",
                border: "1px solid #d8e4f4"
              }}>
                <div style={{ fontSize: "10px", fontWeight: 800, color: "#2457a6" }}>ESTÁVEIS</div>
                <div style={{ marginTop: "6px", fontSize: "12px", lineHeight: 1.5 }}>
                  {evolution.stable.length
                    ? evolution.stable.map((item) => item.label).join(", ")
                    : "Nenhum fator permaneceu estável."}
                </div>
              </div>

              <div style={{
                padding: "13px",
                borderRadius: "10px",
                background: "#fff7f7",
                border: "1px solid #efb0b0"
              }}>
                <div style={{ fontSize: "10px", fontWeight: 800, color: "#b71c1c" }}>QUEDAS</div>
                <div style={{ marginTop: "6px", fontSize: "12px", lineHeight: 1.5 }}>
                  {evolution.declined.length
                    ? evolution.declined.map((item) => `${item.label} (${item.delta.toFixed(2)})`).join(", ")
                    : "Nenhum fator apresentou queda."}
                </div>
              </div>
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
            .replace(/\[AVALIAÇÃO ANDRAGÓGICA\]\s*\{[\s\S]*\}/, "")
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
        <div className="brand small" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ color: "#55BFEF", fontWeight: 900, letterSpacing: "0.08em" }}>ENAT</span>
          <span>INSTRUTOR</span>
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [activeLesson, setActiveLesson] = useState(null);
  const [showLessonHistory, setShowLessonHistory] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [showStudentForm, setShowStudentForm] = useState(false);
  const name = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Instrutor";
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [financeEntries, setFinanceEntries] = useState([]);
  const [showFinanceForm, setShowFinanceForm] = useState(false);
  const [financeForm, setFinanceForm] = useState({ type: 'RECEITA', entry_date: new Date().toISOString().slice(0,10), category: '', description: '', amount: '', payment_method: '', status: 'PAGO' });
  useEffect(() => {
    let active = true;
    async function loadFinanceEntries() {
      if (!supabase || !user?.id) return;
      const { data, error } = await supabase
        .from("ai_finance")
        .select("id, student_id, lesson_id, entry_date, type, category, description, amount, payment_method, status, created_at")
        .eq("user_id", user.id)
        .order("entry_date", { ascending: false });
      if (!active) return;
      if (error) {
        console.error("Erro ao carregar financeiro:", error);
        setFinanceEntries([]);
        return;
      }
      setFinanceEntries(data || []);
    }
    loadFinanceEntries();
    return () => {
      active = false;
    };
  }, [user?.id]);
  const menu = [
    ["dashboard", "DASHBOARD"], ["alunos", "ALUNOS"], ["aulas", "AULAS"], ["hsi", "HSI-DOTH-P"],
    ["financeiro", "FINANCEIRO"], ["agenda", "AGENDA"], ["rpa", "RPA ÃšNICO"], ["assinatura", "ASSINATURA"], ["perfil", "PERFIL"]
  ];
if (tab === "financeiro" && showVehicleForm) {
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
        <div className="brand small" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ color: "#55BFEF", fontWeight: 900, letterSpacing: "0.08em" }}>ENAT</span>
          <span>INSTRUTOR</span>
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
              ENAT - Assistente do Instrutor — acesso autenticado
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
    "Consolidação das aulas, desempenho, HSI-DOTH-P, qualidade andragógica e indicadores financeiros.",
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
    if (tab === "hsi") {
      return (
        <HsiDothPAssessment
          user={user}
          selectedStudent={selectedStudent}
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
if (tab === "financeiro") {
    const financeRevenue = financeEntries
      .filter(entry => String(entry.type || "").toUpperCase() === "RECEITA")
      .reduce((total, entry) => total + Number(entry.amount || 0), 0);
    const financeExpenses = financeEntries
      .filter(entry => String(entry.type || "").toUpperCase() === "DESPESA")
      .reduce((total, entry) => total + Number(entry.amount || 0), 0);
    const financeResult = financeRevenue - financeExpenses;
    const formatCurrency = value =>
      Number(value || 0).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
      });
  return (
    <>
      <h1>Financeiro</h1>

      <div className="panel">
        <h2>GestÃ£o financeira do instrutor</h2>

        <p>
          Centralize receitas, despesas, custos operacionais e
          resultado financeiro em um Ãºnico mÃ³dulo.
        </p>

        <div className="grid">

          <div className="metric">
            <div style={{ fontSize: "12px", opacity: 0.7 }}>
              RECEITAS
            </div>
            {formatCurrency(financeRevenue)}
          </div>

          <div className="metric">
            <div style={{ fontSize: "12px", opacity: 0.7 }}>
              CUSTOS
            </div>
            {formatCurrency(financeExpenses)}
          </div>

          <div className="metric">
            <div style={{ fontSize: "12px", opacity: 0.7 }}>
              RESULTADO
            </div>
            {formatCurrency(financeResult)}
          </div>

        </div>
      </div>

      <div className="panel">
        <h2>Custos operacionais</h2>

        <p>
          Os custos do veÃ­culo fazem parte do controle financeiro
          do instrutor e nÃ£o precisam existir como mÃ³dulo separado.
        </p>

        <div style={{
          display: "flex",
          gap: "10px",
          flexWrap: "wrap"
        }}>
          <button
            type="button"
            onClick={() => setShowVehicleForm(true)}
          >
            VEÃCULO E CUSTOS
          </button>

          <button type="button">
            DESPESAS
          </button>

          <button type="button">
            RECEITAS
          </button>
        </div>
      </div>

      <div className="panel">
        <h2>Indicadores financeiros</h2>

        <div className="grid">

          <div className="metric">
            <div style={{ fontSize: "12px", opacity: 0.7 }}>
              CUSTO POR KM
            </div>
            â€”
          </div>

          <div className="metric">
            <div style={{ fontSize: "12px", opacity: 0.7 }}>
              CUSTO POR AULA
            </div>
            â€”
          </div>

          <div className="metric">
            <div style={{ fontSize: "12px", opacity: 0.7 }}>
              MARGEM
            </div>
            â€”
          </div>

        </div>
      </div>
    </>
  );
}

if (tab === "agenda") {
  return (
    <>
      <h1>Agenda</h1>

      <div className="panel">
        <h2>Planejamento de aulas</h2>

        <p>
          Organize as prÃ³ximas aulas, acompanhe os alunos e
          prepare a conduÃ§Ã£o das atividades seguintes.
        </p>

        <div className="grid">

          <div className="metric">
            <div style={{ fontSize: "12px", opacity: 0.7 }}>
              AULAS HOJE
            </div>
            â€”
          </div>

          <div className="metric">
            <div style={{ fontSize: "12px", opacity: 0.7 }}>
              PRÃ“XIMAS AULAS
            </div>
            â€”
          </div>

          <div className="metric">
            <div style={{ fontSize: "12px", opacity: 0.7 }}>
              ALUNOS
            </div>
            â€”
          </div>

        </div>
      </div>

      <div className="panel">
        <h2>PreparaÃ§Ã£o da prÃ³xima aula</h2>

        <p>
          As informaÃ§Ãµes do HSI-DOTH-P deverÃ£o orientar a preparaÃ§Ã£o
          das prÃ³ximas aulas, permitindo ao instrutor identificar
          quais competÃªncias merecem maior atenÃ§Ã£o.
        </p>

        <div style={{
          padding: "14px",
          borderRadius: "10px",
          background: "#f7faff",
          border: "1px solid #d8e4f4"
        }}>
          <strong>
            Planejamento inteligente
          </strong>

          <p style={{
            marginBottom: 0,
            marginTop: "6px",
            fontSize: "13px"
          }}>
            As recomendaÃ§Ãµes serÃ£o apresentadas automaticamente
            a partir dos registros existentes do aluno.
          </p>
        </div>
      </div>

      <div className="panel">
        <h2>PrÃ³ximas atividades</h2>

        <p>
          Nenhuma aula futura registrada.
        </p>
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

  return <div className="app"><aside><div className="brand small" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
      <span style={{ color: "#55BFEF", fontWeight: 900, letterSpacing: "0.08em" }}>ENAT</span>
      <span>INSTRUTOR</span>
    </div>
    {menu.map(([key, label]) => <button key={key} className={tab === key ? "nav active" : "nav"} onClick={() => setTab(key)}>{label}</button>)}
    <button className="nav logout" onClick={onLogout}>SAIR</button>
  </aside><main><header><div><b>{user?.email}</b><small>ENAT - Assistente do Instrutor — acesso autenticado</small></div><span className="pill">AUTENTICADO</span></header><section>{content()}</section></main></div>;
}

function HsiDothPAssessment({ user, selectedStudent }) {
  const [students, setStudents] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [selectedId, setSelectedId] = useState(selectedStudent?.id || "");
  const [search, setSearch] = useState("");
  const [report, setReport] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const dimensions = [
    {
      key: "decision",
      label: "Decisão",
      recommendation: "Reforçar análise de alternativas, antecipação e escolha de respostas seguras."
    },
    {
      key: "organization",
      label: "Organização",
      recommendation: "Trabalhar planejamento da ação, sequência de procedimentos e organização das tarefas."
    },
    {
      key: "time",
      label: "Tempo",
      recommendation: "Trabalhar ritmo adequado, antecipação e controle do tempo de resposta."
    },
    {
      key: "humanization",
      label: "Humanização",
      recommendation: "Reforçar empatia, respeito, responsabilidade coletiva e convivência segura."
    },
    {
      key: "psychocomportamental",
      label: "Psicocomportamental",
      recommendation: "Trabalhar autorregulação, comportamento preventivo e controle das respostas emocionais."
    }
  ];

  const reportOptions = [
    { key: "overview", label: "Visão geral", icon: "▦", help: "Resumo de todos os resultados" },
    { key: "student", label: "Aluno", icon: "◉", help: "Histórico e situação individual" },
    { key: "lesson", label: "Aula atual", icon: "✓", help: "Resultado e orientação" },
    { key: "next", label: "Preparar próxima aula", icon: "→", help: "Planejamento da próxima aula" },
    { key: "coverage", label: "Abrangência", icon: "%", help: "Prioridades entre os alunos" },
    { key: "evolution", label: "Evolução", icon: "↗", help: "Comparação entre avaliações" },
    { key: "history", label: "Histórico", icon: "≡", help: "Linha do tempo das aulas" }
  ];

  function extractHsi(notes) {
    const match = String(notes || "").match(/\[HSI-DOTH-P\]\s*(\{[\s\S]*?\})(?:\r?\n|$)/);
    if (!match) return null;
    try {
      const parsed = JSON.parse(match[1]);
      if (!parsed?.scores) return null;
      const scores = {};
      for (const item of dimensions) {
        const value = Number(parsed.scores[item.key]);
        if (Number.isFinite(value) && value >= 1 && value <= 5) {
          scores[item.key] = value;
        }
      }
      if (Object.keys(scores).length !== dimensions.length) return null;
      const average = Number(
        (dimensions.reduce((sum, item) => sum + scores[item.key], 0) / dimensions.length).toFixed(2)
      );
      return {
        ...parsed,
        scores,
        average,
        normalized_score: Number.isFinite(Number(parsed.normalized_score))
          ? Number(parsed.normalized_score)
          : Number((average * 20).toFixed(0)),
        classification: parsed.classification || "—"
      };
    } catch {
      return null;
    }
  }

  function formatDate(value) {
    if (!value) return "Sem data";
    return new Date(value).toLocaleString("pt-BR");
  }

  function priorityItems(hsi) {
    if (!hsi?.scores) return [];
    return dimensions
      .map(item => ({
        ...item,
        score: Number(hsi.scores[item.key] || 0)
      }))
      .filter(item => item.score > 0 && item.score <= 3)
      .sort((a, b) => a.score - b.score);
  }

  useEffect(() => {
    let active = true;

    async function loadData() {
      setLoading(true);
      setMsg("");

      if (!supabase) {
        setMsg("Supabase não está configurado.");
        setLoading(false);
        return;
      }

      try {
        const { data: studentsData, error: studentsError } = await supabase
          .from("ai_students")
          .select("id, full_name")
          .eq("user_id", user.id)
          .order("full_name", { ascending: true });

        if (studentsError) throw studentsError;

        const { data: lessonsData, error: lessonsError } = await supabase
          .from("ai_lessons")
          .select("id, student_id, started_at, ended_at, status, phase, km_start, km_end, notes")
          .eq("user_id", user.id)
          .order("started_at", { ascending: false })
          .limit(500);

        if (lessonsError) throw lessonsError;

        if (!active) return;

        setStudents(studentsData || []);
        setLessons(lessonsData || []);

        if (!selectedStudent?.id && !selectedId && studentsData?.length) {
          setSelectedId(studentsData[0].id);
        }
      } catch (error) {
        console.error("Erro ao carregar HSI-DOTH-P:", error);
        if (active) setMsg(error?.message || "Não foi possível carregar os dados do HSI-DOTH-P.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadData();
    return () => { active = false; };
  }, [user?.id]);

  useEffect(() => {
    if (selectedStudent?.id) setSelectedId(selectedStudent.id);
  }, [selectedStudent?.id]);

  const studentMap = Object.fromEntries((students || []).map(item => [item.id, item]));

  const records = (lessons || [])
    .map(lesson => ({
      ...lesson,
      student: studentMap[lesson.student_id],
      hsi: extractHsi(lesson.notes)
    }))
    .filter(item => item.hsi)
    .sort((a, b) => new Date(b.started_at || 0) - new Date(a.started_at || 0));

  const evaluatedStudents = [...new Set(records.map(item => item.student_id))];
  const selectedStudentData = students.find(item => item.id === selectedId) || null;
  const studentRecords = records.filter(item => item.student_id === selectedId);
  const latest = studentRecords[0] || null;
  const previous = studentRecords[1] || null;
  const latestHsi = latest?.hsi || null;
  const previousHsi = previous?.hsi || null;

  const filteredStudents = students.filter(student =>
    String(student.full_name || "").toLowerCase().includes(search.trim().toLowerCase())
  );

  const globalStats = dimensions.map(item => {
    const values = records
      .map(record => Number(record.hsi?.scores?.[item.key]))
      .filter(value => Number.isFinite(value));

    const average = values.length
      ? Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2))
      : 0;

    const attention = values.filter(value => value <= 3).length;
    const coverage = values.length ? Number(((attention / values.length) * 100).toFixed(1)) : 0;

    return { ...item, average, attention, coverage, total: values.length };
  }).sort((a, b) => b.coverage - a.coverage || a.average - b.average);

  const globalAverage = records.length
    ? Number((records.reduce((sum, item) => sum + Number(item.hsi.average || 0), 0) / records.length).toFixed(2))
    : 0;

  const globalIndicator = records.length
    ? Number((records.reduce((sum, item) => sum + Number(item.hsi.normalized_score || 0), 0) / records.length).toFixed(1))
    : 0;

  const collectivePriority = globalStats[0] || null;

  const studentEvolution = latestHsi && previousHsi
    ? dimensions.map(item => ({
        ...item,
        previous: Number(previousHsi.scores[item.key]),
        current: Number(latestHsi.scores[item.key]),
        delta: Number((Number(latestHsi.scores[item.key]) - Number(previousHsi.scores[item.key])).toFixed(2))
      }))
    : [];

  const individualPriority = priorityItems(latestHsi);

  const reportNeedsStudent = ["student", "lesson", "next", "evolution", "history"].includes(report);

  function selectStudent(id) {
    setSelectedId(id);
    setSearch("");
  }

  function printReport() {
    window.print();
  }

  const compactCard = {
    padding: "12px 14px",
    border: "1px solid #dbe5f2",
    borderRadius: "10px",
    background: "#fff"
  };

  const buttonStyle = {
    border: "1px solid #cbd9eb",
    background: "#fff",
    color: "#243b67",
    borderRadius: "9px",
    padding: "9px 11px",
    cursor: "pointer",
    fontWeight: 700
  };

  if (loading) {
    return <div className="panel"><h1>HSI-DOTH-P</h1><p>Carregando resultados das aulas...</p></div>;
  }

  return (
    <div style={{ maxWidth: "1050px", margin: "0 auto" }}>
      <div className="panel" style={{ padding: "15px 18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "14px", alignItems: "flex-start", flexWrap: "wrap" }}>
          <div>
            <h1 style={{ marginBottom: "4px", fontSize: "26px" }}>HSI-DOTH-P — Inteligência Andragógica</h1>
            <p style={{ margin: 0 }}>
              Consolidação automática dos resultados já registrados nas aulas.
              Esta tela não cria uma nova avaliação.
            </p>
          </div>
          <button type="button" onClick={printReport} style={buttonStyle}>IMPRIMIR</button>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(135px, 1fr))",
          gap: "10px",
          marginTop: "16px"
        }}>
          <div style={compactCard}><small>ALUNOS AVALIADOS</small><strong style={{ display: "block", fontSize: "22px" }}>{evaluatedStudents.length}</strong></div>
          <div style={compactCard}><small>AVALIAÇÕES NAS AULAS</small><strong style={{ display: "block", fontSize: "22px" }}>{records.length}</strong></div>
          <div style={compactCard}><small>MÉDIA GERAL</small><strong style={{ display: "block", fontSize: "22px" }}>{records.length ? `${globalAverage.toFixed(2)} / 5` : "—"}</strong></div>
          <div style={compactCard}><small>INDICADOR GERAL</small><strong style={{ display: "block", fontSize: "22px" }}>{records.length ? `${globalIndicator.toFixed(1)} / 100` : "—"}</strong></div>
        </div>
      </div>

      <div className="panel" style={{ padding: "12px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", gap: "10px", flexWrap: "wrap" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "18px" }}>Escolha o relatório</h2>
            <small>Abra somente a informação que você precisa.</small>
          </div>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(125px, 1fr))",
          gap: "8px"
        }}>
          {reportOptions.map(option => (
            <button
              key={option.key}
              type="button"
              onClick={() => setReport(option.key)}
              title={option.help}
              style={{
                ...buttonStyle,
                textAlign: "left",
                background: report === option.key ? "#eaf6ff" : "#fff",
                border: report === option.key ? "1px solid #55BFEF" : buttonStyle.border
              }}
            >
              <span style={{ fontSize: "16px", marginRight: "6px" }}>{option.icon}</span>
              {option.label}
              <small style={{ display: "block", marginTop: "3px", opacity: 0.65, fontWeight: 500 }}>{option.help}</small>
            </button>
          ))}
        </div>

        {reportNeedsStudent && (
          <div style={{ marginTop: "12px", padding: "11px", background: "#f7faff", borderRadius: "10px", border: "1px solid #dbe5f2" }}>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar aluno pelo nome..."
                style={{ flex: "1 1 260px", minWidth: "220px" }}
              />
              <select value={selectedId} onChange={e => selectStudent(e.target.value)} style={{ flex: "1 1 260px" }}>
                <option value="">Selecione um aluno</option>
                {filteredStudents.map(student => (
                  <option key={student.id} value={student.id}>{student.full_name}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {msg && <div className="panel"><p className="msg">{msg}</p></div>}

      {report === "overview" && (
        <>
          <div className="panel" style={{ padding: "13px 16px" }}>
            <h2 style={{ marginTop: 0 }}>Visão geral</h2>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(135px, 1fr))",
              gap: "8px"
            }}>
              {globalStats.map(item => (
                <div key={item.key} style={compactCard}>
                  <small>{item.label}</small>
                  <strong style={{ display: "block", fontSize: "20px", marginTop: "4px" }}>{item.average.toFixed(2)} / 5</strong>
                  <small>{item.coverage.toFixed(1)}% em atenção</small>
                </div>
              ))}
            </div>
          </div>

          <div className="panel" style={{ padding: "14px 18px", background: "#f7faff" }}>
            <h3 style={{ marginTop: 0 }}>Prioridade andragógica coletiva</h3>
            {collectivePriority ? (
              <p style={{ marginBottom: 0 }}>
                <strong>{collectivePriority.label}</strong> apresenta a maior abrangência entre os resultados,
                com <strong>{collectivePriority.coverage.toFixed(1)}%</strong> das avaliações em nível de atenção.
              </p>
            ) : <p>Nenhuma avaliação HSI-DOTH-P foi encontrada nas aulas.</p>}
          </div>
        </>
      )}

      {report === "coverage" && (
        <div className="panel" style={{ padding: "13px 16px" }}>
          <h2 style={{ marginTop: 0 }}>Abrangência entre alunos</h2>
          <p style={{ marginTop: 0 }}>Mostra quais fatores aparecem com maior frequência como ponto de atenção.</p>
          <div style={{ display: "grid", gap: "7px" }}>
            {globalStats.map((item, index) => (
              <div key={item.key} style={{
                display: "grid",
                gridTemplateColumns: "30px 1fr auto",
                gap: "8px",
                alignItems: "center",
                padding: "9px 10px",
                borderBottom: "1px solid #e6edf5"
              }}>
                <strong>{index + 1}</strong>
                <div>
                  <strong>{item.label}</strong>
                  <div style={{ fontSize: "12px", opacity: 0.7 }}>Média {item.average.toFixed(2)} / 5</div>
                </div>
                <strong>{item.coverage.toFixed(1)}%</strong>
              </div>
            ))}
          </div>
        </div>
      )}

      {report === "student" && (
        <div className="panel" style={{ padding: "13px 16px" }}>
          <h2 style={{ marginTop: 0 }}>Relatório individual</h2>
          {!selectedStudentData ? (
            <p>Selecione um aluno acima.</p>
          ) : (
            <>
              <h3 style={{ marginBottom: "10px" }}>{selectedStudentData.full_name}</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(135px, 1fr))", gap: "8px" }}>
                <div style={compactCard}><small>AULAS AVALIADAS</small><strong style={{ display: "block", fontSize: "20px" }}>{studentRecords.length}</strong></div>
                <div style={compactCard}><small>ÚLTIMA MÉDIA</small><strong style={{ display: "block", fontSize: "20px" }}>{latestHsi ? `${latestHsi.average.toFixed(2)} / 5` : "—"}</strong></div>
                <div style={compactCard}><small>ÚLTIMO INDICADOR</small><strong style={{ display: "block", fontSize: "20px" }}>{latestHsi ? `${latestHsi.normalized_score} / 100` : "—"}</strong></div>
                <div style={compactCard}><small>CLASSIFICAÇÃO</small><strong style={{ display: "block", fontSize: "16px" }}>{latestHsi?.classification || "—"}</strong></div>
              </div>
              {latestHsi && (
                <div style={{ marginTop: "14px" }}>
                  <h3>Último resultado</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "7px" }}>
                    {dimensions.map(item => (
                      <div key={item.key} style={compactCard}>
                        <small>{item.label}</small>
                        <strong style={{ display: "block", fontSize: "20px" }}>{latestHsi.scores[item.key]} / 5</strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {report === "lesson" && (
        <div className="panel" style={{ padding: "13px 16px" }}>
          <h2 style={{ marginTop: 0 }}>Aula atual</h2>
          {!latest ? (
            <p>Selecione um aluno com avaliação registrada.</p>
          ) : (
            <>
              <p><strong>{selectedStudentData?.full_name}</strong> — {formatDate(latest.started_at)}</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "7px" }}>
                {dimensions.map(item => (
                  <div key={item.key} style={compactCard}>
                    <small>{item.label}</small>
                    <strong style={{ display: "block", fontSize: "20px" }}>{latest.hsi.scores[item.key]} / 5</strong>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: "12px", padding: "12px", background: "#f7faff", borderRadius: "10px" }}>
                <strong>Diagnóstico</strong>
                <p style={{ marginBottom: 0 }}>{latest.hsi.diagnosis || "Sem diagnóstico registrado."}</p>
              </div>
            </>
          )}
        </div>
      )}

      {report === "next" && (
        <div className="panel" style={{ padding: "16px 18px", background: "#fffaf0" }}>
          <h2 style={{ marginTop: 0 }}>Preparação da próxima aula</h2>
          {!latestHsi ? (
            <p>Selecione um aluno com avaliação registrada.</p>
          ) : (
            <>
              <p><strong>Aluno:</strong> {selectedStudentData?.full_name}</p>
              <h3>Pontos de atenção</h3>
              {individualPriority.length ? (
                <ul>
                  {individualPriority.map(item => (
                    <li key={item.key}><strong>{item.label}</strong> — {item.score}/5. {item.recommendation}</li>
                  ))}
                </ul>
              ) : (
                <p>Nenhum fator até 3/5 foi identificado no último resultado. Manter e ampliar gradualmente as competências.</p>
              )}
              <div style={{ marginTop: "10px" }}>
                <strong>Orientação para o instrutor</strong>
                <p style={{ marginBottom: 0 }}>
                  A próxima aula deve transformar os pontos de atenção em situações práticas observáveis,
                  registrando novamente o desempenho ao final da aula.
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {report === "evolution" && (
        <div className="panel" style={{ padding: "13px 16px" }}>
          <h2 style={{ marginTop: 0 }}>Evolução do aluno</h2>
          {!latestHsi || !previousHsi ? (
            <p>É necessário ter pelo menos duas avaliações HSI-DOTH-P do mesmo aluno.</p>
          ) : (
            <>
              <p>{formatDate(previous?.started_at)} → {formatDate(latest?.started_at)}</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "7px" }}>
                {studentEvolution.map(item => (
                  <div key={item.key} style={compactCard}>
                    <small>{item.label}</small>
                    <strong style={{ display: "block", fontSize: "19px" }}>{item.current.toFixed(1)} / 5</strong>
                    <small>{item.delta > 0 ? "▲" : item.delta < 0 ? "▼" : "—"} {item.delta > 0 ? "+" : ""}{item.delta.toFixed(1)}</small>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {report === "history" && (
        <div className="panel" style={{ padding: "13px 16px" }}>
          <h2 style={{ marginTop: 0 }}>Histórico das aulas</h2>
          {!studentRecords.length ? (
            <p>Nenhuma aula com HSI-DOTH-P registrada para este aluno.</p>
          ) : (
            <div style={{ display: "grid", gap: "6px" }}>
              {studentRecords.map((record, index) => (
                <div key={record.id} style={{
                  padding: "9px 10px",
                  borderBottom: "1px solid #e6edf5",
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  gap: "10px"
                }}>
                  <div>
                    <strong>Aula {studentRecords.length - index}</strong>
                    <span> — {formatDate(record.started_at)}</span>
                  </div>
                  <strong>{record.hsi.average.toFixed(2)} / 5</strong>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
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
  if (loading) return <div className="auth"><div className="card"><h1>ENAT - Assistente do Instrutor</h1><p>Verificando acesso...</p></div></div>;
  if (configError) return <div className="auth"><div className="card"><h1>Configuração necessária</h1><p className="msg">{configError}</p></div></div>;
  return user ? <Dashboard user={user} onLogout={logout} /> : <Auth onAuth={setUser} />;
}

const rootElement = document.getElementById("root");
if (!rootElement) {
  document.body.innerHTML = '<div style="padding:40px;font-family:Arial"><h1>Erro</h1><p>Elemento #root não encontrado.</p></div>';
} else {
  createRoot(rootElement).render(<React.StrictMode><Root /></React.StrictMode>);
}


















