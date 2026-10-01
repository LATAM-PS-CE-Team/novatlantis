# República Digital de Novatlantis — Infraestrutura Pública Digital Soberana & Estado Agêntico

> **Idiomas da Documentação / Documentation Languages:**
> - 🇧🇷 **Português (Oficial):** [README.md](./README.md)
> - 🇪🇸 **Español:** [README.es.md](./README.es.md)
> - 🇺🇸 **English:** [README.en.md](./README.en.md)
> - 🏛️ **Government Data Platform (GDP / EDP):** [government-data-platform/README.md](./government-data-platform/README.md)
> - 📘 **Manual Funcional e Técnico Completo:** [docs/DOCUMENTACAO_COMPLETA_NOVATLANTIS.md](./docs/DOCUMENTACAO_COMPLETA_NOVATLANTIS.md)

---

## 1. Visão Geral da Nação AI-First (Material UI + AlloyDB + Government Data Platform)

A **República Digital de Novatlantis** (`novatlantis.gov.cloud`) é uma nação soberana nativa da era agêntica, projetada sob o paradigma estético e funcional **Sovereign Civic** com **Material UI (`@mui/material` v6)** (inspirado na austeridade institucional do **GOV.UK** e na interoperabilidade da **e-Estonia**), operando integralmente sobre o **Google Cloud (Projeto Argolis: `novatlantis`)**.

A arquitetura do Estado é composta por:
- **3 Aplicações Full-Stack Completas e Independentes** (cada uma com seu próprio **Frontend React + Material UI (`@mui/material`)** e **Backend Node.js 22 conectado ao AlloyDB for PostgreSQL via Direct VPC Egress**);
- **Banco de Dados Transacional Soberano no AlloyDB for PostgreSQL**:
  - **Cluster:** `projects/novatlantis/locations/us-central1/clusters/novatlantis-sovereign-cluster`
  - **Instância Primária:** `projects/novatlantis/locations/us-central1/clusters/novatlantis-sovereign-cluster/instances/novatlantis-primary-01` (`10.223.28.2:5432`, PostgreSQL 15 + `vector` extension)
