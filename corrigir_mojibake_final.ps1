$p = "src\main.jsx"

if (-not (Test-Path $p)) {
    Write-Host "ERRO: arquivo nao encontrado."
    exit 1
}

$texto = Get-Content $p -Raw -Encoding UTF8

function BadScore($s) {
    $patterns = @(
        [char]0x00C3,
        [char]0x00C2,
        [char]0x00E2,
        [char]0x00C6,
        [char]0x00EF,
        [char]0xFFFD
    )

    $total = 0

    foreach ($pattern in $patterns) {
        $total += ([regex]::Matches(
            $s,
            [regex]::Escape($pattern)
        )).Count
    }

    return $total
}

$antes = BadScore $texto

Write-Host "SUSPEITOS ANTES: $antes"

# ------------------------------------------------
# Tenta desfazer corrupcao CP1252 -> UTF8
# somente quando melhora o resultado.
# ------------------------------------------------

for ($i = 1; $i -le 4; $i++) {

    try {

        $bytes = [System.Text.Encoding]::GetEncoding(1252).GetBytes($texto)

        $candidato = [System.Text.Encoding]::UTF8.GetString($bytes)

        $atual = BadScore $texto
        $novo = BadScore $candidato

        Write-Host "PASSO $i - antes: $atual - depois: $novo"

        if ($novo -lt $atual) {
            $texto = $candidato
        }
        else {
            break
        }

    }
    catch {
        break
    }
}

# ------------------------------------------------
# Correcoes por Unicode
# ------------------------------------------------

$texto = $texto.Replace(
    ([char]0x00EF + [char]0x00BF + [char]0x00BD),
    ""
)

# Nao informado
$texto = $texto.Replace(
    ("N" + [char]0xFFFD + "o"),
    ("N" + [char]0x00E3 + "o")
)

# Nao informada
$texto = $texto.Replace(
    ("N" + [char]0xFFFD + "o informada"),
    ("N" + [char]0x00E3 + "o informada")
)

# Nao foi
$texto = $texto.Replace(
    ("N" + [char]0xFFFD + "o foi"),
    ("N" + [char]0x00E3 + "o foi")
)

# Valido
$texto = $texto.Replace(
    ("v" + [char]0xFFFD + "lido"),
    ("v" + [char]0x00E1 + "lido")
)

# Numero
$texto = $texto.Replace(
    ("N" + [char]0xFFFD + "mero"),
    ("N" + [char]0x00FA + "mero")
)

# Combustivel
$texto = $texto.Replace(
    ("Combust" + [char]0xFFFD + "vel"),
    ("Combust" + [char]0x00ED + "vel")
)

# Eletrico
$texto = $texto.Replace(
    ("El" + [char]0xFFFD + "trico"),
    ("El" + [char]0x00E9 + "trico")
)

# Hibrido
$texto = $texto.Replace(
    ("H" + [char]0xFFFD + "brido"),
    ("H" + [char]0x00ED + "brido")
)

# ------------------------------------------------
# Simbolos
# ------------------------------------------------

$texto = $texto.Replace(
    "â" + [char]0x20AC + "”",
    [char]0x2014
)

$texto = $texto.Replace(
    [char]0x00E2 + [char]0x20AC + [char]0x201D,
    [char]0x2014
)

# ------------------------------------------------
# Salvar UTF8
# ------------------------------------------------

Set-Content $p $texto -Encoding UTF8

$depois = BadScore $texto

Write-Host ""
Write-Host "CORRECAO EXECUTADA."
Write-Host "ANTES : $antes"
Write-Host "DEPOIS: $depois"
Write-Host ""

if ($depois -lt $antes) {
    Write-Host "OK: quantidade de caracteres suspeitos diminuiu."
}
elseif ($depois -eq $antes) {
    Write-Host "ATENCAO: nenhuma melhora detectada."
}
else {
    Write-Host "ATENCAO: resultado piorou. Restaurar backup."
}