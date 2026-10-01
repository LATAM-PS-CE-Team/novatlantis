# República Digital de Novatlantis — Infraestrutura Pública Digital Soberana & Estado Agêntico

> **Idiomas da Documentação / Documentation Languages:**
> - 🇧🇷 **Português (Oficial):** [README.md](./README.md)
> - 🇪🇸 **Español:** [README.es.md](./README.es.md)
> - 🇺🇸 **English:** [README.en.md](./README.en.md)
> - 📘 **Manual Funcional e Técnico Completo:** [docs/DOCUMENTACAO_COMPLETA_NOVATLANTIS.md](./docs/DOCUMENTACAO_COMPLETA_NOVATLANTIS.md)

---

## 1. Visão Geral da Nação AI-First

A **República Digital de Novatlantis** (`novatlantis.gov.cloud`) é uma nação soberana nativa da era agêntica, projetada sob o paradigma estético e funcional **Sovereign Civic** (inspirado na austeridade institucional do **GOV.UK** e na interoperabilidade da **e-Estonia**), operando integralmente sobre o **Google Cloud (Projeto Argolis: `novatlantis`)**.

A arquitetura do Estado foi estruturada em **3 Aplicações Full-Stack Completas e Independentes** (cada uma com seu próprio **Frontend React + Tailwind CSS** e **Backend Node.js 22 + SQLite `node:sqlite`**) mais **5 Microsserviços Setoriais**, utilizando o **Datalake Soberano de 100.000 Cidadãos (`dim_citizens`) como Módulo Unificado de Usuários (SSO & RBAC/ABAC)**.

---

## 2. Separação das 3 Aplicações Principais Full-Stack (Produção Cloud Run)

