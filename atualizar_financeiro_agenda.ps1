$p = "src\main.jsx"

$backup = "src\main_BACKUP_PRE_FINANCEIRO_AGENDA_$(Get-Date -Format 'yyyyMMdd_HHmmss').jsx"
Copy-Item $p $backup -Force
Write-Host "Backup criado: $backup"

$s = Get-Content $p -Raw

# =========================================================
# 1. O formulário de veículo passa a pertencer ao Financeiro
# =========================================================

$oldVehicle = 'if (tab === "custos" && showVehicleForm)'
$newVehicle = 'if (tab === "financeiro" && showVehicleForm)'

if ($s.Contains($oldVehicle)) {
    $s = $s.Replace($oldVehicle, $newVehicle)
    Write-Host "Formulário de veículo vinculado ao Financeiro."
}
else {
    Write-Host "A referência do formulário de veículo já foi alterada ou não foi encontrada."
}

# =========================================================
# 2. Substituir a tela antiga de CUSTOS
#    por uma tela consolidada de FINANCEIRO
# =========================================================

$startMarker = 'if (tab === "custos") {'
$endMarker = '    const p = pages[tab];'

$start = $s.IndexOf($startMarker)

if ($start -ge 0) {

    $end = $s.IndexOf($endMarker, $start)

    if ($end -lt 0) {
        throw "Fim do bloco CUSTOS não encontrado."
    }

    $financeiroBlock = @'
if (tab === "financeiro") {
  return (
    <>
      <h1>Financeiro</h1>

      <div className="panel">
        <h2>Gestão financeira do instrutor</h2>

        <p>
          Centralize receitas, despesas, custos operacionais e
          resultado financeiro em um único módulo.
        </p>

        <div className="grid">

          <div className="metric">
            <div style={{ fontSize: "12px", opacity: 0.7 }}>
              RECEITAS
            </div>
            R$ 0,00
          </div>

          <div className="metric">
            <div style={{ fontSize: "12px", opacity: 0.7 }}>
              CUSTOS
            </div>
            R$ 0,00
          </div>

          <div className="metric">
            <div style={{ fontSize: "12px", opacity: 0.7 }}>
              RESULTADO
            </div>
            R$ 0,00
          </div>

        </div>
      </div>

      <div className="panel">
        <h2>Custos operacionais</h2>

        <p>
          Os custos do veículo fazem parte do controle financeiro
          do instrutor e não precisam existir como módulo separado.
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
            VEÍCULO E CUSTOS
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

if (tab === "agenda") {
  return (
    <>
      <h1>Agenda</h1>

      <div className="panel">
        <h2>Planejamento de aulas</h2>

        <p>
          Organize as próximas aulas, acompanhe os alunos e
          prepare a condução das atividades seguintes.
        </p>

        <div className="grid">

          <div className="metric">
            <div style={{ fontSize: "12px", opacity: 0.7 }}>
              AULAS HOJE
            </div>
            —
          </div>

          <div className="metric">
            <div style={{ fontSize: "12px", opacity: 0.7 }}>
              PRÓXIMAS AULAS
            </div>
            —
          </div>

          <div className="metric">
            <div style={{ fontSize: "12px", opacity: 0.7 }}>
              ALUNOS
            </div>
            —
          </div>

        </div>
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

        <p>
          Nenhuma aula futura registrada.
        </p>
      </div>
    </>
  );
}

'@

    $s = $s.Substring(0, $start) +
         $financeiroBlock +
         $s.Substring($end)

    Write-Host "Financeiro e Agenda criados."
}
else {
    throw "Bloco antigo CUSTOS não encontrado. Nenhuma alteração estrutural foi feita."
}

Set-Content $p $s -Encoding UTF8

Write-Host ""
Write-Host "ATUALIZAÇÃO CONCLUÍDA."
Write-Host "Execute agora: npm run build"