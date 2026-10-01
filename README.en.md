# Digital Republic of Novatlantis — Sovereign Digital Public Infrastructure & Agentic State

> **Documentation Languages / Idiomas da Documentação:**
> - 🇧🇷 **Português (Official):** [README.md](./README.md)
> - 🇪🇸 **Español:** [README.es.md](./README.es.md)
> - 🇺🇸 **English:** [README.en.md](./README.en.md)
> - 🏛️ **Government Data Platform (GDP / EDP):** [government-data-platform/README.md](./government-data-platform/README.md)
> - 📘 **Full Functional & Technical Manual:** [docs/DOCUMENTACAO_COMPLETA_NOVATLANTIS.md](./docs/DOCUMENTACAO_COMPLETA_NOVATLANTIS.md)

---

## 1. Overview of the AI-First Nation (`america.gov` Design System + Material UI + AlloyDB + Government Data Platform)

The **Digital Republic of Novatlantis** (`novatlantis.gov.cloud`) is an AI-native sovereign state built on an editorial civic design system inspired directly by **[america.gov](https://america.gov/)** combined with **Material UI (`@mui/material` v6)**, **AlloyDB for PostgreSQL**, and the **Government Data Platform (GDP)**, running on **Google Cloud (Argolis Project: `novatlantis`)**.

### Core Architectural & Citizen Experience Pillars:
1. **Unified Multilingual Architecture (Native i18n on 100% of Pages — `Português`, `Español`, `English`):**
   - Global language selector (`🌐 PT | ES | EN`) persistently available in the top header (`TopNavUserWidget`), inside the Hamburger Menu (`☰`) of all 3 portals, and inside the Sovereign Profile Settings modal.
   - Automatic 3-layer language resolution:
     1. Explicit user selection in the header/menu (`localStorage.novatlantis_lang` or `?lang=pt-BR|es-419|en-US` URL parameter propagated across portals via SSO);
     2. Authenticated citizen's `native_language` stored in AlloyDB / GDF (`45% pt-BR`, `45% es-419`, `10% en-US`);
     3. Automatic browser locale detection via `navigator.language` / `Accept-Language`.
2. **Editorial `america.gov` Design System & Hamburger Menu (`☰`) Navigation:**
   - High-contrast civic palette (`#fcfbf9` Warm Cream, `#0a2240` Deep Navy, `#991b1b` Crimson Accent) and editorial typography (`Merriweather` + `Public Sans` + `JetBrains Mono`).
   - Clean **Hamburger Menu (`☰`)** navigation both in the portal headers and inside the **Sovereign Profile Modal ("More Profile Options")**, allowing users to switch seamlessly between the Digital NID Card, Registration Data & Official Photo (with client-side compression and database persistence in `citizen_profiles`), Security & Password, and Preferences without modal lockups.
3. **Zero-Trust Unauthenticated-by-Default Policy & Public AI Concierge:**
   - **No user is signed in by default.** Visitors can freely ask public questions in the **National AI Concierge** on the Home Page in Portuguese, Spanish, or English without logging in.
   - When requesting personal or administrative services, the user is prompted to sign in with their Sovereign NID (`NID` + Password with mandatory password change on first login).
4. **3 Independent Full-Stack Applications** built with **React + Material UI (`@mui/material`)** and **Node.js 22 connected to AlloyDB for PostgreSQL (`10.223.28.2:5432`) via Direct VPC Egress**.

---

## 2. The 3 Full-Stack Core Applications (Cloud Run Production + Material UI)

| Full-Stack Application | Directory | Cloud Run Service (`novatlantis`) | Institutional Role & Features |
| :--- | :--- | :--- | :--- |
| **1. National Main Portal + National AI Concierge** | [`apps/landing-portal`](./apps/landing-portal) | [`https://novatlantis-landing-portal-wpahcxvhuq-uc.a.run.app`](https://novatlantis-landing-portal-wpahcxvhuq-uc.a.run.app) | **`america.gov`-Inspired Home Page (Material UI)**: Official government top banner, header with Hamburger Menu (`☰`), global language switcher (`PT | ES | EN`), and user status widget (`TopNavUserWidget`). Hero section with **National AI Concierge** open for unauthenticated public queries and essential service cards. |
| **2. Citizen Portal (360° Self-Service)** | [`apps/citizen-portal`](./apps/citizen-portal) | [`https://novatlantis-citizen-portal-wpahcxvhuq-uc.a.run.app`](https://novatlantis-citizen-portal-wpahcxvhuq-uc.a.run.app) | **Citizen Self-Service App (Material UI)**: Internal navigation via Hamburger Menu (`☰`) and full `PT | ES | EN` support. Includes Sovereign NID Wallet (Mod-11 + NIST Biometrics + Profile Photo upload persisted to AlloyDB/SQLite), Read-Only Family Graph (`rel_family_graph`), HL7 Health Record & AI Telemedicine, School Report Card, 311 Urban Services, 911 SOS, 45s Business Registration, and ICAO Passport. |
| **3. Government Backstage & Identity 360** | [`apps/gov-backstage`](./apps/gov-backstage) | [`https://novatlantis-gov-backstage-wpahcxvhuq-uc.a.run.app`](https://novatlantis-gov-backstage-wpahcxvhuq-uc.a.run.app) | **Civil Servants & Public Managers App (Material UI)**: Hamburger Menu (`☰`) navigation across all 6 administrative environments with `PT | ES | EN` support and **Identity 360 (RBAC/ABAC)** enforcement. Prime Minister Cabinet (`jopoco`), Identity 360 Management, Hospital & Doctor Management, School & Exam Management, 311/911 Command Center, and 100k Citizen AlloyDB & GDP Explorer. |

---

## 3. Official Test Credentials (SSO, Mandatory First Login & Identity 360)

| NID | Name / Role | Login Email | Initial Password (Postal Channel) | Identity 360 Role (`iam_role`) | Backstage Access |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `NID-000-0000-0001-9` | **Jopoco (Prime Minister / Root)** | `jopoco@novatlantis.gov.cloud` | `Novatlantis@0001-9` (or `ATs32=34`) | `PRIME_MINISTER_ROOT` | **FULL (Root L10)** |
| `NID-000-0000-0002-7` | **Dr. Aurelius Valerius (Secretary-General)** | `secretario.geral@novatlantis.gov.cloud` | `Novatlantis@0002-7` | `SECRETARY_GENERAL` | **FULL (Executive L9)** |
| `NID-000-0000-0003-5` | **Helena Viana (Identity 360 Manager)** | `gestor.identidade@novatlantis.gov.cloud` | `Novatlantis@0003-5` | `IDENTITY_MANAGER_360` | **IAM 360 Management (L8)** |
| `NID-000-0000-0004-3` | **Dr. Sofia Mendes (Health Manager & Doctor)** | `sofia.mendes@saude.novatlantis.gov.cloud` | `Novatlantis@0004-3` | `DOCTOR_AND_HEALTH_MANAGER` | **Health & Telemedicine (L6)** |
| `NID-000-0000-0006-0` | **Prof. Lucas Albuquerque (Education Manager)** | `lucas.albuquerque@educacao.novatlantis.gov.cloud` | `Novatlantis@0006-0` | `TEACHER_AND_EDU_MANAGER` | **Education, Exams & Grades (L6)** |
| `NID-000-0000-0008-6` | **Commander Rafael Santos** | `rafael.santos@operacoes.novatlantis.gov.cloud` | `Novatlantis@0008-6` | `OPERATIONS_311_911_MANAGER` | **311 & 911 Command (L6)** |
| `NID-000-0000-0009-4` | **Justice Clara Sterling Davis** | `clara.sterling@justica.novatlantis.gov.cloud` | `Novatlantis@0009-4` | `JUSTICE_AND_TREASURY_MANAGER` | **Justice & Treasury (L7)** |
| `NID-000-0000-0010-8` | **Pedro Albuquerque Viana (Student, 11y)** | `pedro.albuquerque@cidadao.novatlantis.gov.cloud` | `Novatlantis@0010-8` | `CITIZEN_COMMON` | **Denied (Citizen Portal Only)** |
