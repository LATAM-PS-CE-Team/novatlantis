# Digital Republic of Novatlantis — Sovereign Digital Public Infrastructure & Agentic State

> **Documentation Languages / Idiomas da Documentação:**
> - 🇧🇷 **Português:** [README.md](./README.md)
> - 🇪🇸 **Español:** [README.es.md](./README.es.md)
> - 🇺🇸 **English (Official):** [README.en.md](./README.en.md)
> - 📘 **Full Functional & Technical Manual:** [docs/DOCUMENTACAO_COMPLETA_NOVATLANTIS.md](./docs/DOCUMENTACAO_COMPLETA_NOVATLANTIS.md)

---

## 1. Overview of the AI-First Nation

The **Digital Republic of Novatlantis** (`novatlantis.gov.cloud`) is an agentic-era sovereign digital nation designed under the **Sovereign Civic** aesthetic and functional paradigm (inspired by the institutional austerity of **GOV.UK** and the interoperability of **e-Estonia**), running on **Google Cloud (Argolis Project: `novatlantis`)**.

The State's architecture is separated into **3 Complete, Independent Full-Stack Applications** (each with its own dedicated **React + Tailwind CSS Frontend** and **Node.js 22 + SQLite `node:sqlite` Backend**) plus **5 Sectoral Microservices**, using the **100,000-Citizen Sovereign Datalake (`dim_citizens`) as the Unified Users Module (SSO & RBAC/ABAC)**.

---

## 2. Separation into 3 Core Full-Stack Applications (Cloud Run Production)

