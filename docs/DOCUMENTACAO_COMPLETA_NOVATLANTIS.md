# Documentação Funcional e Técnica Completa — República Digital de Novatlantis

**Lema Constitucional:** `NOVATLANTIS • LIBERTAS IN DIGITALI`  
**Design System Oficial:** `Sovereign Civic` (Austeridade Institucional, Clareza Cívica e Estado AI-First)  
**Google Cloud Project ID (Argolis):** `novatlantis` (`1054221034062`)  
**Repositório Oficial GitHub:** `https://github.com/billebr/novatlantis` (`git@github.com:billebr/novatlantis.git`)  
**Primeiro-Ministro & Administrador Geral (Root):** `Jopoco` (`NID-000-0000-0001-9` / `admin@jopoco.altostrat.com` / `jopoco@novatlantis.gov.cloud`)

---

## 1. Visão Arquitetural e Design System "Sovereign Civic"

A República Digital de Novatlantis adota o sistema de design **Sovereign Civic**, concebido para refletir **austeridade institucional, transparência algorítmica e trabalho público contínuo em prol da população**.

### 1.1 Diretrizes Visuais e Tokens
- **Superfícies Claras e Austeras:**
  - Fundo Primário (`surface`): `#F7F9FC` (Titanium Cool Gray)
  - Cartões Institucionais (`surface-container-lowest`): `#FFFFFF` (Pure White)
  - Container Secundário (`surface-container-low`): `#F2F4F7`
  - Bordas Estruturais (`civic-border` / `outline-variant`): `1px solid #C6C6CE` / `#DCE3EC`
- **Cores de Autoridade de Estado:**
  - Cabeçalho Soberano (`primary-container` / `sovereign-navy`): `#141A32` / `#0A1128`
  - Azul Administrativo (`secondary`): `#0061A5`
  - Verde-Teal de Consenso Verificado (`tertiary` / `tertiary-fixed`): `#006B5B` / `#57FBDB`
  - Vermelho de Emergência Civil (`error`): `#BA1A1A`
- **Tipografia Oficial:**
  - Títulos e Rótulos Oficiais: `Public Sans` (`600`, `700`, `800`)
  - Corpo de Texto e Tabelas de Alta Densidade: `Inter` (`400`, `500`, `600`) com `tabular-nums`
  - Identificadores Criptográficos, NIDs e Hashs: `JetBrains Mono`
  - Iconografia: `Material Symbols Outlined`

---

## 2. Government Data Framework (GDF) — Base de 100.000 Cidadãos & Data Lakehouse

Toda a operação da República apoia-se em uma população sintética íntegra de **100.000 cidadãos** gerada pelo motor determinístico [`data-generator/generate_novatlantis_lakehouse.py`](../data-generator/generate_novatlantis_lakehouse.py).

### 2.1 Arquitetura Medalhão no Google Cloud (`novatlantis`)
1. **Camada Bronze (Raw / Ingestão Imutável):**
   - **Cloud Storage Bucket:** `gs://novatlantis-gdf-lakehouse/bronze/*.ndjson.gz`
   - Dataset BigQuery: `novatlantis:gdf_bronze`
2. **Camada Silver (Trusted & Relacional / Grafo):**
   - Dataset BigQuery: `novatlantis:gdf_silver` (11 tabelas normalizadas com integridade referencial)
   - Banco Operacional de Baixa Latência: `apps/landing-portal/gdf_sovereign.db` (SQLite WAL embarcado no serviço mestre para consultas e mutações transacionais em `< 5ms`).
3. **Camada Gold (Visões Analíticas Interministeriais):**
   - Dataset BigQuery: `novatlantis:gdf_gold`
   - Views Analíticas:
     - `novatlantis.gdf_gold.vw_border_passport_clearance`
     - `novatlantis.gdf_gold.vw_school_truancy_family_alerts`
     - `novatlantis.gdf_gold.vw_emergency_911_medical_dispatch`

### 2.2 Dicionário de Dados das Tabelas GDF (100.000 Cidadãos)

