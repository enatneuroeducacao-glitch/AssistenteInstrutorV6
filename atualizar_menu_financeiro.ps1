$p = "src\main.jsx"

$backup = "src\main_BACKUP_PRE_MENU_FINANCEIRO_$(Get-Date -Format 'yyyyMMdd_HHmmss').jsx"
Copy-Item $p $backup -Force
Write-Host "Backup criado: $backup"

$lines = @(Get-Content $p)

if ($lines.Count -lt 2865) {
    throw "O arquivo possui menos de 2865 linhas."
}

$lines[2864] = '    ["financeiro", "FINANCEIRO"], ["agenda", "AGENDA"], ["rpa", "RPA ÚNICO"], ["assinatura", "ASSINATURA"], ["perfil", "PERFIL"]'

Set-Content $p $lines -Encoding UTF8

Write-Host "Linha 2865 atualizada."