from pathlib import Path

p = Path("src/main.jsx")
s = p.read_text(encoding="utf-8")

# Shared financial definitions used by Dashboard and Financeiro.
helper = r'''
function getFinancialSnapshot({ financeEntries = [], vehicles = [], maintenance = [] } = {}) {
  const paidStatuses = new Set(["PAGO", "REALIZADO", "CONFIRMADO", "LIQUIDADO"]);
  const pendingStatuses = new Set(["PENDENTE", "ABERTO", "AGENDADO"]);
  const cancelledStatuses = new Set(["CANCELADO", "CANCELADA", "CANCELLED", "CANCELED"]);

  const activeEntries = Array.isArray(financeEntries) ? financeEntries.filter((entry) => {
    const status = String(entry?.status || "").toUpperCase();
    return !cancelledStatuses.has(status);
  }) : [];

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

  const safeVehicles = Array.isArray(vehicles) ? vehicles : [];
  const vehicleAnnualProvision = safeVehicles.reduce(
    (sum, vehicle) => sum + Number(vehicle?.insurance_annual || 0) + Number(vehicle?.taxes_annual || 0) + Number(vehicle?.other_annual || 0),
    0
  );
  const vehicleMonthlyProvision = vehicleAnnualProvision / 12;

  const now = new Date();
  const safeMaintenance = Array.isArray(maintenance) ? maintenance : [];
  const maintenanceActualCurrentMonth = safeMaintenance
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

if "function getFinancialSnapshot(" not in s:
    marker = "function Dashboard({ user, onLogout }) {"
    if marker not in s:
        raise SystemExit("Dashboard marker not found; financial normalization stopped safely.")
    s = s.replace(marker, helper + marker, 1)

# Include performed_at for current-month maintenance reconciliation.
s = s.replace(
    'supabase.from("ai_maintenance").select("id, actual_cost, status").eq("user_id", user.id)',
    'supabase.from("ai_maintenance").select("id, actual_cost, status, performed_at").eq("user_id", user.id)',
    1,
)

# Replace only the financial portion of Dashboard while preserving every other
# metric required by the JSX render: exams, quality, HSI and currency formatter.
old_dashboard = '''      const revenue = financeEntries
        .filter(entry => String(entry.type || "").toUpperCase() === "RECEITA")
        .reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
      const expenses = financeEntries
        .filter(entry => String(entry.type || "").toUpperCase() === "DESPESA")
        .reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
      const scheduled = agendaLessons.filter(lesson => String(lesson.status || "").toLowerCase() === "scheduled").length;
      const completed = agendaLessons.filter(lesson => ["completed","concluida","concluído"].includes(String(lesson.status || "").toLowerCase())).length;
      const scheduledExams = agendaLessons.filter(lesson => lesson.exam_scheduled_at && String(lesson.exam_status || "").toUpperCase() === "AGENDADA").length;
      const totalLessons = dashboardRpaReports.reduce((sum, r) => sum + Number(r.total_lessons || 0), 0);
      const quality = dashboardRpaReports.map(r => Number(r.latest_quality_score)).filter(Number.isFinite);
      const hsi = dashboardRpaReports.map(r => Number(r.latest_hsi_score)).filter(Number.isFinite);
      const qualityAverage = quality.length ? quality.reduce((a,b)=>a+b,0)/quality.length : null;
      const hsiAverage = hsi.length ? hsi.reduce((a,b)=>a+b,0)/hsi.length : null;
      const formatCurrency = value => Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
      const annualVehicleCosts = dashboardVehicles.reduce((sum, vehicle) => sum + Number(vehicle.insurance_annual || 0) + Number(vehicle.taxes_annual || 0) + Number(vehicle.other_annual || 0), 0);
      const monthlyVehicleCosts = annualVehicleCosts / 12;
      const maintenanceActual = dashboardMaintenance.reduce((sum, item) => sum + Number(item.actual_cost || 0), 0);
      const operationalCosts = monthlyVehicleCosts + maintenanceActual;
      const balance = revenue - expenses - operationalCosts;
      const go = key => setTab(key);'''

new_dashboard = '''      const scheduled = agendaLessons.filter(lesson => String(lesson.status || "").toLowerCase() === "scheduled").length;
      const completed = agendaLessons.filter(lesson => ["completed","concluida","concluído"].includes(String(lesson.status || "").toLowerCase())).length;
      const scheduledExams = agendaLessons.filter(lesson => lesson.exam_scheduled_at && String(lesson.exam_status || "").toUpperCase() === "AGENDADA").length;
      const totalLessons = dashboardRpaReports.reduce((sum, r) => sum + Number(r.total_lessons || 0), 0);
      const quality = dashboardRpaReports.map(r => Number(r.latest_quality_score)).filter(Number.isFinite);
      const hsi = dashboardRpaReports.map(r => Number(r.latest_hsi_score)).filter(Number.isFinite);
      const qualityAverage = quality.length ? quality.reduce((a,b)=>a+b,0)/quality.length : null;
      const hsiAverage = hsi.length ? hsi.reduce((a,b)=>a+b,0)/hsi.length : null;
      const formatCurrency = value => Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
      const financial = getFinancialSnapshot({ financeEntries, vehicles: dashboardVehicles, maintenance: dashboardMaintenance });
      const revenue = financial.revenuePaid;
      const expenses = financial.expensePaid;
      const operationalCosts = financial.vehicleMonthlyProvision;
      const balance = financial.operationalResult;
      const go = key => setTab(key);'''

if old_dashboard not in s:
    raise SystemExit("Dashboard calculation block not found; financial normalization stopped safely.")
s = s.replace(old_dashboard, new_dashboard, 1)

# Make dashboard labels unambiguous.
s = s.replace("<small>Despesas lançadas</small>", "<small>Despesas realizadas</small>", 1)
s = s.replace("<small>Custos operacionais / mês</small>", "<small>Provisão operacional / mês</small>", 1)
s = s.replace("<small>Saldo operacional</small>", "<small>Resultado operacional</small>", 1)
s = s.replace("<span>Receitas − Despesas − Custos</span>", "<span>Receitas realizadas − Despesas realizadas − Provisão operacional</span>", 1)

# Financeiro uses the exact same snapshot.
old_finance = '''  const financeRevenue = financeEntries
    .filter(entry => String(entry.type || "").toUpperCase() === "RECEITA")
    .reduce((total, entry) => total + Number(entry.amount || 0), 0);

  const financeExpenses = financeEntries
    .filter(entry => String(entry.type || "").toUpperCase() === "DESPESA")
    .reduce((total, entry) => total + Number(entry.amount || 0), 0);

  const financeResult = financeRevenue - financeExpenses;'''
new_finance = '''  const financial = getFinancialSnapshot({ financeEntries, vehicles: dashboardVehicles, maintenance: dashboardMaintenance });
  const financeRevenue = financial.revenuePaid;
  const financeExpenses = financial.expensePaid;
  const financeResult = financial.operationalResult;'''
if old_finance not in s:
    raise SystemExit("Financeiro calculation block not found; financial normalization stopped safely.")
s = s.replace(old_finance, new_finance, 1)

s = s.replace(
    'RESULTADO\n            </div>\n            {formatCurrency(financeResult)}',
    'RESULTADO OPERACIONAL\n            </div>\n            {formatCurrency(financeResult)}',
    1,
)

# Add reconciliation information before the existing financial indicators panel.
marker = '''      <div className="panel">\n        <h2>Indicadores financeiros</h2>'''
panel = '''      <div className="panel" style={{ background: "#f7faff", border: "1px solid #d8e4f4" }}>
        <h2>Conciliação financeira</h2>
        <p style={{ lineHeight: 1.6 }}>O NeuroDrive separa movimentos financeiros realizados da provisão operacional mensal. Custos históricos não são somados silenciosamente ao mês atual.</p>
        <div className="grid">
          <div className="metric"><div style={{ fontSize: "12px", opacity: 0.7 }}>RECEITAS REALIZADAS</div>{formatCurrency(financial.revenuePaid)}</div>
          <div className="metric"><div style={{ fontSize: "12px", opacity: 0.7 }}>DESPESAS REALIZADAS</div>{formatCurrency(financial.expensePaid)}</div>
          <div className="metric"><div style={{ fontSize: "12px", opacity: 0.7 }}>PROVISÃO VEÍCULO / MÊS</div>{formatCurrency(financial.vehicleMonthlyProvision)}</div>
          <div className="metric"><div style={{ fontSize: "12px", opacity: 0.7 }}>A PAGAR / RECEBER</div>{formatCurrency(financial.revenuePending - financial.expensePending)}</div>
        </div>
        {financial.reconciliationRequired && (
          <div style={{ marginTop: "12px", padding: "12px", borderRadius: "10px", background: "#fff8e8", border: "1px solid #f0cf82", lineHeight: 1.5 }}>
            <strong>Conciliação necessária:</strong> existem manutenções realizadas neste mês. Elas não são adicionadas automaticamente ao resultado operacional; registre a despesa correspondente no Financeiro quando efetivamente paga.
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
if marker not in s:
    raise SystemExit("Finance indicators marker not found; financial normalization stopped safely.")
s = s.replace(marker, panel + marker, 1)

p.write_text(s, encoding="utf-8")
