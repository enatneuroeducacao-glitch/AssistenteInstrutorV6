$p = "src\main.jsx"

$path = (Resolve-Path $p).Path

$utf8 = New-Object System.Text.UTF8Encoding($false)

$s = [System.IO.File]::ReadAllText($path, $utf8)

# Financeiro
$s = $s.Replace("contas banc" + [char]0x00C3 + [char]0x00A1 + "rias", "contas bancárias")
$s = $s.Replace("Usu" + [char]0x00C3 + [char]0x00A1 + "rio n" + [char]0x00C3 + [char]0x00A3 + "o autenticado", "Usuário não autenticado")
$s = $s.Replace("valor v" + [char]0x00C3 + [char]0x00A1 + "lido", "valor válido")
$s = $s.Replace("N" + [char]0x00C3 + [char]0x00A3 + "o foi poss" + [char]0x00C3 + [char]0x00ED + "vel", "Não foi possível")
$s = $s.Replace("Combust" + [char]0x00C3 + [char]0x00AD + "vel", "Combustível")
$s = $s.Replace("Manuten" + [char]0x00C3 + [char]0x00A7 + [char]0x00C3 + [char]0x00A3 + "o", "Manutenção")
$s = $s.Replace("Cart" + [char]0x00C3 + [char]0x00A3 + "o", "Cartão")
$s = $s.Replace("Transfer" + [char]0x00C3 + [char]0x00AA + "ncia", "Transferência")
$s = $s.Replace("Conta poupan" + [char]0x00C3 + [char]0x00A7 + "a", "Conta poupança")

# RPA
$s = $s.Replace(
    "RPA " + [char]0x00C3 + [char]0x0160 + "NICO",
    "RPA ÚNICO"
)

# Agenda
$s = $s.Replace("pr" + [char]0x00C3 + [char]0x00B3 + "ximas aulas", "próximas aulas")
$s = $s.Replace("condu" + [char]0x00C3 + [char]0x00A7 + [char]0x00C3 + [char]0x00A3 + "o", "condução")
$s = $s.Replace(
    "PR" + [char]0x00C3 + [char]0x201C + "XIMAS AULAS",
    "PRÓXIMAS AULAS"
)
$s = $s.Replace("Prepara" + [char]0x00C3 + [char]0x00A7 + [char]0x00C3 + [char]0x00A3 + "o", "Preparação")
$s = $s.Replace("informa" + [char]0x00C3 + [char]0x00A7 + [char]0x00C3 + [char]0x00B5 + "es", "informações")
$s = $s.Replace("recomenda" + [char]0x00C3 + [char]0x00A7 + [char]0x00C3 + [char]0x00B5 + "es", "recomendações")
$s = $s.Replace("Pr" + [char]0x00C3 + [char]0x00B3 + "ximas atividades", "Próximas atividades")

# Veículo
$s = $s.Replace(
    "Manuten" + [char]0x00C3 + [char]0x00A7 + [char]0x00C3 + [char]0x00A3 + "o anual",
    "Manutenção anual"
)

[System.IO.File]::WriteAllText($path, $s, $utf8)

Write-Host "TEXTOS CONFIRMADOS CORRIGIDOS."