| Aplicação Full-Stack | Diretório no Monorepo | Serviço Cloud Run (`novatlantis`) | Papel Institucional & Funcionalidades |
| :--- | :--- | :--- | :--- |
| **1. Portal Principal da Nação + Chat do Agente Orquestrador** | [`apps/landing-portal`](./apps/landing-portal) | [`https://novatlantis-landing-portal-wpahcxvhuq-uc.a.run.app`](https://novatlantis-landing-portal-wpahcxvhuq-uc.a.run.app) | **Página Principal da Nação**: Apresenta o balanço nacional em tempo real, a matriz de eventos da vida e a **Barra de Busca Central controlada pelo Agente Orquestrador de Estado**, que abre um **Chat Interativo** para o cidadão dialogar com os serviços públicos e executar transações reais no banco de 100.000 cidadãos. |
| **2. Portal do Cidadão (Autoatendimento 360°)** | [`apps/citizen-portal`](./apps/citizen-portal) | [`https://novatlantis-citizen-portal-wpahcxvhuq-uc.a.run.app`](https://novatlantis-citizen-portal-wpahcxvhuq-uc.a.run.app) | **Aplicação Exclusiva do Cidadão**: Utiliza a base de 100.000 cidadãos como módulo de usuários. Inclui Carteira Soberana NID (Mod-11 + Biometria NIST), Grafo Familiar (`rel_family_graph`), gestão de endereço, Prontuário de Saúde HL7 e Telemedicina com IA, Boletim Escolar por matéria, Zeladoria 311, SOS 911, abertura de empresa em 45s e Passaporte ICAO. |
| **3. Backstage Governamental & Identidade 360** | [`apps/gov-backstage`](./apps/gov-backstage) | [`https://novatlantis-gov-backstage-wpahcxvhuq-uc.a.run.app`](https://novatlantis-gov-backstage-wpahcxvhuq-uc.a.run.app) | **Aplicação Exclusiva de Servidores e Gestores Públicos**: Controlada pela aplicação **Identidade 360 (RBAC/ABAC)**. Inclui o Gabinete do Primeiro-Ministro (`jopoco`) e Secretário-Geral, Gestão de Identidades 360 (concessão/revogação imediata de acessos), Gestão de Hospitais e Médicos, Gestão de Escolas, Professores, Provas e Notas, Comando 311/911 e Explorador do Datalake de 100k cidadãos. |

### Microsserviços Setoriais Adicionais em Produção (`us-central1`)
- **Identidade Soberana NID (`identity-nid`)**: `https://novatlantis-identity-nid-wpahcxvhuq-uc.a.run.app`
- **Zeladoria Urbana 311 (`services-311`)**: `https://novatlantis-services-311-wpahcxvhuq-uc.a.run.app`
- **Despacho de Emergência 911 (`emergency-911`)**: `https://novatlantis-emergency-911-wpahcxvhuq-uc.a.run.app`
- **Prontuário & Telemedicina (`health-telemed`)**: `https://novatlantis-health-telemed-wpahcxvhuq-uc.a.run.app`
- **Educação & Tutoria IA (`education-learn`)**: `https://novatlantis-education-learn-wpahcxvhuq-uc.a.run.app`

---

## 3. Agente Orquestrador de Estado via Chat (Portal Principal da Nação)

No **Portal Principal da Nação (`apps/landing-portal`)**, a barra de busca central é operada pelo **Agente Orquestrador de Estado (`POST /api/orchestrator/chat`)**:
1. Ao digitar uma demanda ou clicar em qualquer sugestão na página principal, abre-se o **Console de Chat do Agente Orquestrador**.
2. O Agente identifica automaticamente o cidadão autenticado na base de **100.000 cidadãos (`dim_citizens`)**, classifica a intenção (`CITIZEN_360_SUMMARY`, `PASSPORT_ICAO`, `GOVBIZ_45S`, `HEALTH_TELEMED`, `EDUCATION_GRADES`, `URBAN_311`, `EMERGENCY_911`, `IAM_BACKSTAGE`), executa a transação real no banco SQLite e exibe:
   - **Resposta Institucional Contextualizada** com os dados reais do cidadão;
   - **Trace de Orquestração Multi-Agente** detalhando a latência e os agentes acionados (`Orchestrator-Core`, `GDF-Query-Engine`, `Health-Telemed-Agent`, `GovBiz-45s-Agent`, etc.);
   - **Card de Transação Oficial** com botão de 1 clique para abrir o registro diretamente no **Portal do Cidadão** ou no **Backstage Governamental**.

---

## 4. Base de Dados Soberana e Datalake (100.000 Cidadãos como Módulo de Usuários)

O script [`data-generator/generate_novatlantis_lakehouse.py`](./data-generator/generate_novatlantis_lakehouse.py) gera o banco relacional embarcado `gdf_sovereign.db` e os arquivos analíticos no Cloud Storage (`gs://novatlantis-gdf-lakehouse/bronze/`):

- **`dim_citizens` (100.000 registros)**: Identidade NID Mod-11, nome, e-mail, idade (0 a 100 anos), idioma nativo (`pt-BR` 45%, `es-419` 45%, `en-US` 10%), profissão, especialidade, endereço, distrito e papel na **Identidade 360 (`iam_role`)**.
- **`rel_family_graph` (71.425 registros)**: Grafo familiar bidirecional (`SPOUSE`, `PARENT_OF`, `CHILD_OF`, `SIBLING`) com guarda legal e contato de emergência.
- **`health_records` (100.000 registros)**: Tipo sanguíneo, alergias, condições crônicas, doador de órgãos e médico de família vinculado.
- **`edu_enrollments` (20.440 registros)**: Matrículas escolares, professor regente, frequência e notas em **Matemática, Ciências, IA & Robótica e Idiomas**.
- **`sec_passports` (44.088 registros)**: Passaportes biométricos padrão ICAO Doc 9303 com linhas MRZ verificáveis.
- **`justice_records` (100.000 registros)**: Certidão judicial e admissibilidade de fronteira.

### Credenciais Oficiais para Testes (SSO & Identidade 360)

| NID | Nome / Cargo | E-mail de Login | Papel Identidade 360 (`iam_role`) | Acesso ao Backstage |
| :--- | :--- | :--- | :--- | :--- |
| `NID-000-0000-0001-9` | **Jopoco (Primeiro-Ministro / Root)** | `jopoco@novatlantis.gov.cloud` / `admin@jopoco.altostrat.com` | `PRIME_MINISTER_ROOT` | **TOTAL (Root L10)** |
| `NID-000-0000-0002-7` | **Dr. Aurelius Valerius (Secretário-Geral)** | `secretario.geral@novatlantis.gov.cloud` | `SECRETARY_GENERAL` | **TOTAL (Executivo L9)** |
| `NID-000-0000-0003-5` | **Helena Viana (Gestora Identidade 360)** | `gestor.identidade@novatlantis.gov.cloud` | `IDENTITY_MANAGER_360` | **Gestão IAM 360 (L8)** |
| `NID-000-0000-0004-3` | **Dra. Sofia Mendes (Gestora Saúde & Médica)** | `sofia.mendes@saude.novatlantis.gov.cloud` | `DOCTOR_AND_HEALTH_MANAGER` | **Saúde & Telemedicina (L6)** |
| `NID-000-0000-0006-0` | **Prof. Lucas Albuquerque (Gestor Educação)** | `lucas.albuquerque@educacao.novatlantis.gov.cloud` | `TEACHER_AND_EDU_MANAGER` | **Educação, Provas & Notas (L6)** |
| `NID-000-0000-0008-6` | **Comandante Rafael Santos** | `rafael.santos@operacoes.novatlantis.gov.cloud` | `OPERATIONS_311_911_MANAGER` | **Comando 311 & 911 (L6)** |
| `NID-000-0000-0009-4` | **Magistrada Clara Sterling Davis** | `clara.sterling@justica.novatlantis.gov.cloud` | `JUSTICE_AND_TREASURY_MANAGER` | **Justiça & Tesouro (L7)** |
| `NID-000-0000-0010-8` | **Pedro Albuquerque Viana (Estudante 11a)** | `pedro.albuquerque@cidadao.novatlantis.gov.cloud` | `CITIZEN_COMMON` | **Negado (Apenas Portal Cidadão)** |

---

## 5. Como Executar e Fazer Deploy no Google Cloud (Argolis)

```bash
# 1. Gerar a base completa de 100.000 cidadãos e o Datalake SQLite + NDJSON.gz
python3 data-generator/generate_novatlantis_lakehouse.py

# 2. Provisionar e implantar todas as aplicações full-stack no Cloud Run (Projeto: novatlantis)
bash infra/argolis/cloudrun-deploy.sh
```
