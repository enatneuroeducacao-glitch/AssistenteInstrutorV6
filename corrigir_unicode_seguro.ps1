$p = "src\main.jsx"

$utf8 = New-Object System.Text.UTF8Encoding($false)

$path = (Resolve-Path $p).Path

$s = [System.IO.File]::ReadAllText($path, $utf8)

Write-Host "Arquivo carregado."

# ----------------------------------------
# Caracteres mojibake construidos por Unicode
# ----------------------------------------

$Atil = [char]0x00C3
$Agrave = [char]0x00C0
$Acirc = [char]0x00C2
$Aacute = [char]0x00C1

# Ã£ -> ã
$s = $s.Replace(
    ($Atil + [char]0x00A3),
    [char]0x00E3
)

# Ã¡ -> á
$s = $s.Replace(
    ($Atil + [char]0x00A1),
    [char]0x00E1
)

# Ã© -> é
$s = $s.Replace(
    ($Atil + [char]0x00A9),
    [char]0x00E9
)

# Ã­ -> í
$s = $s.Replace(
    ($Atil + [char]0x00AD),
    [char]0x00ED
)

# Ã³ -> ó
$s = $s.Replace(
    ($Atil + [char]0x00B3),
    [char]0x00F3
)

# Ãº -> ú
$s = $s.Replace(
    ($Atil + [char]0x00BA),
    [char]0x00FA
)

# Ã§ -> ç
$s = $s.Replace(
    ($Atil + [char]0x00A7),
    [char]0x00E7
)

# Ãµ -> õ
$s = $s.Replace(
    ($Atil + [char]0x00B5),
    [char]0x00F5
)

# Ãª -> ê
$s = $s.Replace(
    ($Atil + [char]0x00AA),
    [char]0x00EA
)

# Ã´ -> ô
$s = $s.Replace(
    ($Atil + [char]0x00B4),
    [char]0x00F4
)

# Ã¢ -> â
$s = $s.Replace(
    ($Atil + [char]0x00A2),
    [char]0x00E2
)

# Ãš -> Ú
$s = $s.Replace(
    ($Atil + [char]0x0160),
    [char]0x00DA
)

# Ã“ -> Ó
$s = $s.Replace(
    ($Atil + [char]0x201C),
    [char]0x00D3
)

# ----------------------------------------
# Casos com caractere de substituicao
# ----------------------------------------

$replacement = [char]0xFFFD

$s = $s.Replace(
    ("Manuten" + $replacement + $replacement + "o"),
    "Manutenção"
)

# ----------------------------------------
# Simbolos
# ----------------------------------------

$s = $s.Replace(
    ("â" + [char]0x20AC),
    [char]0x2014
)

# ----------------------------------------
# Casos específicos restantes
# ----------------------------------------

$s = $s.Replace(
    ("RPA " + $Atil + [char]0x0160 + "NICO"),
    ("RPA " + [char]0x00DA + "NICO")
)

# ----------------------------------------
# Salvar
# ----------------------------------------

[System.IO.File]::WriteAllText(
    $path,
    $s,
    $utf8
)

Write-Host "CORRECAO APLICADA."