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
function LessonForm({ user, initialStudentId = "", onBack, onStarted }) {
  const [students, setStudents] = useState([]);
  const [vehicles, setVehicles] = useState([]);

  const [studentId, setStudentId] = useState(initialStudentId);
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

    if (kmStart === "" || Number(kmStart) < 0) {
      setMsg("Informe uma quilometragem inicial válida.");
      return;
    }

    if (!objective.trim()) {
      setMsg("Informe o objetivo da aula.");
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

      setMsg("Aula iniciada com sucesso.");
      onStarted(data);

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
function LessonRunning({ user, lesson, readOnly = false, onBack, onCompleted }) {
  const phases = [
    { id: 1, name: "PREPARAÇÃO" },
    { id: 2, name: "DESENVOLVIMENTO" },
    { id: 3, name: "PARADA SEGURA" },
    { id: 4, name: "AVALIAÇÃO" },
    { id: 5, name: "CONCLUÍDA" }
  ];
  const metrics = [
    ["pontualidade", "Pontualidade"],
    ["planejamento", "Planejamento"],
    ["seguranca", "Segurança"],
    ["comunicacao", "Comunicação"],
    ["didatica", "Didática"],
    ["adaptacao", "Adaptação"],
    ["execucao", "Execução"],
    ["evolucao", "Evolução"],
    ["registro", "Registro"],
    ["feedback", "Feedback"]
  ];
  const [currentLesson, setCurrentLesson] = useState(lesson);
  const [phase, setPhase] = useState(Number(lesson.phase) || 1);
  const [notes, setNotes] = useState(lesson.notes || "");
  const [kmEnd, setKmEnd] = useState(lesson.km_end ?? "");
  const [evaluation, setEvaluation] = useState(
    Object.fromEntries(metrics.map(([field]) => [field, lesson[field] ?? ""]))
  );
  const [evaluationSaved, setEvaluationSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const metricsComplete = metrics.every(([field]) => {
    const value = evaluation[field];
    return value !== "" && Number.isFinite(Number(value));
  });
  const metricsValid = metricsComplete && metrics.every(([field]) => {
    const value = Number(evaluation[field]);
    return value >= 0 && value <= 10;
  });
  const evaluationValues = Object.fromEntries(
    metrics.map(([field]) => [field, evaluation[field] === "" ? null : Number(evaluation[field])])
  );

  async function updateLesson(changes, successMessage) {
    setBusy(true);
    setMsg("");

    try {
      const { data, error } = await supabase
        .from("ai_lessons")
        .update(changes)
        .eq("id", currentLesson.id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      setCurrentLesson(data);
      setPhase(Number(data.phase) || phase);
      setNotes(data.notes || "");
      setMsg(successMessage);
      return true;
    } catch (error) {
      console.error("Erro ao atualizar aula:", error);
      setMsg(error?.message || "Não foi possível atualizar a aula.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function closePreparation() {
    await updateLesson({ phase: 2 }, "Preparação encerrada. Desenvolvimento iniciado.");
  }

  async function saveDevelopmentNotes(closePhase = false) {
    await updateLesson(
      {
        notes: notes.trim() || null,
        ...(closePhase ? { phase: 3 } : {})
      },
      closePhase
        ? "Desenvolvimento encerrado. Parada segura iniciada."
        : "Observações da aula salvas."
    );
  }

  async function closeSafeStop() {
    await updateLesson(
      { phase: 4, safe_stop_at: new Date().toISOString() },
      "Parada segura registrada. Avaliação iniciada."
    );
  }

  async function saveEvaluation() {
    const saved = await updateLesson(
      evaluationValues,
      metricsValid
        ? "Avaliação salva. A aula pode ser concluída após informar o KM final."
        : "Avaliação parcial salva. Preencha todas as métricas entre 0 e 10 para concluir a aula."
    );
    if (saved) setEvaluationSaved(metricsValid);
  }

  async function completeLesson() {
    if (!evaluationSaved || !metricsValid) {
      setMsg("Salve todas as métricas da avaliação, entre 0 e 10, antes de concluir a aula.");
      return;
    }

    if (kmEnd === "" || !Number.isFinite(Number(kmEnd))) {
      setMsg("Informe a quilometragem final.");
      return;
    }

    if (Number(kmEnd) < Number(currentLesson.km_start)) {
      setMsg("A quilometragem final não pode ser menor que a inicial.");
      return;
    }

    const startedAt = new Date(currentLesson.started_at).getTime();
    const durationMinutes = Number.isFinite(startedAt)
      ? Math.max(0, Math.round((Date.now() - startedAt) / 60000))
      : null;

    const completed = await updateLesson(
      {
        phase: 5,
        status: "completed",
        km_end: Number(kmEnd),
        ended_at: new Date().toISOString(),
        duration_minutes: durationMinutes,
        notes: notes.trim() || null,
        ...evaluationValues
      },
      "Aula concluída com sucesso."
    );

    if (completed) onCompleted();
  }

  if (readOnly) {
    return (
      <div>
        <h1>Visualização da Aula</h1>
        <div className="panel">
          <p>Esta aula faz parte do histórico e está em modo somente leitura.</p>
          <p><strong>Status registrado:</strong> {lesson.status}</p>
          <p><strong>Fase registrada:</strong> {lesson.phase}</p>
          <p><strong>Início:</strong> {lesson.started_at || "Não informado"}</p>
          <p><strong>Término:</strong> {lesson.ended_at || "Não informado"}</p>
          <p><strong>KM:</strong> {lesson.km_start ?? "—"} → {lesson.km_end ?? "—"}</p>
          <p><strong>Objetivo:</strong> {lesson.objective || "Não informado"}</p>
          <p><strong>Observações:</strong> {lesson.notes || "Não informadas"}</p>
          <button type="button" onClick={onBack}>VOLTAR AO HISTÓRICO</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1>Aula em andamento</h1>

      <div className="panel">
        <h2>Dados da aula</h2>
        <p><strong>Aluno:</strong> {currentLesson.student_name || "Aluno selecionado"}</p>
        <p><strong>Veículo:</strong> {currentLesson.vehicle_name || "Veículo selecionado"}</p>
        <p><strong>KM inicial:</strong> {currentLesson.km_start}</p>
        <p><strong>Objetivo:</strong> {currentLesson.objective}</p>
      </div>

      <div className="panel">
        <h2>Progressão da aula</h2>
        {phases.map((item) => {
          const visualStatus = currentLesson.status === "completed" && phase === 5
            ? "green"
            : item.id < phase
              ? "green"
              : item.id === phase
                ? "yellow"
                : "red";

          return (
            <div key={item.id} style={{
              padding: "15px", marginBottom: "10px", borderRadius: "8px", border: "1px solid #ccc",
              background: visualStatus === "green" ? "#d9f7df" : visualStatus === "yellow" ? "#fff4c2" : "#f8d7da"
            }}>
              <strong>{item.id}. {item.name}</strong>
              <span style={{ marginLeft: "15px" }}>
                {visualStatus === "green" ? "✓ CONCLUÍDA" : visualStatus === "yellow" ? "● ATUAL" : "○ PRÓXIMA"}
              </span>
            </div>
          );
        })}
      </div>

      {phase === 1 && (
        <div className="panel">
          <h2>Preparação</h2>
          <p>Confira os dados iniciais antes de encerrar esta fase.</p>
          <button type="button" disabled={busy} onClick={closePreparation}>ENCERRAR PREPARAÇÃO</button>
        </div>
      )}

      {phase === 2 && (
        <div className="panel">
          <h2>Desenvolvimento</h2>
          <label>Observações e notas da aula</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Registre observações da aula" />
          <button type="button" disabled={busy} onClick={() => saveDevelopmentNotes(false)}>SALVAR OBSERVAÇÕES</button>
          <button type="button" disabled={busy} onClick={() => saveDevelopmentNotes(true)} style={{ marginLeft: "10px" }}>ENCERRAR DESENVOLVIMENTO</button>
        </div>
      )}

      {phase === 3 && (
        <div className="panel">
          <h2>Parada segura</h2>
          <p>Ao encerrar esta fase, o horário da parada segura será registrado.</p>
          <button type="button" disabled={busy} onClick={closeSafeStop}>REGISTRAR PARADA SEGURA</button>
        </div>
      )}

      {phase === 4 && (
        <div className="panel">
          <h2>Avaliação pedagógica</h2>
          <p>Preencha as métricas de 0 a 10 e salve antes de concluir a aula.</p>
          <div className="grid">
            {metrics.map(([field, label]) => (
              <label key={field}>
                {label}
                <input
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  value={evaluation[field]}
                  onChange={e => {
                    setEvaluation(prev => ({ ...prev, [field]: e.target.value }));
                    setEvaluationSaved(false);
                  }}
                />
              </label>
            ))}
          </div>
          <label>Observações finais</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Registre observações finais" />
          <button type="button" disabled={busy} onClick={saveEvaluation}>SALVAR AVALIAÇÃO</button>
          <label>KM final</label>
          <input type="number" min={currentLesson.km_start ?? 0} step="0.1" value={kmEnd} onChange={e => setKmEnd(e.target.value)} />
          <button type="button" disabled={busy || !evaluationSaved} onClick={completeLesson}>CONCLUIR AULA</button>
        </div>
      )}

      {phase === 5 && currentLesson.status === "completed" && (
        <div className="panel"><p>Aula concluída.</p><button type="button" onClick={onBack}>VOLTAR PARA AULAS</button></div>
      )}

      {msg && <p className="msg">{msg}</p>}
    </div>
  );
}

function LessonHistory({ user, onBack, onSelect }) {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    let active = true;

    async function loadLessons() {
      if (!supabase) {
        if (active) { setMsg("Supabase não está configurado."); setLoading(false); }
        return;
      }

      const { data, error } = await supabase
        .from("ai_lessons")
        .select("id, student_id, vehicle_id, started_at, ended_at, status, phase, km_start, km_end, duration_minutes, objective, notes, safe_stop_at, pontualidade, planejamento, seguranca, comunicacao, didatica, adaptacao, execucao, evolucao, registro, feedback")
        .eq("user_id", user.id)
        .order("started_at", { ascending: false });

      if (!active) return;
      if (error) setMsg(error.message || "Não foi possível carregar o histórico.");
      else setLessons(data || []);
      setLoading(false);
    }

    loadLessons();
    return () => { active = false; };
  }, [user.id]);

  return (
    <div>
      <h1>Histórico de Aulas</h1>
      <div className="panel"><p>As aulas existentes são exibidas somente para visualização e não serão alteradas automaticamente.</p><button type="button" onClick={onBack}>VOLTAR</button></div>
      {loading && <div className="panel"><p>Carregando aulas...</p></div>}
      {msg && <div className="panel"><p className="msg">{msg}</p></div>}
      {!loading && !msg && lessons.length === 0 && <div className="panel"><p>Nenhuma aula encontrada.</p></div>}
      {!loading && lessons.length > 0 && <div className="grid">
        {lessons.map(item => <div className="panel" key={item.id}>
          <p><strong>Status:</strong> {item.status}</p>
          <p><strong>Fase registrada:</strong> {item.phase}</p>
          <p><strong>Início:</strong> {item.started_at || "Não informado"}</p>
          <p><strong>KM:</strong> {item.km_start ?? "—"} → {item.km_end ?? "—"}</p>
          <p><strong>Objetivo:</strong> {item.objective || "Não informado"}</p>
          <button type="button" onClick={() => onSelect(item)}>VISUALIZAR</button>
        </div>)}
      </div>}
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
  const [showLessonHistory, setShowLessonHistory] = useState(false);
  const [activeLesson, setActiveLesson] = useState(null);
  const [lessonReadOnly, setLessonReadOnly] = useState(false);
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
      initialStudentId={selectedStudent?.id || ""}
      onBack={() => setShowLessonForm(false)}
      onStarted={(lesson) => {
        setActiveLesson(lesson);
        setLessonReadOnly(false);
        setShowLessonForm(false);
      }}
    />
  );
}
if (tab === "aulas" && showLessonHistory) {
  return (
    <LessonHistory
      user={user}
      onBack={() => setShowLessonHistory(false)}
      onSelect={(lesson) => {
        setActiveLesson(lesson);
        setLessonReadOnly(true);
        setShowLessonHistory(false);
      }}
    />
  );
}
if (tab === "aulas" && activeLesson) {
  return (
    <LessonRunning
      user={user}
      lesson={activeLesson}
      readOnly={lessonReadOnly}
      onBack={() => {
        setActiveLesson(null);
        if (lessonReadOnly) setShowLessonHistory(true);
        else setTab("aulas");
      }}
      onCompleted={() => {
        setActiveLesson(null);
        setLessonReadOnly(false);
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
          <div className="row">
            <button onClick={() => setShowLessonForm(true)}>
              + INICIAR AULA
            </button>
            <button onClick={() => setShowLessonHistory(true)}>
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