- **Government Data Platform (GDP)** ([`government-data-platform/`](./government-data-platform)) baseado na arquitetura oficial [`googlecloudplatform/education-data-platform`](https://github.com/googlecloudplatform/education-data-platform), implantado no BigQuery e Cloud Storage do projeto `novatlantis` com **100.000 cidadãos** e todas as tabelas relacionais e views analíticas.

---

## 2. Separação das 3 Aplicações Principais Full-Stack (Produção Cloud Run + Material UI)

| Aplicação Full-Stack | Diretório no Monorepo | Serviço Cloud Run (`novatlantis`) | Papel Institucional & Funcionalidades |
| :--- | :--- | :--- | :--- |
| **1. Portal Principal da Nação + Chat do Agente Orquestrador** | [`apps/landing-portal`](./apps/landing-portal) | [`https://novatlantis-landing-portal-wpahcxvhuq-uc.a.run.app`](https://novatlantis-landing-portal-wpahcxvhuq-uc.a.run.app) | **Página Principal da Nação (Material UI)**: Cabeçalho institucional ampliado com **Governo da República de Novatlantis • Portal Principal da Nação** e widget de status do usuário com foto (`TopNavUserWidget`), painel ao vivo do **AlloyDB + Government Data Platform**, matriz de eventos da vida e **Barra de Busca Central controlada pelo Agente Orquestrador de Estado**. |
| **2. Portal do Cidadão (Autoatendimento 360°)** | [`apps/citizen-portal`](./apps/citizen-portal) | [`https://novatlantis-citizen-portal-wpahcxvhuq-uc.a.run.app`](https://novatlantis-citizen-portal-wpahcxvhuq-uc.a.run.app) | **Aplicação Exclusiva do Cidadão (Material UI)**: Utiliza a base de 100.000 cidadãos no AlloyDB/GDP como módulo de usuários. Inclui Carteira Soberana NID (Mod-11 + Biometria NIST), Grafo Familiar Read-Only (`rel_family_graph`), gestão de endereço, Prontuário de Saúde HL7 e Telemedicina com IA, Boletim Escolar por matéria, Zeladoria 311, SOS 911, abertura de empresa em 45s e Passaporte ICAO. |
| **3. Backstage Governamental & Identidade 360** | [`apps/gov-backstage`](./apps/gov-backstage) | [`https://novatlantis-gov-backstage-wpahcxvhuq-uc.a.run.app`](https://novatlantis-gov-backstage-wpahcxvhuq-uc.a.run.app) | **Aplicação Exclusiva de Servidores e Gestores Públicos (Material UI)**: Controlada pela aplicação **Identidade 360 (RBAC/ABAC)**. Inclui o Gabinete do Primeiro-Ministro (`jopoco`) e Secretário-Geral, Gestão de Identidades 360, Gestão de Hospitais e Médicos, Gestão de Escolas, Professores, Provas e Notas, Comando 311/911 e Explorador AlloyDB & GDP de 100k cidadãos. |

---

## 3. Banco de Dados AlloyDB for PostgreSQL & Government Data Platform (GDP)

### 3.1 AlloyDB for PostgreSQL (`novatlantis-sovereign-cluster`)
- **Cluster URI:** `projects/novatlantis/locations/us-central1/clusters/novatlantis-sovereign-cluster`
- **Primary Instance URI:** `projects/novatlantis/locations/us-central1/clusters/novatlantis-sovereign-cluster/instances/novatlantis-primary-01`
- **Private Services Access IP (VPC `novatlantis-vpc`):** `10.223.28.2:5432`
- **Schema DDL:** [`data-generator/sql/01_novatlantis_alloydb_schema.sql`](./data-generator/sql/01_novatlantis_alloydb_schema.sql)
- **Endpoint de Telemetria ao Vivo:** `GET /api/v1/alloydb/status` e `GET /api/v1/gdp/status`

### 3.2 Government Data Platform (`government-data-platform/`)
Baseado em [`googlecloudplatform/education-data-platform`](https://github.com/googlecloudplatform/education-data-platform) e provisionado em produção no projeto `novatlantis`:
- **7 Buckets Cloud Storage (`us-central1`):**
  - `gs://novatlantis-gdp-drp-cs-0` (Drop-off Zone)
  - `gs://novatlantis-gdp-load-cs-0` (Load Dataflow Artifacts)
  - `gs://novatlantis-gdp-trf-cs-0` (Transformation Artifacts)
  - `gs://novatlantis-gdp-dwh-lnd-cs-0` (Data Warehouse Landing Raw Storage)
  - `gs://novatlantis-gdp-dwh-cur-cs-0` (Data Warehouse Curated Storage)
  - `gs://novatlantis-gdp-dwh-conf-cs-0` (Data Warehouse Confidential Storage)
  - `gs://novatlantis-gdp-dwh-plg-cs-0` (Data Warehouse Playground Storage)
- **5 Datasets BigQuery Medallion (`us-central1`):**
  - `novatlantis:novatlantis_gdp_drp_bq_0` (Drop-off Zone)
  - `novatlantis:novatlantis_gdp_dwh_lnd_bq_0` (Landing Zone — 11 tabelas brutas com 100.000 cidadãos)
  - `novatlantis:novatlantis_gdp_dwh_cur_bq_0` (Curated Zone — `citizen_360_anonymized`, `v_mdl_users`, `v_mdl_courses`, `v_mdl_grades`, `v_gdp_executive_kpis`)
  - `novatlantis:novatlantis_gdp_dwh_conf_bq_0` (Confidential Zone — `citizens_pii_biometrics` com templates NIST e passaportes ICAO)
  - `novatlantis:novatlantis_gdp_dwh_plg_bq_0` (Playground Zone para Vertex AI / Cientistas de Dados)
- **Pub/Sub Event Bus:** `projects/novatlantis/topics/novatlantis-gdp-drp-ps-0`
- **7 Service Accounts Dedicadas:** `gdp-drp-cs-0`, `gdp-drp-ps-0`, `gdp-drp-bq-0`, `gdp-load-df-0`, `gdp-trf-df-0`, `gdp-trf-bq-0`, `gdp-orc-cmp-0` (`@novatlantis.iam.gserviceaccount.com`).

---

## 4. Credenciais Oficiais para Testes (SSO, Primeiro Login Obrigatório & Identidade 360)

| NID | Nome / Cargo | E-mail de Login | Senha Inicial (Canal Postal) | Papel Identidade 360 (`iam_role`) | Acesso ao Backstage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `NID-000-0000-0001-9` | **Jopoco (Primeiro-Ministro / Root)** | `jopoco@novatlantis.gov.cloud` | `Novatlantis@0001-9` (ou `ATs32=34`) | `PRIME_MINISTER_ROOT` | **TOTAL (Root L10)** |
| `NID-000-0000-0002-7` | **Dr. Aurelius Valerius (Secretário-Geral)** | `secretario.geral@novatlantis.gov.cloud` | `Novatlantis@0002-7` | `SECRETARY_GENERAL` | **TOTAL (Executivo L9)** |
| `NID-000-0000-0003-5` | **Helena Viana (Gestora Identidade 360)** | `gestor.identidade@novatlantis.gov.cloud` | `Novatlantis@0003-5` | `IDENTITY_MANAGER_360` | **Gestão IAM 360 (L8)** |
| `NID-000-0000-0004-3` | **Dra. Sofia Mendes (Gestora Saúde & Médica)** | `sofia.mendes@saude.novatlantis.gov.cloud` | `Novatlantis@0004-3` | `DOCTOR_AND_HEALTH_MANAGER` | **Saúde & Telemedicina (L6)** |
| `NID-000-0000-0006-0` | **Prof. Lucas Albuquerque (Gestor Educação)** | `lucas.albuquerque@educacao.novatlantis.gov.cloud` | `Novatlantis@0006-0` | `TEACHER_AND_EDU_MANAGER` | **Educação, Provas & Notas (L6)** |
| `NID-000-0000-0008-6` | **Comandante Rafael Santos** | `rafael.santos@operacoes.novatlantis.gov.cloud` | `Novatlantis@0008-6` | `OPERATIONS_311_911_MANAGER` | **Comando 311 & 911 (L6)** |
| `NID-000-0000-0009-4` | **Magistrada Clara Sterling Davis** | `clara.sterling@justica.novatlantis.gov.cloud` | `Novatlantis@0009-4` | `JUSTICE_AND_TREASURY_MANAGER` | **Justiça & Tesouro (L7)** |
| `NID-000-0000-0010-8` | **Pedro Albuquerque Viana (Estudante 11a)** | `pedro.albuquerque@cidadao.novatlantis.gov.cloud` | `Novatlantis@0010-8` | `CITIZEN_COMMON` | **Negado (Apenas Portal Cidadão)** |