| Domínio | Tabela | Volume | Chave Primária / Estrangeira | Descrição Funcional e Técnica |
| :--- | :--- | :--- | :--- | :--- |
| **1. Identidade Civil** | `dim_citizens` | `100.000` | `citizen_id` (`NID-AAA-BBBB-CCCC-D`) | Dados civis completos, idade (0 a 100 anos), idioma nativo (`pt-BR` 45%, `es-419` 45%, `en-US` 10%), credencial profissional, papel 360 e UBI. |
| **1. Biometria NIST** | `sec_biometrics_nist` | `100.000` | `citizen_id` (FK) | Hash facial ISO/IEC 19794-5, vetor de minúcias digitais ISO/IEC 19794-2 `(x, y, θ, qualidade)` e chave pública `Ed25519`. |
| **1. Grafo Familiar** | `rel_family_graph` | `58.985` | `relation_id` (`citizen_id_a`, `citizen_id_b`) | Grafo direcionado de parentesco (`MARRIED_TO`, `PARENT_OF`, `CHILD_OF`, `SIBLING_OF`, `LEGAL_GUARDIAN`) com validação etária estrita (pais $\ge 16$ anos mais velhos que filhos). |
| **2. Território** | `dim_addresses` | `50.000` | `address_id` | Imóveis georreferenciados nos 6 distritos de Novatlantis com coordenadas GPS e consumo de Smart Grid. |
| **2. Residência** | `rel_citizen_residence` | `100.000` | `citizen_id` + `address_id` | Coabitação familiar (cônjuges e filhos menores compartilham o mesmo `address_id`). |
| **3. Saúde HL7** | `health_records` | `100.000` | `citizen_id` | Tipo sanguíneo, alergias, condições crônicas, hospital de referência (`HOSP-NV-01` a `05`), médico de família e contato familiar de emergência. |
| **3. Vacinação** | `health_vaccinations` | `18.326` | `vaccination_id` | Registro de imunizações com lote e código CVX. |
| **4. Escolas** | `edu_institutions` | `6` | `institution_id` (`SCH-NV-001`..`006`) | Creches, escolas fundamentais, liceus politécnicos e universidade nacional. |
| **4. Matrículas** | `edu_enrollments` | `17.993` | `enrollment_id` (`citizen_id`) | Estudantes de 4 a 22 anos com notas em Matemática, Ciências, IA & Robótica, Linguagens, frequência (`attendance_rate`) e alerta de tutoria IA. |
| **5. Passaportes** | `sec_passports` | `60.008` | `passport_number` (`citizen_id`) | Passaportes eletrônicos padrão ICAO e países com isenção de visto. |
| **5. Justiça** | `justice_records` | `100.000` | `citizen_id` | Status de antecedentes (`CLEAR`, `UNDER_REVIEW`, `WARRANT_ACTIVE`), índice de confiança cívica e nível de credencial de segurança. |
| **6. Identidade 360** | `iam_identity_360_roles` | Dinâmico | `grant_id` (`citizen_id`) | Outorgas e revogações de acesso administrativo ao Backstage governamental. |

---

## 3. Governança de Acesso: Login Unificado & Aplicação Identidade 360

### 3.1 Princípio do Login Único Cidadão / Servidor Público
Não existem contas separadas para cidadãos e servidores públicos. Todo indivíduo autentica-se com seu **NID (`NID-AAA-BBBB-CCCC-D`)** ou **E-mail Cívico**.
No momento do login (`POST /api/auth/login`), o motor consulta a tabela `iam_identity_360_roles`:
1. Se `is_active = 1`, o cidadão recebe seu papel administrativo (`effective_role_code`) e os escopos do respectivo Ministério no **Backstage Governamental**.
2. **Revogação Imediata:** Uma vez que a permissão é removida na aplicação **Identidade 360** (`POST /api/iam360/revoke`), `is_active` passa a `0` e `role_code` retorna a `CITIZEN_COMMON`. O usuário volta instantaneamente a ser **Cidadão Comum** e perde o acesso aos módulos administrativos.

### 3.2 Cadeia de Comando Constitucional e Perfis Nomeados

