# República Digital de Novatlantis — Infraestrutura Pública Digital Soberana & Estado Agêntico

> **Idiomas da Documentação / Documentation Languages:**
> - 🇧🇷 **Português (Oficial):** [README.md](./README.md) • **Documentação Completa (PT):** [docs/DOCUMENTACAO_COMPLETA_NOVATLANTIS.md](./docs/DOCUMENTACAO_COMPLETA_NOVATLANTIS.md)
> - 🇪🇸 **Español:** [README.es.md](./README.es.md) • **Documentación Completa (ES):** [docs/DOCUMENTACAO_COMPLETA_NOVATLANTIS.es.md](./docs/DOCUMENTACAO_COMPLETA_NOVATLANTIS.es.md)
> - 🇺🇸 **English:** [README.en.md](./README.en.md) • **Full Documentation (EN):** [docs/DOCUMENTACAO_COMPLETA_NOVATLANTIS.en.md](./docs/DOCUMENTACAO_COMPLETA_NOVATLANTIS.en.md)
> - 🏛️ **Government Data Platform (GDP / EDP):** [government-data-platform/README.md](./government-data-platform/README.md)

---

## 1. Visão Geral da Nação AI-First (Design System `america.gov` + Google Material Design Persistent Navigation Drawer + AlloyDB + Government Data Platform)

