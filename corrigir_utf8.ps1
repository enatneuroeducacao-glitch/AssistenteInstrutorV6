$p = "src\main.jsx"

$utf8 = New-Object System.Text.UTF8Encoding($false)
$cp1252 = [System.Text.Encoding]::GetEncoding(1252)

$path = (Resolve-Path $p).Path

$s = [System.IO.File]::ReadAllText($path, $utf8)

function Get-BadScore($text) {
    $score = 0

    foreach ($c in $text.ToCharArray()) {
        $n = [int][char]$c

        if (
            ($n -eq 0x00C3) -or
            ($n -eq 0x00C2) -or
            ($n -eq 0x00E2) -or
            ($n -eq 0x0192) -or
            ($n -eq 0xFFFD) -or
            ($n -ge 0x2500 -and $n -le 0x257F)
        ) {
            $score++
        }
    }

    return $score
}

$before = Get-BadScore $s

Write-Host "Nivel de corrupcao inicial: $before"

for ($i = 1; $i -le 4; $i++) {

    try {
        $bytes = $cp1252.GetBytes($s)
        $candidate = $utf8.GetString($bytes)

        $oldScore = Get-BadScore $s
        $newScore = Get-BadScore $candidate

        Write-Host "Tentativa $i - antes: $oldScore - depois: $newScore"

        if ($newScore -lt $oldScore) {
            $s = $candidate
        }
        else {
            break
        }
    }
    catch {
        Write-Host "Erro na tentativa $i"
        break
    }
}

[System.IO.File]::WriteAllText(
    $path,
    $s,
    $utf8
)

$after = Get-BadScore $s

Write-Host "Nivel de corrupcao final: $after"
Write-Host "CORRECAO UTF-8 CONCLUIDA."