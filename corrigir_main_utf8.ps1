$p = "src\main.jsx"

if (!(Test-Path $p)) {
    Write-Host "ERRO: src\main.jsx nao encontrado."
    exit 1
}

$utf8 = New-Object System.Text.UTF8Encoding($false)
$win1252 = [System.Text.Encoding]::GetEncoding(1252)

$original = [System.IO.File]::ReadAllText((Resolve-Path $p), $utf8)

function Get-SuspiciousCount($text) {
    $count = 0

    foreach ($c in $text.ToCharArray()) {
        $n = [int][char]$c

        if (
            $n -eq 0x00C3 -or
            $n -eq 0x00C2 -or
            $n -eq 0x00E2 -or
            $n -eq 0x0192 -or
            $n -eq 0xFFFD
        ) {
            $count++
        }
    }

    return $count
}

$current = $original
$before = Get-SuspiciousCount $current

Write-Host "SUSPEITOS ANTES: $before"

for ($i = 1; $i -le 4; $i++) {

    try {
        $bytes = $win1252.GetBytes($current)
        $candidate = $utf8.GetString($bytes)

        $oldCount = Get-SuspiciousCount $current
        $newCount = Get-SuspiciousCount $candidate

        Write-Host "PASSO $i - antes: $oldCount - depois: $newCount"

        if ($newCount -lt $oldCount) {
            $current = $candidate
        }
        else {
            break
        }
    }
    catch {
        Write-Host "ERRO NO PASSO $i"
        break
    }
}

$after = Get-SuspiciousCount $current

if ($after -ge $before) {
    Write-Host "A CORRECAO NAO MELHOROU O ARQUIVO."
    Write-Host "NENHUMA ALTERACAO FOI GRAVADA."
    exit 1
}

[System.IO.File]::WriteAllText(
    (Resolve-Path $p),
    $current,
    $utf8
)

Write-Host ""
Write-Host "CORRECAO UTF-8 APLICADA."
Write-Host "ANTES: $before"
Write-Host "DEPOIS: $after"