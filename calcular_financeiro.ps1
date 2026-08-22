$p = "src\main.jsx"

$lines = [System.Collections.Generic.List[string]](Get-Content $p)

$marker = 'if (tab === "financeiro") {'

$idx = $lines.IndexOf($marker)

if ($idx -lt 0) {
    throw "BLOCO FINANCEIRO NAO ENCONTRADO."
}

if ($lines -match 'const financeRevenue') {
    Write-Host "CALCULOS FINANCEIROS JA EXISTEM."
    exit
}

$block = @'
    const financeRevenue = financeEntries
      .filter(entry => String(entry.type || "").toUpperCase() === "RECEITA")
      .reduce((total, entry) => total + Number(entry.amount || 0), 0);

    const financeExpenses = financeEntries
      .filter(entry => String(entry.type || "").toUpperCase() === "DESPESA")
      .reduce((total, entry) => total + Number(entry.amount || 0), 0);

    const financeResult = financeRevenue - financeExpenses;

    const formatCurrency = value =>
      Number(value || 0).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
      });

'@

$blockLines = $block -split "`r?`n"

for ($i = $blockLines.Count - 1; $i -ge 0; $i--) {
    if ($blockLines[$i] -ne "") {
        $lines.Insert($idx + 1, $blockLines[$i])
    }
}

Set-Content $p $lines -Encoding UTF8

Write-Host "CALCULOS FINANCEIROS INSERIDOS."