A **República Digital de Novatlantis** (`novatlantis.gov.cloud`) é uma nação soberana nativa da era agêntica, projetada com inspiração direta na estética editorial e austera do portal oficial **[america.gov](https://america.gov/)** combinada com **Google Material Design (`@mui/material` v6)**, **AlloyDB for PostgreSQL** e **Government Data Platform (GDP)**, operando integralmente sobre o **Google Cloud (Projeto Argolis: `novatlantis`)**.

### Pilares Arquiteturais e de Experiência do Cidadão:
1. **Arquitetura Unificada de Idiomas (i18n Nativo em 100% das Páginas — `Português`, `Español`, `English`):**
   - Botão seletor global de idiomas (`🌐 PT | ES | EN`) sempre visível no cabeçalho superior (`TopNavUserWidget`), dentro da Navigation Drawer (Sidebar `☰`) de todas as aplicações e nas configurações do Perfil Soberano.
   - Resolução automática em 3 camadas:
     1. Override explícito do usuário no cabeçalho/sidebar (`localStorage.novatlantis_lang` ou parâmetro `?lang=pt-BR|es-419|en-US` propagado via SSO entre portais);
     2. Idioma nativo (`native_language`) registrado no perfil do cidadão autenticado no AlloyDB / GDF (`45% pt-BR`, `45% es-419`, `10% en-US`);
     3. Detecção automática via `navigator.language` / `Accept-Language`.
2. **Design System Editorial `america.gov` & Google Material Design Persistent Navigation Drawer (Sidebar sem Overlay):**
   - Paleta cívica de alto contraste (`#fcfbf9` Warm Cream, `#0a2240` Deep Navy, `#991b1b` Crimson Accent) e tipografia editorial (`Merriweather` + `Public Sans` + `JetBrains Mono`).
   - **Perfil Soberano em Página Inteira (`fullScreen`) com Navigation Drawer Lateral (`<Box component="aside">`)**: Ao abrir o Perfil Soberano, a aplicação abre em tela inteira com uma **Navigation Drawer (Sidebar) persistente ao lado** (padrão Google Material Design, sem overlay sobreposto), permitindo navegar entre Carteira Digital NID, Dados Cadastrais & Foto Oficial (com compressão automática e persistência em `citizen_profiles`), Segurança & Senha e Preferências.
   - **Menu dos Módulos como Persistent Navigation Drawer (Sidebar)**: Nos 3 portais (`landing-portal`, `citizen-portal` e `gov-backstage`), o botão Hambúrguer (`☰`) abre/recolhe uma **Navigation Drawer lateral persistente** que se posiciona ao lado do conteúdo principal (`flex`) em vez de abrir sobreposta com backdrop escuro.
3. **Separação Completa dos Módulos de Zeladoria Urbana 311 e Emergência 911 (SOS):**
   - **Zeladoria Urbana 311 (`urban_311` / `ops_311`)**: Módulo dedicado exclusivamente a chamados de manutenção urbana, iluminação pública inteligente IoT, drenagem pluvial, coleta seletiva e conservação de parques (`ops_311_tickets`).
   - **Emergência 911 (`emergency_911` / `ops_911`)**: Módulo dedicado exclusivamente ao acionamento rápido de socorro tático e médico (Unidade Móvel UTI, Defesa Civil e Guarda Costeira) com integração em tempo real ao prontuário HL7 FHIR (`ops_911_dispatches`).
4. **Autenticação Zero-Trust Sem Login Automático & Concierge IA Público:**
   - **Nenhum usuário inicia logado por padrão.** Qualquer visitante pode utilizar livremente o **Concierge IA Nacional** na Home Page para tirar dúvidas públicas em Português, Espanhol ou Inglês sem precisar de login.
   - Quando o usuário solicita um serviço pessoal ou transacional (Carteira NID, Prontuário de Saúde HL7, Boletim Escolar, Zeladoria 311, Emergência 911 ou Backstage Governamental), o portal solicita autenticação soberana (`NID` + Senha com troca obrigatória no primeiro acesso).

---

## 2. Separação das 3 Aplicações Principais Full-Stack (Produção Cloud Run + Material UI)

| Aplicação Full-Stack | Diretório no Monorepo | Serviço Cloud Run (`novatlantis`) | Papel Institucional & Funcionalidades |
| :--- | :--- | :--- | :--- |
| **1. Portal Principal da Nação + Concierge IA Nacional** | [`apps/landing-portal`](./apps/landing-portal) | [`https://novatlantis-landing-portal-wpahcxvhuq-uc.a.run.app`](https://novatlantis-landing-portal-wpahcxvhuq-uc.a.run.app) | **Home Page Estilo `america.gov` (Material UI)**: Faixa oficial governamental, cabeçalho com Persistent Navigation Drawer (`☰`), seletor global de idiomas (`PT | ES | EN`) e widget de usuário (`TopNavUserWidget`). Hero com **Concierge IA Nacional** aberto para perguntas públicas sem login e grade de 7 serviços essenciais com módulos **Zeladoria Urbana 311** e **Emergência 911** separados. |
| **2. Portal do Cidadão (Autoatendimento 360°)** | [`apps/citizen-portal`](./apps/citizen-portal) | [`https://novatlantis-citizen-portal-wpahcxvhuq-uc.a.run.app`](https://novatlantis-citizen-portal-wpahcxvhuq-uc.a.run.app) | **Aplicação Exclusiva do Cidadão (Material UI)**: Navegação interna via Persistent Navigation Drawer (`☰`) ao lado do conteúdo principal e suporte a `PT | ES | EN`. Inclui 7 módulos independentes: (1) Carteira Soberana NID, (2) Grafo Familiar Read-Only & Endereço, (3) Saúde HL7 & Telemedicina IA, (4) Educação & Notas Escolares, (5) **Zeladoria Urbana 311**, (6) **Emergência 911 (SOS Tático & Médico)** e (7) Economia, Empresas em 45s & Passaporte ICAO. |
| **3. Backstage Governamental & Identidade 360** | [`apps/gov-backstage`](./apps/gov-backstage) | [`https://novatlantis-gov-backstage-wpahcxvhuq-uc.a.run.app`](https://novatlantis-gov-backstage-wpahcxvhuq-uc.a.run.app) | **Aplicação Exclusiva de Servidores e Gestores Públicos (Material UI)**: Navegação entre os 7 ambientes administrativos via Persistent Navigation Drawer (`☰`) lateral com suporte a `PT | ES | EN` e controle **Identidade 360 (RBAC/ABAC)**. Inclui: (1) Gabinete do Primeiro-Ministro (**Joao Thiago Poço - JT**), (2) Gestão IAM 360, (3) Gestão de Hospitais e Médicos, (4) Gestão de Escolas/Provas/Notas, (5) **Comando de Zeladoria Urbana 311**, (6) **Central de Despacho de Emergência 911** e (7) Justiça, Tesouro, AlloyDB & GDP 100k. |

---

## 3. Banco de Dados AlloyDB for PostgreSQL & Government Data Platform (GDP)

### 3.1 AlloyDB for PostgreSQL (`novatlantis-sovereign-cluster`)
- **Cluster URI:** `projects/novatlantis/locations/us-central1/clusters/novatlantis-sovereign-cluster`
- **Primary Instance URI:** `projects/novatlantis/locations/us-central1/clusters/novatlantis-sovereign-cluster/instances/novatlantis-primary-01`
- **Private Services Access IP (VPC `novatlantis-vpc`):** `10.223.28.2:5432`
- **Schema DDL:** [`data-generator/sql/01_novatlantis_alloydb_schema.sql`](./data-generator/sql/01_novatlantis_alloydb_schema.sql)
- **Persistência de Perfil e Foto Oficial:** `PUT /api/v1/profile/me` realiza `UPSERT` na tabela `citizen_profiles` (`photo_url`, `social_name`, `preferred_contact`, `accessibility_needs`) e sincroniza `native_language` em `dim_citizens` tanto no AlloyDB quanto no banco embarcado SQLite WAL.

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
| `NID-000-0000-0001-9` | **Joao Thiago Poço (JT) — Primeiro-Ministro / Root** | `jt@novatlantis.gov.cloud` | `Novatlantis@0001-9` | `PRIME_MINISTER_ROOT` | **TOTAL (Root L10)** |
| `NID-000-0000-0002-7` | **Dr. Aurelius Valerius (Secretário-Geral)** | `secretario.geral@novatlantis.gov.cloud` | `Novatlantis@0002-7` | `SECRETARY_GENERAL` | **TOTAL (Executivo L9)** |
| `NID-000-0000-0003-5` | **Helena Viana (Gestora Identidade 360)** | `gestor.identidade@novatlantis.gov.cloud` | `Novatlantis@0003-5` | `IDENTITY_MANAGER_360` | **Gestão IAM 360 (L8)** |
| `NID-000-0000-0004-3` | **Dra. Sofia Mendes (Gestora Saúde & Médica)** | `sofia.mendes@saude.novatlantis.gov.cloud` | `Novatlantis@0004-3` | `DOCTOR_AND_HEALTH_MANAGER` | **Saúde & Telemedicina (L6)** |
| `NID-000-0000-0006-0` | **Prof. Lucas Albuquerque (Gestor Educação)** | `lucas.albuquerque@educacao.novatlantis.gov.cloud` | `Novatlantis@0006-0` | `TEACHER_AND_EDU_MANAGER` | **Educação, Provas & Notas (L6)** |
| `NID-000-0000-0008-6` | **Comandante Rafael Santos** | `rafael.santos@operacoes.novatlantis.gov.cloud` | `Novatlantis@0008-6` | `OPERATIONS_311_911_MANAGER` | **Comando 311 & 911 (L6)** |
| `NID-000-0000-0009-4` | **Magistrada Clara Sterling Davis** | `clara.sterling@justica.novatlantis.gov.cloud` | `Novatlantis@0009-4` | `JUSTICE_AND_TREASURY_MANAGER` | **Justiça & Tesouro (L7)** |
| `NID-000-0000-0010-8` | **Pedro Albuquerque Viana (Estudante 11a)** | `pedro.albuquerque@cidadao.novatlantis.gov.cloud` | `Novatlantis@0010-8` | `CITIZEN_COMMON` | **Negado (Apenas Portal Cidadão)** |
