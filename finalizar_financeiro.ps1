$p = "src\main.jsx"

$utf8 = New-Object System.Text.UTF8Encoding($false)
$s = [System.IO.File]::ReadAllText($p, $utf8)

$startMarker = 'if (tab === "financeiro") {'
$endMarker = 'if (tab === "agenda") {'

$start = $s.IndexOf($startMarker)
if ($start -lt 0) {
    throw "BLOCO FINANCEIRO NAO ENCONTRADO."
}

$end = $s.IndexOf($endMarker, $start)
if ($end -lt 0) {
    throw "INICIO DA AGENDA NAO ENCONTRADO."
}

$newBlock = @'
if (tab === "financeiro") {

  const financeRevenue = financeEntries
    .filter(entry => String(entry.type || "").toUpperCase() === "RECEITA")
    .reduce((total, entry) => total + Number(entry.amount || 0), 0);

  const financeExpenses = financeEntries
    .filter(entry => String(entry.type || "").toUpperCase() === "DESPESA")
    .reduce((total, entry) => total + Number(entry.amount || 0), 0);

  const financeResult = financeRevenue - financeExpenses;

  const formatCurrency = (value) =>
    Number(value || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });

  async function saveFinanceEntry(event) {
    event.preventDefault();

    if (!supabase || !user?.id) {
      alert("Usuário não autenticado.");
      return;
    }

    const amount = Number(
      String(financeForm.amount || "")
        .replace(/\./g, "")
        .replace(",", ".")
    );

    if (!financeForm.entry_date) {
      alert("Informe a data.");
      return;
    }

    if (!financeForm.category.trim()) {
      alert("Informe a categoria.");
      return;
    }

    if (!amount || amount <= 0) {
      alert("Informe um valor válido.");
      return;
    }

    const payload = {
      user_id: user.id,
      entry_date: financeForm.entry_date,
      type: financeForm.type,
      category: financeForm.category.trim(),
      description: financeForm.description.trim() || null,
      amount,
      payment_method: financeForm.payment_method || null,
      status: financeForm.status
    };

    const { data, error } = await supabase
      .from("ai_finance")
      .insert(payload)
      .select("id, user_id, student_id, lesson_id, entry_date, type, category, description, amount, payment_method, status, created_at")
      .single();

    if (error) {
      console.error("Erro ao salvar lançamento financeiro:", error);
      alert("Não foi possível salvar o lançamento: " + error.message);
      return;
    }

    setFinanceEntries(prev => [data, ...prev]);

    setFinanceForm({
      type: "RECEITA",
      entry_date: new Date().toISOString().slice(0, 10),
      category: "",
      description: "",
      amount: "",
      payment_method: "",
      status: "PAGO"
    });

    setShowFinanceForm(false);
  }

  async function deleteFinanceEntry(id) {
    if (!supabase || !id) return;

    const confirmed = window.confirm(
      "Deseja realmente excluir este lançamento?"
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("ai_finance")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Erro ao excluir lançamento:", error);
      alert("Não foi possível excluir o lançamento: " + error.message);
      return;
    }

    setFinanceEntries(prev =>
      prev.filter(entry => entry.id !== id)
    );
  }

  return (
    <>
      <h1>Financeiro</h1>

      <div className="panel">
        <h2>Gest&atilde;o financeira do instrutor</h2>

        <p>
          Centralize receitas, despesas, custos operacionais e
          resultado financeiro em um &uacute;nico m&oacute;dulo.
        </p>

        <div className="grid">

          <div className="metric">
            <div style={{ fontSize: "12px", opacity: 0.7 }}>
              RECEITAS
            </div>
            {formatCurrency(financeRevenue)}
          </div>

          <div className="metric">
            <div style={{ fontSize: "12px", opacity: 0.7 }}>
              DESPESAS
            </div>
            {formatCurrency(financeExpenses)}
          </div>

          <div className="metric">
            <div style={{ fontSize: "12px", opacity: 0.7 }}>
              RESULTADO
            </div>
            {formatCurrency(financeResult)}
          </div>

        </div>
      </div>

      <div className="panel">

        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
          flexWrap: "wrap"
        }}>
          <div>
            <h2>Lan&ccedil;amentos financeiros</h2>
            <p>
              Registre receitas e despesas do instrutor.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowFinanceForm(!showFinanceForm)}
          >
            {showFinanceForm
              ? "FECHAR"
              : "+ NOVO LAN&Ccedil;AMENTO"}
          </button>
        </div>

        {showFinanceForm && (
          <form
            onSubmit={saveFinanceEntry}
            style={{
              marginTop: "20px",
              display: "grid",
              gap: "14px"
            }}
          >

            <div className="grid">

              <label>
                Tipo
                <select
                  value={financeForm.type}
                  onChange={(e) =>
                    setFinanceForm({
                      ...financeForm,
                      type: e.target.value
                    })
                  }
                >
                  <option value="RECEITA">Receita</option>
                  <option value="DESPESA">Despesa</option>
                </select>
              </label>

              <label>
                Data
                <input
                  type="date"
                  value={financeForm.entry_date}
                  onChange={(e) =>
                    setFinanceForm({
                      ...financeForm,
                      entry_date: e.target.value
                    })
                  }
                  required
                />
              </label>

              <label>
                Categoria
                <select
                  value={financeForm.category}
                  onChange={(e) =>
                    setFinanceForm({
                      ...financeForm,
                      category: e.target.value
                    })
                  }
                  required
                >
                  <option value="">Selecione</option>
                  <option value="Aula">Aula</option>
                  <option value="Combustível">Combust&iacute;vel</option>
                  <option value="Manutenção">Manuten&ccedil;&atilde;o</option>
                  <option value="Seguro">Seguro</option>
                  <option value="Impostos">Impostos</option>
                  <option value="Licenciamento">Licenciamento</option>
                  <option value="IPVA">IPVA</option>
                  <option value="Financiamento">Financiamento</option>
                  <option value="Aluguel">Aluguel</option>
                  <option value="Material">Material</option>
                  <option value="Outros">Outros</option>
                </select>
              </label>

              <label>
                Valor
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="0,00"
                  value={financeForm.amount}
                  onChange={(e) =>
                    setFinanceForm({
                      ...financeForm,
                      amount: e.target.value
                    })
                  }
                  required
                />
              </label>

            </div>

            <label>
              Descri&ccedil;&atilde;o
              <input
                type="text"
                placeholder="Descreva o lançamento"
                value={financeForm.description}
                onChange={(e) =>
                  setFinanceForm({
                    ...financeForm,
                    description: e.target.value
                  })
                }
              />
            </label>

            <div className="grid">

              <label>
                Forma de pagamento
                <select
                  value={financeForm.payment_method}
                  onChange={(e) =>
                    setFinanceForm({
                      ...financeForm,
                      payment_method: e.target.value
                    })
                  }
                >
                  <option value="">Selecione</option>
                  <option value="PIX">PIX</option>
                  <option value="Dinheiro">Dinheiro</option>
                  <option value="Cartão">Cart&atilde;o</option>
                  <option value="Transferência">Transfer&ecirc;ncia</option>
                  <option value="Boleto">Boleto</option>
                  <option value="Outro">Outro</option>
                </select>
              </label>

              <label>
                Status
                <select
                  value={financeForm.status}
                  onChange={(e) =>
                    setFinanceForm({
                      ...financeForm,
                      status: e.target.value
                    })
                  }
                >
                  <option value="PAGO">Pago</option>
                  <option value="PENDENTE">Pendente</option>
                </select>
              </label>

            </div>

            <div style={{
              display: "flex",
              gap: "10px",
              flexWrap: "wrap"
            }}>
              <button type="submit">
                SALVAR LAN&Ccedil;AMENTO
              </button>

              <button
                type="button"
                className="link"
                onClick={() => setShowFinanceForm(false)}
              >
                CANCELAR
              </button>
            </div>

          </form>
        )}

      </div>

      <div className="panel">
        <h2>&Uacute;ltimos lan&ccedil;amentos</h2>

        {financeEntries.length === 0 ? (
          <p>
            Nenhum lan&ccedil;amento financeiro registrado.
          </p>
        ) : (
          <div style={{
            display: "grid",
            gap: "10px"
          }}>

            {financeEntries.map(entry => (
              <div
                key={entry.id}
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
                      {entry.type === "RECEITA"
                        ? "RECEITA"
                        : "DESPESA"}
                    </strong>

                    <div>
                      {entry.category}
                    </div>

                    {entry.description && (
                      <small>{entry.description}</small>
                    )}

                    <div style={{
                      fontSize: "12px",
                      opacity: 0.7,
                      marginTop: "4px"
                    }}>
                      {entry.entry_date}
                      {" • "}
                      {entry.status}
                      {entry.payment_method
                        ? ` • ${entry.payment_method}`
                        : ""}
                    </div>
                  </div>

                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px"
                  }}>

                    <strong>
                      {formatCurrency(entry.amount)}
                    </strong>

                    <button
                      type="button"
                      className="link"
                      onClick={() =>
                        deleteFinanceEntry(entry.id)
                      }
                    >
                      EXCLUIR
                    </button>

                  </div>

                </div>

              </div>
            ))}

          </div>
        )}

      </div>

      <div className="panel">
        <h2>Custos operacionais</h2>

        <p>
          Os custos do ve&iacute;culo fazem parte do controle financeiro
          do instrutor.
        </p>

        <div style={{
          display: "flex",
          gap: "10px",
          flexWrap: "wrap"
        }}>

          <button
            type="button"
            onClick={() => setShowVehicleForm(true)}
          >
            VE&Iacute;CULO E CUSTOS
          </button>

        </div>
      </div>

      <div className="panel">
        <h2>Indicadores financeiros</h2>

        <div className="grid">

          <div className="metric">
            <div style={{ fontSize: "12px", opacity: 0.7 }}>
              CUSTO POR KM
            </div>
            —
          </div>

          <div className="metric">
            <div style={{ fontSize: "12px", opacity: 0.7 }}>
              CUSTO POR AULA
            </div>
            —
          </div>

          <div className="metric">
            <div style={{ fontSize: "12px", opacity: 0.7 }}>
              MARGEM
            </div>
            —
          </div>

        </div>
      </div>
    </>
  );
}

'@

$s = $s.Substring(0, $start) + $newBlock + $s.Substring($end)

[System.IO.File]::WriteAllText($p, $s, $utf8)

Write-Host "FINANCEIRO FUNCIONAL INSERIDO."