$p = "src\main.jsx"

$path = (Resolve-Path $p).Path

$utf8 = New-Object System.Text.UTF8Encoding($false)

$s = [System.IO.File]::ReadAllText($path, $utf8)

Write-Host "Arquivo carregado."

# Função segura: substitui sequências usando códigos Unicode
function R([string]$texto, [string]$padrao, [string]$novo) {
    return $texto -replace $padrao, $novo
}

# Ã£ -> ã
$s = R $s ([string][char]0x00C3 + [string][char]0x00A3) ([string][char]0x00E3)

# Ã¡ -> á
$s = R $s ([string][char]0x00C3 + [string][char]0x00A1) ([string][char]0x00E1)

# Ã© -> é
$s = R $s ([string][char]0x00C3 + [string][char]0x00A9) ([string][char]0x00E9)

# Ã­ -> í
$s = R $s ([string][char]0x00C3 + [string][char]0x00AD) ([string][char]0x00ED)

# Ã³ -> ó
$s = R $s ([string][char]0x00C3 + [string][char]0x00B3) ([string][char]0x00F3)

# Ãº -> ú
$s = R $s ([string][char]0x00C3 + [string][char]0x00BA) ([string][char]0x00FA)

# Ã§ -> ç
$s = R $s ([string][char]0x00C3 + [string][char]0x00A7) ([string][char]0x00E7)

# Ãµ -> õ
$s = R $s ([string][char]0x00C3 + [string][char]0x00B5) ([string][char]0x00F5)

# Ãª -> ê
$s = R $s ([string][char]0x00C3 + [string][char]0x00AA) ([string][char]0x00EA)

# Ã´ -> ô
$s = R $s ([string][char]0x00C3 + [string][char]0x00B4) ([string][char]0x00F4)

# Ã¢ -> â
$s = R $s ([string][char]0x00C3 + [string][char]0x00A2) ([string][char]0x00E2)

# Ãš -> Ú
$s = R $s ([string][char]0x00C3 + [string][char]0x0160) ([string][char]0x00DA)

# Ã“ -> Ó
$s = R $s ([string][char]0x00C3 + [string][char]0x201C) ([string][char]0x00D3)

# Caractere de substituição isolado em palavras conhecidas
$s = R $s ("Manuten" + [char]0xFFFD + [char]0xFFFD + "o") "Manutenção"

# Casos conhecidos de palavras
$s = R $s "Usu" + [char]0x00E1 + "rio" "Usuário"

# Grava novamente como UTF-8 sem BOM
[System.IO.File]::WriteAllText(
    $path,
    $s,
    $utf8
)

Write-Host "CORRECAO FINALIZADA."