| Full-Stack Application | Monorepo Directory | Cloud Run Service (`novatlantis`) | Institutional Role & Capabilities |
| :--- | :--- | :--- | :--- |
| **1. National Master Portal + State Orchestrator Agent Chat** | [`apps/landing-portal`](./apps/landing-portal) | [`https://novatlantis-landing-portal-wpahcxvhuq-uc.a.run.app`](https://novatlantis-landing-portal-wpahcxvhuq-uc.a.run.app) | **National Master Portal**: Displays real-time national indicators, the Life Events matrix, and the **Central Search Bar powered by the State Orchestrator Agent**, which opens an **Interactive Chat Console** allowing citizens to converse with State services and execute real transactions against the 100,000-citizen database. |
| **2. Citizen Portal (360° Self-Service)** | [`apps/citizen-portal`](./apps/citizen-portal) | [`https://novatlantis-citizen-portal-wpahcxvhuq-uc.a.run.app`](https://novatlantis-citizen-portal-wpahcxvhuq-uc.a.run.app) | **Dedicated Citizen Application**: Uses the 100,000-citizen database as its Users Module. Includes the NID Sovereign Credential (Mod-11 + NIST Biometrics), Family Graph (`rel_family_graph`), residential address management, HL7 Health Record & AI Telemedicine, Student Grades per subject, 311 Urban Services, 911 SOS, 45s Company Incorporation, and ICAO Passport issuance. |
| **3. Government Backstage & Identity 360** | [`apps/gov-backstage`](./apps/gov-backstage) | [`https://novatlantis-gov-backstage-wpahcxvhuq-uc.a.run.app`](https://novatlantis-gov-backstage-wpahcxvhuq-uc.a.run.app) | **Dedicated Public Servant & Manager Application**: Enforced by **Identity 360 (RBAC/ABAC)**. Includes the Prime Minister's (`jopoco`) & Secretary-General's Cabinet, Identity 360 Management (instant role grant/revocation), Hospital & Doctor Management, School, Teacher, Exam & Grade Management, 311/911 Command Center, and the 100k Citizen Datalake Explorer. |

### Additional Sectoral Microservices in Production (`us-central1`)
- **Sovereign Identity NID (`identity-nid`)**: `https://novatlantis-identity-nid-wpahcxvhuq-uc.a.run.app`
- **Urban Services 311 (`services-311`)**: `https://novatlantis-services-311-wpahcxvhuq-uc.a.run.app`
- **Emergency Dispatch 911 (`emergency-911`)**: `https://novatlantis-emergency-911-wpahcxvhuq-uc.a.run.app`
- **Health Record & Telemedicine (`health-telemed`)**: `https://novatlantis-health-telemed-wpahcxvhuq-uc.a.run.app`
- **Education & AI Tutoring (`education-learn`)**: `https://novatlantis-education-learn-wpahcxvhuq-uc.a.run.app`

---

## 3. State Orchestrator Agent via Chat (National Master Portal)

In the **National Master Portal (`apps/landing-portal`)**, the central search bar is powered by the **State Orchestrator Agent (`POST /api/orchestrator/chat`)**:
1. Submitting a query in the central search bar or clicking any quick prompt opens the **State Orchestrator Agent Chat Console**.
2. The Agent automatically resolves the authenticated citizen from the **100,000-citizen database (`dim_citizens`)**, classifies the intent (`CITIZEN_360_SUMMARY`, `PASSPORT_ICAO`, `GOVBIZ_45S`, `HEALTH_TELEMED`, `EDUCATION_GRADES`, `URBAN_311`, `EMERGENCY_911`, `IAM_BACKSTAGE`), executes a real SQLite transaction, and renders:
   - **Contextual Institutional Reply** enriched with the citizen's real GDF records;
   - **Multi-Agent Orchestration Trace** showing latency and invoked sub-agents (`Orchestrator-Core`, `GDF-Query-Engine`, `Health-Telemed-Agent`, `GovBiz-45s-Agent`, etc.);
   - **Official Transaction Card** with a 1-click button to open the record directly in the standalone **Citizen Portal** or **Government Backstage**.

---

## 4. Sovereign Database & Datalake (100,000 Citizens as Users Module)

The script [`data-generator/generate_novatlantis_lakehouse.py`](./data-generator/generate_novatlantis_lakehouse.py) generates the embedded relational database `gdf_sovereign.db` and the analytical Lakehouse files in Cloud Storage (`gs://novatlantis-gdf-lakehouse/bronze/`):

- **`dim_citizens` (100,000 records)**: Mod-11 NID identity, full name, email, age (0 to 100 years), native language (`pt-BR` 45%, `es-419` 45%, `en-US` 10%), profession, specialty, address, district, and **Identity 360 role (`iam_role`)**.
- **`rel_family_graph` (71,425 records)**: Bidirectional family graph (`SPOUSE`, `PARENT_OF`, `CHILD_OF`, `SIBLING`) with legal custody and emergency contact flags.
- **`health_records` (100,000 records)**: Blood type, allergies, chronic conditions, organ donor status, and assigned primary care physician.
- **`edu_enrollments` (20,440 records)**: Student enrollments, assigned teacher, attendance rate, and subject scores in **Mathematics, Sciences, AI & Robotics, and Languages**.
- **`sec_passports` (44,088 records)**: ICAO Doc 9303 biometric passports with verifiable MRZ lines.
- **`justice_records` (100,000 records)**: Judicial clearance and border admissibility status.

### Official Test Credentials (SSO & Identity 360)

| NID | Name / Title | Login Email | Identity 360 Role (`iam_role`) | Backstage Access |
| :--- | :--- | :--- | :--- | :--- |
| `NID-000-0000-0001-9` | **Jopoco (Prime Minister / Root)** | `jopoco@novatlantis.gov.cloud` / `admin@jopoco.altostrat.com` | `PRIME_MINISTER_ROOT` | **FULL (Root L10)** |
| `NID-000-0000-0002-7` | **Dr. Aurelius Valerius (Secretary-General)** | `secretario.geral@novatlantis.gov.cloud` | `SECRETARY_GENERAL` | **FULL (Executive L9)** |
| `NID-000-0000-0003-5` | **Helena Viana (Identity 360 Manager)** | `gestor.identidade@novatlantis.gov.cloud` | `IDENTITY_MANAGER_360` | **IAM 360 Management (L8)** |
| `NID-000-0000-0004-3` | **Dra. Sofia Mendes (Health Manager & Doctor)** | `sofia.mendes@saude.novatlantis.gov.cloud` | `DOCTOR_AND_HEALTH_MANAGER` | **Health & Telemedicine (L6)** |
| `NID-000-0000-0006-0` | **Prof. Lucas Albuquerque (Education Manager)** | `lucas.albuquerque@educacao.novatlantis.gov.cloud` | `TEACHER_AND_EDU_MANAGER` | **Education, Exams & Grades (L6)** |
| `NID-000-0000-0008-6` | **Commander Rafael Santos** | `rafael.santos@operacoes.novatlantis.gov.cloud` | `OPERATIONS_311_911_MANAGER` | **311 & 911 Command (L6)** |
| `NID-000-0000-0009-4` | **Magistrate Clara Sterling Davis** | `clara.sterling@justica.novatlantis.gov.cloud` | `JUSTICE_AND_TREASURY_MANAGER` | **Justice & Treasury (L7)** |
| `NID-000-0000-0010-8` | **Pedro Albuquerque Viana (Student, 11yo)** | `pedro.albuquerque@cidadao.novatlantis.gov.cloud` | `CITIZEN_COMMON` | **Denied (Citizen Portal Only)** |

---

## 5. How to Run and Deploy on Google Cloud (Argolis)

```bash
# 1. Generate the 100,000-citizen database and SQLite + NDJSON.gz Datalake
python3 data-generator/generate_novatlantis_lakehouse.py

# 2. Provision and deploy all full-stack applications to Cloud Run (Project: novatlantis)
bash infra/argolis/cloudrun-deploy.sh
```
