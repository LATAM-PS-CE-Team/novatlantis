# Digital Republic of Novatlantis — Sovereign Digital Public Infrastructure & Agentic State

> **Documentation Languages / Idiomas da Documentação:**
> - 🇧🇷 **Português (Official):** [README.md](./README.md) • **Documentação Completa (PT):** [docs/DOCUMENTACAO_COMPLETA_NOVATLANTIS.md](./docs/DOCUMENTACAO_COMPLETA_NOVATLANTIS.md)
> - 🇪🇸 **Español:** [README.es.md](./README.es.md) • **Documentación Completa (ES):** [docs/DOCUMENTACAO_COMPLETA_NOVATLANTIS.es.md](./docs/DOCUMENTACAO_COMPLETA_NOVATLANTIS.es.md)
> - 🇺🇸 **English:** [README.en.md](./README.en.md) • **Full Documentation (EN):** [docs/DOCUMENTACAO_COMPLETA_NOVATLANTIS.en.md](./docs/DOCUMENTACAO_COMPLETA_NOVATLANTIS.en.md)
> - 🏛️ **Government Data Platform (GDP / EDP):** [government-data-platform/README.md](./government-data-platform/README.md)

---

## 1. Overview of the AI-First Nation (`america.gov` Design System + Google Material Design Persistent Navigation Drawer + AlloyDB + Government Data Platform)

