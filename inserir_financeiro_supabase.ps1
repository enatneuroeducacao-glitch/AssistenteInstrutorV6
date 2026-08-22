$p = "src\main.jsx"

$lines = [System.Collections.Generic.List[string]](Get-Content $p)

$marker = '  const [financeEntries, setFinanceEntries] = useState([]);'

$idx = $lines.IndexOf($marker)

if ($idx -lt 0) {
    throw "MARCADOR financeEntries NAO ENCONTRADO."
}

if ($lines -match 'loadFinanceEntries') {
    Write-Host "A LOGICA FINANCEIRA JA EXISTE. NENHUMA ALTERACAO."
    exit
}

$block = @'
  useEffect(() => {
    let active = true;

    async function loadFinanceEntries() {
      if (!supabase || !user?.id) return;

      const { data, error } = await supabase
        .from("ai_finance")
        .select("id, student_id, lesson_id, entry_date, type, category, description, amount, payment_method, status, created_at")
        .eq("user_id", user.id)
        .order("entry_date", { ascending: false });

      if (!active) return;

      if (error) {
        console.error("Erro ao carregar financeiro:", error);
        setFinanceEntries([]);
        return;
      }

      setFinanceEntries(data || []);
    }

    loadFinanceEntries();

    return () => {
      active = false;
    };
  }, [user?.id]);

'@

$blockLines = $block -split "`r?`n"

for ($i = $blockLines.Count - 1; $i -ge 0; $i--) {
    if ($blockLines[$i] -ne "") {
        $lines.Insert($idx + 1, $blockLines[$i])
    }
}

Set-Content $p $lines -Encoding UTF8

Write-Host "LEITURA DO AI_FINANCE INSERIDA COM SUCESSO."