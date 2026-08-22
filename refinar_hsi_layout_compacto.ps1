# Refinamento visual do HSI-DOTH-P
# Cria backup e deixa a Central de Relatórios mais compacta e intuitiva.

$p = "src\main.jsx"
if (-not (Test-Path $p)) { throw "Arquivo src\main.jsx não encontrado." }

$s = Get-Content $p -Raw
$start = $s.IndexOf("function HsiDothPAssessment")
$end = $s.IndexOf("function ProfileForm", $start)
if ($start -lt 0 -or $end -lt 0) { throw "Componente HsiDothPAssessment não localizado." }

$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backup = "src\main_BACKUP_PRE_HSI_LAYOUT_COMPACTO_$stamp.jsx"
Copy-Item $p $backup -Force
Write-Host "Backup criado: $backup"

$block = $s.Substring($start, $end - $start)

# Container principal mais estreito e compacto
$block = $block.Replace(
'maxWidth: "1100px", margin: "0 auto"',
'maxWidth: "1050px", margin: "0 auto"'
)

# Menos espaçamento vertical nos painéis principais
$block = $block.Replace(
'style={{ padding: "18px 20px" }}',
'style={{ padding: "15px 18px" }}'
)

$block = $block.Replace(
'style={{ padding: "14px 18px" }}',
'style={{ padding: "12px 16px" }}'
)

$block = $block.Replace(
'style={{ padding: "16px 18px" }}',
'style={{ padding: "13px 16px" }}'
)

# Cards superiores mais compactos
$block = $block.Replace(
'gridTemplateColumns: "repeat(4, minmax(130px, 1fr))"',
'gridTemplateColumns: "repeat(4, minmax(120px, 1fr))"'
)

# Opções de relatório em botões menores
$block = $block.Replace(
'gridTemplateColumns: "repeat(auto-fit, minmax(135px, 1fr))"',
'gridTemplateColumns: "repeat(auto-fit, minmax(125px, 1fr))"'
)

# Cards de fatores: não ocupar espaço excessivo
$block = $block.Replace(
'gridTemplateColumns: "repeat(5, minmax(130px, 1fr))"',
'gridTemplateColumns: "repeat(auto-fit, minmax(135px, 1fr))"'
)

$block = $block.Replace(
'gridTemplateColumns: "repeat(5, minmax(110px, 1fr))"',
'gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))"'
)

# Cards individuais
$block = $block.Replace(
'gridTemplateColumns: "repeat(4, minmax(120px, 1fr))"',
'gridTemplateColumns: "repeat(auto-fit, minmax(135px, 1fr))"'
)

# Títulos mais proporcionais
$block = $block.Replace(
'<h1 style={{ marginBottom: "5px" }}>',
'<h1 style={{ marginBottom: "4px", fontSize: "26px" }}>'
)

$block = $block.Replace(
'<h2 style={{ margin: 0, fontSize: "19px" }}>',
'<h2 style={{ margin: 0, fontSize: "18px" }}>'
)

# Menos espaço entre os grupos de relatório
$block = $block.Replace(
'gap: "10px", marginTop: "16px"',
'gap: "8px", marginTop: "12px"'
)

$s = $s.Substring(0, $start) + $block + $s.Substring($end)
Set-Content $p $s -Encoding UTF8

Write-Host ""
Write-Host "Layout compacto aplicado."
Write-Host "A lógica dos dados e dos relatórios não foi alterada."
Write-Host "Execute agora: npm run build"
