# Documentação Funcional e Técnica Completa — República Digital de Novatlantis

> **Idiomas da Documentação Completa / Full Documentation Languages:**
> - 🇧🇷 **Português (Oficial):** [DOCUMENTACAO_COMPLETA_NOVATLANTIS.md](./DOCUMENTACAO_COMPLETA_NOVATLANTIS.md)
> - 🇪🇸 **Español:** [DOCUMENTACAO_COMPLETA_NOVATLANTIS.es.md](./DOCUMENTACAO_COMPLETA_NOVATLANTIS.es.md)
> - 🇺🇸 **English:** [DOCUMENTACAO_COMPLETA_NOVATLANTIS.en.md](./DOCUMENTACAO_COMPLETA_NOVATLANTIS.en.md)

**Lema Constitucional:** `NOVATLANTIS • LIBERTAS IN DIGITALI`  
**Design System Oficial:** `Sovereign Civic` / `america.gov` + **Google Material Design Persistent Navigation Drawer**  
**Google Cloud Project ID (Argolis):** `novatlantis` (`1054221034062`)  
**Repositório Oficial GitHub:** `https://github.com/billebr/novatlantis` (`git@github.com:billebr/novatlantis.git`)  
**Primeiro-Ministro & Administrador Geral (Root):** `Joao Thiago Poço (JT)` (`NID-000-0000-0001-9` / `jt@novatlantis.gov.cloud`)

---

## 1. Visão Arquitetural e Design System "Sovereign Civic" (`america.gov` + Google Material Design)