| NID | Nome / Cargo | E-mail de Login | Papel Identidade 360 | Atribuições no Sistema |
| :--- | :--- | :--- | :--- | :--- |
| `NID-000-0000-0001-9` | **Jopoco** (Primeiro-Ministro & Root) | `admin@jopoco.altostrat.com` / `jopoco@novatlantis.gov.cloud` | `PRIME_MINISTER_ROOT` | Administrador Geral da Nação. Nomeia/destitui o Gestor de Identidades 360 e possui acesso total a todos os ministérios. |
| `NID-000-0000-0002-7` | **Alexandre Vance** (Secretário-Geral) | `secretario.geral@novatlantis.gov.cloud` | `SECRETARY_GENERAL` | Apoia o Primeiro-Ministro na coordenação interministerial e governança de estado. |
| `NID-000-0000-0003-5` | **Helena Albuquerque** (Gestora 360) | `gestor.identidade@novatlantis.gov.cloud` | `IDENTITY_MANAGER_360` | Nomeada pelo Primeiro-Ministro. Concede e revoga acessos de Backstage conforme o perfil profissional do servidor. |
| `NID-000-0000-0004-3` | **Dra. Sofia Mendes Costa** | `dra.sofia.mendes@novatlantis.gov.cloud` | `DOCTOR_AND_HEALTH_MANAGER` | Gestora Pública de Saúde e Médica de Telemedicina (`HOSP-NV-01`). Cônjuge do Primeiro-Ministro no grafo familiar. |
| `NID-000-0000-0005-1` | **Dr. Mateo Vargas Ríos** | `dr.mateo.vargas@novatlantis.gov.cloud` | `DOCTOR_TELEMED` | Médico Clínico de Telemedicina (`HOSP-NV-02`). |
| `NID-000-0000-0006-0` | **Prof. Lucas Albuquerque Silva** | `prof.lucas.silva@novatlantis.gov.cloud` | `TEACHER_AND_EDU_MANAGER` | Gestor Educacional e Professor (`SCH-NV-002`). Pai de Pedro (`NID-000-0000-0010-2`) e Alice (`NID-000-0000-0011-0`). |
| `NID-000-0000-0007-8` | **Profa. Valeria Ríos Hernández** | `profa.valeria.rios@novatlantis.gov.cloud` | `TEACHER_EDUCATOR` | Professora da Rede Pública Nacional. |
| `NID-000-0000-0008-6` | **Comandante Rafael Santos** | `comandante.rafael@novatlantis.gov.cloud` | `OPERATIONS_311_911_MANAGER` | Gestor de Demandas Urbanas 311 e Central de Despacho 911. |
| `NID-000-0000-0009-4` | **Juíza Clara Sterling Davis** | `juiza.clara.sterling@novatlantis.gov.cloud` | `JUSTICE_AND_TREASURY_MANAGER` | Magistrada da Suprema Corte Digital, Passaportes ICAO e Tesouro Soberano. |
| `NID-000-0000-0010-2` | **Pedro Albuquerque Costa** (11 anos) | `pedro.albuquerque@cidadania.novatlantis.gov` | `CITIZEN_COMMON` | Estudante do Ensino Fundamental II (`SCH-NV-002`). Acesso exclusivo ao Espaço do Cidadão. |

---

## 4. Documentação Funcional dos Ambientes

### 4.1 Portal Institucional da Nação (`PUBLIC_PORTAL`)
- **Barra de Comando Agêntico:** Recebe intenções em linguagem natural e encaminha diretamente ao módulo transacional correspondente.
- **Painel de Métricas Soberanas:** Exibe tempo médio de resolução (`1.4s`), população registrada no GDF (`100.000`), custo operacional do Estado (`0.42% do PIB`) e soberania de dados Nível 5.
- **Bento Grid de 6 Serviços Essenciais:** Acesso rápido para Identidade 360, Tributação/UBI/Empresas em 45s, Justiça/Passaporte ICAO, Saúde HL7/Telemedicina, Zeladoria 311/911 e Educação Contínua.

### 4.2 Espaço do Cidadão (`CITIZEN_HUB`)
- **Carteira de Identidade Soberana (NID) & Biometria NIST:** Exibe score biométrico, chave pública `Ed25519`, hash facial ISO-19794-5 e minúcias digitais.
- **Grafo Familiar Civil (`rel_family_graph`):** Lista cônjuge, pais e filhos com navegação direta entre membros da família.
- **Prontuário Único HL7 FHIR & Boletim Escolar:** Exibe tipo sanguíneo, alergias, condições crônicas, hospital de referência e notas nas 4 disciplinas.
- **Serviços Transacionais Instantâneos:**
  - **Emissão de Passaporte Digital ICAO** (`POST /api/services/passport`) com validação automática no Cruzamento GDF #1.
  - **Abertura de Empresa Autônoma em 45 Segundos** (`POST /api/services/company`) com alocação de 250 TFLOPs.
  - **Abertura de Demanda Urbana 311** (`POST /api/services/311`) enviada diretamente à fila do servidor público no Backstage.
  - **Botão SOS 911** (`POST /api/services/911`) com disparo imediato do Cruzamento GDF #3.

