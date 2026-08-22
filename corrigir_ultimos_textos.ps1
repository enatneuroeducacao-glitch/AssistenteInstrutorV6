$p = "src\main.jsx"

$path = (Resolve-Path $p).Path
$utf8 = New-Object System.Text.UTF8Encoding($false)

$s = [System.IO.File]::ReadAllText($path, $utf8)

function C([string]$a, [string]$b) {
    $script:s = $script:s.Replace($a, $b)
}

# RPA
C ("RPA " + [char]0x00C3 + [char]0x0161 + "NICO") ("RPA " + [char]0x00DA + "NICO")

# NÃ£o foi possÃ­vel
C ("N" + [char]0x00C3 + [char]0x00A3 + "o foi poss" + [char]0x00C3 + [char]0x00AD + "vel") ("N" + [char]0x00E3 + "o foi poss" + [char]0x00ED + "vel")

# prÃ³xima
C ("pr" + [char]0x00C3 + [char]0x00B3 + "xima") ("pr" + [char]0x00F3 + "xima")

# deverÃ£o
C ("dever" + [char]0x00C3 + [char]0x00A3 + "o") ("dever" + [char]0x00E3 + "o")

# preparaÃ§Ã£o
C ("prepara" + [char]0x00C3 + [char]0x00A7 + [char]0x00C3 + [char]0x00A3 + "o") ("prepara" + [char]0x00E7 + [char]0x00E3 + "o")

# serÃ£o
C ("ser" + [char]0x00C3 + [char]0x00A3 + "o") ("ser" + [char]0x00E3 + "o")

# Casos HTML entity que ainda aparecem visualmente corretamente no código
# Mantemos as entidades válidas; elas não são erro de codificação.

[System.IO.File]::WriteAllText($path, $s, $utf8)

Write-Host "ULTIMOS TEXTOS CORRIGIDOS."
