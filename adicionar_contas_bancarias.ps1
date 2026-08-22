$p = "src\main.jsx"

$utf8 = New-Object System.Text.UTF8Encoding($false)
$s = [System.IO.File]::ReadAllText($p, $utf8)

# ------------------------------------------------------------
# 1. Adicionar estados das contas bancárias
# ------------------------------------------------------------

$marker = '  const [financeEntries, setFinanceEntries] = useState([]);'

if ($s.IndexOf($marker) -lt 0) {
    throw "MARCADOR financeEntries NAO ENCONTRADO."
}

if ($s.IndexOf('financeAccounts') -lt 0) {

    $insert = @'
  const [financeAccounts, setFinanceAccounts] = useState([]);
  const [showFinanceAccounts, setShowFinanceAccounts] = useState(false);
  const [financeAccountForm, setFinanceAccountForm] = useState({
    bank_name: "",
    account_name: "",
    account_type: "CORRENTE",
    agency: "",
    account_number: "",
    initial_balance: "",
    status: "ATIVA"
  });
'@

    $s = $s.Replace(
        $marker,
        $marker + [Environment]::NewLine + $insert.TrimEnd()
    )

    Write-Host "ESTADOS DAS CONTAS INSERIDOS."
}
else {
    Write-Host "ESTADOS DAS CONTAS JA EXISTEM."
}

# ------------------------------------------------------------
# 2. Carregar contas do Supabase
# ------------------------------------------------------------

$loadMarker = '  useEffect(() => {'

$loadCode = @'
  useEffect(() => {
    let active = true;

    async function loadFinanceAccounts() {
      if (!supabase || !user?.id) return;

      const { data, error } = await supabase
        .from("ai_finance_accounts")
        .select("id, user_id, bank_name, account_name, account_type, agency, account_number, initial_balance, status, created_at")
        .eq("user_id", user.id)
        .order("account_name", { ascending: true });

      if (!active) return;

      if (error) {
        console.error("Erro ao carregar contas bancárias:", error);
        setFinanceAccounts([]);
        return;
      }

      setFinanceAccounts(data || []);
    }

    loadFinanceAccounts();

    return () => {
      active = false;
    };
  }, [user?.id]);

'@

# Inserir antes do primeiro useEffect que já existe
if ($s.IndexOf('loadFinanceAccounts') -lt 0) {
    $pos = $s.IndexOf($loadMarker)

    if ($pos -lt 0) {
        throw "PRIMEIRO useEffect NAO ENCONTRADO."
    }

    $s = $s.Substring(0, $pos) +
         $loadCode +
         $s.Substring($pos)

    Write-Host "CARREGAMENTO DAS CONTAS INSERIDO."
}
else {
    Write-Host "CARREGAMENTO DAS CONTAS JA EXISTE."
}

# ------------------------------------------------------------
# 3. Localizar o bloco financeiro
# ------------------------------------------------------------

$startMarker = 'if (tab === "financeiro") {'
$endMarker = 'if (tab === "agenda") {'

$start = $s.IndexOf($startMarker)

if ($start -lt 0) {
    throw "BLOCO FINANCEIRO NAO ENCONTRADO."
}

$end = $s.IndexOf($endMarker, $start)

if ($end -lt 0) {
    throw "BLOCO AGENDA NAO ENCONTRADO."
}

$financeBlock = $s.Substring($start, $end - $start)

# ------------------------------------------------------------
# 4. Adicionar função de salvar conta
# ------------------------------------------------------------

if ($financeBlock.IndexOf('saveFinanceAccount') -lt 0) {

$functionCode = @'

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

    const initialBalance = Number(
      String(financeAccountForm.initial_balance || "")
        .replace(/\./g, "")
        .replace(",", ".")
    ) || 0;

    const payload = {
      user_id: user.id,
      bank_name: financeAccountForm.bank_name.trim(),
      account_name: financeAccountForm.account_name.trim(),
      account_type: financeAccountForm.account_type,
      agency: financeAccountForm.agency.trim() || null,
      account_number: financeAccountForm.account_number.trim() || null,
      initial_balance: initialBalance,
      status: financeAccountForm.status
    };

    const { data, error } = await supabase
      .from("ai_finance_accounts")
      .insert(payload)
      .select("id, user_id, bank_name, account_name, account_type, agency, account_number, initial_balance, status, created_at")
      .single();

    if (error) {
      console.error("Erro ao salvar conta:", error);
      alert("Não foi possível salvar a conta: " + error.message);
      return;
    }

    setFinanceAccounts(prev =>
      [...prev, data].sort((a, b) =>
        String(a.account_name).localeCompare(
          String(b.account_name),
          "pt-BR"
        )
      )
    );

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
    if (!supabase || !id) return;

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
        "Verifique se existem lançamentos vinculados a ela."
      );
      return;
    }

    setFinanceAccounts(prev =>
      prev.filter(account => account.id !== id)
    );
  }

'@

    $financeBlock = $financeBlock.Replace(
        '  return (',
        $functionCode + '  return (',
        1
    )

    Write-Host "FUNCOES DE CONTAS INSERIDAS."
}

# ------------------------------------------------------------
# 5. Inserir painel de contas bancárias
# ------------------------------------------------------------

