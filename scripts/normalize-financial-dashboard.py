from pathlib import Path

p = Path("src/main.jsx")
s = p.read_text(encoding="utf-8")

# The browser dashboard and the Financeiro page must use the same financial
# definitions. Vehicle annual costs are treated as a monthly provision, while
# realized financial movements come only from paid/settled ai_finance entries.
# Actual maintenance is reported for reconciliation but is not silently added
# to the monthly provision, preventing double counting.
if "function getFinancialSnapshot(" not in s:
    marker = "function Dashboard({ user, onLogout }) {"
    if marker not in s:
        raise SystemExit("Dashboard marker not found; financial normalization stopped safely.")

    helper = r'''
function getFinancialSnapshot({ financeEntries = [], vehicles = [], maintenance = [] } = {}) {
  const paidStatuses = new Set(["PAGO", "REALIZADO", "CONFIRMADO", "LIQUIDADO"]);
  const pendingStatuses = new Set(["PENDENTE", "ABERTO", "AGENDADO"]);
  const cancelledStatuses = new Set(["CANCELADO", "CANCELADA", "CANCELLED", "CANCELED"]);

  const activeEntries = financeEntries.filter((entry) => {
    const status = String(entry?.status || "").toUpperCase();
    return !cancelledStatuses.has(status);
  });

  const revenuePaid = activeEntries
    .filter((entry) => String(entry?.type || "").toUpperCase() === "RECEITA" && paidStatuses.has(String(entry?.status || "PAGO").toUpperCase()))
    .reduce((sum, entry) => sum + Number(entry?.amount || 0), 0);

  const expensePaid = activeEntries
    .filter((entry) => String(entry?.type || "").toUpperCase() === "DESPESA" && paidStatuses.has(String(entry?.status || "PAGO").toUpperCase()))
    .reduce((sum, entry) => sum + Number(entry?.amount || 0), 0);

  const revenuePending = activeEntries
    .filter((entry) => String(entry?.type || "").toUpperCase() === "RECEITA" && pendingStatuses.has(String(entry?.status || "").toUpperCase()))
    .reduce((sum, entry) => sum + Number(entry?.amount || 0), 0);

  const expensePending = activeEntries
    .filter((entry) => String(entry?.type || "").toUpperCase() === "DESPESA" && pendingStatuses.has(String(entry?.status || "").toUpperCase()))
    .reduce((sum, entry) => sum + Number(entry?.amount || 0), 0);

  const vehicleAnnualProvision = vehicles.reduce(
    (sum, vehicle) => sum + Number(vehicle?.insurance_annual || 0) + Number(vehicle?.taxes_annual || 0) + Number(vehicle?.other_annual || 0),
    0
  );
  const vehicleMonthlyProvision = vehicleAnnualProvision / 12;

  const now = new Date();
  const maintenanceActualCurrentMonth = maintenance
    .filter((item) => {
      if (!item?.performed_at) return false;
      const date = new Date(item.performed_at);
      return Number.isFinite(date.getTime()) && date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
    })
    .filter((item) => !cancelledStatuses.has(String(item?.status || "").toUpperCase()))
    .reduce((sum, item) => sum + Number(item?.actual_cost || 0), 0);

  const financialResult = revenuePaid - expensePaid;
  const operationalResult = financialResult - vehicleMonthlyProvision;
  const operationalMargin = revenuePaid > 0 ? (operationalResult / revenuePaid) * 100 : null;

  return {
    revenuePaid,
    expensePaid,
    revenuePending,
    expensePending,
    vehicleAnnualProvision,
    vehicleMonthlyProvision,
    maintenanceActualCurrentMonth,
    financialResult,
    operationalResult,
    operationalMargin,
    financeEntries: activeEntries.length,
    reconciliationRequired: maintenanceActualCurrentMonth > 0,
  };
}

'''
    s = s.replace(marker, helper + marker, 1)

# Load performed_at so the reconciliation layer can distinguish current-month
# maintenance from historical maintenance.
s = s.replace(
    'supabase.from("ai_maintenance").select("id, actual_cost, status").eq("user_id", user.id)',
    'supabase.from("ai_maintenance").select("id, actual_cost, status, performed_at").eq("user_id", user.id)',
    1,
)

# Replace the dashboard's old mixed-period financial formula with the common
# snapshot. This removes the old behavior that added all historical maintenance
# directly to a monthly figure.
old_dashboard_start = '''      const revenue = financeEntries
        .filter(entry => String(entry.type || "").toUpperCase() === "RECEITA")
        .reduce((sum, entry) => sum + Number(entry.amount || 0), 0);'''
old_dashboard_end = '''      const go = key => setTab(key);'''
start = s.find(old_dashboard_start)
end = s.find(old_dashboard_end, start)
if start < 0 or end < 0:
    raise SystemExit("Dashboard financial calculation block not found; stopped safely.")
end += len(old_dashboard_end)
new_dashboard = '''      const financial = getFinancialSnapshot({
        financeEntries,
        vehicles: dashboardVehicles,
        maintenance: dashboardMaintenance,
      });
      const revenue = financial.revenuePaid;
      const expenses = financial.expensePaid;
      const operationalCosts = financial.vehicleMonthlyProvision;
      const balance = financial.operationalResult;
      const go = key => setTab(key);'''
s = s[:start] + new_dashboard + s[end:]

