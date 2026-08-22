# Atualiza somente o componente HsiDothPAssessment
# Mantém o restante de src\main.jsx intacto e cria backup antes da alteração.

$p = "src\main.jsx"
if (-not (Test-Path $p)) {
  throw "Arquivo src\main.jsx não encontrado."
}

$s = Get-Content $p -Raw
$start = $s.IndexOf("function HsiDothPAssessment")
$end = $s.IndexOf("function ProfileForm", $start)

if ($start -lt 0) { throw "Componente HsiDothPAssessment não encontrado." }
if ($end -lt 0) { throw "Função ProfileForm não encontrada após HsiDothPAssessment." }

$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backup = "src\main_BACKUP_PRE_HSI_RELATORIOS_$stamp.jsx"
Copy-Item $p $backup -Force
Write-Host "Backup criado: $backup"

$newComponent = @'
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
    { key: "lesson", label: "Relatório da aula", icon: "✓", help: "Leitura do último resultado" },
    { key: "next", label: "Próxima aula", icon: "→", help: "Preparação pedagógica" },
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
    <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
      <div className="panel" style={{ padding: "18px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "14px", alignItems: "flex-start", flexWrap: "wrap" }}>
          <div>
            <h1 style={{ marginBottom: "5px" }}>HSI-DOTH-P — Inteligência Pedagógica</h1>
            <p style={{ margin: 0 }}>
              Consolidação automática dos resultados já registrados nas aulas.
              Esta tela não cria uma nova avaliação.
            </p>
          </div>
          <button type="button" onClick={printReport} style={buttonStyle}>IMPRIMIR</button>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(130px, 1fr))",
          gap: "10px",
          marginTop: "16px"
        }}>
          <div style={compactCard}><small>ALUNOS AVALIADOS</small><strong style={{ display: "block", fontSize: "22px" }}>{evaluatedStudents.length}</strong></div>
          <div style={compactCard}><small>AVALIAÇÕES NAS AULAS</small><strong style={{ display: "block", fontSize: "22px" }}>{records.length}</strong></div>
          <div style={compactCard}><small>MÉDIA GERAL</small><strong style={{ display: "block", fontSize: "22px" }}>{records.length ? `${globalAverage.toFixed(2)} / 5` : "—"}</strong></div>
          <div style={compactCard}><small>INDICADOR GERAL</small><strong style={{ display: "block", fontSize: "22px" }}>{records.length ? `${globalIndicator.toFixed(1)} / 100` : "—"}</strong></div>
        </div>
      </div>

      <div className="panel" style={{ padding: "14px 18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", gap: "10px", flexWrap: "wrap" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "19px" }}>Escolha o relatório</h2>
            <small>Abra somente a informação que você precisa.</small>
          </div>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(135px, 1fr))",
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
          <div className="panel" style={{ padding: "16px 18px" }}>
            <h2 style={{ marginTop: 0 }}>Visão geral</h2>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, minmax(130px, 1fr))",
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
            <h3 style={{ marginTop: 0 }}>Prioridade pedagógica coletiva</h3>
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
        <div className="panel" style={{ padding: "16px 18px" }}>
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
        <div className="panel" style={{ padding: "16px 18px" }}>
          <h2 style={{ marginTop: 0 }}>Relatório individual</h2>
          {!selectedStudentData ? (
            <p>Selecione um aluno acima.</p>
          ) : (
            <>
              <h3 style={{ marginBottom: "10px" }}>{selectedStudentData.full_name}</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(120px, 1fr))", gap: "8px" }}>
                <div style={compactCard}><small>AULAS AVALIADAS</small><strong style={{ display: "block", fontSize: "20px" }}>{studentRecords.length}</strong></div>
                <div style={compactCard}><small>ÚLTIMA MÉDIA</small><strong style={{ display: "block", fontSize: "20px" }}>{latestHsi ? `${latestHsi.average.toFixed(2)} / 5` : "—"}</strong></div>
                <div style={compactCard}><small>ÚLTIMO INDICADOR</small><strong style={{ display: "block", fontSize: "20px" }}>{latestHsi ? `${latestHsi.normalized_score} / 100` : "—"}</strong></div>
                <div style={compactCard}><small>CLASSIFICAÇÃO</small><strong style={{ display: "block", fontSize: "16px" }}>{latestHsi?.classification || "—"}</strong></div>
              </div>
              {latestHsi && (
                <div style={{ marginTop: "14px" }}>
                  <h3>Último resultado</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(110px, 1fr))", gap: "7px" }}>
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
        <div className="panel" style={{ padding: "16px 18px" }}>
          <h2 style={{ marginTop: 0 }}>Relatório da aula</h2>
          {!latest ? (
            <p>Selecione um aluno com avaliação registrada.</p>
          ) : (
            <>
              <p><strong>{selectedStudentData?.full_name}</strong> — {formatDate(latest.started_at)}</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(110px, 1fr))", gap: "7px" }}>
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
        <div className="panel" style={{ padding: "16px 18px" }}>
          <h2 style={{ marginTop: 0 }}>Evolução do aluno</h2>
          {!latestHsi || !previousHsi ? (
            <p>É necessário ter pelo menos duas avaliações HSI-DOTH-P do mesmo aluno.</p>
          ) : (
            <>
              <p>{formatDate(previous?.started_at)} → {formatDate(latest?.started_at)}</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(110px, 1fr))", gap: "7px" }}>
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
        <div className="panel" style={{ padding: "16px 18px" }}>
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

'@

$s = $s.Substring(0, $start) + $newComponent + $s.Substring($end)
Set-Content $p $s -Encoding UTF8

Write-Host ""
Write-Host "HSI-DOTH-P atualizado para Central de Relatórios."
Write-Host "A tela agora usa os resultados já gravados nas aulas e não cria nova avaliação."
Write-Host "Execute: npm run build"