### 4.3 Ambiente de Backstage Governamental (`GOVERNMENT_BACKSTAGE`)
1. **Gabinete do Primeiro-Ministro (`pm_cabinet`):** Outorga ou destituição constitucional do Gestor de Identidades 360 e trilha de auditoria oficial (`ops_audit_log`).
2. **Aplicação Identidade 360 (`iam_360`):** Concessão de papéis administrativos baseados na credencial profissional e botão de **Revogação Imediata** com reversão instantânea para `CITIZEN_COMMON`.
3. **Gestão da Saúde, Hospitais e Telemedicina (`health_backstage`):** Painel dos 5 hospitais nacionais (`HOSP-NV-01` a `05`), corpo clínico e console médico para realizar teleconsultas e assinar receitas digitais em `Ed25519` (`POST /api/backstage/health/telemed`).
4. **Gestão da Educação, Escolas, Provas e Notas (`edu_backstage`):** Gestão das 6 instituições de ensino (`SCH-NV-001` a `006`), diário digital do professor para editar notas de Matemática, Ciências, IA & Robótica, Linguagens e Frequência (`POST /api/backstage/education/grade`), e aplicação de provas corrigidas por IA (`POST /api/backstage/education/exam`).
5. **Backstage 311 & Comando 911 (`ops_311_911`):** Conclusão de chamados urbanos 311 por servidores públicos (`POST /api/services/311/resolve`) e painel de despacho 911 enriquecido com dados HL7 e contato familiar.
6. **Justiça, Fronteiras & Tesouro (`justice_treasury`):** Monitoramento de empresas autônomas, distribuição do Dividendo UBI e antecedentes judiciais.
7. **Explorador GDF 100k & Data Lakehouse (`gdf_lakehouse`):** Pesquisa em tempo real sobre os 100.000 cidadãos (`GET /api/gdf/search`), inspeção de ficha 360° (`GET /api/gdf/citizen/:nid`) e visualização ao vivo dos 3 Cruzamentos Analíticos da Camada Gold.

---

## 5. Referência Técnica de APIs REST (`apps/landing-portal/server.mjs`)

| Método | Endpoint | Descrição |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Status operacional do banco GDF (100k cidadãos) e referências do Data Lakehouse no GCP. |
| `POST` | `/api/auth/login` | Autentica por NID ou E-mail e resolve dinamicamente as permissões ativas na Identidade 360. |
| `GET` | `/api/gdf/search?q=&credential=` | Pesquisa SQL paginada sobre os 100.000 cidadãos com filtro por credencial profissional. |
| `GET` | `/api/gdf/citizen/:nid` | Retorna a ficha 360° completa do cidadão (civil, biometria, família, residência, HL7, escola, passaporte, justiça). |
| `GET` | `/api/iam360/roles` | Lista todas as permissões ativas e revogadas na aplicação Identidade 360. |
| `POST` | `/api/iam360/grant` | Concede permissão de Backstage (valida hierarquia Primeiro-Ministro vs Gestor de Identidades). |
| `POST` | `/api/iam360/revoke` | Revoga permissão administrativa e reverte o usuário imediatamente para `CITIZEN_COMMON`. |
| `GET` | `/api/backstage/overview` | Métricas agregadas das 11 tabelas GDF, os 3 cruzamentos Gold e trilha de auditoria. |
| `GET` | `/api/backstage/health` | Lista hospitais, corpo clínico e sessões de telemedicina. |
| `POST` | `/api/backstage/health/telemed` | Registra teleconsulta médica e emite prescrição assinada com `Ed25519`. |
| `GET` | `/api/backstage/education` | Lista escolas, professores, alunos matriculados e provas aplicadas. |
| `POST` | `/api/backstage/education/grade` | Atualiza notas por matéria e frequência de um aluno e recalcula alerta de evasão. |
| `POST` | `/api/backstage/education/exam` | Aplica nova prova assistida por IA em uma instituição de ensino. |
| `GET` | `/api/backstage/operations` | Lista chamados 311 e despachos de emergência 911. |
| `POST` | `/api/services/311` | Abre novo chamado urbano 311 pelo cidadão. |
| `POST` | `/api/services/311/resolve` | Conclui chamado 311 pelo servidor público no Backstage. |
| `POST` | `/api/services/911` | Aciona emergência 911 com cruzamento automático HL7 + familiar de emergência. |
| `POST` | `/api/services/company` | Abre empresa autônoma em 45s vinculada ao NID do cidadão. |
| `POST` | `/api/services/passport` | Solicita/renova Passaporte Digital ICAO mediante verificação no Cruzamento GDF #1. |
| `GET` | `/api/v1/profile/me` | Retorna o perfil completo do cidadão autenticado, incluindo foto oficial (`photo_url`), idioma nativo (`native_language`) e grafo familiar Read-Only (`family_links`). |
| `PUT` | `/api/v1/profile/me` | Persiste alterações de perfil (`photo_url` comprimido em Base64/WebP, `social_name`, `preferred_contact`, `accessibility_needs`, `native_language`, `street_address`, `district`) via `UPSERT` em `citizen_profiles` e `dim_citizens` no **AlloyDB for PostgreSQL (`10.223.28.2:5432`)** e no SQLite WAL. |

