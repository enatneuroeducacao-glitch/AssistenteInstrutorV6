$p = "src\main.jsx"

$utf8 = New-Object System.Text.UTF8Encoding($false)
$path = (Resolve-Path $p).Path

$s = [System.IO.File]::ReadAllText($path, $utf8)

function BadText([byte[]]$bytes) {
    $enc = [System.Text.Encoding]::UTF8
    return $enc.GetString($bytes)
}

$map = @{}

$map[(BadText ([byte[]](0xC3,0x83,0xC6,0x92,0xC3,0x82,0xC2,0xA1)))] = "á"
$map[(BadText ([byte[]](0xC3,0x83,0xC6,0x92,0xC3,0x82,0xC2,0xAD)))] = "í"
$map[(BadText ([byte[]](0xC3,0x83,0xC6,0x92,0xC3,0x82,0xC2,0xA7)))] = "ç"
$map[(BadText ([byte[]](0xC3,0x83,0xC6,0x92,0xC3,0x82,0xC2,0xA3)))] = "ã"

$s = $s.Replace("Contas bancÃƒÂ¡rias", "Contas bancárias")
$s = $s.Replace("conta bancÃƒÂ¡ria", "conta bancária")
$s = $s.Replace("saÃƒÂ­das", "saídas")
$s = $s.Replace("AgÃƒÂªncia", "Agência")
$s = $s.Replace("NÃƒÂºmero", "Número")
$s = $s.Replace("lanÃƒÂ§amento", "lançamento")
$s = $s.Replace("LanÃƒÂ§amentos", "Lançamentos")
$s = $s.Replace("DescriÃƒÂ§ÃƒÂ£o", "Descrição")
$s = $s.Replace("CombustÃƒÂ­vel", "Combustível")
$s = $s.Replace("ManutenÃƒÂ§ÃƒÂ£o", "Manutenção")

$s = $s.Replace("Contas bancÃ¡rias", "Contas bancárias")
$s = $s.Replace("conta bancÃ¡ria", "conta bancária")
$s = $s.Replace("saÃ­das", "saídas")
$s = $s.Replace("AgÃªncia", "Agência")
$s = $s.Replace("NÃºmero", "Número")
$s = $s.Replace("lanÃ§amento", "lançamento")
$s = $s.Replace("LanÃ§amentos", "Lançamentos")

[System.IO.File]::WriteAllText($path, $s, $utf8)

Write-Host "TEXTOS DE CONTAS E FINANCEIRO CORRIGIDOS."