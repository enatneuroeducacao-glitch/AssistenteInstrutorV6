$p = "src\main.jsx"

$utf8 = New-Object System.Text.UTF8Encoding($false)
$s = [System.IO.File]::ReadAllText($p, $utf8)

if ($s.Contains("async function saveFinanceAccount")) {
    Write-Host "saveFinanceAccount JA EXISTE."
    exit
}

$marker = 'if (tab === "financeiro") {'

$start = $s.IndexOf($marker)

if ($start -lt 0) {
    throw "BLOCO FINANCEIRO NAO ENCONTRADO."
}

$returnPos = $s.IndexOf("  return (", $start)

if ($returnPos -lt 0) {
    throw "RETURN DO FINANCEIRO NAO ENCONTRADO."
}

$functions = @'
  async function saveFinanceAccount(event) {
    event.preventDefault();

    if (!supabase || !user?.id) {
      alert("Usuário não autenticado.");
      return;
    }

    if (!financeAccountForm.bank_name.trim()) {
      alert("Informe o banco.");
      return;
    }

    if (!financeAccountForm.account_name.trim()) {
      alert("Informe o nome da conta.");
      return;
    }

    const initialBalance =
      Number(
        String(financeAccountForm.initial_balance || "")
          .replace(",", ".")
      ) || 0;

    const payload = {
      user_id: user.id,
      bank_name: financeAccountForm.bank_name.trim(),
      account_name: financeAccountForm.account_name.trim(),
      account_type: financeAccountForm.account_type,
      agency: financeAccountForm.agency.trim() || null,
      account_number:
        financeAccountForm.account_number.trim() || null,
      initial_balance: initialBalance,
      status: financeAccountForm.status
    };

    const { data, error } = await supabase
      .from("ai_finance_accounts")
      .insert(payload)
      .select("*")
      .single();

    if (error) {
      console.error("Erro ao salvar conta:", error);
      alert("Erro ao salvar conta: " + error.message);
      return;
    }

    setFinanceAccounts(prev => [...prev, data]);

    setFinanceAccountForm({
      bank_name: "",
      account_name: "",
      account_type: "CORRENTE",
      agency: "",
      account_number: "",
      initial_balance: "",
      status: "ATIVA"
    });

    setShowFinanceAccounts(false);
  }

  async function deleteFinanceAccount(id) {
    if (!supabase || !user?.id || !id) return;

    const confirmed = window.confirm(
      "Deseja realmente excluir esta conta?"
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("ai_finance_accounts")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Erro ao excluir conta:", error);
      alert(
        "Não foi possível excluir a conta. " +
        "Ela pode possuir lançamentos financeiros vinculados."
      );
      return;
    }

    setFinanceAccounts(prev =>
      prev.filter(account => account.id !== id)
    );
  }

'@

$s =
    $s.Substring(0, $returnPos) +
    $functions +
    $s.Substring($returnPos)

[System.IO.File]::WriteAllText($p, $s, $utf8)

Write-Host "FUNCOES DE CONTAS BANCARIAS INSERIDAS."