A República Digital de Novatlantis adota o sistema de design **Sovereign Civic** inspirado diretamente em **[america.gov](https://america.gov/)** e nas diretrizes de navegação do **Google Material Design (`@mui/material` v6)**, concebido para refletir **austeridade institucional, transparência algorítmica e trabalho público contínuo em prol da população**.

### 1.1 Diretrizes Visuais, Tokens e Navegação Material Design
- **Superfícies Claras e Austeras:**
  - Fundo Primário (`surface`): `#FCFBF9` (Warm Cream Editorial) / `#F7F9FC`
  - Cartões Institucionais (`surface-container-lowest`): `#FFFFFF` (Pure White)
  - Container Secundário (`surface-container-low`): `#F2F4F7`
  - Bordas Estruturais (`civic-border` / `outline-variant`): `1px solid #E5E4DC` / `#DCE3EC`
- **Cores de Autoridade de Estado:**
  - Cabeçalho Soberano (`primary-container` / `sovereign-navy`): `#0A2240` / `#002046`
  - Azul Administrativo (`secondary`): `#0061A5`
  - Verde-Teal de Consenso Verificado (`tertiary`): `#006B5B`
  - Vermelho de Emergência Civil 911 (`error`): `#991B1B` / `#BA1A1A`
- **Tipografia Oficial:**
  - Títulos Editoriais de Estado: `Merriweather` (`700`, `900`)
  - Rótulos Oficiais e Corpo de Texto: `Public Sans` / `Inter` (`400`, `600`, `700`, `800`) com `tabular-nums`
  - Identificadores Criptográficos, NIDs e Hashs: `JetBrains Mono`
- **Padrão Google Material Design Persistent Navigation Drawer (Sidebar sem Overlay):**
  - **Perfil Soberano em Página Inteira (`fullScreen`) com Sidebar Lateral:** Ao clicar no perfil do cidadão (`TopNavUserWidget`), a aplicação abre uma visualização de **Página Inteira (`fullScreen`)** com uma **Navigation Drawer (Sidebar) lateral persistente (`<Box component="aside">`)** posicionada ao lado do conteúdo principal (`flex: 1`), sem janelas sobrepostas (overlay).
  - **Menu dos Módulos em Persistent Navigation Drawer (Sidebar):** Nos 3 portais (`landing-portal`, `citizen-portal` e `gov-backstage`), o botão Hambúrguer (`☰`) abre ou recolhe uma **Navigation Drawer (Sidebar) lateral persistente** que divide o layout horizontalmente com `<main>`, seguindo o padrão Google Material Design em vez de abrir um drawer modal sobreposto.

---

## 2. Government Data Framework (GDF) — Base de 100.000 Cidadãos, AlloyDB & Government Data Platform (GDP)

Toda a operação da República apoia-se em uma população sintética íntegra de **100.000 cidadãos** gerada pelo motor determinístico [`data-generator/generate_novatlantis_lakehouse.py`](../data-generator/generate_novatlantis_lakehouse.py) e persistida no **AlloyDB for PostgreSQL** e na **Government Data Platform (GDP)**.

### 2.1 Arquitetura Transacional (AlloyDB) e Analítica Medalhão (GDP no Google Cloud `novatlantis`)
1. **Camada Transacional Soberana (AlloyDB for PostgreSQL):**
   - **Cluster AlloyDB:** `projects/novatlantis/locations/us-central1/clusters/novatlantis-sovereign-cluster`
   - **Instância Primária:** `novatlantis-primary-01` (`10.223.28.2:5432` via Direct VPC Egress na `novatlantis-vpc`)
   - **Fallback Local de Baixa Latência:** `gdf_sovereign.db` (SQLite WAL sincronizado nos microsserviços).
2. **Camada Analítica Medalhão (Government Data Platform — BigQuery & Cloud Storage):**
   - **7 Buckets Cloud Storage (`us-central1`):** `gs://novatlantis-gdp-drp-cs-0`, `gs://novatlantis-gdp-load-cs-0`, `gs://novatlantis-gdp-trf-cs-0`, `gs://novatlantis-gdp-dwh-lnd-cs-0`, `gs://novatlantis-gdp-dwh-cur-cs-0`, `gs://novatlantis-gdp-dwh-conf-cs-0`, `gs://novatlantis-gdp-dwh-plg-cs-0`.
   - **Datasets BigQuery:** `novatlantis_gdp_drp_bq_0`, `novatlantis_gdp_dwh_lnd_bq_0` (Landing), `novatlantis_gdp_dwh_cur_bq_0` (Curated), `novatlantis_gdp_dwh_conf_bq_0` (Confidential PII/NIST), `novatlantis_gdp_dwh_plg_bq_0` (Playground) e `gdf_bronze` / `gdf_silver` / `gdf_gold`.

### 2.2 Dicionário de Dados das Tabelas GDF (100.000 Cidadãos)

| Domínio | Tabela | Volume | Chave Primária / Estrangeira | Descrição Funcional e Técnica |
| :--- | :--- | :--- | :--- | :--- |
| **1. Identidade Civil** | `dim_citizens` | `100.000` | `citizen_id` (`NID-AAA-BBBB-CCCC-D`) | Dados civis completos, idade (0 a 100 anos), idioma nativo (`pt-BR` 45%, `es-419` 45%, `en-US` 10%), credencial profissional, papel 360 e UBI. |
| **1. Perfil Soberano** | `citizen_profiles` | Dinâmico | `nid` (PK/FK) | Foto oficial comprimida (`photo_url`), nome social (`social_name`), canal preferencial (`preferred_contact`) e acessibilidade (`accessibility_needs`). |
| **1. Biometria NIST** | `sec_biometrics_nist` | `100.000` | `citizen_id` (FK) | Hash facial ISO/IEC 19794-5, vetor de minúcias digitais ISO/IEC 19794-2 `(x, y, θ, qualidade)` e chave pública `Ed25519`. |
| **1. Grafo Familiar** | `rel_family_graph` | `71.425` | `relation_id` (`source_nid`, `target_nid`) | Grafo direcionado de parentesco (`CONJUGE`, `PAI_MAE_DE`, `FILHO_A_DE`, `IRMAO_A_DE`) com validação etária estrita e exposição estritamente Read-Only. |
| **2. Território** | `dim_addresses` | `50.000` | `address_id` | Imóveis georreferenciados nos 6 distritos de Novatlantis com coordenadas GPS e consumo de Smart Grid. |
| **3. Saúde HL7** | `health_records` | `100.000` | `citizen_id` | Tipo sanguíneo, alergias, condições crônicas, hospital de referência (`HOSP-NV-01` a `06`), médico de família e status vacinal. |
| **4. Escolas & Notas** | `edu_enrollments` | `20.440` | `enrollment_id` (`student_nid`) | Estudantes de 4 a 17 anos com notas em Matemática, Ciências, IA & Robótica, Idiomas e frequência (`attendance_rate`). |
| **5. Zeladoria 311** | `ops_311_tickets` | Dinâmico | `ticket_id` (`citizen_nid`) | Chamados dedicados de zeladoria urbana, iluminação inteligente IoT, drenagem pluvial e coleta seletiva. |
| **6. Emergência 911** | `ops_911_dispatches` | Dinâmico | `dispatch_id` (`citizen_nid`) | Despachos táticos e médicos imediatos (UTI Móvel, Defesa Civil e Guarda Costeira) com protocolo de IA. |
| **7. Passaportes** | `sec_passports` | `60.008` | `passport_number` (`nid`) | Passaportes biométricos padrão ICAO Doc 9303 com linhas MRZ. |
| **8. Identidade 360** | `iam_identity_360_roles` | Dinâmico | `grant_id` (`nid`) | Outorgas e revogações de acesso administrativo ao Backstage governamental. |

---

## 3. Governança de Acesso: Login Unificado & Aplicação Identidade 360

### 3.1 Princípio do Login Único Cidadão / Servidor Público
Não existem contas separadas para cidadãos e servidores públicos. Todo indivíduo autentica-se com seu **NID (`NID-AAA-BBBB-CCCC-D`)** ou **E-mail Cívico**.
No momento do login (`POST /api/auth/login` ou `POST /api/v1/auth/login`), o motor consulta a tabela de papéis da **Identidade 360**:
1. Se o cidadão possuir nomeação ativa, recebe seu papel administrativo (`effective_role_code`) e os escopos do respectivo Ministério no **Backstage Governamental**.
2. **Revogação Imediata:** Uma vez que a permissão é removida na aplicação **Identidade 360** (`POST /api/iam360/revoke`), `iam_role` retorna imediatamente a `CITIZEN_COMMON`. O usuário volta instantaneamente a ser **Cidadão Comum** e perde o acesso aos módulos administrativos.

### 3.2 Cadeia de Comando Constitucional e Perfis Nomeados

| NID | Nome / Cargo | E-mail de Login | Senha Inicial (Canal Postal) | Papel Identidade 360 | Atribuições no Sistema |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `NID-000-0000-0001-9` | **Joao Thiago Poço (JT)** (Primeiro-Ministro & Root) | `jt@novatlantis.gov.cloud` | `Novatlantis@0001-9` | `PRIME_MINISTER_ROOT` | Administrador Geral da Nação. Nomeia/destitui o Gestor de Identidades 360 e possui acesso total a todos os ministérios. |
| `NID-000-0000-0002-7` | **Dr. Aurelius Valerius** (Secretário-Geral) | `secretario.geral@novatlantis.gov.cloud` | `Novatlantis@0002-7` | `SECRETARY_GENERAL` | Apoia o Primeiro-Ministro (JT) na coordenação interministerial e governança de estado. |
| `NID-000-0000-0003-5` | **Helena Viana** (Gestora Identidade 360) | `gestor.identidade@novatlantis.gov.cloud` | `Novatlantis@0003-5` | `IDENTITY_MANAGER_360` | Nomeada pelo Primeiro-Ministro. Concede e revoga acessos de Backstage conforme o perfil profissional do servidor. |
| `NID-000-0000-0004-3` | **Dra. Sofia Mendes Costa** | `sofia.mendes@saude.novatlantis.gov.cloud` | `Novatlantis@0004-3` | `DOCTOR_AND_HEALTH_MANAGER` | Gestora Pública de Saúde e Médica de Telemedicina (`HOSP-NV-01`). |
| `NID-000-0000-0005-1` | **Dr. Mateo Vargas Ríos** | `mateo.vargas@saude.novatlantis.gov.cloud` | `Novatlantis@0005-1` | `DOCTOR_TELEMED` | Médico Clínico de Telemedicina (`HOSP-NV-02`). |
| `NID-000-0000-0006-0` | **Prof. Lucas Albuquerque Silva** | `lucas.albuquerque@educacao.novatlantis.gov.cloud` | `Novatlantis@0006-0` | `TEACHER_AND_EDU_MANAGER` | Gestor Educacional e Professor (`SCH-NV-002`). Pai de Pedro (`NID-000-0000-0010-8`). |
| `NID-000-0000-0007-8` | **Profa. Valeria Ríos Hernández** | `valeria.rios@educacao.novatlantis.gov.cloud` | `Novatlantis@0007-8` | `TEACHER_EDUCATOR` | Professora da Rede Pública Nacional. |
| `NID-000-0000-0008-6` | **Comandante Rafael Santos** | `rafael.santos@operacoes.novatlantis.gov.cloud` | `Novatlantis@0008-6` | `OPERATIONS_311_911_MANAGER` | Comandante dos módulos separados de Zeladoria Urbana 311 e Despacho de Emergência 911. |
| `NID-000-0000-0009-4` | **Magistrada Clara Sterling Davis** | `clara.sterling@justica.novatlantis.gov.cloud` | `Novatlantis@0009-4` | `JUSTICE_AND_TREASURY_MANAGER` | Magistrada da Suprema Corte Digital, Passaportes ICAO e Tesouro Soberano. |
| `NID-000-0000-0010-8` | **Pedro Albuquerque Viana** (11 anos) | `pedro.albuquerque@cidadao.novatlantis.gov.cloud` | `Novatlantis@0010-8` | `CITIZEN_COMMON` | Estudante do Ensino Fundamental II (`SCH-NV-002`). Acesso exclusivo ao Portal do Cidadão. |

---

## 4. Documentação Funcional dos 3 Ambientes e Separação dos Módulos 311 e 911

### 4.1 Portal Principal da Nação (`apps/landing-portal`)
- **Persistent Navigation Drawer (Sidebar `☰`):** Abre ao lado da página principal (padrão Google Material Design), exibindo os links diretos para os módulos do cidadão e ambientes administrativos.
- **Concierge IA Nacional Público:** Permite que qualquer visitante faça perguntas sobre os serviços do Estado em Português, Espanhol ou Inglês sem precisar estar logado.
- **Grade de 7 Serviços Essenciais Soberanos:** Inclui cartões independentes para **Zeladoria Urbana 311** (`?tab=urban_311`) e **Emergência 911 (SOS Tático & Médico)** (`?tab=emergency_911`).

### 4.2 Portal do Cidadão (`apps/citizen-portal`) — 7 Módulos Independentes com Sidebar Persistente
1. **1. Carteira Soberana NID & Biometria NIST (`identity`):** Credencial Mod-11, chave pública `Ed25519`, score facial NIST e auditoria Zero-Trust de 48h.
2. **2. Grafo Familiar & Endereço Soberano (`family_address`):** Visualização estritamente Read-Only do grafo familiar (`rel_family_graph`) e atualização de domicílio em tempo real.
3. **3. Saúde HL7 & Telemedicina 24/7 (`health`):** Prontuário Eletrônico Nacional HL7 FHIR e realização de teleconsultas assistidas por IA com receita digital ICP.
4. **4. Educação & Notas Escolares (`education`):** Boletim escolar por matéria (`Matemática`, `Ciências`, `IA & Robótica`, `Idiomas`) e frequência sincronizados com o Backstage dos professores.
5. **5. Zeladoria Urbana 311 (`urban_311`):** Módulo dedicado exclusivamente à abertura e acompanhamento de protocolos de manutenção urbana (`ops_311_tickets`).
6. **6. Emergência 911 — SOS Tático & Médico (`emergency_911`):** Módulo dedicado exclusivamente ao acionamento rápido de socorro 911 (UTI Móvel, Defesa Civil e Guarda Costeira) com monitoramento de ETA em tempo real (`ops_911_dispatches`).
7. **7. Economia, Empresa em 45s & Passaporte ICAO (`treasury`):** Abertura instantânea de empresas (`GovBiz 45s`) e emissão de Passaporte Biométrico ICAO Doc 9303.

### 4.3 Ambiente de Backstage Governamental (`apps/gov-backstage`) — 7 Ambientes Administrativos com Sidebar Persistente
1. **1. Gabinete do Primeiro-Ministro (`Joao Thiago Poço - JT`) & Secretário-Geral (`pm_cabinet`):** Comando executivo da nação e KPIs em tempo real do Government Data Fabric (100.000 cidadãos).
2. **2. Aplicação Identidade 360 (`iam360`):** Concessão e revogação instantânea de papéis administrativos RBAC/ABAC com reversão imediata para `CITIZEN_COMMON`.
3. **3. Gestão da Saúde, Hospitais & Médicos (`health_mgmt`):** Monitoramento das 6 unidades hospitalares e fila nacional de telemedicina.
4. **4. Gestão da Educação, Escolas, Provas & Notas (`edu_mgmt`):** Diário de classe do professor para lançamento de notas por matéria e publicação de provas nacionais.
5. **5. Comando de Zeladoria Urbana 311 (`ops_311`):** Fila dedicada exclusivamente ao atendimento e conclusão de chamados urbanos 311 abertos pelos cidadãos (`POST /api/services/311/resolve`).
6. **6. Central de Despacho de Emergência 911 (`ops_911`):** Console dedicado exclusivamente ao monitoramento em tempo real de despachos táticos e médicos 911 (`ops_911_dispatches`).
7. **7. Justiça, Tesouro, AlloyDB & GDP 100k (`justice_datalake`):** Explorador SQL em tempo real sobre os 100.000 cidadãos no AlloyDB (`10.223.28.2:5432`) e BigQuery GDP (`novatlantis_gdp_dwh_cur_bq_0`).

---

## 5. Referência Técnica de APIs REST

| Método | Endpoint | Descrição |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Status operacional do AlloyDB, SQLite WAL (100k cidadãos) e datasets da Government Data Platform no GCP. |
| `POST` | `/api/v1/auth/login` | Autentica por NID ou E-mail com verificação de senha, bloqueio de força bruta e token JWT (`FIRST_LOGIN_REQUIRED` ou `FULL_ACCESS`). |
| `POST` | `/api/v1/auth/first-login-password` | Troca obrigatória da senha inicial postal no primeiro login e emissão de sessão soberana completa. |
| `GET` | `/api/v1/profile/me` | Retorna o perfil completo do cidadão autenticado, incluindo foto oficial (`photo_url`), idioma nativo (`native_language`) e grafo familiar Read-Only (`family_links`). |
| `PUT` | `/api/v1/profile/me` | Persiste alterações de perfil (`photo_url` comprimido em Base64, `social_name`, `preferred_contact`, `accessibility_needs`, `native_language`, `street_address`, `district`) via `UPSERT` em `citizen_profiles` e `dim_citizens` no **AlloyDB** e no SQLite WAL. |
| `GET` | `/api/gdf/search?q=&limit=` | Pesquisa SQL sobre os 100.000 cidadãos com filtro por nome, NID, profissão ou distrito. |
| `GET` | `/api/iam360/roles` | Lista todas as permissões ativas na aplicação Identidade 360. |
| `POST` | `/api/iam360/grant` | Concede permissão administrativa de Backstage na Identidade 360. |
| `POST` | `/api/iam360/revoke` | Revoga permissão administrativa e reverte o usuário imediatamente para `CITIZEN_COMMON`. |
| `POST` | `/api/services/311` | Registra novo chamado no módulo dedicado de **Zeladoria Urbana 311** (`ops_311_tickets`). |
| `POST` | `/api/services/311/resolve` | Conclui chamado 311 pelo servidor público no **Comando de Zeladoria Urbana 311**. |
| `POST` | `/api/services/911` | Dispara protocolo imediato no módulo dedicado de **Emergência 911** (`ops_911_dispatches`). |
| `POST` | `/api/services/company` | Constitui empresa autônoma em 45 segundos vinculada ao NID do cidadão. |
| `POST` | `/api/services/passport` | Emite ou revalida Passaporte Biométrico ICAO Doc 9303. |