if ($financeBlock.IndexOf('CONTAS BANCARIAS') -lt 0) {

$accountsPanel = @'

      <div className="panel">

        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
          flexWrap: "wrap"
        }}>

          <div>
            <h2>Contas bancárias</h2>
            <p>
              Cadastre as contas utilizadas pelo instrutor
              para controlar entradas e saídas financeiras.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setShowFinanceAccounts(!showFinanceAccounts)
            }
          >
            {showFinanceAccounts
              ? "FECHAR"
              : "+ CADASTRAR CONTA"}
          </button>

        </div>

        {showFinanceAccounts && (
          <form
            onSubmit={saveFinanceAccount}
            style={{
              marginTop: "20px",
              display: "grid",
              gap: "14px"
            }}
          >

            <div className="grid">

              <label>
                Banco
                <input
                  type="text"
                  value={financeAccountForm.bank_name}
                  onChange={(e) =>
                    setFinanceAccountForm({
                      ...financeAccountForm,
                      bank_name: e.target.value
                    })
                  }
                  placeholder="Ex.: Banco do Brasil"
                  required
                />
              </label>

              <label>
                Nome da conta
                <input
                  type="text"
                  value={financeAccountForm.account_name}
                  onChange={(e) =>
                    setFinanceAccountForm({
                      ...financeAccountForm,
                      account_name: e.target.value
                    })
                  }
                  placeholder="Ex.: Conta principal"
                  required
                />
              </label>

              <label>
                Tipo
                <select
                  value={financeAccountForm.account_type}
                  onChange={(e) =>
                    setFinanceAccountForm({
                      ...financeAccountForm,
                      account_type: e.target.value
                    })
                  }
                >
                  <option value="CORRENTE">
                    Conta corrente
                  </option>

                  <option value="POUPANCA">
                    Conta poupança
                  </option>

                  <option value="DIGITAL">
                    Conta digital
                  </option>

                  <option value="DINHEIRO">
                    Carteira / dinheiro
                  </option>
                </select>
              </label>

            </div>

            <div className="grid">

              <label>
                Agência
                <input
                  type="text"
                  value={financeAccountForm.agency}
                  onChange={(e) =>
                    setFinanceAccountForm({
                      ...financeAccountForm,
                      agency: e.target.value
                    })
                  }
                />
              </label>

              <label>
                Número da conta
                <input
                  type="text"
                  value={financeAccountForm.account_number}
                  onChange={(e) =>
                    setFinanceAccountForm({
                      ...financeAccountForm,
                      account_number: e.target.value
                    })
                  }
                />
              </label>

              <label>
                Saldo inicial
                <input
                  type="number"
                  step="0.01"
                  value={financeAccountForm.initial_balance}
                  onChange={(e) =>
                    setFinanceAccountForm({
                      ...financeAccountForm,
                      initial_balance: e.target.value
                    })
                  }
                  placeholder="0,00"
                />
              </label>

            </div>

            <label>
              Status
              <select
                value={financeAccountForm.status}
                onChange={(e) =>
                  setFinanceAccountForm({
                    ...financeAccountForm,
                    status: e.target.value
                  })
                }
              >
                <option value="ATIVA">Ativa</option>
                <option value="INATIVA">Inativa</option>
              </select>
            </label>

            <div style={{
              display: "flex",
              gap: "10px",
              flexWrap: "wrap"
            }}>

              <button type="submit">
                SALVAR CONTA
              </button>

              <button
                type="button"
                className="link"
                onClick={() => setShowFinanceAccounts(false)}
              >
                CANCELAR
              </button>

            </div>

          </form>
        )}

        <div style={{
          marginTop: "20px",
          display: "grid",
          gap: "10px"
        }}>

          {financeAccounts.length === 0 ? (

            <p>
              Nenhuma conta bancária cadastrada.
            </p>

          ) : (

            financeAccounts.map(account => (

              <div
                key={account.id}
                className="panel"
                style={{
                  margin: 0,
                  padding: "14px"
                }}
              >

                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "12px",
                  flexWrap: "wrap"
                }}>

                  <div>

                    <strong>
                      {account.bank_name}
                    </strong>

                    <div>
                      {account.account_name}
                    </div>

                    <small>
                      {account.account_type}
                      {account.agency
                        ? ` • Agência ${account.agency}`
                        : ""}
                      {account.account_number
                        ? ` • Conta ${account.account_number}`
                        : ""}
                    </small>

                  </div>

                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px"
                  }}>

                    <strong>
                      {formatCurrency(account.initial_balance)}
                    </strong>

                    <button
                      type="button"
                      className="link"
                      onClick={() =>
                        deleteFinanceAccount(account.id)
                      }
                    >
                      EXCLUIR
                    </button>

                  </div>

                </div>

              </div>

            ))

          )}

        </div>

      </div>

'@

    # Inserir antes de "Custos operacionais"
    $accountsPos = $financeBlock.IndexOf(
        '      <div className="panel">' +
        [Environment]::NewLine +
        '        <h2>Custos operacionais</h2>'
    )

    if ($accountsPos -lt 0) {
        throw "PAINEL CUSTOS OPERACIONAIS NAO ENCONTRADO."
    }

    $financeBlock =
        $financeBlock.Substring(0, $accountsPos) +
        $accountsPanel +
        $financeBlock.Substring($accountsPos)

    Write-Host "PAINEL CONTAS BANCARIAS INSERIDO."
}

# ------------------------------------------------------------
# 6. Gravar bloco financeiro
# ------------------------------------------------------------

$s =
    $s.Substring(0, $start) +
    $financeBlock +
    $s.Substring($end)

[System.IO.File]::WriteAllText($p, $s, $utf8)

Write-Host "CONTAS BANCARIAS INTEGRADAS AO FINANCEIRO."