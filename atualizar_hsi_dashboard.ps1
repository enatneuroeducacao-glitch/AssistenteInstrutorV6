$ErrorActionPreference = "Stop"

$p = "src\main.jsx"
if (-not (Test-Path $p)) {
  throw "Arquivo src\main.jsx não encontrado. Execute este script na pasta do projeto."
}

$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backup = "src\main_BACKUP_PRE_HSI_DASHBOARD_REPLACE_$stamp.jsx"
Copy-Item $p $backup -Force
Write-Host "Backup criado: $backup"

$s = Get-Content $p -Raw
$start = $s.IndexOf("function HsiDothPAssessment")
$end = $s.IndexOf("function ProfileForm", $start)

if ($start -lt 0) { throw "function HsiDothPAssessment não encontrada." }
if ($end -lt 0) { throw "function ProfileForm não encontrada após HsiDothPAssessment." }

$newComponent = @'
function HsiDothPAssessment({ user, selectedStudent }) {
  const [students, setStudents] = useState([]);
  const [records, setRecords] = useState([]);
  const [selectedId, setSelectedId] = useState(selectedStudent?.id || "");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const dimensions = [
    { key: "decision", label: "Decisão" },
    { key: "organization", label: "Organização" },
    { key: "time", label: "Tempo" },
    { key: "humanization", label: "Humanização" },
    { key: "psychocomportamental", label: "Psicocomportamental" }
  ];

  function parseHsi(notes) {
    const text = String(notes || "");
    const match = text.match(/\[HSI-DOTH-P\]\s*(\{[\s\S]*\})(?:\r?\n|$)/);
    if (!match) return null;
    try {
      const parsed = JSON.parse(match[1]);
      const scores = {};
      for (const item of dimensions) {
        const value = Number(parsed?.scores?.[item.key]);
        if (!Number.isFinite(value) || value < 1 || value > 5) return null;
        scores[item.key] = value;
      }
      return {
        ...parsed,
        scores,
        average: Number(parsed.average ?? (
          dimensions.reduce((sum, item) => sum + scores[item.key], 0) / dimensions.length
        )),
        normalized_score: Number(parsed.normalized_score ?? (
          dimensions.reduce((sum, item) => sum + scores[item.key], 0) / dimensions.length / 5 * 100
        ))
      };
    } catch {
      return null;
    }
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
        const { data: studentData, error: studentError } = await supabase
          .from("ai_students")
          .select("id, full_name")
          .eq("user_id", user.id)
          .order("full_name", { ascending: true });

        if (studentError) throw studentError;

        const { data: lessonData, error: lessonError } = await supabase
          .from("ai_lessons")
          .select("id, student_id, started_at, ended_at, status, notes")
          .eq("user_id", user.id)
          .order("started_at", { ascending: false });

        if (lessonError) throw lessonError;

        const studentMap = new Map((studentData || []).map(item => [item.id, item]));
        const parsed = [];

        for (const lesson of lessonData || []) {
          const hsi = parseHsi(lesson.notes);
          if (!hsi) continue;

          parsed.push({
            lesson,
            student: studentMap.get(lesson.student_id) || {
              id: lesson.student_id,
              full_name: "Aluno não identificado"
            },
            hsi
          });
        }

        if (!active) return;

        setStudents(studentData || []);
        setRecords(parsed);
        setSelectedId(selectedStudent?.id || studentData?.[0]?.id || "");
      } catch (error) {
        console.error("Erro ao carregar consolidação HSI-DOTH-P:", error);
        if (active) setMsg(error?.message || "Não foi possível carregar os dados do HSI-DOTH-P.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadData();
    return () => { active = false; };
  }, [user.id, selectedStudent?.id]);

  const filteredStudents = students.filter(student =>
    String(student.full_name || "").toLowerCase().includes(search.toLowerCase())
  );

  const studentRecords = selectedId
    ? records
        .filter(item => item.student.id === selectedId)
        .sort((a, b) => new Date(b.lesson.started_at || 0) - new Date(a.lesson.started_at || 0))
    : [];

  const evaluatedStudents = new Set(records.map(item => item.student.id)).size;
  const totalEvaluations = records.length;

  const allScores = {};
  for (const item of dimensions) {
    allScores[item.key] = records.length
      ? records.reduce((sum, record) => sum + Number(record.hsi.scores[item.key] || 0), 0) / records.length
      : 0;
  }

  const overallAverage = records.length
    ? records.reduce((sum, record) => sum + Number(record.hsi.average || 0), 0) / records.length
    : 0;

  const overallNormalized = overallAverage ? (overallAverage / 5) * 100 : 0;

  const collective = dimensions.map(item => {
    const priorityCount = records.filter(record => Number(record.hsi.scores[item.key]) <= 3).length;
    const coverage = records.length ? (priorityCount / records.length) * 100 : 0;
    return {
      ...item,
      average: allScores[item.key],
      priorityCount,
      coverage
    };
  }).sort((a, b) => b.coverage - a.coverage);

  const selectedStudent = students.find(item => item.id === selectedId);
  const latest = studentRecords[0]?.hsi || null;
  const previous = studentRecords[1]?.hsi || null;

  const individualDeltas = latest && previous
    ? dimensions.map(item => ({
        ...item,
        current: Number(latest.scores[item.key] || 0),
        previous: Number(previous.scores[item.key] || 0),
        delta: Number(latest.scores[item.key] || 0) - Number(previous.scores[item.key] || 0)
      }))
    : [];

  const priorityIndividual = latest
    ? dimensions
        .map(item => ({ ...item, score: Number(latest.scores[item.key] || 0) }))
        .filter(item => item.score <= 3)
        .sort((a, b) => a.score - b.score)
    : [];

  function classification(value) {
    if (!value) return "SEM DADOS";
    if (value < 2) return "CRÍTICA";
    if (value < 3) return "EM DESENVOLVIMENTO";
    if (value < 3.5) return "ADEQUADA";
    if (value < 4.5) return "BOA";
    return "CONSOLIDADA";
  }

  const topCollective = collective[0] || null;

  return (
    <div>
      <div className="panel">
        <h1>HSI-DOTH-P — Inteligência Pedagógica</h1>
        <p>
          Consolidação automática dos resultados HSI-DOTH-P já registrados nas aulas.
          Esta tela não cria uma nova avaliação.
        </p>

        {loading ? (
          <p>Carregando resultados das aulas...</p>
        ) : (
          <div className="grid">
            <div className="metric">
              <div style={{ fontSize: "12px", opacity: 0.7 }}>ALUNOS AVALIADOS</div>
              {evaluatedStudents}
            </div>
            <div className="metric">
              <div style={{ fontSize: "12px", opacity: 0.7 }}>AVALIAÇÕES NAS AULAS</div>
              {totalEvaluations}
            </div>
            <div className="metric">
              <div style={{ fontSize: "12px", opacity: 0.7 }}>MÉDIA GERAL</div>
              {records.length ? `${overallAverage.toFixed(2)} / 5` : "—"}
            </div>
            <div className="metric">
              <div style={{ fontSize: "12px", opacity: 0.7 }}>INDICADOR GERAL</div>
              {records.length ? `${overallNormalized.toFixed(1)} / 100` : "—"}
            </div>
          </div>
        )}

        {msg && <p className="msg">{msg}</p>}
      </div>

      <div className="panel">
        <h2>Busca por aluno</h2>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Digite o nome do aluno..."
        />
        <label style={{ marginTop: "12px" }}>Aluno</label>
        <select value={selectedId} onChange={e => setSelectedId(e.target.value)}>
          <option value="">Selecione um aluno</option>
          {filteredStudents.map(student => (
            <option key={student.id} value={student.id}>{student.full_name}</option>
          ))}
        </select>
      </div>

      <div className="panel">
        <h2>Dashboard geral</h2>
        {records.length === 0 ? (
          <p>Nenhum HSI-DOTH-P registrado nas aulas foi encontrado.</p>
        ) : (
          <>
            <div className="grid">
              {collective.map(item => (
                <div className="metric" key={item.key}>
                  <div style={{ fontSize: "12px", opacity: 0.7 }}>{item.label}</div>
                  <strong>{item.average.toFixed(2)} / 5</strong>
                  <div style={{ fontSize: "12px", marginTop: "5px" }}>
                    Prioridade em {item.priorityCount} avaliação(ões) — {item.coverage.toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
            <div style={{
              marginTop: "16px",
              padding: "16px",
              borderRadius: "12px",
              background: "#f7faff",
              border: "1px solid #d8e4f4"
            }}>
              <h3 style={{ marginTop: 0 }}>Prioridade pedagógica coletiva</h3>
              <p>
                {topCollective
                  ? `${topCollective.label} apresenta a maior abrangência entre os resultados avaliados, com ${topCollective.coverage.toFixed(1)}% das avaliações em nível de atenção.`
                  : "Não há dados suficientes para identificar uma prioridade coletiva."}
              </p>
            </div>
          </>
        )}
      </div>

      {selectedId && (
        <div className="panel">
          <h2>Análise individual{selectedStudent ? ` — ${selectedStudent.full_name}` : ""}</h2>

          {studentRecords.length === 0 ? (
            <p>Este aluno ainda não possui HSI-DOTH-P registrado em suas aulas.</p>
          ) : (
            <>
              <div className="grid">
                <div className="metric">
                  <div style={{ fontSize: "12px", opacity: 0.7 }}>AULAS AVALIADAS</div>
                  {studentRecords.length}
                </div>
                <div className="metric">
                  <div style={{ fontSize: "12px", opacity: 0.7 }}>ÚLTIMA MÉDIA</div>
                  {latest.average.toFixed(2)} / 5
                </div>
                <div className="metric">
                  <div style={{ fontSize: "12px", opacity: 0.7 }}>ÚLTIMO INDICADOR</div>
                  {Number(latest.normalized_score).toFixed(1)} / 100
                </div>
                <div className="metric">
                  <div style={{ fontSize: "12px", opacity: 0.7 }}>CLASSIFICAÇÃO</div>
                  {classification(latest.average)}
                </div>
              </div>

              <h3 style={{ marginTop: "20px" }}>Último resultado</h3>
              <div className="grid">
                {dimensions.map(item => (
                  <div className="metric" key={item.key}>
                    <div style={{ fontSize: "12px", opacity: 0.7 }}>{item.label}</div>
                    <strong>{latest.scores[item.key]} / 5</strong>
                  </div>
                ))}
              </div>

              {priorityIndividual.length > 0 && (
                <div style={{
                  marginTop: "16px",
                  padding: "16px",
                  borderRadius: "12px",
                  background: "#fffaf0",
                  border: "1px solid #f0d58a"
                }}>
                  <h3 style={{ marginTop: 0 }}>Pontos de atenção para a próxima aula</h3>
                  <p>{priorityIndividual.map(item => `${item.label} (${item.score}/5)`).join(", ")}.</p>
                  <p>
                    A próxima aula deve priorizar situações práticas relacionadas a esses fatores,
                    com observação do comportamento e registro da evolução.
                  </p>
                </div>
              )}

              {individualDeltas.length > 0 && (
                <div style={{ marginTop: "18px" }}>
                  <h3>Evolução entre as duas últimas aulas avaliadas</h3>
                  <div className="grid">
                    {individualDeltas.map(item => (
                      <div className="metric" key={item.key}>
                        <div style={{ fontSize: "12px", opacity: 0.7 }}>{item.label}</div>
                        <strong>{item.previous.toFixed(1)} → {item.current.toFixed(1)}</strong>
                        <div style={{ fontSize: "12px", marginTop: "5px" }}>
                          {item.delta > 0 ? "Evolução positiva" : item.delta < 0 ? "Atenção: queda" : "Estável"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <h3 style={{ marginTop: "20px" }}>Histórico das aulas</h3>
              {studentRecords.map((record, index) => (
                <div key={record.lesson.id} style={{ padding: "12px 0", borderBottom: "1px solid #e1e7ef" }}>
                  <strong>Aula {studentRecords.length - index}</strong>
                  {" — "}
                  {record.lesson.started_at ? new Date(record.lesson.started_at).toLocaleString("pt-BR") : "sem data"}
                  {" — "}
                  Média {Number(record.hsi.average).toFixed(2)}/5
                  {" — "}
                  {classification(Number(record.hsi.average))}
                </div>
              ))}
            </>
          )}
        </div>
      )}

      <div className="panel" style={{ background: "#f7faff", border: "1px solid #cfe0f3" }}>
        <h2>Relatório para preparação das próximas aulas</h2>
        {records.length === 0 ? (
          <p>O relatório será disponibilizado quando houver avaliações HSI-DOTH-P registradas nas aulas.</p>
        ) : (
          <>
            <p>
              O planejamento deve utilizar os fatores com maior abrangência coletiva como prioridade,
              sem substituir a observação das necessidades específicas de cada aluno.
            </p>
            <h3>Prioridades sugeridas</h3>
            <ol>
              {collective.slice(0, 3).map(item => (
                <li key={item.key}>
                  <strong>{item.label}</strong>: média {item.average.toFixed(2)}/5,
                  com prioridade em {item.coverage.toFixed(1)}% das avaliações.
                </li>
              ))}
            </ol>
            {selectedStudent && latest && (
              <>
                <h3>Orientação para {selectedStudent.full_name}</h3>
                <p>
                  {priorityIndividual.length
                    ? `Na próxima aula, observar especialmente: ${priorityIndividual.map(item => item.label).join(", ")}.`
                    : "Não foram identificados fatores individuais com nota igual ou inferior a 3 na última avaliação. Manter a progressão pedagógica e aumentar gradualmente a complexidade das situações."}
                </p>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
'@

$before = $s.Substring(0, $start)
$after = $s.Substring($end)
Set-Content $p ($before + $newComponent + "`r`n" + $after) -Encoding UTF8

Write-Host "HSI-DOTH-P substituído pelo dashboard de consolidação."
Write-Host "Backup: $backup"
Write-Host "Agora execute: npm run build"
