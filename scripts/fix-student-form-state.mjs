import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(here, "..");
const filePath = path.join(projectRoot, "src", "main.jsx");

const source = fs.readFileSync(filePath, "utf8");

const dashboardMarker = "function Dashboard({ user, onLogout }) {";
const studentMarker = "function StudentForm({ user, onBack }) {";
const dashboardStateMarker = "  const [tab, setTab] = useState(\"dashboard\");";

const dashboardIndex = source.indexOf(dashboardMarker);
const studentIndex = source.indexOf(studentMarker, dashboardIndex);
const stateIndex = source.indexOf(dashboardStateMarker, studentIndex);

if (dashboardIndex < 0 || studentIndex < 0 || stateIndex < 0) {
  throw new Error("Não foi possível localizar a estrutura esperada do StudentForm. Build interrompido com segurança.");
}

// Se já estiver corrigido, não altera novamente o arquivo.
if (studentIndex < dashboardIndex) {
  console.log("StudentForm já está fora do Dashboard. Nenhuma alteração necessária.");
  process.exit(0);
}

const studentForm = source.slice(studentIndex, stateIndex).trimEnd() + "\n\n";

const withoutStudentForm =
  source.slice(0, studentIndex) + source.slice(stateIndex);

const dashboardIndexAfterRemoval = withoutStudentForm.indexOf(dashboardMarker);
const fixedSource =
  withoutStudentForm.slice(0, dashboardIndexAfterRemoval) +
  studentForm +
  withoutStudentForm.slice(dashboardIndexAfterRemoval);

fs.writeFileSync(filePath, fixedSource, "utf8");
console.log("StudentForm movido para fora do Dashboard: estado do cadastro fica estável durante re-renderizações.");
