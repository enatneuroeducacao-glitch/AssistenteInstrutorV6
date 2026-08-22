$p = "src\main.jsx"

$lines = [System.Collections.Generic.List[string]](Get-Content $p)

$revenueCount = 0
$expenseCount = 0
$resultCount = 0

for ($i = 0; $i -lt $lines.Count; $i++) {

    if ($lines[$i] -match '^\s*R\$ 0,00\s*$') {

        $previous = ""

        if ($i -gt 0) {
            $previous = $lines[$i - 1].Trim()
        }

        if ($previous -eq "</div>") {
            continue
        }

        if ($i -ge 3 -and $lines[$i - 3] -match "RECEITAS") {
            $lines[$i] = "            {formatCurrency(financeRevenue)}"
            $revenueCount++
        }
        elseif ($i -ge 3 -and $lines[$i - 3] -match "CUSTOS") {
            $lines[$i] = "            {formatCurrency(financeExpenses)}"
            $expenseCount++
        }
        elseif ($i -ge 3 -and $lines[$i - 3] -match "RESULTADO") {
            $lines[$i] = "            {formatCurrency(financeResult)}"
            $resultCount++
        }
    }
}

Set-Content $p $lines -Encoding UTF8

Write-Host "RECEITAS ALTERADAS: $revenueCount"
Write-Host "CUSTOS ALTERADOS: $expenseCount"
Write-Host "RESULTADO ALTERADO: $resultCount"