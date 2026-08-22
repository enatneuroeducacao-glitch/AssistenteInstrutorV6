$p = "src\main.jsx"

$path = (Resolve-Path $p).Path
$utf8 = New-Object System.Text.UTF8Encoding($false)

$s = [System.IO.File]::ReadAllText($path, $utf8)

function C([string]$a, [string]$b) {
    $script:s = $script:s.Replace($a, $b)
}

# -----------------------------
# Financeiro
# -----------------------------

C ("contas banc" + [char]0x00C3 + [char]0x00A1 + "rias") ("contas banc" + [char]0x00E1 + "rias")

C ("Usu" + [char]0x00C3 + [char]0x00A1 + "rio n" + [char]0x00C3 + [char]0x00A3 + "o autenticado") ("Usu" + [char]0x00E1 + "rio n" + [char]0x00E3 + "o autenticado")

C ("valor v" + [char]0x00C3 + [char]0x00A1 + "lido") ("valor v" + [char]0x00E1 + "lido")

C ("N" + [char]0x00C3 + [char]0x00A3 + "o foi poss" + [char]0x00C3 + [char]0x00ED + "vel") ("N" + [char]0x00E3 + "o foi poss" + [char]0x00ED + "vel")

C ("Combust" + [char]0x00C3 + [char]0x00AD + "vel") ("Combust" + [char]0x00ED + "vel")

C ("Manuten" + [char]0x00C3 + [char]0x00A7 + [char]0x00C3 + [char]0x00A3 + "o") ("Manuten" + [char]0x00E7 + [char]0x00E3 + "o")

C ("Cart" + [char]0x00C3 + [char]0x00A3 + "o") ("Cart" + [char]0x00E3 + "o")

C ("Transfer" + [char]0x00C3 + [char]0x00AA + "ncia") ("Transfer" + [char]0x00EA + "ncia")

C ("Conta poupan" + [char]0x00C3 + [char]0x00A7 + "a") ("Conta poupan" + [char]0x00E7 + "a")

# -----------------------------
# RPA
# -----------------------------

C ("RPA " + [char]0x00C3 + [char]0x0160 + "NICO") ("RPA " + [char]0x00DA + "NICO")

# -----------------------------
# Agenda
# -----------------------------

C ("pr" + [char]0x00C3 + [char]0x00B3 + "ximas aulas") ("pr" + [char]0x00F3 + "ximas aulas")

C ("condu" + [char]0x00C3 + [char]0x00A7 + [char]0x00C3 + [char]0x00A3 + "o") ("condu" + [char]0x00E7 + [char]0x00E3 + "o")

C ("PR" + [char]0x00C3 + [char]0x201C + "XIMAS AULAS") ("PR" + [char]0x00D3 + "XIMAS AULAS")

C ("Prepara" + [char]0x00C3 + [char]0x00A7 + [char]0x00C3 + [char]0x00A3 + "o") ("Prepara" + [char]0x00E7 + [char]0x00E3 + "o")

C ("informa" + [char]0x00C3 + [char]0x00A7 + [char]0x00C3 + [char]0x00B5 + "es") ("informa" + [char]0x00E7 + [char]0x00F5 + "es")

C ("recomenda" + [char]0x00C3 + [char]0x00A7 + [char]0x00C3 + [char]0x00B5 + "es") ("recomenda" + [char]0x00E7 + [char]0x00F5 + "es")

C ("Pr" + [char]0x00C3 + [char]0x00B3 + "ximas atividades") ("Pr" + [char]0x00F3 + "ximas atividades")

# -----------------------------
# Veiculo
# -----------------------------

C ("Manuten" + [char]0x00C3 + [char]0x00A7 + [char]0x00C3 + [char]0x00A3 + "o anual") ("Manuten" + [char]0x00E7 + [char]0x00E3 + "o anual")

# -----------------------------
# Gravar
# -----------------------------

[System.IO.File]::WriteAllText($path, $s, $utf8)

Write-Host "CORRECAO CONCLUIDA."
