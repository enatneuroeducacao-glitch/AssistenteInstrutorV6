$p = "src\main.jsx"

$lines = [System.Collections.Generic.List[string]](Get-Content $p)

$start = $lines.IndexOf('if (tab === "financeiro") {')

if ($start -lt 0) {
    throw "BLOCO FINANCEIRO NAO ENCONTRADO."
}

$end = $lines.IndexOf('if (tab === "agenda") {', $start)

if ($end -lt 0) {
    throw "FIM DO BLOCO FINANCEIRO NAO ENCONTRADO."
}

$revenueDone = $false
$expenseDone = $false
$resultDone = $false

for ($i = $start; $i -lt $end; $i++) {

    if ($lines[$i].Trim() -eq "R$ 0,00") {

        $context = ($lines[[Math]::Max($start, $i-6)..($i-1)] -join " ")

        if (-not $revenueDone -and $context -match "RECEITAS") {
            $lines[$i] = "            {formatCurrency(financeRevenue)}"
            $revenueDone = $true
            continue
        }

        if (-not $expenseDone -and $context -match "CUSTOS") {
            $lines[$i] = "            {formatCurrency(financeExpenses)}"
            $expenseDone = $true
            continue
        }

        if (-not $resultDone -and $context -match "RESULTADO") {
            $lines[$i] = "            {formatCurrency(financeResult)}"
            $resultDone = $true
            continue
        }
    }
}

Set-Content $p $lines -Encoding UTF8

Write-Host "RECEITAS: $revenueDone"
Write-Host "CUSTOS: $expenseDone"
Write-Host "RESULTADO: $resultDone"