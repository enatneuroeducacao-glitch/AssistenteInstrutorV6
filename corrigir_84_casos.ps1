$p = "src\main.jsx"

$utf8 = New-Object System.Text.UTF8Encoding($false)

$s = [System.IO.File]::ReadAllText(
    (Resolve-Path $p),
    $utf8
)

Write-Host "INICIANDO CORRECAO DOS PADROES RESTANTES..."

# UTF-8 mojibake conhecido
$s = $s.Replace("Ã£", "ã")
$s = $s.Replace("Ã¡", "á")
$s = $s.Replace("Ã©", "é")
$s = $s.Replace("Ã­", "í")
$s = $s.Replace("Ã³", "ó")
$s = $s.Replace("Ãº", "ú")
$s = $s.Replace("Ã§", "ç")
$s = $s.Replace("Ãµ", "õ")
$s = $s.Replace("Ãª", "ê")
$s = $s.Replace("Ã´", "ô")
$s = $s.Replace("Ã¢", "â")
$s = $s.Replace("Ã£", "ã")

# Maiúsculas corrompidas
$s = $s.Replace("Ãš", "Ú")
$s = $s.Replace("Ã“", "Ó")
$s = $s.Replace("Ã‡", "Ç")
$s = $s.Replace("Ãƒ", "Ã")

# Casos de símbolos
$s = $s.Replace("â€”", "—")
$s = $s.Replace("â€“", "–")
$s = $s.Replace("â€¢", "•")

# Casos conhecidos com caractere de substituição
$s = $s.Replace("Manuten" + [char]0xFFFD + [char]0xFFFD + "o", "Manutenção")

# Garantias de termos importantes
$s = $s.Replace("RPA ÃšNICO", "RPA ÚNICO")
$s = $s.Replace("RPA Ãšnico", "RPA Único")

# Grava somente UTF-8
[System.IO.File]::WriteAllText(
    (Resolve-Path $p),
    $s,
    $utf8
)

Write-Host "CORRECAO CONCLUIDA."