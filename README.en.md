# Digital Republic of Novatlantis — Sovereign Digital Public Infrastructure & Agentic State

> **Documentation Languages / Idiomas da Documentação:**
> - 🇧🇷 **Português (Official):** [README.md](./README.md)
> - 🇪🇸 **Español:** [README.es.md](./README.es.md)
> - 🇺🇸 **English:** [README.en.md](./README.en.md)
> - 🏛️ **Government Data Platform (GDP / EDP):** [government-data-platform/README.md](./government-data-platform/README.md)
> - 📘 **Full Functional & Technical Manual:** [docs/DOCUMENTACAO_COMPLETA_NOVATLANTIS.md](./docs/DOCUMENTACAO_COMPLETA_NOVATLANTIS.md)

---

## 1. Overview of the AI-First Nation (Material UI + AlloyDB + Government Data Platform)

The **Digital Republic of Novatlantis** (`novatlantis.gov.cloud`) is an AI-native sovereign state built on the **Sovereign Civic** design system with **Material UI (`@mui/material` v6)** (inspired by **GOV.UK** institutional clarity and **e-Estonia** X-Road interoperability), running on **Google Cloud (Argolis Project: `novatlantis`)**.

Key architectural pillars:
- **3 Independent Full-Stack Applications** built with **React + Material UI (`@mui/material`)** and **Node.js 22 connected to AlloyDB for PostgreSQL via Direct VPC Egress**;
- **Sovereign Transactional Database on AlloyDB for PostgreSQL**:
  - **Cluster:** `projects/novatlantis/locations/us-central1/clusters/novatlantis-sovereign-cluster`
  - **Primary Instance:** `projects/novatlantis/locations/us-central1/clusters/novatlantis-sovereign-cluster/instances/novatlantis-primary-01` (`10.223.28.2:5432`, PostgreSQL 15 + `vector`)
- **Government Data Platform (GDP)** ([`government-data-platform/`](./government-data-platform)) adapted from [`googlecloudplatform/education-data-platform`](https://github.com/googlecloudplatform/education-data-platform) and deployed in BigQuery and Cloud Storage with **100,000 citizens**.

---

## 2. The 3 Full-Stack Core Applications (Cloud Run Production + Material UI)

| Full-Stack Application | Directory | Cloud Run Service (`novatlantis`) | Institutional Role |
| :--- | :--- | :--- | :--- |
| **1. National Main Portal + State Orchestrator Chat** | [`apps/landing-portal`](./apps/landing-portal) | [`https://novatlantis-landing-portal-wpahcxvhuq-uc.a.run.app`](https://novatlantis-landing-portal-wpahcxvhuq-uc.a.run.app) | **National Main Page (Material UI)**: Enlarged institutional header with user status photo widget (`TopNavUserWidget`), live **AlloyDB + Government Data Platform** status bar, life-events service matrix, and **Central Search Bar powered by the State Orchestrator Agent**. |
| **2. Citizen Portal (360° Self-Service)** | [`apps/citizen-portal`](./apps/citizen-portal) | [`https://novatlantis-citizen-portal-wpahcxvhuq-uc.a.run.app`](https://novatlantis-citizen-portal-wpahcxvhuq-uc.a.run.app) | **Citizen Self-Service App (Material UI)**: Sovereign NID Wallet (Mod-11 + NIST Biometrics), Read-Only Family Graph (`rel_family_graph`), HL7 Health Record & AI Telemedicine, School Report Card, 311 Urban Services, 911 SOS, 45s Business Registration, and ICAO Passport. |
| **3. Government Backstage & Identity 360** | [`apps/gov-backstage`](./apps/gov-backstage) | [`https://novatlantis-gov-backstage-wpahcxvhuq-uc.a.run.app`](https://novatlantis-gov-backstage-wpahcxvhuq-uc.a.run.app) | **Civil Servants & Public Managers App (Material UI)**: Prime Minister Cabinet (`jopoco`), Identity 360 RBAC/ABAC Management, Hospital & Doctor Management, School & Exam Management, 311/911 Command Center, and 100k Citizen AlloyDB & GDP Explorer. |