# Make the dashboard labels explicit about what each number means.
s = s.replace(
    '<div className="stat-item"><span className="stat-icon stat-blue"><WalletCards size={22}/></span><div><small>Despesas lançadas</small><strong>{formatCurrency(expenses)}</strong></div></div>',
    '<div className="stat-item"><span className="stat-icon stat-blue"><WalletCards size={22}/></span><div><small>Despesas realizadas</small><strong>{formatCurrency(expenses)}</strong></div></div>',
    1,
)
s = s.replace(
    '<div className="stat-item"><span className="stat-icon stat-orange"><CarFront size={22}/></span><div><small>Custos operacionais / mês</small><strong>{formatCurrency(operationalCosts)}</strong></div></div>',
    '<div className="stat-item"><span className="stat-icon stat-orange"><CarFront size={22}/></span><div><small>Provisão operacional / mês</small><strong>{formatCurrency(operationalCosts)}</strong></div></div>',
    1,
)
s = s.replace(
    '<button className="balance-panel" onClick={() => go("financeiro")}><div><small>Saldo operacional</small><strong>{formatCurrency(balance)}</strong><span>Receitas − Despesas − Custos</span></div><span>ⓘ</span></button>',
    '<button className="balance-panel" onClick={() => go("financeiro")}><div><small>Resultado operacional</small><strong>{formatCurrency(balance)}</strong><span>Receitas realizadas − Despesas realizadas − Provisão operacional</span></div><span>ⓘ</span></button>',
    1,
)

# Replace the Financeiro page's independent calculation with the same snapshot.
old_finance = '''  const financeRevenue = financeEntries
    .filter(entry => String(entry.type || "").toUpperCase() === "RECEITA")
    .reduce((total, entry) => total + Number(entry.amount || 0), 0);

  const financeExpenses = financeEntries
    .filter(entry => String(entry.type || "").toUpperCase() === "DESPESA")
    .reduce((total, entry) => total + Number(entry.amount || 0), 0);

  const financeResult = financeRevenue - financeExpenses;'''
new_finance = '''  const financial = getFinancialSnapshot({
    financeEntries,
    vehicles: dashboardVehicles,
    maintenance: dashboardMaintenance,
  });
  const financeRevenue = financial.revenuePaid;
  const financeExpenses = financial.expensePaid;
  const financeResult = financial.operationalResult;'''
if old_finance not in s:
    raise SystemExit("Financeiro calculation block not found; stopped safely.")
s = s.replace(old_finance, new_finance, 1)

s = s.replace(
    '<div style={{ fontSize: "12px", opacity: 0.7 }}>\n              RESULTADO\n            </div>\n            {formatCurrency(financeResult)}',
    '<div style={{ fontSize: "12px", opacity: 0.7 }}>\n              RESULTADO OPERACIONAL\n            </div>\n            {formatCurrency(financeResult)}',
    1,
)

# Add an explicit reconciliation panel to the Financeiro page. It explains why
# a vehicle cost may exist without a corresponding financial entry and prevents
# users from mistaking a provision for a cash expense.
marker_reconciliation = '''      <div className="panel">\n        <h2>Indicadores financeiros</h2>'''
if marker_reconciliation not in s:
    raise SystemExit("Finance indicators marker not found; stopped safely.")

reconciliation_panel = '''      <div className="panel" style={{ background: "#f7faff", border: "1px solid #d8e4f4" }}>
        <h2>Conciliação financeira</h2>
        <p style={{ lineHeight: 1.6 }}>
          O NeuroDrive agora separa movimento financeiro realizado de provisão operacional. Isso evita que custos históricos ou estimados sejam somados ao mês atual sem correspondência.
        </p>
        <div className="grid">
          <div className="metric"><div style={{ fontSize: "12px", opacity: 0.7 }}>RECEITAS REALIZADAS</div>{formatCurrency(financial.revenuePaid)}</div>
          <div className="metric"><div style={{ fontSize: "12px", opacity: 0.7 }}>DESPESAS REALIZADAS</div>{formatCurrency(financial.expensePaid)}</div>
          <div className="metric"><div style={{ fontSize: "12px", opacity: 0.7 }}>PROVISÃO VEÍCULO / MÊS</div>{formatCurrency(financial.vehicleMonthlyProvision)}</div>
          <div className="metric"><div style={{ fontSize: "12px", opacity: 0.7 }}>A PAGAR / RECEBER</div>{formatCurrency(financial.revenuePending - financial.expensePending)}</div>
        </div>
        {financial.reconciliationRequired && (
          <div style={{ marginTop: "12px", padding: "12px", borderRadius: "10px", background: "#fff8e8", border: "1px solid #f0cf82", lineHeight: 1.5 }}>
            <strong>Conciliação necessária:</strong> existem manutenções realizadas neste mês. Elas não são adicionadas automaticamente ao resultado operacional para evitar dupla contagem; registre a despesa correspondente no Financeiro quando efetivamente paga.
            <div style={{ marginTop: "5px" }}>Manutenção realizada no mês: <b>{formatCurrency(financial.maintenanceActualCurrentMonth)}</b></div>
          </div>
        )}
        {!financial.reconciliationRequired && (
          <div style={{ marginTop: "12px", padding: "12px", borderRadius: "10px", background: "#eefaf1", border: "1px solid #b8dfc1", lineHeight: 1.5 }}>
            <strong>Base conciliada.</strong> Não há manutenção realizada no mês pendente de conciliação nesta camada.
          </div>
        )}
      </div>

'''
s = s.replace(marker_reconciliation, reconciliation_panel + marker_reconciliation, 1)

p.write_text(s, encoding="utf-8")
