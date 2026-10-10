from pathlib import Path
import subprocess
import sys

SOURCE = Path("src/main.jsx")
text = SOURCE.read_text(encoding="utf-8")

# Match the production workflow's Auth adjustments idempotently.
text = text.replace(
    "function Auth({ onAuth }) {",
    'function Auth({ onAuth, initialMessage = "" }) {',
    1,
)
text = text.replace(
    'const [msg, setMsg] = useState("");',
    "const [msg, setMsg] = useState(initialMessage);",
    1,
)
text = text.replace(
    'options: {\n              data: professionalMetadata\n            }',
    'options: {\n              emailRedirectTo: "https://neurodrive.hsi-doth-pg.com.br/?confirmed=1",\n              data: professionalMetadata\n            }',
    1,
)

# The official preparation script defines the access policy for the core app.
# Do not patch protectedTabs here: prepare-neurodrive-pages.py intentionally
# sets the operational core to the same free-access policy as the official site.

# Keep the guest-course session key at module scope before runtime consumers.
key_decl = 'const NEURODRIVE_COURSE_SESSION_KEY = "neurodrive_courses_guest_session_v1";'
if text.count(key_decl) != 1:
    raise SystemExit(
        "Build stopped safely: expected exactly one guest session-key declaration."
    )
text = text.replace(key_decl + "\n\n", "", 1)
anchor = 'import { LayoutDashboard, Users, CalendarDays, CarFront, Brain, FileText, WalletCards, BookOpen, BadgeCheck, LogOut, Play, Trash2 } from "lucide-react";'
if anchor not in text:
    raise SystemExit("Build stopped safely: expected module import anchor was not found.")
text = text.replace(anchor, anchor + "\n\n" + key_decl, 1)
SOURCE.write_text(text, encoding="utf-8")

# Reproduce the official Pages preparation and financial normalization steps.
for script in (
    "scripts/prepare-neurodrive-pages.py",
    "scripts/normalize-financial-dashboard.py",
):
    subprocess.run([sys.executable, script], check=True)

# Fail safely if the homologation access policy diverges from the official build.
final_source = SOURCE.read_text(encoding="utf-8")
if 'const protectedTabs = new Set([]);' not in final_source:
    raise SystemExit("Build stopped safely: access policy differs from official free-core build.")

print("Official NeuroDrive build preparation and access policy verified.")
