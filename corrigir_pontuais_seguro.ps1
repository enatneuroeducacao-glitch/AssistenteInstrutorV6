$ErrorActionPreference = "Stop"

$p = "src\main.jsx"

$utf8 = New-Object System.Text.UTF8Encoding($false)
$cp437 = [System.Text.Encoding]::GetEncoding(437)
$cp1252 = [System.Text.Encoding]::GetEncoding(1252)

$s = [System.IO.File]::ReadAllText((Resolve-Path $p), $utf8)

function U([int[]]$codes) {
    return (-join ($codes | ForEach-Object { [char]$_ }))
}

function BadScore([string]$text) {
    $score = 0

    $markers = @(
        (U @(0x251C)),
        (U @(0x2500)),
        (U @(0x00C3,0x00A3)),
        (U @(0x00C3,0x00A7)),
        (U @(0x00C3,0x00AA)),
        (U @(0x00C3,0x00A1)),
        (U @(0x00C3,0x00AD)),
        (U @(0x00C3,0x00B3)),
        (U @(0x00C3,0x00BA)),
        (U @(0x00C3,0x00B5)),
        (U @(0x00C3,0x00AA)),
        (U @(0x00C2)),
        (U @(0x00E2,0x20AC)),
        (U @(0x00D4,0x00C7)),
        (U @(0xFFFD))
    )

    foreach ($m in $markers) {
        $score += ([regex]::Matches($text, [regex]::Escape($m))).Count
    }

    return $score
}

function TryRepair([string]$text) {

    $current = $text

    for ($round = 0; $round -lt 5; $round++) {

        $before = BadScore $current
        $best = $current
        $bestScore = $before

        foreach ($enc in @($cp437, $cp1252)) {
            try {
                $candidate = [System.Text.Encoding]::UTF8.GetString(
                    $enc.GetBytes($current)
                )

                $score = BadScore $candidate

                if ($score -lt $bestScore) {
                    $best = $candidate
                    $bestScore = $score
                }
            }
            catch {
            }
        }

        if ($bestScore -lt $before) {
            $current = $best
        }
        else {
            break
        }
    }

    return $current
}

# Corrige apenas linhas que realmente apresentam sinais de corrupção.
$lines = $s -split "`r?`n"

for ($i = 0; $i -lt $lines.Count; $i++) {
    $lines[$i] = TryRepair $lines[$i]
}

$s = $lines -join [Environment]::NewLine

# Símbolos conhecidos que ficaram de múltiplas conversões.
$known = @{}

$known[(U @(0x00C3,0x00A2,0x00E2,0x20AC,0x00A2,0x00AC,0x00E2,0x20AC,0x00AF))] = (U @(0x2014))
$known[(U @(0x00C3,0x00A2,0x00E2,0x20AC,0x2020,0x00E2,0x20AC,0x2122))] = (U @(0x2192))
$known[(U @(0x00C3,0x00A2,0x00E2,0x20AC,0x00A2,0x00A2))] = (U @(0x2022))

$known[(U @(0x00E2,0x20AC,0x201D))] = (U @(0x2014))
$known[(U @(0x00E2,0x20AC,0x0094))] = (U @(0x2014))

$known[(U @(0x00D4,0x00C7,0x00F6))] = (U @(0x2014))

$known[(U @(0x00D4,0x00E5,0x00C6))] = (U @(0x2192))

foreach ($pair in $known.GetEnumerator()) {
    $s = $s.Replace([string]$pair.Key, [string]$pair.Value)
}

# Correções textuais pontuais adicionais.
$s = $s.Replace(
    (U @(0x00C3,0x00A7)),
    (U @(0x00E7))
)

$s = $s.Replace(
    (U @(0x00C3,0x00A3)),
    (U @(0x00E3))
)

$s = $s.Replace(
    (U @(0x00C3,0x00A9)),
    (U @(0x00E9))
)

$s = $s.Replace(
    (U @(0x00C3,0x00AA)),
    (U @(0x00EA))
)

$s = $s.Replace(
    (U @(0x00C3,0x00AD)),
    (U @(0x00ED))
)

$s = $s.Replace(
    (U @(0x00C3,0x00A1)),
    (U @(0x00E1))
)

$s = $s.Replace(
    (U @(0x00C3,0x00B3)),
    (U @(0x00F3))
)

$s = $s.Replace(
    (U @(0x00C3,0x00BA)),
    (U @(0x00FA))
)

$s = $s.Replace(
    (U @(0x00C3,0x00B5)),
    (U @(0x00F5))
)

$s = $s.Replace(
    (U @(0x00C3,0x00A7)),
    (U @(0x00E7))
)

# Grava somente UTF-8 sem BOM.
[System.IO.File]::WriteAllText(
    (Resolve-Path $p),
    $s,
    $utf8
)

Write-Host ""
Write-Host "CORRECAO PONTUAL CONCLUIDA."
Write-Host "Arquivo salvo em UTF-8."