---

## 6. Arquitetura Unificada de Idiomas (i18n), Design System `america.gov` & Perfil Soberano

### 6.1 Suporte Completo a Português (`pt-BR`), Espanhol (`es-419`) e Inglês (`en-US`) em Todas as Páginas
- **Seletor Global de Idiomas no Cabeçalho (`TopNavUserWidget`) e no Menu Hambúrguer (`☰`):** Presente em 100% das telas dos 3 portais (`landing-portal`, `citizen-portal`, `gov-backstage`), permitindo alternar instantaneamente entre **Português (`PT`)**, **Español (`ES`)** e **English (`EN`)**.
- **Resolução Automática de Idioma em 3 Camadas (`resolveInitialLanguage`):**
  1. **Camada 1 (Override Explícito):** Se o usuário selecionou explicitamente um idioma no cabeçalho ou via parâmetro `?lang=pt-BR|es-419|en-US` (propagado automaticamente nos links SSO entre os 3 portais), o portal respeita e grava em `localStorage.novatlantis_lang`.
  2. **Camada 2 (Idioma Nativo do Cidadão Autenticado):** Ao autenticar-se com seu NID, se não houver override manual, a interface assume automaticamente o campo `native_language` registrado no AlloyDB / GDF (`pt-BR`, `es-419` ou `en-US`), que também pode ser atualizado em **Dados Cadastrais & Foto Oficial**.
  3. **Camada 3 (Visitante Anônimo):** Lê automaticamente o idioma do navegador (`navigator.language` / `Accept-Language`).

### 6.2 Design System Editorial `america.gov` & Menu Hambúrguer (`☰`) Sem Travamento de Tela
- **Home Page (`landing-portal`):** Inspirada diretamente em [america.gov](https://america.gov/), com faixa oficial superior, cabeçalho institucional limpo, **Concierge IA Nacional** centralizado para perguntas públicas **sem necessidade de login prévio**, pílulas de perguntas sugeridas e cartões de serviços essenciais.
- **Menu Hambúrguer (`☰`) nas Páginas Internas e no Perfil Soberano:**
  - Nos portais internos (`citizen-portal` e `gov-backstage`), a navegação entre módulos utiliza um **Menu Hambúrguer (`☰`)** deslizante.
  - Dentro do modal **Meu Perfil Soberano (`TopNavUserWidget`)**, o botão **Mais Opções do Perfil (`☰`)** utiliza um menu hambúrguer colapsável inline (`<Collapse>`) em vez de um `<Drawer>` modal aninhado, garantindo transição fluida e **zero travamento de foco/backdrop** ao acessar:
    1. **Carteira Digital Soberana (NID) & Grafo Familiar**;
    2. **Dados Cadastrais, Idioma Nativo & Foto Oficial** (com compressão automática em `<canvas>` para JPEG `320x320` e gravação persistente em `citizen_profiles` no AlloyDB e SQLite);
    3. **Segurança, Senha & Biometria NIST**;
    4. **Preferências & Acessibilidade**.

