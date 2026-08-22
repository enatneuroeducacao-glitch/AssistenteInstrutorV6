$p = "src\main.jsx"

$backup = "src\main_BACKUP_PRE_CORRECAO_UNICODE_$(Get-Date -Format 'yyyyMMdd_HHmmss').jsx"
Copy-Item $p $backup -Force

Write-Host "Backup criado: $backup"

$s = Get-Content $p -Raw -Encoding UTF8

# Correções usando escapes Unicode.
$correcoes = @(
    @("GestÃ£o", "Gest" + [char]0xE3 + "o"),
    @("gestÃ£o", "gest" + [char]0xE3 + "o"),
    @("veÃ­culo", "ve" + [char]0xED + "culo"),
    @("VeÃ­culo", "Ve" + [char]0xED + "culo"),
    @("VEÃCULO", "VE" + [char]0xCD + "CULO"),
    @("nÃ£o", "n" + [char]0xE3 + "o"),
    @("NÃ£o", "N" + [char]0xE3 + "o"),
    @("mÃ³dulo", "m" + [char]0xF3 + "dulo"),
    @("MÃ³dulo", "M" + [char]0xF3 + "dulo"),
    @("Ãºnico", "" + [char]0xFA + "nico"),
    @("ÃšNICO", "" + [char]0xDA + "NICO"),
    @("Ãšnico", "" + [char]0xDA + "nico"),
    @("RPA ÃšNICO", "RPA " + [char]0xDA + "NICO"),
    @("RPA Ãšnico", "RPA " + [char]0xDA + "nico"),
    @("prÃ³xima", "pr" + [char]0xF3 + "xima"),
    @("PrÃ³xima", "Pr" + [char]0xF3 + "xima"),
    @("prÃ³ximas", "pr" + [char]0xF3 + "ximas"),
    @("PrÃ³ximas", "Pr" + [char]0xF3 + "ximas"),
    @("avaliaÃ§Ã£o", "avalia" + [char]0xE7 + [char]0xE3 + "o"),
    @("AvaliaÃ§Ã£o", "Avalia" + [char]0xE7 + [char]0xE3 + "o"),
    @("avaliaÃ§Ãµes", "avalia" + [char]0xE7 + [char]0xF5 + "es"),
    @("AvaliaÃ§Ãµes", "Avalia" + [char]0xE7 + [char]0xF5 + "es"),
    @("decisÃ£o", "deci" + [char]0xE7 + [char]0xE3 + "o"),
    @("DecisÃ£o", "Deci" + [char]0xE7 + [char]0xE3 + "o"),
    @("organizaÃ§Ã£o", "organiza" + [char]0xE7 + [char]0xE3 + "o"),
    @("OrganizaÃ§Ã£o", "Organiza" + [char]0xE7 + [char]0xE3 + "o"),
    @("informaÃ§Ã£o", "informa" + [char]0xE7 + [char]0xE3 + "o"),
    @("InformaÃ§Ã£o", "Informa" + [char]0xE7 + [char]0xE3 + "o"),
    @("situaÃ§Ãµes", "situa" + [char]0xE7 + [char]0xF5 + "es"),
    @("SituaÃ§Ãµes", "Situa" + [char]0xE7 + [char]0xF5 + "es"),
    @("aÃ§Ã£o", "a" + [char]0xE7 + [char]0xE3 + "o"),
    @("AÃ§Ã£o", "A" + [char]0xE7 + [char]0xE3 + "o"),
    @("conduÃ§Ã£o", "condu" + [char]0xE7 + [char]0xE3 + "o"),
    @("ConduÃ§Ã£o", "Condu" + [char]0xE7 + [char]0xE3 + "o"),
    @("mÃ©dia", "m" + [char]0xE9 + "dia"),
    @("MÃ©dia", "M" + [char]0xE9 + "dia"),
    @("Ã­ndice", "" + [char]0xED + "ndice"),
    @("pedagÃ³gica", "pedag" + [char]0xF3 + "gica"),
    @("PedagÃ³gica", "Pedag" + [char]0xF3 + "gica"),
    @("pedagÃ³gico", "pedag" + [char]0xF3 + "gico"),
    @("PedagÃ³gico", "Pedag" + [char]0xF3 + "gico"),
    @("andragÃ³gica", "andrag" + [char]0xF3 + "gica"),
    @("AndragÃ³gica", "Andrag" + [char]0xF3 + "gica"),
    @("andragÃ³gico", "andrag" + [char]0xF3 + "gico"),
    @("AndragÃ³gico", "Andrag" + [char]0xF3 + "gico"),
    @("relatÃ³rio", "relat" + [char]0xF3 + "rio"),
    @("RelatÃ³rio", "Relat" + [char]0xF3 + "rio"),
    @("histÃ³rico", "hist" + [char]0xF3 + "rico"),
    @("HistÃ³rico", "Hist" + [char]0xF3 + "rico")
)

foreach ($item in $correcoes) {
    $s = $s.Replace($item[0], $item[1])
}

Set-Content $p $s -Encoding UTF8

Write-Host ""
Write-Host "CORREÇÃO UNICODE CONCLUÍDA."
Write-Host "Backup: $backup"