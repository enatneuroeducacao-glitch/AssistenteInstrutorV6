import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { createClient } from "@supabase/supabase-js";
import "./style.css";
import RPAForm from "./RPAForm";
import { COURSE_CATALOG } from "./courseContent";
import { buildModuleAssessment } from "./courseAssessment";
import { LayoutDashboard, Users, CalendarDays, CarFront, Brain, FileText, WalletCards, BookOpen, BadgeCheck, LogOut, Play } from "lucide-react";

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
  const [personType, setPersonType] = useState("PF");
  const [cpf, setCpf] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [tradeName, setTradeName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [credential, setCredential] = useState("");
  const [credentialUf, setCredentialUf] = useState("");
  const [uf, setUf] = useState("");
  const [actingCity, setActingCity] = useState("");
  const [employmentType, setEmploymentType] = useState("");
  const [teachingType, setTeachingType] = useState("");
  const [category, setCategory] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setMsg("");

    if (!supabase) {
      return setMsg(
        "Supabase não está configurado. Verifique o arquivo .env."
      );
    }

    if (
      !email ||
      !pass ||
      (mode === "signup" &&
        (
          !name ||
          (personType === "PF" ? (!cpf || !birthDate) : (!cnpj || !companyName)) ||
          !credential ||
          !uf ||
          !actingCity ||
          !employmentType ||
          !teachingType ||
          !category
        ))
    ) {
      return setMsg(
        "Preencha todos os campos profissionais obrigatórios."
      );
    }

    if (pass.length < 6) {
      return setMsg(
        "A senha deve ter pelo menos 6 caracteres."
      );
    }

    setBusy(true);

    try {
      if (mode === "login") {
        const { data, error } =
          await supabase.auth.signInWithPassword({
            email: email.trim(),
            password: pass
          });

        if (error) throw error;

        if (data.user) {
          onAuth(data.user);
        }

      } else {
        const professionalMetadata = {
          full_name: name.trim(),
          person_type: personType,
          cpf: personType === "PF" ? cpf.trim() : null,
          cnpj: personType === "PJ" ? cnpj.trim() : null,
          company_name: personType === "PJ" ? companyName.trim() : null,
          trade_name: personType === "PJ" ? tradeName.trim() : null,
          birth_date: birthDate,
          credential: credential.trim(),
          credential_uf: credentialUf || null,
          uf: uf || null,
          acting_city: actingCity.trim(),
          employment_type: employmentType || null,
          teaching_type: teachingType || null,
          category: category || null
        };

        const { data, error } =
          await supabase.auth.signUp({
            email: email.trim(),
            password: pass,
            options: {
              data: professionalMetadata
            }
          });

        if (error) throw error;

        if (data.user && data.session) {
          onAuth(data.user);
        } else {
          setMsg(
            "Conta criada com sucesso. Verifique seu e-mail para confirmar o cadastro."
          );
        }
      }

    } catch (err) {
      console.error("Erro de autenticação:", err);
      setMsg(
        err?.message ||
        "Não foi possível concluir o cadastro."
      );

    } finally {
      setBusy(false);
    }
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
      {mode === "signup" && (
        <>
          <input
            autoFocus
            placeholder="Nome completo"
            value={name}
            onChange={e => setName(e.target.value)}
          />

          <select value={personType} onChange={e => setPersonType(e.target.value)}>
            <option value="PF">Pessoa Física (PF)</option>
            <option value="PJ">Pessoa Jurídica (PJ)</option>
          </select>

          {personType === "PF" ? (
            <input
              placeholder="CPF"
              value={cpf}
              onChange={e => setCpf(e.target.value)}
              inputMode="numeric"
            />
          ) : (
            <>
              <input
                placeholder="CNPJ"
                value={cnpj}
                onChange={e => setCnpj(e.target.value)}
                inputMode="numeric"
              />
              <input
                placeholder="Razão social"
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
              />
              <input
                placeholder="Nome fantasia (opcional)"
                value={tradeName}
                onChange={e => setTradeName(e.target.value)}
              />
            </>
          )}

          {personType === "PF" && (
            <input
              type="date"
              title="Data de nascimento"
              value={birthDate}
              onChange={e => setBirthDate(e.target.value)}
            />
          )}

          <input
            placeholder="Credencial de instrutor"
            value={credential}
            onChange={e => setCredential(e.target.value)}
          />

          <select
            value={credentialUf}
            onChange={e => setCredentialUf(e.target.value)}
          >
            <option value="">UF da credencial</option>
            <option value="AC">AC</option>
            <option value="AL">AL</option>
            <option value="AP">AP</option>
            <option value="AM">AM</option>
            <option value="BA">BA</option>
            <option value="CE">CE</option>
            <option value="DF">DF</option>
            <option value="ES">ES</option>
            <option value="GO">GO</option>
            <option value="MA">MA</option>
            <option value="MT">MT</option>
            <option value="MS">MS</option>
            <option value="MG">MG</option>
            <option value="PA">PA</option>
            <option value="PB">PB</option>
            <option value="PR">PR</option>
            <option value="PE">PE</option>
            <option value="PI">PI</option>
            <option value="RJ">RJ</option>
            <option value="RN">RN</option>
            <option value="RS">RS</option>
            <option value="RO">RO</option>
            <option value="RR">RR</option>
            <option value="SC">SC</option>
            <option value="SP">SP</option>
            <option value="SE">SE</option>
            <option value="TO">TO</option>
          </select>

          <select
            value={uf}
            onChange={e => setUf(e.target.value)}
          >
            <option value="">Estado onde atua</option>
            <option value="AC">AC</option>
            <option value="AL">AL</option>
            <option value="AP">AP</option>
            <option value="AM">AM</option>
            <option value="BA">BA</option>
            <option value="CE">CE</option>
            <option value="DF">DF</option>
            <option value="ES">ES</option>
            <option value="GO">GO</option>
            <option value="MA">MA</option>
            <option value="MT">MT</option>
            <option value="MS">MS</option>
            <option value="MG">MG</option>
            <option value="PA">PA</option>
            <option value="PB">PB</option>
            <option value="PR">PR</option>
            <option value="PE">PE</option>
            <option value="PI">PI</option>
            <option value="RJ">RJ</option>
            <option value="RN">RN</option>
            <option value="RS">RS</option>
            <option value="RO">RO</option>
            <option value="RR">RR</option>
            <option value="SC">SC</option>
            <option value="SP">SP</option>
            <option value="SE">SE</option>
            <option value="TO">TO</option>
          </select>

          <input
            placeholder="Município de atuação"
            value={actingCity}
            onChange={e => setActingCity(e.target.value)}
          />

          <select
            value={employmentType}
            onChange={e => setEmploymentType(e.target.value)}
          >
            <option value="">Tipo de atuação</option>
            <option value="AUTÔNOMO">Autônomo</option>
            <option value="CLT">CLT</option>
            <option value="AGREGADO">Agregado</option>
          </select>

          <select
            value={teachingType}
            onChange={e => setTeachingType(e.target.value)}
          >
            <option value="">Área de atuação</option>
            <option value="TEÓRICO">Teórico</option>
            <option value="PRÁTICO">Prático</option>
            <option value="AMBOS">Teórico e Prático</option>
          </select>

          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
          >
            <option value="">Categoria da CNH</option>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
            <option value="D">D</option>
            <option value="E">E</option>
            <option value="AB">AB</option>
            <option value="AC">AC</option>
            <option value="AD">AD</option>
            <option value="AE">AE</option>
          </select>
        </>
      )}
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
            Cadastre o primeiro aluno para começar usando o botão acima.
          </p>
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
function AgendaForm({ user, onBack, onScheduled }) {
  const [students, setStudents] = useState([]);
  const [studentId, setStudentId] = useState("");
  const [lessonCategory, setLessonCategory] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [objective, setObjective] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    async function loadStudents() {
      if (!supabase || !user?.id) return;

      const { data, error } = await supabase
        .from("ai_students")
        .select("id, full_name")
        .eq("user_id", user.id)
        .order("full_name");

      if (error) {
        console.error("Erro ao carregar alunos para agenda:", error);
        setMsg("Não foi possível carregar os alunos.");
        return;
      }

      setStudents(data || []);
    }

    loadStudents();
  }, [user?.id]);

  async function scheduleLesson(e) {
    e.preventDefault();
    setMsg("");

    if (!studentId) {
      setMsg("Selecione o aluno.");
      return;
    }

    if (!scheduledAt) {
      setMsg("Informe a data e o horário.");
      return;
    }

    if (!lessonCategory) {
      setMsg("Selecione a categoria da CNH desta aula.");
      return;
    }

    setBusy(true);

    try {
      const { data, error } = await supabase
        .from("ai_lessons")
        .insert({
          user_id: user.id,
          student_id: studentId,
          scheduled_at: new Date(scheduledAt).toISOString(),
          status: "scheduled",
          phase: 1,
          cnh_category: String(lessonCategory).toUpperCase(),
  
          objective: objective.trim() || null
        })
        .select("id, student_id, scheduled_at, started_at, ended_at, status, phase, cnh_category, service_contract_item_id, objective, exam_scheduled_at, exam_type, exam_location, exam_status, ai_students(full_name)")
        .single();

      if (error) throw error;

      setMsg("Aula agendada com sucesso.");

      setTimeout(() => {
        onScheduled(data);
      }, 500);

    } catch (error) {
      console.error("Erro ao agendar aula:", error);
      setMsg(error?.message || "Não foi possível agendar a aula.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="app">
      <aside>
        <div className="brand small">
          <span style={{ color: "#55BFEF", fontWeight: 900 }}>
            ENAT
          </span>
          <span>INSTRUTOR</span>
        </div>

        <button className="nav active">
          AGENDA
        </button>

        <button className="nav" onClick={onBack}>
          VOLTAR
        </button>
      </aside>

      <main>
        <header>
          <div>
            <b>{user?.email}</b>
            <small>
              ENAT - Assistente do Instrutor
            </small>
          </div>

          <span className="pill">
            NOVO AGENDAMENTO
          </span>
        </header>

        <section>
          <h1>Agendar aula</h1>

          <div className="panel">
            <form onSubmit={scheduleLesson}>

              <label>
                Aluno
                <select
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  required
                >
                  <option value="">
                    Selecione o aluno
                  </option>

                  {students.map((student) => (
                    <option
                      key={student.id}
                      value={student.id}
                    >
                      {student.full_name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Categoria da aula
                <select
                  value={lessonCategory}
                  onChange={(e) => setLessonCategory(e.target.value)}
                  required
                  disabled={!studentId}
                >
                  <option value="">Selecione a categoria da aula</option>
                  {['A','B','C','D','E'].map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <small>
                  A categoria da aula é definida manualmente pelo instrutor e não altera a categoria cadastral do aluno.
                </small>
              </label>

              <label>
                Data e horário
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  required
                />
              </label>

              <label>
                Objetivo da aula
                <textarea
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  placeholder="Objetivo ou observações para esta aula"
                  rows={4}
                />
              </label>

              <div>
                <button
                  type="submit"
                  disabled={busy}
                >
                  {busy
                    ? "AGENDANDO..."
                    : "AGENDAR AULA"}
                </button>

                <button
                  type="button"
                  className="link"
                  onClick={onBack}
                >
                  CANCELAR
                </button>
              </div>

              {msg && (
                <p className="msg">
                  {msg}
                </p>
              )}

            </form>
          </div>
        </section>
      </main>
    </div>
  );
}
function ExamScheduleForm({ user, onBack, onScheduled }) {
  const [students, setStudents] = useState([]);
  const [studentId, setStudentId] = useState("");
  const [examScheduledAt, setExamScheduledAt] = useState("");
  const [examType, setExamType] = useState("EXAME_PRATICO");
  const [examLocation, setExamLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    async function loadStudents() {
      if (!supabase || !user?.id) return;
      const { data, error } = await supabase
        .from("ai_students")
        .select("id, full_name, category")
        .eq("user_id", user.id)
        .order("full_name");
      if (error) {
        console.error(error);
        setMsg("Não foi possível carregar os alunos.");
        return;
      }
      setStudents(data || []);
    }
    loadStudents();
  }, [user?.id]);

  async function scheduleExam(e) {
    e.preventDefault();
    setMsg("");
    if (!studentId) return setMsg("Selecione o aluno.");
    if (!examScheduledAt) return setMsg("Informe a data e o horário da prova.");
    if (!supabase || !user?.id) return setMsg("Usuário não autenticado.");

    setBusy(true);
    try {
      const { data, error } = await supabase
        .from("ai_lessons")
        .insert({
          user_id: user.id,
          student_id: studentId,
          exam_scheduled_at: new Date(examScheduledAt).toISOString(),
          exam_type: examType,
          exam_location: examLocation.trim() || null,
          exam_status: "AGENDADA",
          status: "exam_scheduled",
          objective: notes.trim() || "Agendamento de prova"
        })
        .select("id, student_id, exam_scheduled_at, exam_type, exam_status, status, objective, ai_students(full_name, category)")
        .single();

      if (error) throw error;
      setMsg("Prova agendada com sucesso.");
      setTimeout(() => onScheduled(data), 500);
    } catch (error) {
      console.error("Erro ao agendar prova:", error);
      setMsg(error?.message || "Não foi possível agendar a prova.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="panel">
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:"12px",flexWrap:"wrap"}}>
          <div>
            <div style={{fontSize:"11px",fontWeight:800,letterSpacing:"0.08em",opacity:0.65}}>AULAS / PROVA</div>
            <h1 style={{marginBottom:"6px"}}>Agendamento da prova</h1>
            <p style={{margin:0}}>Registre a data, horário e tipo de prova do aluno.</p>
          </div>
          <button type="button" onClick={onBack}>VOLTAR</button>
        </div>
      </div>

      <form className="panel" onSubmit={scheduleExam}>
        <label>Aluno
          <select value={studentId} onChange={e => setStudentId(e.target.value)} required>
            <option value="">Selecione o aluno</option>
            {students.map(student => (
              <option key={student.id} value={student.id}>
                {student.full_name}{student.category ? ` — CNH ${student.category}` : ""}
              </option>
            ))}
          </select>
        </label>

        <label>Tipo de prova
          <select value={examType} onChange={e => setExamType(e.target.value)}>
            <option value="EXAME_PRATICO">Exame prático</option>
            <option value="EXAME_TEORICO">Exame teórico</option>
            <option value="REEXAME_PRATICO">Reexame prático</option>
            <option value="OUTRO">Outro</option>
          </select>
        </label>

        <label>Data e horário da prova
          <input type="datetime-local" value={examScheduledAt} onChange={e => setExamScheduledAt(e.target.value)} required />
        </label>

        <label>Local da prova
          <input value={examLocation} onChange={e => setExamLocation(e.target.value)} placeholder="Local / unidade / endereço" />
        </label>

        <label>Observações
          <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Informações importantes para a prova" rows={4} />
        </label>

        <div style={{display:"flex",gap:"10px",flexWrap:"wrap"}}>
          <button type="submit" disabled={busy}>{busy ? "AGENDANDO..." : "AGENDAR PROVA"}</button>
          <button type="button" className="link" onClick={onBack}>CANCELAR</button>
        </div>
        {msg && <p className="msg">{msg}</p>}
      </form>
    </div>
  );
}

function LessonForm({ user, onBack, onStarted, scheduledLesson = null }) {
  const [students, setStudents] = useState([]);
  const [vehicles, setVehicles] = useState([]);

  const [studentId, setStudentId] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [lessonCategory, setLessonCategory] = useState("");
  const [kmStart, setKmStart] = useState("");
  const [objective, setObjective] = useState("");
  const [scheduleExam, setScheduleExam] = useState(false);
  const [examScheduledAt, setExamScheduledAt] = useState("");
  const [examType, setExamType] = useState("EXAME_PRATICO");
  const [examLocation, setExamLocation] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (scheduledLesson?.student_id) {
      setStudentId(String(scheduledLesson.student_id));
      if (scheduledLesson.cnh_category) {
        // Categoria da aula é escolhida manualmente pelo instrutor.
      }
      if (scheduledLesson.objective) setObjective(scheduledLesson.objective);
    }
  }, [scheduledLesson?.id]);

  useEffect(() => {
    async function loadData() {
      if (!supabase) return;

      const { data: studentsData, error: studentsError } =
        await supabase
          .from("ai_students")
          .select("id, full_name, category")
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

  useEffect(() => {
    setLessonCategory("");
 }, [studentId]);

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

    if (scheduleExam && !examScheduledAt) {
      setMsg("Informe a data e o horário da prova.");
      return;
    }

    if (!lessonCategory) {
      setMsg("Selecione a categoria da CNH desta aula.");
      return;
    }


    setBusy(true);

    try {
      const selectedStudent = students.find(
        (item) => String(item.id) === String(studentId)
      );

      const cnhCategory =
        String(lessonCategory).toUpperCase();

      if (!cnhCategory) {
        throw new Error("Categoria da CNH não selecionada.");
      }

      const { data: previousLessons, error: previousLessonsError } = await supabase
        .from("ai_lessons")
        .select("id, status")
        .eq("user_id", user.id)
        .eq("student_id", studentId);

      if (previousLessonsError) throw previousLessonsError;

      const lessonNumber = (previousLessons || [])
        .filter((item) => {
          const status = String(item.status || "").toLowerCase();
          if (scheduledLesson?.id && String(item.id) === String(scheduledLesson.id)) return false;
          return !["exam_scheduled", "scheduled", "canceled", "cancelled"].includes(status);
        })
        .length + 1;

      const lessonPayload = {
        user_id: user.id,
        student_id: studentId,
        vehicle_id: vehicleId,
        started_at: scheduledLesson?.started_at || new Date().toISOString(),
        status: "running",
        phase: 1,
        lesson_number: lessonNumber,
        cnh_category: cnhCategory,

        km_start: Number(kmStart),
        objective: objective.trim() || null,
        exam_scheduled_at: scheduleExam && examScheduledAt ? new Date(examScheduledAt).toISOString() : scheduledLesson?.exam_scheduled_at || null,
        exam_type: scheduleExam ? examType : scheduledLesson?.exam_type || null,
        exam_location: scheduleExam ? (examLocation.trim() || null) : scheduledLesson?.exam_location || null,
        exam_status: scheduleExam ? "AGENDADA" : scheduledLesson?.exam_status || null
      };

      const lessonQuery = scheduledLesson?.id
        ? supabase
            .from("ai_lessons")
            .update(lessonPayload)
            .eq("id", scheduledLesson.id)
            .eq("user_id", user.id)
        : supabase
            .from("ai_lessons")
            .insert(lessonPayload);

      const { data, error } = await lessonQuery
        .select("*, ai_students(full_name, category), ai_vehicles(brand, model, plate)")
        .single();

      if (error) throw error;

      // A primeira aula inaugura o RPA do aluno e passa a funcionar como linha de base.
      // As aulas seguintes apenas atualizam a evolução do mesmo RPA.
      const rpaPatch = {
        user_id: user.id,
        student_id: studentId,
        latest_lesson_id: data.id,
        total_lessons: lessonNumber,
        status: "EM_FORMACAO",
        baseline_captured: lessonNumber === 1,
        ...(lessonNumber === 1 ? {
          first_lesson_id: data.id,
          baseline_at: new Date().toISOString(),
          baseline_km_start: Number(kmStart),
          baseline_objective: objective.trim() || null,
          baseline_cnh_category: cnhCategory
        } : {})
      };

      let { error: rpaError } = await supabase
        .from("ai_rpa_reports")
        .upsert(rpaPatch, { onConflict: "user_id,student_id" });

      // Compatibilidade com instalações antigas que ainda não possuem a
      // constraint única user_id + student_id: tenta localizar o RPA e
      // atualizar, ou criar o registro, sem impedir o início da aula.
      if (rpaError) {
        const existingRpa = await supabase
          .from("ai_rpa_reports")
          .select("id")
          .eq("user_id", user.id)
          .eq("student_id", studentId)
          .maybeSingle();

        if (existingRpa.data?.id) {
          const retry = await supabase
            .from("ai_rpa_reports")
            .update(rpaPatch)
            .eq("id", existingRpa.data.id)
            .eq("user_id", user.id);
          rpaError = retry.error;
        } else if (!existingRpa.error) {
          const retry = await supabase
            .from("ai_rpa_reports")
            .insert(rpaPatch);
          rpaError = retry.error;
        }
      }

      if (rpaError) {
        console.warn("A aula foi criada, mas o RPA não pôde ser alimentado:", rpaError);
      }

      console.log("Aula criada:", data);
      setMsg(lessonNumber === 1
        ? "1ª aula iniciada. A linha de base do RPA foi preparada para alimentar a evolução do aluno."
        : `Aula ${lessonNumber} iniciada. O RPA do aluno foi atualizado.`);

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

        {studentId && (
          <div
            style={{
              marginTop: "12px",
              padding: "12px",
              border: "1px solid #d8e4f4",
              borderRadius: "8px",
              background: "#f7faff"
            }}
          >
            <label>
              <strong>Categoria da aula</strong>

              <select
                value={lessonCategory}
                onChange={(e) => setLessonCategory(e.target.value)}
                required
                style={{ marginTop: "6px" }}
              >
                <option value="">Selecione a categoria</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
                <option value="E">E</option>
              </select>
            </label>

            {lessonCategory && (
              <small
                style={{
                  display: "block",
                  marginTop: "6px"
                }}
              >
                Categoria selecionada:{" "}
                <strong>{lessonCategory}</strong>.
                Esta categoria será registrada especificamente
                nesta aula e no RPA.
              </small>
            )}
          </div>
        )}
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
          placeholder="Ex.: trabalhar estacionamento, saída em aclive, percepção de risco..."
        />
      </div>

      <div className="panel" style={{background:"#f7faff",border:"1px solid #d8e4f4"}}>
        <h2 style={{ marginBottom: "4px" }}>4. Agendamento da prova</h2>
        <label style={{display:"flex",alignItems:"center",gap:"8px",fontWeight:800}}>
          <input type="checkbox" checked={scheduleExam} onChange={e => setScheduleExam(e.target.checked)} />
          Agendar prova para este aluno
        </label>
        {scheduleExam && (
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:"12px",marginTop:"12px"}}>
            <label>Tipo de prova
              <select value={examType} onChange={e => setExamType(e.target.value)}>
                <option value="EXAME_PRATICO">Exame prático</option>
                <option value="EXAME_TEORICO">Exame teórico</option>
                <option value="REEXAME_PRATICO">Reexame prático</option>
                <option value="OUTRO">Outro</option>
              </select>
            </label>
            <label>Data e horário
              <input type="datetime-local" value={examScheduledAt} onChange={e => setExamScheduledAt(e.target.value)} />
            </label>
            <label>Local
              <input value={examLocation} onChange={e => setExamLocation(e.target.value)} placeholder="Local da prova" />
            </label>
          </div>
        )}
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

  const [hsiEvaluation, setHsiEvaluation] = useState({
    decision: Number(lesson?.hsi_evaluation?.decision || 0),
    organization: Number(lesson?.hsi_evaluation?.organization || 0),
    time: Number(lesson?.hsi_evaluation?.time || 0),
    humanization: Number(lesson?.hsi_evaluation?.humanization || 0),
    psychocomportamental: Number(lesson?.hsi_evaluation?.psychocomportamental || 0),
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
    setHsiEvaluation({
      decision: Number(lesson?.hsi_evaluation?.decision || 0),
      organization: Number(lesson?.hsi_evaluation?.organization || 0),
      time: Number(lesson?.hsi_evaluation?.time || 0),
      humanization: Number(lesson?.hsi_evaluation?.humanization || 0),
      psychocomportamental: Number(lesson?.hsi_evaluation?.psychocomportamental || 0),
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

  const hsiItems = [
    { key: "decision", label: "Decisão", description: "Analisa alternativas e escolhe respostas seguras." },
    { key: "organization", label: "Organização", description: "Planeja e organiza a execução da atividade." },
    { key: "time", label: "Tempo", description: "Mantém ritmo, antecipação e tempo de resposta adequados." },
    { key: "humanization", label: "Humanização", description: "Demonstra empatia, respeito e responsabilidade coletiva." },
    { key: "psychocomportamental", label: "Psicocomportamental", description: "Demonstra autorregulação e comportamento preventivo." },
  ];

  const evaluationComplete = evaluationItems.every(
    (item) => Number(evaluation[item.key]) >= 1 && Number(evaluation[item.key]) <= 5
  );
  const hsiComplete = hsiItems.every(
    (item) => Number(hsiEvaluation[item.key]) >= 1 && Number(hsiEvaluation[item.key]) <= 5
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

  function setHsiValue(key, value) {
    if (readOnly || busy) return;
    setHsiEvaluation((current) => ({ ...current, [key]: Number(value) }));
  }

  const hsiAverage = hsiComplete
    ? hsiItems.reduce((sum, item) => sum + Number(hsiEvaluation[item.key]), 0) / hsiItems.length
    : null;

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

    if (!hsiComplete) {
      setMessage("Preencha todos os cinco fatores do HSI-DOTH-P antes de concluir a aula.");
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
    const hsiPayload = {
      scores: hsiItems.reduce((acc, item) => ({ ...acc, [item.key]: Number(hsiEvaluation[item.key]) }), {}),
      average: Number(hsiAverage.toFixed(2)),
      normalized_score: Number((hsiAverage * 20).toFixed(0)),
      classification: hsiAverage >= 4.2 ? "ALTO" : hsiAverage >= 3.4 ? "ADEQUADO" : hsiAverage >= 2.6 ? "ATENÇÃO" : "CRÍTICO",
      completed_at: endedAt,
    };
    const hsiNote = `[HSI-DOTH-P] ${JSON.stringify(hsiPayload)}`;
    const mergedNotes = [notes, evaluationNote, hsiNote]
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

    if (updated) {
      // Baixa uma aula somente na categoria realmente ministrada.
      if (updated.cnh_category) {
        const { data: planData, error: planReadError } = await supabase
          .from("ai_student_category_plans")
          .select("id, planned_lessons, completed_lessons, service_contract_item_id")
          .eq("user_id", user.id)
          .eq("student_id", updated.student_id)
          .eq("cnh_category", String(updated.cnh_category).toUpperCase())
          .maybeSingle();

        if (!planReadError && planData) {
          const completed = Math.min(
            Number(planData.planned_lessons || 0),
            Number(planData.completed_lessons || 0) + 1
          );
          const { error: planUpdateError } = await supabase
            .from("ai_student_category_plans")
            .update({ completed_lessons: completed })
            .eq("id", planData.id)
            .eq("user_id", user.id);
          if (planUpdateError) console.warn("Não foi possível atualizar a quantidade concluída da categoria:", planUpdateError);

          if (planData.service_contract_item_id) {
            const { error: itemUpdateError } = await supabase
              .from("ai_service_contract_items")
              .update({ completed_lessons: completed })
              .eq("id", planData.service_contract_item_id)
              .eq("user_id", user.id);
            if (itemUpdateError) console.warn("Não foi possível atualizar o item do contrato:", itemUpdateError);
          }
        }
      }

      const rpaUpdate = {
        latest_lesson_id: updated.id,
        total_lessons: Number(updated.lesson_number || 1),
        latest_quality_score: Number((evaluationAverage * 20).toFixed(2)),
        latest_hsi_score: Number((hsiAverage * 20).toFixed(2)),
        latest_average: Number(evaluationAverage.toFixed(2)),
        latest_evaluation: pedagogicalEvaluation,
        continuity_plan: pedagogicalAnalysis.next_lesson_recommendation || null,
        latest_notes: notes || null,
        status: "EM_FORMACAO",
        updated_at: new Date().toISOString()
      };

      let { error: rpaError } = await supabase
        .from("ai_rpa_reports")
        .update(rpaUpdate)
        .eq("user_id", user.id)
        .eq("student_id", updated.student_id);

      // Compatibilidade com bancos ainda não migrados: preserva a evolução
      // nos campos estruturais já existentes e não bloqueia a conclusão da aula.
      if (rpaError) {
        const fallbackNotes = [
          notes || null,
          `[AVALIAÇÃO ANDRAGÓGICA] ${JSON.stringify(pedagogicalEvaluation)}`,
          `[HSI-DOTH-P] ${JSON.stringify({ scores: hsiEvaluation, average: Number(hsiAverage.toFixed(2)), normalized_score: Number((hsiAverage * 20).toFixed(0)) })}`
        ].filter(Boolean).join("\n");
        const fallback = {
          latest_lesson_id: updated.id,
          total_lessons: Number(updated.lesson_number || 1),
          latest_notes: fallbackNotes,
          continuity_plan: pedagogicalAnalysis.next_lesson_recommendation || null,
          status: "EM_FORMACAO",
          updated_at: new Date().toISOString()
        };
        const retry = await supabase
          .from("ai_rpa_reports")
          .update(fallback)
          .eq("user_id", user.id)
          .eq("student_id", updated.student_id);
        rpaError = retry.error;
      }

      if (rpaError) {
        console.warn("Aula concluída, mas não foi possível atualizar o RPA:", rpaError);
      }
    }

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

      <div className="panel" style={{ background: "#f7faff" }}>
        <h2>HSI-DOTH-P — avaliação da aula</h2>
        <p style={{ marginTop: 0 }}>Registre os cinco fatores do HSI-DOTH-P em escala de 1 a 5. O resultado será incorporado ao RPA ÚNICO e ao dashboard.</p>
        <div style={{ display: "grid", gap: "10px" }}>
          {hsiItems.map(item => (
            <div key={item.key} style={{ padding: "10px 12px", border: "1px solid #d8e4f4", borderRadius: "9px", background: "#fff" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", alignItems: "center" }}>
                <div><strong>{item.label}</strong><div style={{ fontSize: "12px", opacity: 0.7 }}>{item.description}</div></div>
                <select value={hsiEvaluation[item.key] || ""} onChange={e => setHsiValue(item.key, e.target.value)} disabled={readOnly || busy || isFinished} style={{ width: "90px", margin: 0 }}>
                  <option value="">—</option>
                  {[1,2,3,4,5].map(value => <option key={value} value={value}>{value}</option>)}
                </select>
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: "10px", fontWeight: 800 }}>
          {hsiComplete ? `Indicador HSI-DOTH-P: ${(hsiAverage * 20).toFixed(1)} / 100` : "Preenchimento pendente"}
        </div>
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
        average: Number(
          (
            Number(pedagogicalEvaluation.attention || 0) +
            Number(pedagogicalEvaluation.risk_perception || 0) +
            Number(pedagogicalEvaluation.decision_making || 0) +
            Number(pedagogicalEvaluation.vehicle_control || 0) +
            Number(pedagogicalEvaluation.behavior || 0)
          ) / 5
        ),
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
            <div style={{ fontSize: "11px", opacity: 0.65, fontWeight: 700 }}>DISTANCIA</div>
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
    payment_method: "",
    payment_installments: "1",
    first_due_date: new Date().toISOString().slice(0, 10),
    entry_amount: "0",
    contract_notes: "",
    notes: ""
  });

  const [categoryPlans, setCategoryPlans] = useState({
    A: { enabled: false, lessons: "", unitPrice: "" },
    B: { enabled: false, lessons: "", unitPrice: "" },
    C: { enabled: false, lessons: "", unitPrice: "" },
    D: { enabled: false, lessons: "", unitPrice: "" },
    E: { enabled: false, lessons: "", unitPrice: "" }
  });

  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [savedStudent, setSavedStudent] = useState(null);
  const [savedContract, setSavedContract] = useState(null);
  const [savedContractItems, setSavedContractItems] = useState([]);
  const [instructorProfile, setInstructorProfile] = useState(null);

  useEffect(() => {
    let active = true;
    async function loadInstructorProfile() {
      if (!supabase || !user?.id) return;
      const { data } = await supabase
        .from("ai_profiles")
        .select("full_name, cpf, birth_date, phone, city, uf, credential, credential_uf, category")
        .eq("user_id", user.id)
        .maybeSingle();
      if (active) setInstructorProfile(data || null);
    }
    loadInstructorProfile();
    return () => { active = false; };
  }, [user?.id]);

  function updateCategoryPlan(category, field, value) {
    setCategoryPlans(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value
      }
    }));
  }

  const selectedCategoryPlans = Object.entries(categoryPlans)
    .filter(([, plan]) => plan.enabled);

  const totalContractLessons = selectedCategoryPlans.reduce(
    (sum, [, plan]) => sum + (Number(plan.lessons) || 0),
    0
  );

  const totalContractAmount = selectedCategoryPlans.reduce(
    (sum, [, plan]) =>
      sum + ((Number(plan.lessons) || 0) * (Number(plan.unitPrice) || 0)),
    0
  );

  function addMonths(dateString, months) {
    const d = new Date(`${dateString}T12:00:00`);
    d.setMonth(d.getMonth() + Number(months || 0));
    return d.toISOString().slice(0, 10);
  }

  function formatDateBR(value) {
    if (!value) return "Não informada";
    const [y, m, d] = String(value).slice(0, 10).split("-");
    return y && m && d ? `${d}/${m}/${y}` : value;
  }

  function buildInstallments(total, count, firstDueDate, entryAmount = 0) {
    const totalCents = Math.round(Number(total || 0) * 100);
    const requestedEntryCents = Math.max(0, Math.round(Number(entryAmount || 0) * 100));
    const entryCents = Math.min(requestedEntryCents, totalCents);
    const financedCents = totalCents - entryCents;
    const n = Math.max(1, Number(count || 1));
    const base = Math.floor(financedCents / n);
    const remainder = financedCents - (base * n);
    return Array.from({ length: n }, (_, index) => {
      const cents = base + (index < remainder ? 1 : 0);
      return {
        installment_number: index + 1,
        due_date: addMonths(firstDueDate, index),
        amount: cents / 100,
        status: "PENDENTE"
      };
    });
  }

  const isInstallmentPayment = ["CARTAO_CREDITO", "BOLETO", "PARCELADO"].includes(form.payment_method);
  const installmentCount = isInstallmentPayment ? Math.max(1, Number(form.payment_installments || 1)) : 1;
  const entryAmount = Math.max(0, Number(form.entry_amount || 0));
  const scheduledInstallments = buildInstallments(totalContractAmount, installmentCount, form.first_due_date || form.start_date || new Date().toISOString().slice(0, 10), entryAmount);
  const financedAmount = Math.max(0, totalContractAmount - entryAmount);

  function formatBRL(value) {
    return Number(value || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  }

  function updateField(field, value) {
    setForm(prev => ({
      ...prev,
      [field]: value
    }));
  }

  function buildContractText(student) {
    const contract = savedContract || {};
    const items = savedContractItems || [];
    const profile = instructorProfile || {};
    const amount = Number(contract.contract_amount || 0);
    const paymentLabels = {
      PIX: "PIX",
      DINHEIRO: "Dinheiro",
      DEBITO: "Cartão de débito",
      CARTAO_CREDITO: "Cartão de crédito",
      BOLETO: "Boleto",
      TRANSFERENCIA: "Transferência bancária",
      PARCELADO: "Parcelado",
      OUTRO: "Outro"
    };
    const paymentLabel = paymentLabels[contract.payment_method] || contract.payment_method || "Não informada";
    const installmentCount = Number(contract.installments_count || 1);
    const entry = Number(contract.entry_amount || 0);
    const financed = Number(contract.financed_amount ?? Math.max(0, amount - entry));
    const startDate = formatDateBR(contract.start_date || student.start_date);
    const firstDue = formatDateBR(contract.first_due_date);
    const installmentRows = Array.isArray(contract.installments) ? contract.installments : [];
    const notes = contract.notes || "Nenhuma condição adicional registrada.";
    const categoryRows = items.length
      ? items.map(item => {
          const subtotal = Number(item.planned_lessons || 0) * Number(item.unit_price || 0);
          return `- CNH ${String(item.cnh_category || "").toUpperCase()}: ${item.planned_lessons || 0} aula(s) × ${formatBRL(item.unit_price)} = ${formatBRL(subtotal)}`;
        }).join("\n")
      : "- Conforme planejamento registrado no sistema.";
    const schedule = installmentRows.length
      ? installmentRows.map(item => `- Parcela ${item.installment_number}/${installmentCount}: vencimento ${formatDateBR(item.due_date)} — ${formatBRL(item.amount)} — ${item.status || "PENDENTE"}`).join("\n")
      : `- Pagamento em parcela única no valor de ${formatBRL(amount)}.`;

    return `CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE INSTRUÇÃO DE TRÂNSITO

Pelo presente instrumento particular, de um lado, como CONTRATANTE, o ALUNO abaixo identificado, e, de outro, como CONTRATADO, o INSTRUTOR DE TRÂNSITO abaixo identificado, celebram o presente contrato de prestação de serviços de instrução de trânsito, mediante as condições seguintes.

1. IDENTIFICAÇÃO DAS PARTES

CONTRATANTE — ALUNO
Nome: ${student.full_name || "Não informado"}
CPF: ${student.cpf || "Não informado"}
Telefone: ${student.phone || "Não informado"}
Categoria pretendida: ${student.category || "Não informada"}

CONTRATADO — INSTRUTOR DE TRÂNSITO
Nome: ${profile.full_name || user?.user_metadata?.full_name || user?.email || "Não informado"}
CPF: ${profile.cpf || "Não informado"}
Credencial: ${profile.credential || "Não informada"}
UF da credencial: ${profile.credential_uf || profile.uf || "Não informada"}
Telefone: ${profile.phone || "Não informado"}

2. OBJETO DO CONTRATO

2.1. O objeto deste contrato é a prestação de serviços de instrução prática de trânsito ao CONTRATANTE, conforme categoria, quantidade de aulas, valores e planejamento registrados neste instrumento e no sistema Assistente do Instrutor.

2.2. A prestação observará a legislação de trânsito e as normas regulamentares aplicáveis à formação de condutores, inclusive a regulamentação vigente do CONTRAN e do órgão executivo de trânsito competente.

2.3. A contratação de aulas não constitui promessa ou garantia de aprovação em exame teórico ou prático, pois o resultado depende do desempenho do candidato e dos critérios e procedimentos do órgão competente.

3. PLANEJAMENTO DOS SERVIÇOS

${categoryRows}

Total de aulas contratadas: ${contract.planned_lessons || 0}
Data prevista de início: ${startDate}

3.1. Aulas adicionais, mudança de categoria ou alteração relevante do planejamento dependerão de nova contratação ou aditivo, com atualização dos valores quando aplicável.

4. AGENDAMENTO, PONTUALIDADE E REAGENDAMENTO

4.1. As aulas serão previamente agendadas entre as partes, com registro de data e horário pelo sistema ou por outro meio acordado.

4.2. As partes comprometem-se a observar os horários combinados e a comunicar, tão logo possível, qualquer impossibilidade de comparecimento.

4.3. O atraso do CONTRATANTE poderá reduzir o tempo efetivo da aula quando não for operacionalmente possível compensá-lo sem prejudicar outros horários previamente agendados.

4.4. O atraso ou impedimento do CONTRATADO deverá, sempre que possível, ser compensado por extensão da aula ou reagendamento.

4.5. Cancelamentos e reagendamentos observarão a política informada no momento da contratação e, na ausência de regra específica, serão tratados de boa-fé entre as partes, respeitada a legislação aplicável.

5. OBRIGAÇÕES DO INSTRUTOR

5.1. São obrigações do CONTRATADO:
a) prestar os serviços com zelo, respeito, urbanidade e profissionalismo;
b) observar as normas de trânsito e de formação de condutores aplicáveis;
c) priorizar a segurança durante a instrução;
d) orientar o aluno quanto à condução segura, percepção de riscos e atitudes compatíveis com a urbanidade no trânsito;
e) registrar, quando aplicável, a evolução e os pontos de melhoria do aluno;
f) manter a documentação profissional exigida para o exercício da atividade;
g) utilizar veículo que atenda aos requisitos legais e de segurança quando o veículo for de sua responsabilidade;
h) preservar a confidencialidade das informações pessoais do CONTRATANTE, ressalvadas as hipóteses legais.

6. OBRIGAÇÕES DO ALUNO

6.1. São obrigações do CONTRATANTE:
a) fornecer informações verdadeiras e atualizadas;
b) apresentar a documentação exigida para a realização das aulas;
c) portar a documentação de aprendizagem exigida pela legislação quando aplicável;
d) comparecer aos horários agendados;
e) seguir as orientações de segurança do instrutor;
f) informar qualquer circunstância que possa comprometer sua segurança ou capacidade de condução;
g) não participar da aula sob influência de álcool, drogas ou substâncias que comprometam a condução;
h) pagar os valores contratados nos respectivos vencimentos.

7. VEÍCULO E CONDIÇÕES DE SEGURANÇA

7.1. O veículo utilizado será aquele regularmente disponibilizado para a atividade, conforme as exigências legais aplicáveis.

7.2. O CONTRATADO poderá interromper ou não iniciar a aula quando identificar risco à segurança, irregularidade documental ou condição inadequada do veículo, da via ou do próprio aluno.

7.3. Nenhuma meta de horário, desempenho ou conclusão do curso prevalecerá sobre a segurança das pessoas envolvidas.

8. VALOR E CONDIÇÕES FINANCEIRAS

Valor total contratado: ${formatBRL(amount)}
Forma de pagamento: ${paymentLabel}
Quantidade de parcelas: ${installmentCount}x
Entrada: ${formatBRL(entry)}
Saldo parcelado: ${formatBRL(financed)}
Primeiro vencimento: ${firstDue}

8.1. O valor contratado corresponde aos serviços expressamente descritos neste instrumento.

8.2. O cronograma financeiro abaixo integra este contrato e deverá refletir os lançamentos registrados no sistema financeiro.

9. CRONOGRAMA FINANCEIRO

${schedule}

9.1. Cada parcela possui registro próprio no sistema financeiro e poderá assumir os estados PENDENTE, PAGO, ATRASADO ou CANCELADO, conforme a situação efetivamente registrada.

9.2. O pagamento de uma parcela não implica quitação das parcelas posteriores.

9.3. Eventuais encargos por atraso somente serão aplicados quando previamente informados, contratualmente previstos e permitidos pela legislação aplicável.

10. EXECUÇÃO, ACOMPANHAMENTO E DESEMPENHO

10.1. O instrutor poderá registrar avaliações, evolução, dificuldades e pontos de melhoria para fins de acompanhamento pedagógico e comprovação da execução dos serviços.

10.2. Esses registros não substituem a avaliação oficial realizada pelo órgão competente.

11. DOCUMENTAÇÃO E LICENÇA DE APRENDIZAGEM

11.1. A realização das aulas dependerá do atendimento dos requisitos legais e documentais exigidos para o candidato.

11.2. Se a aula não puder ser realizada por ausência, irregularidade ou impedimento documental imputável ao CONTRATANTE, o reagendamento observará as condições deste contrato e a legislação aplicável.

12. PROTEÇÃO DE DADOS PESSOAIS

12.1. Os dados pessoais fornecidos pelo CONTRATANTE poderão ser tratados para cadastro, execução e administração do contrato, agendamento, controle de aulas, emissão de documentos, controle financeiro, comunicação entre as partes, cumprimento de obrigações legais e exercício regular de direitos, observada a Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018).

12.2. O CONTRATANTE poderá exercer os direitos previstos na legislação aplicável pelos canais disponibilizados pelo responsável pelo tratamento dos dados.

12.3. O uso de dados para publicidade ou divulgação não relacionada à execução do contrato dependerá da hipótese legal adequada e, quando necessário, de autorização específica.

13. IMAGEM, ÁUDIO E VÍDEO

13.1. A utilização de imagem, voz ou vídeo do CONTRATANTE para divulgação pública ou finalidade promocional dependerá de autorização específica quando exigida.

13.2. Registros necessários à segurança, controle operacional, comprovação da prestação do serviço ou cumprimento de obrigação legal serão tratados de acordo com a finalidade e a base legal aplicável.

14. RESPONSABILIDADE DAS PARTES

14.1. Cada parte responderá pelos danos que causar por ação ou omissão, nos termos da legislação aplicável.

14.2. O CONTRATADO não garante aprovação em exames nem responde por atos de órgãos públicos, examinadores, terceiros, indisponibilidade de sistemas públicos ou alterações normativas fora de seu controle.

14.3. Nenhuma cláusula deste contrato deverá ser interpretada como exclusão ou limitação de responsabilidade que não seja permitida pela legislação aplicável.

15. ALTERAÇÕES DO CONTRATO

15.1. Alterações de quantidade de aulas, categoria, preço, forma de pagamento ou outras condições relevantes deverão ser registradas no sistema ou em aditivo contratual.

15.2. O histórico eletrônico poderá registrar data, usuário responsável e conteúdo das alterações para fins de transparência e auditoria.

16. RESCISÃO E ENCERRAMENTO

16.1. O contrato poderá ser encerrado por acordo entre as partes ou nas demais hipóteses admitidas pela legislação.

16.2. No encerramento serão apurados os serviços efetivamente prestados, valores pagos, valores devidos, eventuais créditos e demais obrigações existentes.

16.3. Eventual restituição, compensação ou cobrança deverá observar o contrato e a legislação aplicável, inclusive as regras de proteção do consumidor quando incidentes.

17. INADIMPLEMENTO

17.1. O atraso de qualquer parcela poderá ser registrado no sistema financeiro como ATRASADO.

17.2. A existência de débito não autoriza constrangimento, exposição pública ou qualquer prática incompatível com a legislação.

18. NATUREZA DA RELAÇÃO

18.1. Este instrumento formaliza uma prestação de serviços de instrução de trânsito entre as partes, observada a legislação aplicável à atividade do instrutor autônomo quando essa for a modalidade de atuação do CONTRATADO.

19. COMUNICAÇÕES E REGISTROS ELETRÔNICOS

19.1. As comunicações sobre aulas, pagamentos, reagendamentos e alterações poderão ocorrer por telefone, WhatsApp, e-mail ou pelo sistema utilizado pelas partes.

19.2. Registros eletrônicos de contratação, agendamento, pagamento e alterações poderão ser utilizados como elementos de comprovação da relação contratual, observada a legislação aplicável.

20. BOA-FÉ E EQUILÍBRIO CONTRATUAL

20.1. As partes comprometem-se a agir com boa-fé, transparência, cooperação, respeito e equilíbrio na execução do contrato.

20.2. Eventual cláusula que contrarie norma legal cogente deverá ser interpretada ou ajustada de modo a preservar a validade das demais disposições, sem afastar direitos indisponíveis.

21. LEGISLAÇÃO APLICÁVEL E FORO

21.1. Este contrato será regido pela legislação brasileira aplicável, incluindo as normas de trânsito vigentes, a regulamentação do CONTRAN e SENATRAN, a legislação civil e, quando incidente, a legislação de proteção do consumidor e de proteção de dados pessoais.

21.2. Fica observado o foro competente na forma da legislação aplicável, inclusive eventual regra legal de competência territorial em favor do consumidor, quando incidente.

22. DECLARAÇÃO DE CIÊNCIA

O CONTRATANTE declara que recebeu informações claras sobre os serviços, quantidade de aulas, valores, forma de pagamento, cronograma financeiro, condições de execução, agendamento e responsabilidades das partes.

O CONTRATADO declara que prestará os serviços dentro dos limites de sua habilitação profissional e da regulamentação aplicável.

CONDIÇÕES ADICIONAIS REGISTRADAS:
${notes}

Local e data: ________________________________, ______/______/________.

____________________________________________
CONTRATANTE — ALUNO
Nome: ${student.full_name || "Não informado"}
CPF: ${student.cpf || "Não informado"}

____________________________________________
CONTRATADO — INSTRUTOR DE TRÂNSITO
Nome: ${profile.full_name || user?.user_metadata?.full_name || user?.email || "Não informado"}
CPF: ${profile.cpf || "Não informado"}
Credencial: ${profile.credential || "Não informada"}

____________________________________________
TESTEMUNHA 1
Nome: ______________________________________
CPF: _______________________________________

____________________________________________
TESTEMUNHA 2
Nome: ______________________________________
CPF: _______________________________________

ANEXOS INTEGRANTES DO CONTRATO
I — Planejamento de aulas por categoria.
II — Cronograma financeiro.
III — Política de agendamento, cancelamento e reagendamento, quando existente.
IV — Termo de ciência de segurança, quando utilizado.
V — Aviso de privacidade, quando disponibilizado separadamente.

Documento gerado pelo ENAT — Assistente do Instrutor.
`;
  }

  function printContract() {
    if (!savedStudent) {
      setMsg("Salve o aluno antes de gerar o contrato.");
      return;
    }

    const text = buildContractText(savedStudent);
    const escapeHtml = value => String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    const win = window.open("", "_blank", "width=1000,height=800");
    if (!win) {
      setMsg("O navegador bloqueou a janela do contrato. Permita pop-ups para o sistema.");
      return;
    }

    const contract = savedContract || {};
    const paymentLabels = { PIX: "PIX", DINHEIRO: "Dinheiro", DEBITO: "Cartão de débito", CARTAO_CREDITO: "Cartão de crédito", BOLETO: "Boleto", TRANSFERENCIA: "Transferência bancária", PARCELADO: "Parcelado", OUTRO: "Outro" };
    const installments = Array.isArray(contract.installments) ? contract.installments : [];
    const tableRows = installments.map(item => `
      <tr>
        <td>${item.installment_number}/${contract.installments_count || 1}</td>
        <td>${formatDateBR(item.due_date)}</td>
        <td>${formatBRL(item.amount)}</td>
        <td>${escapeHtml(item.status || "PENDENTE")}</td>
      </tr>`).join("");

    const sections = text.split(/\n(?=\d+\. )/g);
    const bodyHtml = sections.map(section => {
      const safe = escapeHtml(section.trim());
      if (!safe) return "";
      const firstLine = safe.split("\n")[0];
      if (/^\d+\. /.test(firstLine)) {
        return `<section><h2>${firstLine}</h2><p>${safe.split("\n").slice(1).join("<br>")}</p></section>`;
      }
      return `<div class="prelude">${safe.replace(/\n/g, "<br>")}</div>`;
    }).join("");

    win.document.write(`
      <!doctype html>
      <html lang="pt-BR">
      <head>
        <meta charset="utf-8">
        <title>Contrato - ${escapeHtml(savedStudent.full_name)}</title>
        <style>
          @page{size:A4;margin:18mm 16mm 18mm 16mm}
          body{font-family:Arial,Helvetica,sans-serif;max-width:820px;margin:0 auto;color:#17233b;font-size:11.5pt;line-height:1.55}
          .header{text-align:center;border-bottom:2px solid #1d3557;padding-bottom:12px;margin-bottom:22px}
          .brand{font-weight:900;letter-spacing:.12em;color:#168fc4;font-size:13px}
          h1{font-size:19px;margin:7px 0 0;color:#17233b}
          h2{font-size:13px;color:#17345f;margin:20px 0 7px;border-bottom:1px solid #d8e1ed;padding-bottom:4px}
          p{margin:5px 0 10px;text-align:justify}
          .prelude{margin:8px 0;line-height:1.55}
          .summary{border:1px solid #d5deea;border-radius:8px;padding:12px;margin:15px 0;background:#f7faff}
          table{width:100%;border-collapse:collapse;margin:10px 0 18px;font-size:10.5pt}
          th,td{border:1px solid #cfd8e3;padding:7px;text-align:left}
          th{background:#eef4fa}
          .signatures{margin-top:38px;display:grid;grid-template-columns:1fr 1fr;gap:45px 55px}
          .sig{padding-top:36px;border-top:1px solid #222;text-align:center;min-height:55px}
          .footer{margin-top:30px;padding-top:10px;border-top:1px solid #d5deea;font-size:9px;color:#667085;text-align:center}
          @media print{body{max-width:none}.no-print{display:none}}
        </style>
      </head>
      <body>
        <div class="header"><div class="brand">ENAT — ASSISTENTE DO INSTRUTOR</div><h1>CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE INSTRUÇÃO DE TRÂNSITO</h1></div>
        <div class="summary">
          <strong>Resumo financeiro</strong><br>
          Valor contratado: ${formatBRL(contract.contract_amount)}<br>
          Forma de pagamento: ${escapeHtml(paymentLabels[contract.payment_method] || contract.payment_method || "Não informada")}<br>
          Parcelamento: ${contract.installments_count || 1}x &nbsp; | &nbsp; Entrada: ${formatBRL(contract.entry_amount || 0)}<br>
          Primeiro vencimento: ${formatDateBR(contract.first_due_date)}
        </div>
        ${bodyHtml}
        ${installments.length ? `<h2>CRONOGRAMA FINANCEIRO</h2><table><thead><tr><th>Parcela</th><th>Vencimento</th><th>Valor</th><th>Status</th></tr></thead><tbody>${tableRows}</tbody></table>` : ""}
        <div class="signatures">
          <div class="sig">CONTRATANTE — ALUNO<br>${escapeHtml(savedStudent.full_name || "")}</div>
          <div class="sig">CONTRATADO — INSTRUTOR DE TRÂNSITO<br>${escapeHtml(instructorProfile?.full_name || user?.user_metadata?.full_name || user?.email || "")}</div>
          <div class="sig">TESTEMUNHA 1<br>Nome / CPF</div>
          <div class="sig">TESTEMUNHA 2<br>Nome / CPF</div>
        </div>
        <div class="footer">Documento gerado pelo ENAT — Assistente do Instrutor. Revisar os dados antes da assinatura.</div>
        <script>window.onload=function(){setTimeout(function(){window.print();},250);}</script>
      </body>
      </html>
    `);
    win.document.close();
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

    if (selectedCategoryPlans.length === 0) {
      setMsg("Selecione pelo menos uma categoria de aula no planejamento do contrato.");
      return;
    }

    for (const [cat, plan] of selectedCategoryPlans) {
      const lessons = Number(plan.lessons);
      const unitPrice = Number(plan.unitPrice);

      if (!Number.isInteger(lessons) || lessons <= 0) {
        setMsg(`Informe uma quantidade válida de aulas para a categoria ${cat}.`);
        return;
      }

      if (!Number.isFinite(unitPrice) || unitPrice < 0) {
        setMsg(`Informe um valor válido por aula para a categoria ${cat}.`);
        return;
      }
    }

    setBusy(true);

    try {
      // Evita duplicidade de cadastro quando o CPF já estiver registrado para este instrutor.
      if (form.cpf.trim()) {
        const { data: existing, error: duplicateError } = await supabase
          .from("ai_students")
          .select("id, full_name")
          .eq("user_id", user.id)
          .eq("cpf", form.cpf.trim())
          .limit(1);

        if (duplicateError) throw duplicateError;

        if (existing?.length) {
          setMsg(`Aluno já cadastrado: ${existing[0].full_name}. Abra o cadastro existente em ALUNOS.`);
          return;
        }
      }

      const totalLessons = totalContractLessons;
      const totalAmount = totalContractAmount;

      const { data, error } = await supabase
        .from("ai_students")
        .insert({
          user_id: user.id,
          full_name: form.full_name.trim(),
          cpf: form.cpf.trim() || null,
          phone: form.phone.trim() || null,
          category: form.category.trim().toUpperCase() || null,
          start_date: form.start_date || null,

          // Compatibilidade com a estrutura antiga.
          lesson_goal: totalLessons || null,
          contract_amount: totalAmount || null,

          payment_method: form.payment_method || null,
          contract_status: totalAmount > 0
            ? "PENDENTE_ASSINATURA"
            : "NAO_GERADO",

          contract_notes: form.contract_notes.trim() || null,

          notes: [
            form.student_objective.trim()
              ? `Objetivo do aluno: ${form.student_objective.trim()}`
              : "",
            form.notes.trim()
              ? `Observações: ${form.notes.trim()}`
              : ""
          ].filter(Boolean).join("\n\n") || null
        })
        .select("*")
        .single();

      if (error) throw error;

      const student = data;

      // Cria o contrato principal.
      const { data: contract, error: contractError } = await supabase
        .from("ai_service_contracts")
        .insert({
          user_id: user.id,
          student_id: student.id,
          contractor_name: student.full_name,
          contract_amount: totalAmount,
          planned_lessons: totalLessons,
          payment_method: form.payment_method || null,
          installments_count: installmentCount,
          first_due_date: form.first_due_date || form.start_date || null,
          entry_amount: entryAmount,
          financed_amount: financedAmount,
          start_date: form.start_date || null,
          // O banco define o status inicial do contrato.
          // Não enviar um valor fixo evita conflito com o CHECK de status
          // existente no projeto Supabase.
          notes: form.contract_notes.trim() || null
        })
        .select("*")
        .single();

      if (contractError) throw contractError;

      // O contrato já existe no Supabase neste ponto.
      // Mantemos o aluno e o contrato disponíveis imediatamente para a geração,
      // mesmo que alguma etapa complementar (itens, planejamento ou financeiro)
      // apresente erro depois.
      setSavedStudent(student);
      setSavedContract(contract);
      setSavedContractItems([]);

      // Cria cada item do contrato separadamente por categoria.
      const contractItems = selectedCategoryPlans.map(([cat, plan]) => ({
        user_id: user.id,
        service_contract_id: contract.id,
        student_id: student.id,
        cnh_category: cat,
        planned_lessons: Number(plan.lessons),
        unit_price: Number(plan.unitPrice)
      }));

      const { data: createdItems, error: itemsError } = await supabase
        .from("ai_service_contract_items")
        .insert(contractItems)
        .select("*");

      if (itemsError) throw itemsError;
      setSavedContractItems(createdItems || []);

      // Mantém o planejamento por categoria sincronizado.
      const categoryPlansPayload = selectedCategoryPlans.map(([cat, plan]) => {
        const item = createdItems?.find(
          row => String(row.cnh_category).toUpperCase() === cat
        );

        return {
          user_id: user.id,
          student_id: student.id,
          cnh_category: cat,
          planned_lessons: Number(plan.lessons),
          completed_lessons: 0,
          unit_price: Number(plan.unitPrice),
          service_contract_id: contract.id,
          service_contract_item_id: item?.id || null
        };
      });

      const { error: plansError } = await supabase
        .from("ai_student_category_plans")
        .upsert(categoryPlansPayload, {
          onConflict: "student_id,cnh_category"
        });

      if (plansError) throw plansError;

      // Gera o cronograma financeiro real do contrato. Cada parcela vira um lançamento
      // vinculado ao contrato e ao aluno, permitindo acompanhar pagamento individualmente.
      const installmentRows = scheduledInstallments.map(item => ({
        user_id: user.id,
        service_contract_id: contract.id,
        student_id: student.id,
        installment_number: item.installment_number,
        due_date: item.due_date,
        amount: item.amount,
        status: item.status,
        payment_method: form.payment_method || null
      }));

      let createdInstallments = [];
      if (installmentRows.length) {
        const { data: installmentsData, error: installmentsError } = await supabase
          .from("ai_contract_installments")
          .insert(installmentRows)
          .select("*");
        if (installmentsError) throw installmentsError;
        createdInstallments = installmentsData || [];
      }

      const financePayload = [
        ...(entryAmount > 0 ? [{
          user_id: user.id,
          student_id: student.id,
          entry_date: form.start_date || new Date().toISOString().slice(0, 10),
          type: "RECEITA",
          category: "ENTRADA DE CONTRATO",
          description: "Entrada do contrato de instrução",
          amount: entryAmount,
          payment_method: form.payment_method || null,
          person_type: "PF",
          document: form.cpf.trim() || null,
          counterparty_name: student.full_name,
          service_contract_id: contract.id,
          service_contract_item_id: null,
          status: "PENDENTE"
        }] : []),
        ...createdInstallments.map(item => ({
          user_id: user.id,
          student_id: student.id,
          entry_date: item.due_date,
          type: "RECEITA",
          category: "CONTRATO DE INSTRUÇÃO",
          description: `Contrato de instrução — parcela ${item.installment_number}/${createdInstallments.length}`,
          amount: Number(item.amount),
          payment_method: form.payment_method || null,
          person_type: "PF",
          document: form.cpf.trim() || null,
          counterparty_name: student.full_name,
          service_contract_id: contract.id,
          contract_installment_id: item.id,
          service_contract_item_id: null,
          status: "PENDENTE"
        }))
      ].filter(item => item.amount > 0);

      if (financePayload.length) {
        const { error: financeError } = await supabase
          .from("ai_finance")
          .insert(financePayload);
        if (financeError) throw financeError;
      }

      // Atualiza o contrato com o cronograma para a geração do documento.
      const contractWithInstallments = {
        ...contract,
        installments_count: installmentCount,
        entry_amount: entryAmount,
        first_due_date: form.first_due_date || form.start_date || null,
        installments: createdInstallments
      };
      setSavedContract(contractWithInstallments);
      setSavedContractItems(createdItems || []);

      setMsg("Aluno cadastrado com sucesso. O contrato está disponível para geração.");

      setForm(prev => ({
        ...prev,
        full_name: "",
        cpf: "",
        phone: "",
        category: "",
        start_date: "",
        lesson_goal: "",
        contract_amount: "",
        payment_method: "",
        payment_installments: "1",
        first_due_date: new Date().toISOString().slice(0, 10),
        entry_amount: "0",
        contract_notes: "",
        student_objective: "",
        notes: ""
      }));

      setCategoryPlans({
        A: { enabled: false, lessons: "", unitPrice: "" },
        B: { enabled: false, lessons: "", unitPrice: "" },
        C: { enabled: false, lessons: "", unitPrice: "" },
        D: { enabled: false, lessons: "", unitPrice: "" },
        E: { enabled: false, lessons: "", unitPrice: "" }
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

        <button className="nav active">ALUNOS</button>
        <button className="nav" onClick={onBack}>VOLTAR</button>
      </aside>

      <main>
        <header>
          <div>
            <b>{user?.email}</b>
            <small>Cadastro de aluno</small>
          </div>
          <span className="pill">ALUNOS</span>
        </header>

        <section>
          <h1>Novo Aluno</h1>

          <form className="panel" onSubmit={saveStudent}>
            <h2>Dados do aluno</h2>

            <label>Nome completo
              <input value={form.full_name} onChange={e => updateField("full_name", e.target.value)} placeholder="Nome completo do aluno" />
            </label>

            <label>CPF
              <input value={form.cpf} onChange={e => updateField("cpf", e.target.value)} placeholder="CPF" inputMode="numeric" />
            </label>

            <label>Telefone
              <input value={form.phone} onChange={e => updateField("phone", e.target.value)} placeholder="Telefone" />
            </label>

            <label>Categoria da CNH
              <input
                value={form.category}
                onChange={e => updateField("category", e.target.value.toUpperCase())}
                placeholder="Ex.: AB"
              />
              <small>Informe a categoria/habilitação do aluno. Ex.: A, B, AB, AC, AD ou AE.</small>
            </label>

            <label>Data de início
              <input
                type="date"
                value={form.start_date}
                onChange={e => updateField("start_date", e.target.value)}
              />
            </label>

            <h2>Planejamento de aulas por categoria</h2>

            <div style={{
              display: "grid",
              gap: "12px",
              marginBottom: "18px"
            }}>
              {["A", "B", "C", "D", "E"].map(cat => {
                const plan = categoryPlans[cat];

                return (
                  <div
                    key={cat}
                    style={{
                      border: "1px solid rgba(85,191,239,0.25)",
                      borderRadius: "10px",
                      padding: "14px"
                    }}
                  >
                    <label style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontWeight: 800
                    }}>
                      <input
                        type="checkbox"
                        checked={plan.enabled}
                        onChange={e =>
                          updateCategoryPlan(
                            cat,
                            "enabled",
                            e.target.checked
                          )
                        }
                      />
                      Categoria {cat}
                    </label>

                    {plan.enabled && (
                      <div style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "10px",
                        marginTop: "10px"
                      }}>
                        <label>
                          Quantidade de aulas
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={plan.lessons}
                            onChange={e =>
                              updateCategoryPlan(
                                cat,
                                "lessons",
                                e.target.value
                              )
                            }
                            placeholder="Ex.: 5"
                          />
                        </label>

                        <label>
                          Valor por aula
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={plan.unitPrice}
                            onChange={e =>
                              updateCategoryPlan(
                                cat,
                                "unitPrice",
                                e.target.value
                              )
                            }
                            placeholder="Ex.: 80,00"
                          />
                        </label>

                        <div style={{
                          gridColumn: "1 / -1",
                          fontWeight: 800
                        }}>
                          Total categoria {cat}:{" "}
                          {formatBRL(
                            (Number(plan.lessons) || 0) *
                            (Number(plan.unitPrice) || 0)
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{
              padding: "16px",
              borderRadius: "10px",
              border: "1px solid rgba(85,191,239,0.35)",
              marginBottom: "18px"
            }}>
              <strong>Total contratado</strong>
              <div>
                {totalContractLessons} aula(s)
              </div>
              <div style={{
                fontSize: "20px",
                fontWeight: 900,
                marginTop: "4px"
              }}>
                {formatBRL(totalContractAmount)}
              </div>
            </div>

            <label>Objetivo textual do aluno
              <textarea value={form.student_objective} onChange={e => updateField("student_objective", e.target.value)} placeholder="Ex.: preparação para exame" />
            </label>

            <h2>Financeiro e contrato</h2>

            <div style={{
              padding: "14px",
              border: "1px solid #d8e4f4",
              borderRadius: "10px",
              background: "#f7faff",
              marginBottom: "12px"
            }}>
              <strong>Valor contratado (calculado)</strong>
              <div style={{ fontSize: "22px", fontWeight: 900, marginTop: "4px" }}>
                {formatBRL(totalContractAmount)}
              </div>
              <small>O valor é formado automaticamente pela soma das categorias contratadas.</small>
            </div>

            <label>Forma de pagamento
              <select value={form.payment_method} onChange={e => updateField("payment_method", e.target.value)}>
                <option value="">Selecione</option>
                <option value="PIX">PIX</option>
                <option value="DINHEIRO">Dinheiro</option>
                <option value="CARTAO_CREDITO">Cartão de crédito</option>
                <option value="CARTAO_DEBITO">Cartão de débito</option>
                <option value="TRANSFERENCIA">Transferência</option>
                <option value="BOLETO">Boleto</option>
                <option value="PARCELADO">Parcelado</option>
                <option value="OUTRO">Outro</option>
              </select>
            </label>

            {isInstallmentPayment && (
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "10px",
                padding: "14px",
                margin: "10px 0 12px",
                border: "1px solid #d8e4f4",
                borderRadius: "10px",
                background: "#f7faff"
              }}>
                <label>Quantidade de parcelas
                  <select value={form.payment_installments} onChange={e => updateField("payment_installments", e.target.value)}>
                    {Array.from({ length: form.payment_method === "CARTAO_CREDITO" ? 12 : 24 }, (_, i) => i + 1).map(n => (
                      <option key={n} value={n}>{n}x</option>
                    ))}
                  </select>
                </label>
                <label>Entrada
                  <input type="number" min="0" step="0.01" value={form.entry_amount} onChange={e => updateField("entry_amount", e.target.value)} />
                </label>
                <label>1º vencimento
                  <input type="date" value={form.first_due_date} onChange={e => updateField("first_due_date", e.target.value)} />
                </label>
              </div>
            )}

            <div style={{
              padding: "14px",
              border: "1px solid #d8e4f4",
              borderRadius: "10px",
              background: "#fff",
              marginBottom: "12px"
            }}>
              <strong>Resumo financeiro</strong>
              <div style={{ marginTop: "8px" }}>Total: <b>{formatBRL(totalContractAmount)}</b></div>
              <div>Entrada: <b>{formatBRL(entryAmount)}</b></div>
              <div>Parcelamento: <b>{installmentCount}x de aproximadamente {formatBRL(scheduledInstallments[0]?.amount || 0)}</b></div>
              <div style={{ marginTop: "8px", fontSize: "12px" }}>
                O sistema criará cada parcela no financeiro como <b>RECEITA / PENDENTE</b>, vinculada ao contrato e ao aluno.
              </div>
              {scheduledInstallments.length > 0 && (
                <div style={{ marginTop: "10px", maxHeight: "180px", overflowY: "auto" }}>
                  {scheduledInstallments.map(item => (
                    <div key={item.installment_number} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #edf1f5", fontSize: "12px" }}>
                      <span>Parcela {item.installment_number}/{installmentCount}</span>
                      <span>{formatDateBR(item.due_date)}</span>
                      <strong>{formatBRL(item.amount)}</strong>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <label>Condições do contrato
              <textarea value={form.contract_notes} onChange={e => updateField("contract_notes", e.target.value)} placeholder="Condições adicionais do contrato." />
            </label>

            <label>Observações
              <textarea value={form.notes} onChange={e => updateField("notes", e.target.value)} placeholder="Observações sobre o aluno" />
            </label>

            <div style={{display:"flex",gap:"10px",flexWrap:"wrap"}}>
              <button type="submit" disabled={busy}>{busy ? "SALVANDO..." : "SALVAR ALUNO"}</button>
              {savedStudent && <button type="button" onClick={printContract}>GERAR CONTRATO</button>}
              <button type="button" className="link" onClick={onBack}>VOLTAR</button>
            </div>

            {msg && <p className="msg">{msg}</p>}
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
  const [showExamForm, setShowExamForm] = useState(false);
  const [showAgendaForm, setShowAgendaForm] = useState(false);
  const [activeLesson, setActiveLesson] = useState(null);
  const [showLessonHistory, setShowLessonHistory] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [showStudentForm, setShowStudentForm] = useState(false);
  const name = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Instrutor";
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [dashboardStudents, setDashboardStudents] = useState([]);
  const [dashboardRpaReports, setDashboardRpaReports] = useState([]);
  const [dashboardVehicles, setDashboardVehicles] = useState([]);
  const [dashboardMaintenance, setDashboardMaintenance] = useState([]);
  const [financeEntries, setFinanceEntries] = useState([]);
  const [agendaLessons, setAgendaLessons] = useState([]);
  const [scheduledLessonToStart, setScheduledLessonToStart] = useState(null);
  const [agendaLoading, setAgendaLoading] = useState(false);
  const [financeAccounts, setFinanceAccounts] = useState([]);
  const [showFinanceAccounts, setShowFinanceAccounts] = useState(false);
  const [financeAccountForm, setFinanceAccountForm] = useState({
    bank_name: "",
    account_name: "",
    account_type: "CORRENTE",
    agency: "",
    account_number: "",
    initial_balance: "",
    status: "ATIVA"
  });
  const [showFinanceForm, setShowFinanceForm] = useState(false);
  const [financeForm, setFinanceForm] = useState({ type: 'RECEITA', entry_date: new Date().toISOString().slice(0,10), category: '', description: '', amount: '', payment_method: '', account_id: '', status: 'PAGO', person_type: 'PF', document: '', counterparty_name: '' });
  useEffect(() => {
    let active = true;

    async function loadFinanceAccounts() {
      if (!supabase || !user?.id) return;

      const { data, error } = await supabase
        .from("ai_finance_accounts")
        .select("id, user_id, bank_name, account_name, account_type, agency, account_number, initial_balance, status, created_at")
        .eq("user_id", user.id)
        .order("account_name", { ascending: true });

      if (!active) return;

      if (error) {
        console.error("Erro ao carregar contas bancárias:", error);
        setFinanceAccounts([]);
        return;
      }

      setFinanceAccounts(data || []);
    }

    loadFinanceAccounts();

    return () => {
      active = false;
    };
  }, [user?.id]);
  useEffect(() => {
    let active = true;
    async function loadDashboardStudents() {
      if (!supabase || !user?.id) return;
      const { data, error } = await supabase
        .from("ai_students")
        .select("id, full_name, category, lesson_goal, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (!active) return;
      if (error) {
        console.error("Erro ao carregar alunos do dashboard:", error);
        setDashboardStudents([]);
        return;
      }
      setDashboardStudents(data || []);
    }
    loadDashboardStudents();
    return () => { active = false; };
  }, [user?.id]);

  useEffect(() => {
    let active = true;
    async function loadDashboardVehicleCosts() {
      if (!supabase || !user?.id) return;
      const [{ data: vehicles, error: vehicleError }, { data: maintenance, error: maintenanceError }] = await Promise.all([
        supabase.from("ai_vehicles").select("id, insurance_annual, taxes_annual, other_annual").eq("user_id", user.id),
        supabase.from("ai_maintenance").select("id, actual_cost, status").eq("user_id", user.id)
      ]);
      if (!active) return;
      if (vehicleError) setDashboardVehicles([]); else setDashboardVehicles(vehicles || []);
      if (maintenanceError) setDashboardMaintenance([]); else setDashboardMaintenance(maintenance || []);
    }
    loadDashboardVehicleCosts();
    return () => { active = false; };
  }, [user?.id]);

  useEffect(() => {
    let active = true;
    async function loadDashboardRpa() {
      if (!supabase || !user?.id) return;
      let { data, error } = await supabase
        .from("ai_rpa_reports")
        .select("id, student_id, total_lessons, status, latest_quality_score, latest_hsi_score, latest_average, updated_at")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      // O dashboard continua funcional mesmo se a migration dos indicadores
      // avançados do RPA ainda não tiver sido executada no Supabase.
      if (error) {
        const fallback = await supabase
          .from("ai_rpa_reports")
          .select("id, student_id, total_lessons, status, updated_at")
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false });
        data = fallback.data;
        error = fallback.error;
      }

      if (!active) return;
      if (error) {
        console.error("Erro ao carregar RPA do dashboard:", error);
        setDashboardRpaReports([]);
        return;
      }
      setDashboardRpaReports(data || []);
    }
    loadDashboardRpa();
    return () => { active = false; };
  }, [user?.id]);

  useEffect(() => {
    let active = true;
    async function loadFinanceEntries() {
      if (!supabase || !user?.id) return;
      const { data, error } = await supabase
        .from("ai_finance")
        .select("*")
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
  useEffect(() => {
    let active = true;

    async function loadAgendaLessons() {
      if (!supabase || !user?.id) return;

      setAgendaLoading(true);

      const { data, error } = await supabase
        .from("ai_lessons")
        .select("id, student_id, scheduled_at, started_at, ended_at, status, phase, cnh_category, service_contract_item_id, objective, exam_scheduled_at, exam_type, exam_location, exam_status, ai_students(full_name)")
        .eq("user_id", user.id)
        .order("scheduled_at", { ascending: true });

      if (!active) return;

      if (error) {
        console.error("Erro ao carregar agenda:", error);
        setAgendaLessons([]);
        setAgendaLoading(false);
        return;
      }

      setAgendaLessons(data || []);
      setAgendaLoading(false);
    }

    loadAgendaLessons();

    return () => {
      active = false;
    };
  }, [user?.id]);
  const menu = [
    ["dashboard", "DASHBOARD", LayoutDashboard],
    ["alunos", "ALUNOS", Users],
    ["agenda", "AGENDA", CalendarDays],
    ["aulas", "AULAS", CarFront],
    ["hsi", "HSI-DOTH-P", Brain],
    ["rpa", "RPA ÚNICO", FileText],
    ["financeiro", "FINANCEIRO", WalletCards],
    ["cursos", "CURSOS", BookOpen],
    ["assinatura", "LICENÇA / CONTATO ENAT", BadgeCheck]
  ];
if (tab === "financeiro" && showVehicleForm) {
  return (
    <VehicleForm
      user={user}
      onBack={() => setShowVehicleForm(false)}
    />
  );
}
if (tab === "aulas" && showExamForm) {
  return (
    <ExamScheduleForm
      user={user}
      onBack={() => setShowExamForm(false)}
      onScheduled={(data) => {
        setShowExamForm(false);
        if (data) setAgendaLessons(prev => [data, ...prev.filter(item => item.id !== data.id)]);
      }}
    />
  );
}
if (tab === "aulas" && showLessonForm) {
  return (
    <LessonForm
      user={user}
      scheduledLesson={scheduledLessonToStart}
      onBack={() => { setScheduledLessonToStart(null); setShowLessonForm(false); }}
      onStarted={(lesson) => {
        setActiveLesson(lesson);
        setAgendaLessons(prev => prev.map(item => item.id === lesson.id ? { ...item, ...lesson } : item));
        setScheduledLessonToStart(null);
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

        {menu.map(([key, label, Icon]) => (
          <button
            key={key}
            title={label}
            aria-label={label}
            className={tab === key ? "nav active icon-nav" : "nav icon-nav"}
            onClick={() => setTab(key)}
          >
            <Icon size={20} strokeWidth={2.1} />
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
    "Licença e acesso",
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

    if (tab === "cursos") {
      return <CoursesPage user={user} onBack={() => setTab("dashboard")} />;
    }

    if (tab === "assinatura") {
      return <SubscriptionPage onBack={() => setTab("dashboard")} />;
    }

    if (tab === "dashboard") {
      const revenue = financeEntries
        .filter(entry => String(entry.type || "").toUpperCase() === "RECEITA")
        .reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
      const expenses = financeEntries
        .filter(entry => String(entry.type || "").toUpperCase() === "DESPESA")
        .reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
      const scheduled = agendaLessons.filter(lesson => String(lesson.status || "").toLowerCase() === "scheduled").length;
      const completed = agendaLessons.filter(lesson => ["completed","concluida","concluído"].includes(String(lesson.status || "").toLowerCase())).length;
      const scheduledExams = agendaLessons.filter(lesson => lesson.exam_scheduled_at && String(lesson.exam_status || "").toUpperCase() === "AGENDADA").length;
      const totalLessons = dashboardRpaReports.reduce((sum, r) => sum + Number(r.total_lessons || 0), 0);
      const quality = dashboardRpaReports.map(r => Number(r.latest_quality_score)).filter(Number.isFinite);
      const hsi = dashboardRpaReports.map(r => Number(r.latest_hsi_score)).filter(Number.isFinite);
      const qualityAverage = quality.length ? quality.reduce((a,b)=>a+b,0)/quality.length : null;
      const hsiAverage = hsi.length ? hsi.reduce((a,b)=>a+b,0)/hsi.length : null;
      const formatCurrency = value => Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
      const annualVehicleCosts = dashboardVehicles.reduce((sum, vehicle) => sum + Number(vehicle.insurance_annual || 0) + Number(vehicle.taxes_annual || 0) + Number(vehicle.other_annual || 0), 0);
      const monthlyVehicleCosts = annualVehicleCosts / 12;
      const maintenanceActual = dashboardMaintenance.reduce((sum, item) => sum + Number(item.actual_cost || 0), 0);
      const operationalCosts = monthlyVehicleCosts + maintenanceActual;
      const balance = revenue - expenses - operationalCosts;
      const go = key => setTab(key);

      const actions = [
        ["alunos", "Alunos", "Cadastro e evolução", Users],
        ["agenda", "Agenda", "Aulas e provas", CalendarDays],
        ["aulas", "Aulas", "Executar e consultar", CarFront],
        ["hsi", "HSI-DOTH-P", "Avaliação comportamental", Brain],
        ["rpa", "RPA ÚNICO", "Relatórios e evolução", FileText],
        ["financeiro", "Financeiro", "Receitas e despesas", WalletCards],
      ];

      return (
        <div className="dashboard-page">
          <div className="dashboard-hero">
            <div><div className="eyebrow">ENAT • ASSISTENTE DO INSTRUTOR</div><h1>Dashboard <span className="dashboard-version">V7.5 OPERACIONAL</span></h1><p>Visão geral da operação. Use os indicadores e atalhos para entrar diretamente em cada módulo.</p></div>
            <div className="dashboard-greeting"><span>Instrutor</span><strong>{name}</strong></div>
          </div>

          <div className="dashboard-layout">
            <div className="dashboard-main-column">
              <section className="dashboard-section-card quick-access-section">
                <div className="section-title"><span className="section-title-icon">⚡</span><div><div className="eyebrow">NAVEGAÇÃO</div><h2>ACESSO RÁPIDO</h2></div></div>
                <div className="quick-grid">{actions.map(([key,label,desc,Icon]) => <button key={key} className="quick-card" onClick={() => go(key)}><span className="quick-icon"><Icon size={24}/></span><span><strong>{label}</strong><small>{desc}</small></span><b>→</b></button>)}</div>
              </section>

              <section className="dashboard-section-card actions-section">
                <div className="section-title"><span className="section-title-icon">🚀</span><div><div className="eyebrow">OPERAÇÃO</div><h2>AÇÕES RÁPIDAS</h2></div></div>
                <div className="action-grid">
                  <button className="action-card action-green" onClick={() => go("alunos")}><Users size={32}/><strong>+ Novo aluno</strong></button>
                  <button className="action-card action-blue" onClick={() => { setShowLessonForm(true); go("aulas"); }}><CarFront size={32}/><strong>+ Iniciar aula</strong></button>
                  <button className="action-card action-orange" onClick={() => go("financeiro")}><WalletCards size={32}/><strong>+ Lançar financeiro</strong></button>
                  <button className="action-card action-purple" onClick={() => go("rpa")}><FileText size={32}/><strong>Ver RPA ÚNICO</strong></button>
                </div>
              </section>

              <section className="dashboard-section-card operational-summary">
                <div className="summary-illustration"><CarFront size={58}/><FileText size={48}/></div>
                <div><div className="eyebrow">VISÃO OPERACIONAL</div><h2>Resumo operacional</h2><p>Use o acesso rápido para navegar pelas áreas do sistema e acompanhar seu desempenho.</p></div>
              </section>
            </div>

            <aside className="dashboard-stats-panel">
              <div className="stats-panel-title"><span>📊</span><strong>ESTATÍSTICAS GERAIS</strong></div>
              <div className="stat-item"><span className="stat-icon stat-blue"><CalendarDays size={22}/></span><div><small>Provas agendadas</small><strong>{scheduledExams}</strong></div></div>
              <div className="stat-item"><span className="stat-icon stat-green"><Users size={22}/></span><div><small>Alunos com RPA</small><strong>{dashboardRpaReports.length}</strong></div></div>
              <div className="stat-item"><span className="stat-icon stat-orange"><BadgeCheck size={22}/></span><div><small>Qualidade média</small><strong>{qualityAverage !== null ? qualityAverage.toFixed(1) : "—"}<em>/ 100</em></strong></div></div>
              <div className="stat-item"><span className="stat-icon stat-purple"><Brain size={22}/></span><div><small>HSI-DOTH-P médio</small><strong>{hsiAverage !== null ? hsiAverage.toFixed(1) : "—"}<em>/ 100</em></strong></div></div>
              <div className="stat-item"><span className="stat-icon stat-blue"><WalletCards size={22}/></span><div><small>Despesas lançadas</small><strong>{formatCurrency(expenses)}</strong></div></div>
              <div className="stat-item"><span className="stat-icon stat-orange"><CarFront size={22}/></span><div><small>Custos operacionais / mês</small><strong>{formatCurrency(operationalCosts)}</strong></div></div>
              <div className="stat-item"><span className="stat-icon stat-teal"><FileText size={22}/></span><div><small>Registros financeiros</small><strong>{financeEntries.length}</strong></div></div>
              <button className="balance-panel" onClick={() => go("financeiro")}><div><small>Saldo operacional</small><strong>{formatCurrency(balance)}</strong><span>Receitas − Despesas − Custos</span></div><span>ⓘ</span></button>
            </aside>
          </div>
        </div>
      );
    }
    if (tab === "perfil") return <ProfileForm user={user} />;
if (tab === "financeiro") {

  const financeRevenue = financeEntries
    .filter(entry => String(entry.type || "").toUpperCase() === "RECEITA")
    .reduce((total, entry) => total + Number(entry.amount || 0), 0);

  const financeExpenses = financeEntries
    .filter(entry => String(entry.type || "").toUpperCase() === "DESPESA")
    .reduce((total, entry) => total + Number(entry.amount || 0), 0);

  const financeResult = financeRevenue - financeExpenses;

  const formatCurrency = (value) =>
    Number(value || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });

  async function saveFinanceEntry(event) {
    event.preventDefault();

    if (!supabase || !user?.id) {
      alert("Usuário não autenticado.");
      return;
    }

    const amount = Number(
      String(financeForm.amount || "")
        .replace(/\./g, "")
        .replace(",", ".")
    );

    if (!financeForm.entry_date) {
      alert("Informe a data.");
      return;
    }

    if (!financeForm.category.trim()) {
      alert("Informe a categoria.");
      return;
    }

    if (!amount || amount <= 0) {
      alert("Informe um valor válido.");
      return;
    }

    const payload = {
      user_id: user.id,
      entry_date: financeForm.entry_date,
      type: financeForm.type,
      category: financeForm.category.trim(),
      description: financeForm.description.trim() || null,
      amount,
      payment_method: financeForm.payment_method || null,
      person_type: financeForm.person_type || "PF",
      document: financeForm.document.trim() || null,
      counterparty_name: financeForm.counterparty_name.trim() || null,
      account_id: financeForm.account_id || null,
      status: financeForm.status
    };

    const { data, error } = await supabase
      .from("ai_finance")
      .insert(payload)
      .select("id, user_id, student_id, lesson_id, entry_date, type, category, description, amount, payment_method, person_type, document, counterparty_name, account_id, status, created_at")
      .single();

    if (error) {
      console.error("Erro ao salvar lançamento financeiro:", error);
      alert("Não foi possível salvar o lançamento: " + error.message);
      return;
    }

    setFinanceEntries(prev => [data, ...prev]);

    setFinanceForm({
      type: "RECEITA",
      entry_date: new Date().toISOString().slice(0, 10),
      category: "",
      description: "",
      amount: "",
      payment_method: "",
      person_type: "PF",
      document: "",
      counterparty_name: "",
      status: "PAGO"
    });

    setShowFinanceForm(false);
  }

  async function deleteFinanceEntry(id) {
    if (!supabase || !id) return;

    const confirmed = window.confirm(
      "Deseja realmente excluir este lançamento?"
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("ai_finance")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Erro ao excluir lançamento:", error);
      alert("Não foi possível excluir o lançamento: " + error.message);
      return;
    }

    setFinanceEntries(prev =>
      prev.filter(entry => entry.id !== id)
    );
  }

  async function saveFinanceAccount(event) {
    event.preventDefault();

    if (!supabase || !user?.id) {
      alert("Usuário não autenticado.");
      return;
    }

    if (!financeAccountForm.bank_name.trim()) {
      alert("Informe o banco.");
      return;
    }

    if (!financeAccountForm.account_name.trim()) {
      alert("Informe o nome da conta.");
      return;
    }

    const initialBalance =
      Number(
        String(financeAccountForm.initial_balance || "")
          .replace(",", ".")
      ) || 0;

    const payload = {
      user_id: user.id,
      bank_name: financeAccountForm.bank_name.trim(),
      account_name: financeAccountForm.account_name.trim(),
      account_type: financeAccountForm.account_type,
      agency: financeAccountForm.agency.trim() || null,
      account_number:
        financeAccountForm.account_number.trim() || null,
      initial_balance: initialBalance,
      status: financeAccountForm.status
    };

    const { data, error } = await supabase
      .from("ai_finance_accounts")
      .insert(payload)
      .select("*")
      .single();

    if (error) {
      console.error("Erro ao salvar conta:", error);
      alert("Erro ao salvar conta: " + error.message);
      return;
    }

    setFinanceAccounts(prev => [...prev, data]);

    setFinanceAccountForm({
      bank_name: "",
      account_name: "",
      account_type: "CORRENTE",
      agency: "",
      account_number: "",
      initial_balance: "",
      status: "ATIVA"
    });

    setShowFinanceAccounts(false);
  }

  async function deleteFinanceAccount(id) {
    if (!supabase || !user?.id || !id) return;

    const confirmed = window.confirm(
      "Deseja realmente excluir esta conta?"
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("ai_finance_accounts")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Erro ao excluir conta:", error);
      alert(
        "Não foi possível excluir a conta. " +
        "Ela pode possuir lançamentos financeiros vinculados."
      );
      return;
    }

    setFinanceAccounts(prev =>
      prev.filter(account => account.id !== id)
    );
  }
  return (
    <>
      <h1>Financeiro</h1>

      <div className="panel">
        <h2>Gest&atilde;o financeira do instrutor</h2>

        <p>
          Centralize receitas, despesas, custos operacionais e
          resultado financeiro em um &uacute;nico m&oacute;dulo.
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
              DESPESAS
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

        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
          flexWrap: "wrap"
        }}>
          <div>
            <h2>Lan&ccedil;amentos financeiros</h2>
            <p>
              Registre receitas e despesas do instrutor.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowFinanceForm(!showFinanceForm)}
          >
            {showFinanceForm
              ? "FECHAR"
              : String.fromCharCode(43,32,78,79,86,79,32,76,65,78,199,65,77,69,78,84,79)}
          </button>
        </div>

        {showFinanceForm && (
          <form
            onSubmit={saveFinanceEntry}
            style={{
              marginTop: "20px",
              display: "grid",
              gap: "14px"
            }}
          >

            <div className="grid">

              <label>
                Tipo
                <select
                  value={financeForm.type}
                  onChange={(e) =>
                    setFinanceForm({
                      ...financeForm,
                      type: e.target.value
                    })
                  }
                >
                  <option value="RECEITA">Receita</option>
                  <option value="DESPESA">Despesa</option>
                </select>
              </label>

              <label>
                Data
                <input
                  type="date"
                  value={financeForm.entry_date}
                  onChange={(e) =>
                    setFinanceForm({
                      ...financeForm,
                      entry_date: e.target.value
                    })
                  }
                  required
                />
              </label>

              <label>
                Categoria
                <select
                  value={financeForm.category}
                  onChange={(e) =>
                    setFinanceForm({
                      ...financeForm,
                      category: e.target.value
                    })
                  }
                  required
                >
                  <option value="">Selecione</option>
                  <option value="Aula">Aula</option>
                  <option value="Combustível">Combust&iacute;vel</option>
                  <option value="Manutenção">Manuten&ccedil;&atilde;o</option>
                  <option value="Seguro">Seguro</option>
                  <option value="Impostos">Impostos</option>
                  <option value="Licenciamento">Licenciamento</option>
                  <option value="IPVA">IPVA</option>
                  <option value="Financiamento">Financiamento</option>
                  <option value="Aluguel">Aluguel</option>
                  <option value="Material">Material</option>
                  <option value="Outros">Outros</option>
                </select>
              </label>

              <label>
                Valor
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="0,00"
                  value={financeForm.amount}
                  onChange={(e) =>
                    setFinanceForm({
                      ...financeForm,
                      amount: e.target.value
                    })
                  }
                  required
                />
              </label>

            </div>

            <label>
              Descri&ccedil;&atilde;o
              <input
                type="text"
                placeholder="Descreva o lançamento"
                value={financeForm.description}
                onChange={(e) =>
                  setFinanceForm({
                    ...financeForm,
                    description: e.target.value
                  })
                }
              />
            </label>

            <div className="grid">

              <label>
                Tipo de pessoa
                <select
                  value={financeForm.person_type}
                  onChange={(e) =>
                    setFinanceForm({
                      ...financeForm,
                      person_type: e.target.value,
                      document: ""
                    })
                  }
                >
                  <option value="PF">Pessoa Física (PF)</option>
                  <option value="PJ">Pessoa Jurídica (PJ)</option>
                </select>
              </label>

              <label>
                {financeForm.person_type === "PJ" ? "CNPJ" : "CPF"}
                <input
                  value={financeForm.document}
                  onChange={(e) =>
                    setFinanceForm({
                      ...financeForm,
                      document: e.target.value
                    })
                  }
                  placeholder={financeForm.person_type === "PJ" ? "CNPJ" : "CPF"}
                  inputMode="numeric"
                />
              </label>

              <label>
                Nome / razão social
                <input
                  value={financeForm.counterparty_name}
                  onChange={(e) =>
                    setFinanceForm({
                      ...financeForm,
                      counterparty_name: e.target.value
                    })
                  }
                  placeholder="Nome do cliente ou empresa"
                />
              </label>

              <label>
                Forma de pagamento
                <select
                  value={financeForm.payment_method}
                  onChange={(e) =>
                    setFinanceForm({
                      ...financeForm,
                      payment_method: e.target.value
                    })
                  }
                >
                  <option value="">Selecione</option>
                  <option value="PIX">PIX</option>
                  <option value="Dinheiro">Dinheiro</option>
                  <option value="Cartão">Cart&atilde;o</option>
                  <option value="Transferência">Transfer&ecirc;ncia</option>
                  <option value="Boleto">Boleto</option>
                  <option value="Outro">Outro</option>
                </select>
              </label>

              <label>
                Status
                <select
                  value={financeForm.status}
                  onChange={(e) =>
                    setFinanceForm({
                      ...financeForm,
                      status: e.target.value
                    })
                  }
                >
                  <option value="PAGO">Pago</option>
                  <option value="PENDENTE">Pendente</option>
                </select>
              </label>

            </div>

            <div style={{
              display: "flex",
              gap: "10px",
              flexWrap: "wrap"
            }}>
              <button type="submit">
                SALVAR LAN&Ccedil;AMENTO
              </button>

              <button
                type="button"
                className="link"
                onClick={() => setShowFinanceForm(false)}
              >
                CANCELAR
              </button>
            </div>

          </form>
        )}

      </div>

      <div className="panel">
        <h2>&Uacute;ltimos lan&ccedil;amentos</h2>

        {financeEntries.length === 0 ? (
          <p>
            Nenhum lan&ccedil;amento financeiro registrado.
          </p>
        ) : (
          <div style={{
            display: "grid",
            gap: "10px"
          }}>

            {financeEntries.map(entry => (
              <div
                key={entry.id}
                className="panel"
                style={{
                  margin: 0,
                  padding: "14px"
                }}
              >

                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "12px",
                  flexWrap: "wrap"
                }}>

                  <div>
                    <strong>
                      {entry.type === "RECEITA"
                        ? "RECEITA"
                        : "DESPESA"}
                    </strong>

                    <div>
                      {entry.category}
                    </div>

                    {entry.description && (
                      <small>{entry.description}</small>
                    )}

                    <div style={{
                      fontSize: "12px",
                      opacity: 0.7,
                      marginTop: "4px"
                    }}>
                      {entry.entry_date}
                      {" • "}
                      {entry.status}
                      {entry.payment_method
                        ? ` • ${entry.payment_method}`
                        : ""}
                    </div>
                  </div>

                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px"
                  }}>

                    <strong>
                      {formatCurrency(entry.amount)}
                    </strong>

                    <button
                      type="button"
                      className="link"
                      onClick={() =>
                        deleteFinanceEntry(entry.id)
                      }
                    >
                      EXCLUIR
                    </button>

                  </div>

                </div>

              </div>
            ))}

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
            <h2>Contas bancárias</h2>
            <p>
              Cadastre as contas utilizadas pelo instrutor
              para controlar entradas e saídas financeiras.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setShowFinanceAccounts(!showFinanceAccounts)
            }
          >
            {showFinanceAccounts
              ? "FECHAR"
              : "+ CADASTRAR CONTA"}
          </button>

        </div>

        {showFinanceAccounts && (
          <form
            onSubmit={saveFinanceAccount}
            style={{
              marginTop: "20px",
              display: "grid",
              gap: "14px"
            }}
          >

            <div className="grid">

              <label>
                Banco
                <input
                  type="text"
                  value={financeAccountForm.bank_name}
                  onChange={(e) =>
                    setFinanceAccountForm({
                      ...financeAccountForm,
                      bank_name: e.target.value
                    })
                  }
                  placeholder="Ex.: Banco do Brasil"
                  required
                />
              </label>

              <label>
                Nome da conta
                <input
                  type="text"
                  value={financeAccountForm.account_name}
                  onChange={(e) =>
                    setFinanceAccountForm({
                      ...financeAccountForm,
                      account_name: e.target.value
                    })
                  }
                  placeholder="Ex.: Conta principal"
                  required
                />
              </label>

              <label>
                Tipo
                <select
                  value={financeAccountForm.account_type}
                  onChange={(e) =>
                    setFinanceAccountForm({
                      ...financeAccountForm,
                      account_type: e.target.value
                    })
                  }
                >
                  <option value="CORRENTE">
                    Conta corrente
                  </option>

                  <option value="POUPANCA">
                    Conta poupança
                  </option>

                  <option value="DIGITAL">
                    Conta digital
                  </option>

                  <option value="DINHEIRO">
                    Carteira / dinheiro
                  </option>
                </select>
              </label>

            </div>

            <div className="grid">

              <label>
                Agência
                <input
                  type="text"
                  value={financeAccountForm.agency}
                  onChange={(e) =>
                    setFinanceAccountForm({
                      ...financeAccountForm,
                      agency: e.target.value
                    })
                  }
                />
              </label>

              <label>
                Número da conta
                <input
                  type="text"
                  value={financeAccountForm.account_number}
                  onChange={(e) =>
                    setFinanceAccountForm({
                      ...financeAccountForm,
                      account_number: e.target.value
                    })
                  }
                />
              </label>

              <label>
                Saldo inicial
                <input
                  type="number"
                  step="0.01"
                  value={financeAccountForm.initial_balance}
                  onChange={(e) =>
                    setFinanceAccountForm({
                      ...financeAccountForm,
                      initial_balance: e.target.value
                    })
                  }
                  placeholder="0,00"
                />
              </label>

            </div>

            <label>
              Status
              <select
                value={financeAccountForm.status}
                onChange={(e) =>
                  setFinanceAccountForm({
                    ...financeAccountForm,
                    status: e.target.value
                  })
                }
              >
                <option value="ATIVA">Ativa</option>
                <option value="INATIVA">Inativa</option>
              </select>
            </label>

            <div style={{
              display: "flex",
              gap: "10px",
              flexWrap: "wrap"
            }}>

              <button type="submit">
                SALVAR CONTA
              </button>

              <button
                type="button"
                className="link"
                onClick={() => setShowFinanceAccounts(false)}
              >
                CANCELAR
              </button>

            </div>

          </form>
        )}

        <div style={{
          marginTop: "20px",
          display: "grid",
          gap: "10px"
        }}>

          {financeAccounts.length === 0 ? (

            <p>
              Nenhuma conta bancária cadastrada.
            </p>

          ) : (

            financeAccounts.map(account => (

              <div
                key={account.id}
                className="panel"
                style={{
                  margin: 0,
                  padding: "14px"
                }}
              >

                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "12px",
                  flexWrap: "wrap"
                }}>

                  <div>

                    <strong>
                      {account.bank_name}
                    </strong>

                    <div>
                      {account.account_name}
                    </div>

                    <small>
                      {account.account_type}
                      {account.agency
                        ? ` • Agência ${account.agency}`
                        : ""}
                      {account.account_number
                        ? ` • Conta ${account.account_number}`
                        : ""}
                    </small>

                  </div>

                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px"
                  }}>

                    <strong>
                      {formatCurrency(account.initial_balance)}
                    </strong>

                    <button
                      type="button"
                      className="link"
                      onClick={() =>
                        deleteFinanceAccount(account.id)
                      }
                    >
                      EXCLUIR
                    </button>

                  </div>

                </div>

              </div>

            ))

          )}

        </div>

      </div>
      <div className="panel">
        <h2>Custos operacionais</h2>

        <p>
          Os custos do ve&iacute;culo fazem parte do controle financeiro
          do instrutor.
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
            VE&Iacute;CULO E CUSTOS
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
            —
          </div>

          <div className="metric">
            <div style={{ fontSize: "12px", opacity: 0.7 }}>
              CUSTO POR AULA
            </div>
            —
          </div>

          <div className="metric">
            <div style={{ fontSize: "12px", opacity: 0.7 }}>
              MARGEM
            </div>
            —
          </div>

        </div>
      </div>
    </>
  );
}
if (tab === "agenda" && showAgendaForm) {
  return (
    <AgendaForm
      user={user}
      onBack={() => setShowAgendaForm(false)}
      onScheduled={(data) => {
        setShowAgendaForm(false);
        if (data) setAgendaLessons(prev => [data, ...prev.filter(item => item.id !== data.id)]);
      }}
    />
  );
}
if (tab === "agenda") {
  const hoje = new Date();
  const inicioHoje = new Date(
    hoje.getFullYear(),
    hoje.getMonth(),
    hoje.getDate()
  );

  const fimHoje = new Date(
    hoje.getFullYear(),
    hoje.getMonth(),
    hoje.getDate() + 1
  );

  const aulasHoje = agendaLessons.filter((lesson) => {
    if (!lesson.scheduled_at) return false;

    const data = new Date(lesson.scheduled_at);

    return data >= inicioHoje && data < fimHoje;
  });

  const proximasAulas = agendaLessons.filter((lesson) => {
    if (!lesson.scheduled_at) return false;

    const data = new Date(lesson.scheduled_at);

    return data >= hoje;
  });

  const alunosAgendados = new Set(
    agendaLessons
      .map((lesson) => lesson.student_id)
      .filter(Boolean)
  );

  function nomeAlunoAgenda(lesson) {
    const aluno = Array.isArray(lesson.ai_students)
      ? lesson.ai_students[0]
      : lesson.ai_students;

    return aluno?.full_name || "Aluno não identificado";
  }

  function dataAgenda(value) {
    if (!value) return "Data não definida";

    const data = new Date(value);

    if (Number.isNaN(data.getTime())) {
      return "Data inválida";
    }

    return data.toLocaleString("pt-BR", {
      dateStyle: "short",
      timeStyle: "short"
    });
  }

  function statusAgenda(status) {
    if (!status) return "AGENDADA";

    const mapa = {
      scheduled: "AGENDADA",
      running: "EM ANDAMENTO",
      completed: "CONCLUÍDA",
      cancelled: "CANCELADA"
    };

    return mapa[status] || String(status).toUpperCase();
  }

  return (
    <>
      <h1>Agenda</h1>

      <div className="panel">
        <h2>Planejamento de aulas</h2>

        <p>
          Organize as próximas aulas, acompanhe os alunos e
          prepare a condução das atividades seguintes.
        </p>

        <div style={{
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
          marginTop: "12px"
        }}>
          <button
            type="button"
            onClick={() => setShowAgendaForm(true)}
          >
            + AGENDAR AULA
          </button>
        </div>

        <div className="grid">

          <div className="metric">
            <div style={{ fontSize: "12px", opacity: 0.7 }}>
              AULAS HOJE
            </div>
            {aulasHoje.length}
          </div>

          <div className="metric">
            <div style={{ fontSize: "12px", opacity: 0.7 }}>
              PRÓXIMAS AULAS
            </div>
            {proximasAulas.length}
          </div>

          <div className="metric">
            <div style={{ fontSize: "12px", opacity: 0.7 }}>
              ALUNOS
            </div>
            {alunosAgendados.size}
          </div>

        </div>
      </div>

      <div className="panel">
        <h2>Próximas aulas</h2>

        {agendaLoading ? (
          <p>Carregando agenda...</p>
        ) : proximasAulas.length === 0 ? (
          <p>
            Nenhuma aula futura registrada.
          </p>
        ) : (

          <div
            style={{
              display: "grid",
              gap: "6px",
              fontSize: "13px"
            }}
          >

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1.1fr 1.2fr .7fr 1.5fr 1fr auto",
                gap: "10px",
                padding: "10px 12px",
                background: "#eef4fb",
                border: "1px solid #d8e4f4",
                borderRadius: "8px",
                fontWeight: 800,
                fontSize: "11px",
                color: "#29436d"
              }}
            >
              <div>DATA / HORA</div>
              <div>ALUNO</div>
              <div>CATEGORIA</div>
              <div>OBJETIVO</div>
              <div>STATUS</div>
              <div>AÇÃO</div>
            </div>

            {proximasAulas.slice(0, 10).map((lesson) => (
              <div
                key={lesson.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.1fr 1.2fr .7fr 1.5fr 1fr auto",
                  gap: "10px",
                  alignItems: "center",
                  padding: "11px 12px",
                  border: "1px solid #d8e4f4",
                  borderRadius: "8px",
                  background: "#ffffff"
                }}
              >
                <div>
                  {dataAgenda(lesson.scheduled_at)}
                </div>

                <div>
                  <strong>
                    {nomeAlunoAgenda(lesson)}
                  </strong>
                </div>

                <div>
                  <strong>{lesson.cnh_category || "—"}</strong>
                </div>

                <div style={{ opacity: 0.8 }}>
                  {lesson.objective || "—"}
                </div>

                <div>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "4px 8px",
                      borderRadius: "6px",
                      background: "#edf7ef",
                      fontSize: "11px",
                      fontWeight: 700
                    }}
                  >
                    {statusAgenda(lesson.status)}
                  </span>
                </div>

                <div>
                  {String(lesson.status || "").toLowerCase() === "scheduled" && (
                    <button
                      type="button"
                      title="Iniciar aula agendada"
                      onClick={() => {
                        setScheduledLessonToStart(lesson);
                        setShowLessonForm(true);
                        setTab("aulas");
                      }}
                      style={{ margin: 0, padding: "7px 9px" }}
                    >
                      <Play size={15} />
                    </button>
                  )}
                </div>
              </div>
            ))}

          </div>
        )}
      </div>

      <div className="panel">
        <h2>Próximas provas</h2>
        {(() => {
          const provas = agendaLessons.filter(lesson => lesson.exam_scheduled_at).sort((a,b) => new Date(a.exam_scheduled_at) - new Date(b.exam_scheduled_at));
          if (!provas.length) return <p>Nenhuma prova agendada.</p>;
          return <div style={{display:"grid",gap:"8px"}}>
            {provas.slice(0,10).map(lesson => (
              <div key={`exam-${lesson.id}`} style={{padding:"10px 12px",border:"1px solid #d8e4f4",borderRadius:"8px",background:"#fff"}}>
                <strong>{nomeAlunoAgenda(lesson)}</strong> — {lesson.exam_type || "Prova"}<br />
                <small>{dataAgenda(lesson.exam_scheduled_at)}{lesson.exam_location ? ` • ${lesson.exam_location}` : ""}</small>
              </div>
            ))}
          </div>;
        })()}
      </div>

      <div className="panel">
        <h2>Preparação da próxima aula</h2>

        <p>
          As informações do HSI-DOTH-P deverão orientar a preparação
          das próximas aulas, permitindo ao instrutor identificar
          quais competências merecem maior atenção.
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
            As recomendações serão apresentadas automaticamente
            a partir dos registros existentes do aluno.
          </p>
        </div>
      </div>

      <div className="panel">
        <h2>Próximas atividades</h2>

        {proximasAulas.length === 0 ? (
          <p>
            Nenhuma atividade futura registrada.
          </p>
        ) : (
          <p>
            Existem {proximasAulas.length} aula(s) programada(s)
            para acompanhamento.
          </p>
        )}
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
            <button type="button" onClick={() => setShowExamForm(true)}>
              + AGENDAR PROVA
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

  return <div className="app dashboard-shell"><aside className="main-sidebar"><div className="sidebar-brand"><span>ENAT</span><small>ASSISTENTE DO INSTRUTOR</small></div>
    {menu.map(([key, label, Icon]) => <button key={key} title={label} aria-label={label} className={tab === key ? "nav active" : "nav"} onClick={() => setTab(key)}><Icon size={22} strokeWidth={2.1} /><span>{label}</span></button>)}
    <button className="nav logout" title="SAIR" aria-label="SAIR" onClick={onLogout}><LogOut size={22} /><span>SAIR</span></button>
  </aside><main><header><div><b>{user?.email}</b><small>ENAT - Assistente do Instrutor — acesso autenticado</small></div><div className="header-date">📅 25 de agosto de 2026</div><span className="pill">AUTENTICADO</span></header><section>{content()}</section></main></div>;
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

function CoursesPage({ user, onBack }) {
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [expandedModule, setExpandedModule] = useState(0);
  const [passedAssessments, setPassedAssessments] = useState({});
  const [assessmentIndex, setAssessmentIndex] = useState(null);
  const [assessmentQuestions, setAssessmentQuestions] = useState([]);
  const [assessmentAnswers, setAssessmentAnswers] = useState({});
  const [assessmentResult, setAssessmentResult] = useState(null);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestSent, setRequestSent] = useState(false);

  function courseProgressKey(course) {
    return `enat-course-assessments-v1-${course.id}`;
  }

  function certificateKey(course) {
    return `enat-course-certificate-v1-${course.id}`;
  }

  function openCourse(course) {
    setSelectedCourse(course);
    setExpandedModule(0);
    setAssessmentIndex(null);
    setAssessmentQuestions([]);
    setAssessmentAnswers({});
    setAssessmentResult(null);
    setRequestSent(false);

    try {
      const saved = JSON.parse(localStorage.getItem(courseProgressKey(course)) || "{}");
      setPassedAssessments(saved || {});
    } catch {
      setPassedAssessments({});
    }
  }

  function closeCourse() {
    setSelectedCourse(null);
    setPassedAssessments({});
    setAssessmentIndex(null);
    setAssessmentQuestions([]);
    setAssessmentAnswers({});
    setAssessmentResult(null);
  }

  function openAssessment(index) {
    if (!selectedCourse) return;
    const module = selectedCourse.modules[index];
    setExpandedModule(index);
    setAssessmentIndex(index);
    const baseQuestions = buildModuleAssessment(selectedCourse, module, index);
    const randomized = baseQuestions.map(question => {
      const options = question.options.map((text, optionIndex) => ({ text, optionIndex }));
      options.sort(() => Math.random() - 0.5);
      return {
        ...question,
        options: options.map(item => item.text),
        answer: options.findIndex(item => item.optionIndex === question.answer)
      };
    });
    setAssessmentQuestions(randomized);
    setAssessmentAnswers({});
    setAssessmentResult(null);
  }

  function submitAssessment(event) {
    event.preventDefault();
    if (!selectedCourse || assessmentIndex === null) return;

    const unanswered = assessmentQuestions.some(question => assessmentAnswers[question.id] === undefined);
    if (unanswered) {
      setAssessmentResult({ type: "warning", message: "Responda todas as questões antes de concluir a avaliação." });
      return;
    }

    let correct = 0;
    assessmentQuestions.forEach(question => {
      if (Number(assessmentAnswers[question.id]) === question.answer) correct += 1;
    });

    const score = Number(((correct / assessmentQuestions.length) * 10).toFixed(1));
    const passed = score >= 7;

    if (passed) {
      const next = {
        ...passedAssessments,
        [assessmentIndex]: {
          score,
          passed: true,
          completedAt: new Date().toISOString()
        }
      };
      setPassedAssessments(next);
      localStorage.setItem(courseProgressKey(selectedCourse), JSON.stringify(next));
      setAssessmentResult({ type: "success", score, correct, total: assessmentQuestions.length });
    } else {
      setAssessmentResult({ type: "error", score, correct, total: assessmentQuestions.length });
    }
  }

  function generateCertificate() {
    if (!selectedCourse) return;

    const allPassed = selectedCourse.modules.every((_, index) => !!passedAssessments[index]?.passed);
    if (!allPassed) return;

    const name = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Instrutor";
    const issuedAt = new Date();
    const date = issuedAt.toLocaleDateString("pt-BR");
    const certificateId = `ENAT-${selectedCourse.id.toUpperCase()}-${issuedAt.getTime()}`;

    localStorage.setItem(certificateKey(selectedCourse), JSON.stringify({
      certificateId,
      courseId: selectedCourse.id,
      courseTitle: selectedCourse.title,
      name,
      issuedAt: issuedAt.toISOString()
    }));

    const safe = value => String(value).replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[char]));

    const win = window.open("", "_blank", "width=1200,height=850");
    if (!win) {
      alert("O navegador bloqueou a janela do certificado. Permita pop-ups para gerar o PDF.");
      return;
    }

    win.document.write(`<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<title>Certificado ENAT — ${safe(selectedCourse.title)}</title>
<style>
@page { size: A4 landscape; margin: 0; }
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; width: 100%; height: 100%; }
body { font-family: Georgia, 'Times New Roman', serif; background: #eef3f7; color: #172a46; }
.sheet { width: 297mm; height: 210mm; padding: 16mm; margin: 0 auto; background: white; }
.certificate { width: 100%; height: 100%; border: 3px solid #55BFEF; padding: 10mm; position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
.inner { width: 100%; height: 100%; border: 1px solid #b9dff1; padding: 12mm; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.brand { font-family: Arial, sans-serif; font-size: 30px; font-weight: 900; letter-spacing: 6px; color: #2457a6; }
.subtitle { font-family: Arial, sans-serif; font-size: 12px; letter-spacing: 2px; color: #55BFEF; margin-top: 4px; text-transform: uppercase; }
h1 { font-size: 28px; margin: 20px 0 8px; letter-spacing: 2px; text-transform: uppercase; }
.present { font-family: Arial, sans-serif; font-size: 14px; color: #667780; }
.name { font-size: 32px; font-weight: bold; color: #172a46; margin: 8px 0 12px; border-bottom: 1px solid #9fb7c8; padding: 0 28px 7px; }
.text { max-width: 850px; font-size: 17px; line-height: 1.55; }
.course { font-size: 22px; font-weight: bold; color: #2457a6; margin: 8px 0; }
.meta { font-family: Arial, sans-serif; font-size: 11px; color: #71808d; margin-top: 18px; }
.signature { position: absolute; bottom: 18mm; left: 18mm; right: 18mm; display: flex; justify-content: space-between; align-items: end; font-family: Arial, sans-serif; font-size: 10px; color: #667780; }
.line { width: 75mm; border-top: 1px solid #8c9aa5; padding-top: 5px; }
.actions { position: fixed; top: 15px; right: 15px; font-family: Arial, sans-serif; }
button { background: #55BFEF; border: 0; color: white; padding: 10px 16px; border-radius: 7px; font-weight: bold; cursor: pointer; }
@media print { body { background: white; } .sheet { margin: 0; } .actions { display: none; } }
</style>
</head>
<body>
<div class="actions"><button onclick="window.print()">SALVAR / IMPRIMIR PDF</button></div>
<div class="sheet">
  <div class="certificate">
    <div class="inner">
      <div class="brand">ENAT</div>
      <div class="subtitle">Ensino Neuroeducacional Aplicado ao Trânsito</div>
      <h1>Certificado de Conclusão</h1>
      <div class="present">Certificamos que</div>
      <div class="name">${safe(name)}</div>
      <div class="text">concluiu a formação de aprofundamento profissional</div>
      <div class="course">${safe(selectedCourse.title)}</div>
      <div class="text">com aprovação em todas as avaliações finais dos módulos, obtendo aproveitamento mínimo de 7,0 em cada avaliação.</div>
      <div class="meta">Emitido em ${safe(date)} • Certificado nº ${safe(certificateId)}</div>
      <div class="signature">
        <div class="line">ENAT — Ensino Neuroeducacional Aplicado ao Trânsito</div>
        <div class="line">Registro digital do Assistente do Instrutor</div>
      </div>
    </div>
  </div>
</div>
<script>window.onload = function(){ setTimeout(function(){ window.print(); }, 350); };</script>
</body>
</html>`);
    win.document.close();
  }

  function sendCourseRequest(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const title = form.get("courseTitle") || "";
    const description = form.get("courseDescription") || "";
    const subject = encodeURIComponent(`Solicitação de curso específico — ${title}`);
    const body = encodeURIComponent(
      `Olá, equipe ENAT.\n\n` +
      `Gostaria de solicitar uma formação específica pelo Assistente do Instrutor.\n\n` +
      `Curso desejado: ${title}\n\n` +
      `Necessidade/objetivo:\n${description}\n\n` +
      `Atenciosamente.`
    );
    window.location.href = `mailto:enat.neuroeducacao@gmail.com?subject=${subject}&body=${body}`;
    setRequestSent(true);
  }

  if (selectedCourse) {
    const total = selectedCourse.modules.length;
    const done = selectedCourse.modules.filter((_, index) => !!passedAssessments[index]?.passed).length;
    const progress = total ? Math.round((done / total) * 100) : 0;
    const courseCompleted = done === total;

    return (
      <div style={{ maxWidth: "1120px", margin: "0 auto" }}>
        <button className="secondary" type="button" onClick={closeCourse} style={{ marginBottom: 16 }}>
          ← VOLTAR PARA CURSOS
        </button>

        <div className="panel" style={{ padding: 28, background: "linear-gradient(135deg,#061019,#0b1823)", color: "#fff", border: "1px solid rgba(85,191,239,.25)" }}>
          <div style={{ display: "flex", gap: 18, alignItems: "flex-start", flexWrap: "wrap" }}>
            <div style={{ width: 64, height: 64, borderRadius: 16, background: "#eaf6ff", display: "grid", placeItems: "center", fontSize: 32 }}>
              {selectedCourse.icon}
            </div>
            <div style={{ flex: 1 }}>
              <small style={{ fontWeight: 800, letterSpacing: ".08em", color: "#55BFEF" }}>
                ENAT • FORMAÇÃO CONTINUADA
              </small>
              <h1 style={{ margin: "6px 0 8px", color: "#fff" }}>{selectedCourse.title}</h1>
              <p style={{ color: "#c9d8e2", lineHeight: 1.6, margin: 0 }}>{selectedCourse.description}</p>
            </div>
          </div>
        </div>

        <div className="panel" style={{ marginTop: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
            <div>
              <strong>Progresso da formação</strong>
              <div style={{ color: "#667780", marginTop: 5 }}>{done} de {total} módulos aprovados</div>
            </div>
            <strong style={{ color: "#2457a6", fontSize: 22 }}>{progress}%</strong>
          </div>
          <div style={{ height: 10, background: "#e8eef2", borderRadius: 10, overflow: "hidden", marginTop: 12 }}>
            <div style={{ width: `${progress}%`, height: "100%", background: "#55BFEF", transition: "width .25s ease" }} />
          </div>
        </div>

        {courseCompleted && (
          <div className="panel" style={{ marginTop: 16, padding: 22, border: "1px solid #b8e4ca", background: "#f3fcf6" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
              <div style={{ fontSize: 34 }}>🏆</div>
              <div style={{ flex: 1 }}>
                <h2 style={{ margin: 0, color: "#17663f" }}>Formação concluída!</h2>
                <p style={{ margin: "6px 0 0", color: "#4e6b5b" }}>
                  Todos os módulos foram aprovados com média mínima de 7,0.
                </p>
              </div>
              <button type="button" onClick={generateCertificate}>📜 GERAR CERTIFICADO PDF</button>
            </div>
          </div>
        )}

        <div className="panel" style={{ marginTop: 16 }}>
          <h2 style={{ marginTop: 0 }}>Conteúdo e avaliação da formação</h2>
          <p style={{ color: "#667780", lineHeight: 1.6 }}>
            Estude cada módulo. Para concluí-lo, é necessário realizar a avaliação final e obter <strong>média mínima de 7,0</strong>. Em caso de reprovação, o módulo permanece pendente e poderá ser refeito.
          </p>

          <div style={{ display: "grid", gap: 12 }}>
            {selectedCourse.modules.map((module, index) => {
              const isOpen = expandedModule === index;
              const result = passedAssessments[index];
              const isDone = !!result?.passed;

              return (
                <div key={`${selectedCourse.id}-${index}`} style={{ border: `1px solid ${isOpen ? "#9bd8f5" : "#dbe5f2"}`, borderRadius: 14, overflow: "hidden", background: "#fbfdff" }}>
                  <button
                    type="button"
                    onClick={() => setExpandedModule(isOpen ? -1 : index)}
                    style={{ width: "100%", textAlign: "left", border: 0, borderRadius: 0, background: "#fff", color: "#243b67", padding: "16px 18px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}
                  >
                    <span style={{ width: 34, height: 34, borderRadius: "50%", background: isDone ? "#dff5e8" : "#eaf6ff", color: isDone ? "#18764a" : "#55BFEF", display: "grid", placeItems: "center", fontWeight: 900, flex: "0 0 auto" }}>
                      {isDone ? "✓" : String(index + 1).padStart(2, "0")}
                    </span>
                    <span style={{ flex: 1 }}>
                      <strong style={{ display: "block", fontSize: 16 }}>{module.title}</strong>
                      <span style={{ display: "block", marginTop: 4, color: "#667780", fontWeight: 500 }}>{module.subtitle}</span>
                    </span>
                    {isDone && <span style={{ color: "#18764a", fontWeight: 800, fontSize: 13 }}>APROVADO • {result.score.toFixed(1)}</span>}
                    <span style={{ fontSize: 20, color: "#55BFEF" }}>{isOpen ? "−" : "+"}</span>
                  </button>

                  {isOpen && (
                    <div style={{ padding: "0 18px 20px 64px" }}>
                      <div style={{ borderTop: "1px solid #edf1f5", paddingTop: 18, color: "#354554", lineHeight: 1.75, whiteSpace: "pre-line" }}>
                        {module.content}
                      </div>

                      <div style={{ marginTop: 18, padding: 16, borderRadius: 12, background: "#f7fbfe", border: "1px solid #dceff9" }}>
                        <strong style={{ color: "#243b67" }}>🎯 Aplicação prática</strong>
                        <p style={{ margin: "7px 0 0", color: "#5f6b7a", lineHeight: 1.6 }}>
                          Relacione este módulo a uma situação real de instrução. Identifique um comportamento observável, defina o que o aluno precisa desenvolver e registre qual evidência indicará evolução.
                        </p>
                      </div>

                      <div style={{ marginTop: 12, padding: 16, borderRadius: 12, background: "#fff", border: "1px dashed #c8d9e6" }}>
                        <strong style={{ color: "#243b67" }}>📝 Reflexão do instrutor</strong>
                        <p style={{ margin: "7px 0 0", color: "#5f6b7a", lineHeight: 1.6 }}>
                          O que deste conteúdo pode ser incorporado à sua próxima aula? Que dificuldade do aluno pode ser melhor compreendida a partir deste módulo?
                        </p>
                      </div>

                      {assessmentIndex === index ? (
                        <form onSubmit={submitAssessment} style={{ marginTop: 18, padding: 18, borderRadius: 12, background: "#fff", border: "1px solid #dbe5f2" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                            <div>
                              <h3 style={{ margin: 0 }}>📝 Avaliação final do módulo</h3>
                              <p style={{ margin: "5px 0 0", color: "#667780" }}>5 questões • nota de 0 a 10 • aprovação a partir de 7,0</p>
                            </div>
                            <button type="button" className="secondary" onClick={() => { setAssessmentIndex(null); setAssessmentResult(null); }}>FECHAR</button>
                          </div>

                          <div style={{ display: "grid", gap: 18, marginTop: 18 }}>
                            {assessmentQuestions.map((question, qIndex) => (
                              <div key={question.id} style={{ padding: 15, border: "1px solid #edf1f5", borderRadius: 10 }}>
                                <strong>{qIndex + 1}. {question.question}</strong>
                                <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                                  {question.options.map((option, optionIndex) => (
                                    <label key={`${question.id}-${optionIndex}`} style={{ display: "flex", gap: 9, alignItems: "flex-start", cursor: "pointer", padding: 8, borderRadius: 8, background: assessmentAnswers[question.id] === optionIndex ? "#eef9fe" : "transparent" }}>
                                      <input
                                        type="radio"
                                        name={question.id}
                                        value={optionIndex}
                                        checked={Number(assessmentAnswers[question.id]) === optionIndex}
                                        onChange={() => setAssessmentAnswers(prev => ({ ...prev, [question.id]: optionIndex }))}
                                      />
                                      <span style={{ lineHeight: 1.45 }}>{option}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>

                          {assessmentResult && (
                            <div style={{ marginTop: 16, padding: 15, borderRadius: 10, background: assessmentResult.type === "success" ? "#f0fbf4" : assessmentResult.type === "warning" ? "#fff8e8" : "#fff1f1", border: `1px solid ${assessmentResult.type === "success" ? "#b8e4ca" : assessmentResult.type === "warning" ? "#f1d89a" : "#efc1c1"}` }}>
                              {assessmentResult.type === "success" ? (
                                <><strong style={{ color: "#17663f" }}>✓ APROVADO — Nota {assessmentResult.score.toFixed(1)}</strong><p style={{ margin: "5px 0 0", color: "#4e6b5b" }}>Módulo concluído. Você pode avançar para o próximo.</p></>
                              ) : assessmentResult.type === "error" ? (
                                <><strong style={{ color: "#a33a3a" }}>✕ NÃO APROVADO — Nota {assessmentResult.score.toFixed(1)}</strong><p style={{ margin: "5px 0 0", color: "#7b5555" }}>A média mínima é 7,0. Revise o módulo e tente novamente.</p></>
                              ) : (
                                <strong style={{ color: "#7a5a00" }}>{assessmentResult.message}</strong>
                              )}
                            </div>
                          )}

                          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
                            {assessmentResult?.type === "error" && (
                              <button type="button" className="secondary" onClick={() => { setAssessmentAnswers({}); setAssessmentResult(null); }}>TENTAR NOVAMENTE</button>
                            )}
                            <button type="submit">FINALIZAR AVALIAÇÃO</button>
                          </div>
                        </form>
                      ) : (
                        <div style={{ marginTop: 16, display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                          {isDone ? (
                            <div style={{ color: "#18764a", fontWeight: 800 }}>✓ Avaliação aprovada com nota {result.score.toFixed(1)}</div>
                          ) : (
                            <div style={{ color: "#667780" }}>Este módulo só será concluído após aprovação na avaliação final.</div>
                          )}
                          <button type="button" onClick={() => openAssessment(index)}>{isDone ? "REFAZER AVALIAÇÃO" : "📝 FAZER AVALIAÇÃO FINAL"}</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="panel" style={{ marginTop: 16 }}>
          <h2 style={{ marginTop: 0 }}>Certificação</h2>
          <p style={{ color: "#667780", lineHeight: 1.6 }}>
            O certificado é liberado somente depois da aprovação em todos os módulos. A emissão gera uma versão pronta para impressão/salvamento em <strong>PDF</strong>, com nome do instrutor, curso, data e identificador do certificado.
          </p>
          {courseCompleted ? (
            <button type="button" onClick={generateCertificate}>📜 EMITIR CERTIFICADO EM PDF</button>
          ) : (
            <div style={{ padding: 14, borderRadius: 10, background: "#f7fbfe", border: "1px solid #dceff9", color: "#5f6b7a" }}>
              🔒 Complete e aprove todos os módulos para liberar o certificado.
            </div>
          )}
        </div>

        <div className="panel" style={{ marginTop: 16 }}>
          <h2 style={{ marginTop: 0 }}>Orientação de estudo</h2>
          <ul style={{ lineHeight: 1.75, paddingLeft: 20 }}>
            <li>Leia o conteúdo antes de realizar a avaliação final.</li>
            <li>A aprovação exige média mínima de 7,0 em cada módulo.</li>
            <li>Em caso de reprovação, revise o conteúdo e refaça a avaliação.</li>
            <li>Use o conhecimento como aprofundamento profissional e respeite os limites da atuação do instrutor.</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1120px", margin: "0 auto" }}>
      <div className="panel" style={{ padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div>
            <small style={{ fontWeight: 800, letterSpacing: ".08em", color: "#55BFEF" }}>ENAT — ASSISTENTE DO INSTRUTOR</small>
            <h1 style={{ margin: "6px 0 8px" }}>Cursos e Desenvolvimento Profissional</h1>
            <p style={{ margin: 0, color: "#5f6b7a", maxWidth: 760, lineHeight: 1.6 }}>
              Amplie sua formação, aprofunde conhecimentos e desenvolva novas competências para atuar como instrutor de trânsito.
            </p>
          </div>
          <button className="secondary" type="button" onClick={onBack}>← VOLTAR</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16, marginTop: 18 }}>
        {COURSE_CATALOG.map(course => (
          <div key={course.id} className="panel" style={{ padding: 22, display: "flex", flexDirection: "column", minHeight: 280 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
              <div style={{ width: 54, height: 54, borderRadius: 14, background: "#eaf6ff", display: "grid", placeItems: "center", fontSize: 27 }}>
                {course.icon}
              </div>
              <div>
                <small style={{ color: "#55BFEF", fontWeight: 800, letterSpacing: ".06em" }}>{course.category.toUpperCase()}</small>
                <h3 style={{ margin: "4px 0 0" }}>{course.title}</h3>
              </div>
            </div>
            <p style={{ color: "#5f6b7a", lineHeight: 1.55, flex: 1 }}>{course.description}</p>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginTop: 14 }}>
              <span style={{ fontSize: 13, color: "#7a8694" }}>{course.modules.length} módulos • avaliação + certificado</span>
              <button type="button" onClick={() => openCourse(course)} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                📖 ACESSAR CURSO
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="panel" style={{ marginTop: 18, padding: 24, border: "1px dashed #55BFEF" }}>
        <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ fontSize: 34 }}>💡</div>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: "0 0 6px" }}>Não encontrou o curso que procura?</h2>
            <p style={{ margin: 0, color: "#5f6b7a", lineHeight: 1.5 }}>
              Solicite uma formação específica. A equipe ENAT poderá avaliar sua necessidade e desenvolver uma proposta de conteúdo.
            </p>
          </div>
          <button type="button" onClick={() => { setRequestSent(false); setShowRequestForm(true); }}>✉ SOLICITAR CURSO</button>
        </div>
      </div>

      {showRequestForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 1000 }}>
          <div className="panel" style={{ width: "100%", maxWidth: 560, padding: 26 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ margin: 0 }}>Solicitar curso específico</h2>
              <button type="button" className="secondary" onClick={() => setShowRequestForm(false)}>✕</button>
            </div>
            <p style={{ color: "#5f6b7a", lineHeight: 1.5 }}>
              A solicitação será preparada para o e-mail institucional ENAT: <strong>enat.neuroeducacao@gmail.com</strong>.
            </p>
            <form onSubmit={sendCourseRequest}>
              <label style={{ display: "block", marginBottom: 14 }}>
                Curso ou formação desejada
                <input name="courseTitle" required placeholder="Ex.: Neuropsicologia aplicada ao trânsito" style={{ width: "100%", marginTop: 6 }} />
              </label>
              <label style={{ display: "block", marginBottom: 14 }}>
                Objetivo ou necessidade
                <textarea name="courseDescription" required rows={5} placeholder="Descreva o que gostaria de aprofundar." style={{ width: "100%", marginTop: 6, resize: "vertical" }} />
              </label>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button type="button" className="secondary" onClick={() => setShowRequestForm(false)}>CANCELAR</button>
                <button type="submit">✉ ENVIAR SOLICITAÇÃO</button>
              </div>
            </form>
            {requestSent && <p className="msg" style={{ marginTop: 14 }}>Solicitação preparada para envio ao e-mail institucional.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
function SubscriptionPage({ onBack }) {
  return (
    <div style={{ maxWidth: "900px", margin: "0 auto" }}>
      <div className="panel">
        <button type="button" className="link" onClick={onBack}>VOLTAR</button>
        <h1>Licença e contato ENAT</h1>
        <p style={{ lineHeight: 1.6 }}>
          Consulte aqui as informações de licença e acesso do Assistente do Instrutor. A contratação e os termos comerciais
          devem ser confirmados antes de qualquer cobrança.
        </p>
        <div style={{ padding: "16px", background: "#f7faff", border: "1px solid #dbe5f2", borderRadius: "12px" }}>
          <strong>Importante</strong>
          <p style={{ marginBottom: 0, lineHeight: 1.5 }}>
            Esta tela é informativa e não deve apresentar uma cobrança como concluída sem confirmação do provedor de pagamento.
          </p>
        </div>
      </div>
    </div>
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




