The **Digital Republic of Novatlantis** (`novatlantis.gov.cloud`) is an AI-native sovereign state built on an editorial civic design system inspired directly by **[america.gov](https://america.gov/)** combined with **Google Material Design (`@mui/material` v6)**, **AlloyDB for PostgreSQL**, and the **Government Data Platform (GDP)**, running on **Google Cloud (Argolis Project: `novatlantis`)**.

### Core Architectural & Citizen Experience Pillars:
1. **Unified Multilingual Architecture (Native i18n on 100% of Pages — `Português`, `Español`, `English`):**
   - Global language selector (`🌐 PT | ES | EN`) persistently available in the top header (`TopNavUserWidget`), inside the Navigation Drawer (`☰`) of all 3 portals, and inside the Sovereign Profile view.
   - Automatic 3-layer language resolution:
     1. Explicit user selection in the header/sidebar (`localStorage.novatlantis_lang` or `?lang=pt-BR|es-419|en-US` URL parameter propagated across portals via SSO);
     2. Authenticated citizen's `native_language` stored in AlloyDB / GDF (`45% pt-BR`, `45% es-419`, `10% en-US`);
     3. Automatic browser locale detection via `navigator.language` / `Accept-Language`.
2. **Editorial `america.gov` Design System & Google Material Design Persistent Navigation Drawer (Sidebar without Overlay):**
   - High-contrast civic palette (`#fcfbf9` Warm Cream, `#0a2240` Deep Navy, `#991b1b` Crimson Accent) and editorial typography (`Merriweather` + `Public Sans` + `JetBrains Mono`).
   - **Full-Page Sovereign Profile (`fullScreen`) with Side-by-Side Navigation Drawer (`<Box component="aside">`)**: Opening the Sovereign Profile launches a full-page view with a **persistent side Navigation Drawer (Sidebar)** next to the main content (Google Material Design pattern, rather than a small overlay popup), allowing smooth navigation across Digital NID Wallet, Registration Data & Official Photo (with client-side compression and persistence in `citizen_profiles`), Security & Password, and Preferences.
   - **Modules Menu as Persistent Navigation Drawer (Sidebar)**: Across all 3 portals (`landing-portal`, `citizen-portal`, and `gov-backstage`), the Hamburger button (`☰`) toggles a **Google Material Design Persistent Navigation Drawer (Sidebar)** that sits side-by-side with `<main>` in a flex layout instead of opening as a modal overlay.
3. **Complete Separation of 311 Urban Maintenance and 911 Emergency (SOS) Modules:**
   - **311 Urban Maintenance (`urban_311` / `ops_311`)**: Dedicated module for non-emergency urban maintenance requests, smart street lighting IoT, storm drainage, waste collection, and park upkeep (`ops_311_tickets`).
   - **911 Emergency Dispatch (`emergency_911` / `ops_911`)**: Dedicated high-priority module for immediate tactical & medical SOS dispatch (Mobile ICU Ambulance, Civil Defense, and Coast Guard) integrated in real time with HL7 FHIR health records (`ops_911_dispatches`).
4. **Zero-Trust Unauthenticated-by-Default Policy & Public AI Concierge:**
   - **No user is signed in by default.** Visitors can freely ask public questions in the **National AI Concierge** on the Home Page in Portuguese, Spanish, or English without logging in.
   - When requesting personal or administrative services, the user is prompted to sign in with their Sovereign NID (`NID` + Password with mandatory password change on first login).

---

## 2. The 3 Full-Stack Core Applications (Cloud Run Production + Material UI)

| Full-Stack Application | Directory | Cloud Run Service (`novatlantis`) | Institutional Role & Features |
| :--- | :--- | :--- | :--- |
| **1. National Main Portal + National AI Concierge** | [`apps/landing-portal`](./apps/landing-portal) | [`https://novatlantis-landing-portal-wpahcxvhuq-uc.a.run.app`](https://novatlantis-landing-portal-wpahcxvhuq-uc.a.run.app) | **`america.gov`-Inspired Home Page (Material UI)**: Official government top banner, header with Persistent Navigation Drawer (`☰`), global language switcher (`PT | ES | EN`), and user status widget (`TopNavUserWidget`). Hero section with **National AI Concierge** open for unauthenticated public queries and 7 essential service cards with separated **311 Urban Services** and **911 Emergency** modules. |
| **2. Citizen Portal (360° Self-Service)** | [`apps/citizen-portal`](./apps/citizen-portal) | [`https://novatlantis-citizen-portal-wpahcxvhuq-uc.a.run.app`](https://novatlantis-citizen-portal-wpahcxvhuq-uc.a.run.app) | **Citizen Self-Service App (Material UI)**: Side-by-side Persistent Navigation Drawer (`☰`) and full `PT | ES | EN` support. Includes 7 independent modules: (1) Sovereign NID Wallet, (2) Read-Only Family Graph & Address, (3) HL7 Health Record & AI Telemedicine, (4) School Report Card, (5) **311 Urban Services**, (6) **911 Emergency (Tactical & Medical SOS)**, and (7) Economy, 45s Business Registration & ICAO Passport. |
| **3. Government Backstage & Identity 360** | [`apps/gov-backstage`](./apps/gov-backstage) | [`https://novatlantis-gov-backstage-wpahcxvhuq-uc.a.run.app`](https://novatlantis-gov-backstage-wpahcxvhuq-uc.a.run.app) | **Civil Servants & Public Managers App (Material UI)**: Side-by-side Persistent Navigation Drawer (`☰`) across all 7 administrative environments with `PT | ES | EN` support and **Identity 360 (RBAC/ABAC)** enforcement. Includes: (1) Prime Minister Cabinet (**Joao Thiago Poço - JT**), (2) Identity 360 Management, (3) Hospital & Doctor Management, (4) School & Exam Management, (5) **311 Urban Maintenance Command**, (6) **911 Emergency Dispatch Command**, and (7) Justice, Treasury, AlloyDB & 100k Citizen GDP Explorer. |

---

## 3. Official Test Credentials (SSO, Mandatory First Login & Identity 360)

| NID | Name / Role | Login Email | Initial Password (Postal Channel) | Identity 360 Role (`iam_role`) | Backstage Access |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `NID-000-0000-0001-9` | **Joao Thiago Poço (JT) — Prime Minister / Root** | `jt@novatlantis.gov.cloud` | `Novatlantis@0001-9` | `PRIME_MINISTER_ROOT` | **FULL (Root L10)** |
| `NID-000-0000-0002-7` | **Dr. Aurelius Valerius (Secretary-General)** | `secretario.geral@novatlantis.gov.cloud` | `Novatlantis@0002-7` | `SECRETARY_GENERAL` | **FULL (Executive L9)** |
| `NID-000-0000-0003-5` | **Helena Viana (Identity 360 Manager)** | `gestor.identidade@novatlantis.gov.cloud` | `Novatlantis@0003-5` | `IDENTITY_MANAGER_360` | **IAM 360 Management (L8)** |
| `NID-000-0000-0004-3` | **Dr. Sofia Mendes (Health Manager & Doctor)** | `sofia.mendes@saude.novatlantis.gov.cloud` | `Novatlantis@0004-3` | `DOCTOR_AND_HEALTH_MANAGER` | **Health & Telemedicine (L6)** |
| `NID-000-0000-0006-0` | **Prof. Lucas Albuquerque (Education Manager)** | `lucas.albuquerque@educacao.novatlantis.gov.cloud` | `Novatlantis@0006-0` | `TEACHER_AND_EDU_MANAGER` | **Education, Exams & Grades (L6)** |
| `NID-000-0000-0008-6` | **Commander Rafael Santos** | `rafael.santos@operacoes.novatlantis.gov.cloud` | `Novatlantis@0008-6` | `OPERATIONS_311_911_MANAGER` | **311 & 911 Command (L6)** |
| `NID-000-0000-0009-4` | **Justice Clara Sterling Davis** | `clara.sterling@justica.novatlantis.gov.cloud` | `Novatlantis@0009-4` | `JUSTICE_AND_TREASURY_MANAGER` | **Justice & Treasury (L7)** |
| `NID-000-0000-0010-8` | **Pedro Albuquerque Viana (Student, 11y)** | `pedro.albuquerque@cidadao.novatlantis.gov.cloud` | `Novatlantis@0010-8` | `CITIZEN_COMMON` | **Denied (Citizen Portal Only)** |
