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
function LessonRunning({ lesson, onFinish }) {
  const phases = [
  { id: 1, name: "PREPARAÇÃO" },
  { id: 2, name: "DESLOCAMENTO" },
  { id: 3, name: "DESENVOLVIMENTO" },
  { id: 4, name: "AVALIAÇÃO" },
  { id: 5, name: "PARADA SEGURA" }
];

  const [phase, setPhase] = useState(Number(lesson.phase) || 1);

  async function advancePhase() {
  if (phase >= 5) {
    await onFinish();
    return;
  }

  const nextPhase = phase + 1;

  try {
    const { error } = await supabase
      .from("ai_lessons")
      .update({
        phase: nextPhase
      })
      .eq("id", lesson.id);

    if (error) throw error;

    setPhase(nextPhase);
  } catch (error) {
    console.error("Erro ao avançar fase:", error);
    alert(error?.message || "Não foi possível avançar a fase.");
  }
}

  return (
    <div>
      <h1>Aula em andamento</h1>

      <div className="panel">
        <h2>Dados da aula</h2>

        <p>
          <strong>Aluno:</strong>{" "}
          {lesson.student_name || "Aluno selecionado"}
        </p>

        <p>
          <strong>Veículo:</strong>{" "}
          {lesson.vehicle_name || "Veículo selecionado"}
        </p>

        <p>
          <strong>KM inicial:</strong> {lesson.km_start}
        </p>

        <p>
          <strong>Objetivo:</strong>{" "}
          {lesson.objective || "Não informado"}
        </p>
      </div>

      <div className="panel">
        <h2>Progressão da aula</h2>

        <div style={{ marginTop: "20px" }}>
          {phases.map((item) => {
            let status = "red";

            if (item.id < phase) {
              status = "green";
            } else if (item.id === phase) {
              status = "yellow";
            }

            return (
              <div
                key={item.id}
                style={{
                  padding: "15px",
                  marginBottom: "10px",
                  borderRadius: "8px",
                  border: "1px solid #ccc",
                  background:
                    status === "green"
                      ? "#d9f7df"
                      : status === "yellow"
                      ? "#fff4c2"
                      : "#f8d7da"
                }}
              >
                <strong>
                  {item.id}. {item.name}
                </strong>

                <span style={{ marginLeft: "15px" }}>
                  {status === "green"
                    ? "✓ CONCLUÍDA"
                    : status === "yellow"
                    ? "● ATUAL"
                    : "○ PRÓXIMA"}
                </span>
              </div>
            );
          })}
        </div>
{phase < 5 && (
  <button
    onClick={advancePhase}
    style={{ marginTop: "20px" }}
  >
    CONCLUIR {phases[phase - 1].name}
  </button>
)}

{phase === 5 && (
  <button
    onClick={advancePhase}
    style={{ marginTop: "20px" }}
  >
    FINALIZAR AULA
  </button>
)}
      </div>
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

  const historyLayout = layoutMode === "columns"
    ? {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: "16px",
        alignItems: "start"
      }
    : {
        display: "flex",
        flexDirection: "column",
        gap: "16px"
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
            <strong>Layout do histórico</strong>
            <p style={{ margin: "4px 0 0" }}>
              Escolha como as aulas serão organizadas na tela.
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

      {!loading && !msg && lessons.length > 0 && (
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
                boxSizing: "border-box"
              }}>
                <h2>{student?.full_name || "Aluno não informado"}</h2>
                <p><strong>Data:</strong> {formatDate(lesson.started_at)}</p>
                <p>
                  <strong>Veículo:</strong>{" "}
                  {vehicle
                    ? `${vehicle.brand || ""} ${vehicle.model || ""}${vehicle.plate ? ` — ${vehicle.plate}` : ""}`.trim()
                    : "Não informado"}
                </p>
                <p><strong>Status:</strong> {statusLabel(lesson.status)}</p>
                <p><strong>Fase:</strong> {phaseLabel(lesson.phase)}</p>
                <p><strong>KM inicial:</strong> {lesson.km_start ?? "Não informado"}</p>
                <p><strong>KM final:</strong> {lesson.km_end ?? "Não informado"}</p>
                <p>
                  <strong>Duração:</strong>{" "}
                  {lesson.duration_minutes != null
                    ? `${lesson.duration_minutes} min`
                    : "Não informada"}
                </p>
                <p><strong>Objetivo:</strong> {lesson.objective || "Não informado"}</p>

                <button type="button" onClick={() => onSelect(lesson)}>
                  VISUALIZAR AULA
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function LessonDetails({ lesson, onBack }) {
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
            <h2>Visualização da aula</h2>
            <p>Modo somente leitura. Nenhum dado será alterado.</p>
          </div>
          <button type="button" onClick={onBack}>VOLTAR AO HISTÓRICO</button>
        </div>
      </div>

      <div className="grid">
        <div className="panel">
          <h2>Identificação</h2>
          <p><strong>ID da aula:</strong> {lesson.id}</p>
          <p><strong>Aluno:</strong> {student?.full_name || "Não informado"}</p>
          <p>
            <strong>Veículo:</strong>{" "}
            {vehicle
              ? `${vehicle.brand || ""} ${vehicle.model || ""}${vehicle.plate ? ` — ${vehicle.plate}` : ""}`.trim()
              : "Não informado"}
          </p>
        </div>

        <div className="panel">
          <h2>Status</h2>
          <p><strong>Status:</strong> {statusLabel(lesson.status)}</p>
          <p><strong>Fase:</strong> {phaseLabel(lesson.phase)}</p>
          <p><strong>Início:</strong> {formatDate(lesson.started_at)}</p>
          <p><strong>Término:</strong> {formatDate(lesson.ended_at)}</p>
        </div>

        <div className="panel">
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
        </div>

        <div className="panel">
          <h2>Objetivo e observações</h2>
          <p><strong>Objetivo:</strong> {lesson.objective || "Não informado"}</p>
          <p><strong>Observações:</strong> {lesson.notes || "Não informado"}</p>
        </div>
      </div>
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
      lesson={activeLesson}
      onFinish={async () => {
  try {
    const { error } = await supabase
      .from("ai_lessons")
      .update({
        phase: 5,
        status: "completed",
        ended_at: new Date().toISOString()
      })
      .eq("id", activeLesson.id);

    if (error) throw error;

    setActiveLesson(null);
    setTab("aulas");
  } catch (error) {
    console.error("Erro ao finalizar aula:", error);
    alert(error?.message || "Não foi possível finalizar a aula.");
  }
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

