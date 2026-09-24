# Security Policy

## Scope

This repository contains the public application layer of the ENAT / NeuroDrive ecosystem. Sensitive business logic, service credentials, private prompts, and privileged database operations must remain server-side.

## Reporting a vulnerability

Please do not publish security vulnerabilities, credentials, personal data, or exploit details in public issues.

Report suspected vulnerabilities privately to the project maintainer through the project's authorized private communication channel, including:

- affected component or URL;
- approximate date/time;
- reproduction steps;
- security impact;
- screenshots or logs only when they contain no credentials or unnecessary personal data.

## Security principles

- Frontend code is not a security boundary.
- Supabase Row Level Security and least-privilege grants protect data access.
- `service_role` credentials and other secrets must never be shipped to the browser.
- SECURITY DEFINER functions require explicit justification, pinned `search_path`, and restricted EXECUTE grants.
- HSI predictive and AI outputs must remain subject to ownership checks and audit controls.
- Personal data must be minimized and processed according to applicable privacy requirements, including LGPD where applicable.

## Supported branches

Security fixes should be developed in isolated branches and validated before reaching the production branch.
