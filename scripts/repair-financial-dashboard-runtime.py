from pathlib import Path

p = Path("src/main.jsx")
s = p.read_text(encoding="utf-8")

old = '''      const financial = getFinancialSnapshot({
        financeEntries,
        vehicles: dashboardVehicles,
        maintenance: dashboardMaintenance,
      });
      const revenue = financial.revenuePaid;
      const expenses = financial.expensePaid;
      const operationalCosts = financial.vehicleMonthlyProvision;
      const balance = financial.operationalResult;
      const go = key => setTab(key);'''

new = '''      const scheduled = agendaLessons.filter(lesson => String(lesson.status || "").toLowerCase() === "scheduled").length;
      const completed = agendaLessons.filter(lesson => ["completed","concluida","concluído"].includes(String(lesson.status || "").toLowerCase())).length;
      const scheduledExams = agendaLessons.filter(lesson => lesson.exam_scheduled_at && String(lesson.exam_status || "").toUpperCase() === "AGENDADA").length;
      const totalLessons = dashboardRpaReports.reduce((sum, r) => sum + Number(r.total_lessons || 0), 0);
      const quality = dashboardRpaReports.map(r => Number(r.latest_quality_score)).filter(Number.isFinite);
      const hsi = dashboardRpaReports.map(r => Number(r.latest_hsi_score)).filter(Number.isFinite);
      const qualityAverage = quality.length ? quality.reduce((a,b)=>a+b,0)/quality.length : null;
      const hsiAverage = hsi.length ? hsi.reduce((a,b)=>a+b,0)/hsi.length : null;
      const formatCurrency = value => Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
      const financial = getFinancialSnapshot({
        financeEntries,
        vehicles: dashboardVehicles,
        maintenance: dashboardMaintenance,
      });
      const revenue = financial.revenuePaid;
      const expenses = financial.expensePaid;
      const operationalCosts = financial.vehicleMonthlyProvision;
      const balance = financial.operationalResult;
      const go = key => setTab(key);'''

if old in s:
    s = s.replace(old, new, 1)
elif "const scheduledExams = agendaLessons.filter" not in s:
    raise SystemExit("Expected normalized dashboard block was not found; repair stopped safely.")

# Guard the build against the exact regression that previously caused the
# dashboard render to fail: all values referenced by the dashboard JSX must be
# defined in its render scope.
required = [
    "const scheduledExams =",
    "const qualityAverage =",
    "const hsiAverage =",
    "const formatCurrency =",
    "const financial = getFinancialSnapshot({",
]
missing = [item for item in required if item not in s]
if missing:
    raise SystemExit("Financial dashboard repair validation failed: " + ", ".join(missing))

p.write_text(s, encoding="utf-8")
