# Documentación Funcional y Técnica Completa — República Digital de Novatlantis

> **Idiomas de la Documentación Completa / Full Documentation Languages:**
> - 🇧🇷 **Português (Oficial):** [DOCUMENTACAO_COMPLETA_NOVATLANTIS.md](./DOCUMENTACAO_COMPLETA_NOVATLANTIS.md)
> - 🇪🇸 **Español:** [DOCUMENTACAO_COMPLETA_NOVATLANTIS.es.md](./DOCUMENTACAO_COMPLETA_NOVATLANTIS.es.md)
> - 🇺🇸 **English:** [DOCUMENTACAO_COMPLETA_NOVATLANTIS.en.md](./DOCUMENTACAO_COMPLETA_NOVATLANTIS.en.md)

**Lema Constitucional:** `NOVATLANTIS • LIBERTAS IN DIGITALI`  
**Design System Oficial:** `Sovereign Civic` / `america.gov` + **Google Material Design Persistent Navigation Drawer**  
**Google Cloud Project ID (Argolis):** `novatlantis` (`1054221034062`)  
**Repositorio Oficial en GitHub:** `https://github.com/billebr/novatlantis` (`git@github.com:billebr/novatlantis.git`)  
**Primer Ministro y Administrador General (Root):** `Joao Thiago Poço (JT)` (`NID-000-0000-0001-9` / `jt@novatlantis.gov.cloud`)

---

## 1. Visión Arquitectónica y Design System "Sovereign Civic" (`america.gov` + Google Material Design)

La República Digital de Novatlantis adopta el sistema de diseño **Sovereign Civic**, inspirado directamente en **[america.gov](https://america.gov/)** y en las directrices de navegación de **Google Material Design (`@mui/material` v6)**, concebido para reflejar **austeridad institucional, transparencia algorítmica y servicio público continuo en favor de la población**.

### 1.1 Directrices Visuales, Tokens y Navegación Material Design
- **Superficies Claras y Austeras:**
  - Fondo Primario (`surface`): `#FCFBF9` (Warm Cream Editorial) / `#F7F9FC`
  - Tarjetas Institucionales (`surface-container-lowest`): `#FFFFFF` (Pure White)
  - Contenedor Secundario (`surface-container-low`): `#F2F4F7`
  - Bordes Estructurales (`civic-border` / `outline-variant`): `1px solid #E5E4DC` / `#DCE3EC`
- **Colores de Autoridad de Estado:**
  - Encabezado Soberano (`primary-container` / `sovereign-navy`): `#0A2240` / `#002046`
  - Azul Administrativo (`secondary`): `#0061A5`
  - Verde-Teal de Consenso Verificado (`tertiary`): `#006B5B`
  - Rojo de Emergencia Civil 911 (`error`): `#991B1B` / `#BA1A1A`
- **Tipografía Oficial:**
  - Títulos Editoriales de Estado: `Merriweather` (`700`, `900`)
  - Etiquetas Oficiales y Cuerpo de Texto: `Public Sans` / `Inter` (`400`, `600`, `700`, `800`) con `tabular-nums`
  - Identificadores Criptográficos, NIDs y Hashes: `JetBrains Mono`
- **Patrón Google Material Design Persistent Navigation Drawer (Sidebar sin Overlay):**
  - **Perfil Soberano en Página Completa (`fullScreen`) con Sidebar Lateral:** Al abrir el perfil del ciudadano (`TopNavUserWidget`), la aplicación abre una vista de **Página Completa (`fullScreen`)** con una **Navigation Drawer (Sidebar) lateral persistente (`<Box component="aside">`)** situada al lado del contenido principal (`flex: 1`), sin ventanas superpuestas (overlay).
  - **Menú de Módulos como Persistent Navigation Drawer (Sidebar):** En los 3 portales (`landing-portal`, `citizen-portal` y `gov-backstage`), el botón Hamburguesa (`☰`) abre o contrae una **Navigation Drawer (Sidebar) lateral persistente** que comparte el layout horizontal con `<main>`, siguiendo el patrón de Google Material Design en lugar de abrir un cajón modal superpuesto.

---

## 2. Government Data Framework (GDF) — Base de 100.000 Ciudadanos, AlloyDB y Government Data Platform (GDP)

Toda la operación de la República se apoya en una población sintética íntegra de **100.000 ciudadanos** generada por el motor determinista [`data-generator/generate_novatlantis_lakehouse.py`](../data-generator/generate_novatlantis_lakehouse.py) y persistida en **AlloyDB for PostgreSQL** y en la **Government Data Platform (GDP)**.

### 2.1 Arquitectura Transaccional (AlloyDB) y Analítica Medallion (GDP en Google Cloud `novatlantis`)
1. **Capa Transaccional Soberana (AlloyDB for PostgreSQL):**
   - **Clúster AlloyDB:** `projects/novatlantis/locations/us-central1/clusters/novatlantis-sovereign-cluster`
   - **Instancia Primaria:** `novatlantis-primary-01` (`10.223.28.2:5432` vía Direct VPC Egress en `novatlantis-vpc`)
   - **Respaldo Local de Baja Latencia:** `gdf_sovereign.db` (SQLite WAL sincronizado en los microservicios).
2. **Capa Analítica Medallion (Government Data Platform — BigQuery y Cloud Storage):**
   - **7 Buckets Cloud Storage (`us-central1`):** `gs://novatlantis-gdp-drp-cs-0`, `gs://novatlantis-gdp-load-cs-0`, `gs://novatlantis-gdp-trf-cs-0`, `gs://novatlantis-gdp-dwh-lnd-cs-0`, `gs://novatlantis-gdp-dwh-cur-cs-0`, `gs://novatlantis-gdp-dwh-conf-cs-0`, `gs://novatlantis-gdp-dwh-plg-cs-0`.
   - **Datasets BigQuery:** `novatlantis_gdp_drp_bq_0`, `novatlantis_gdp_dwh_lnd_bq_0` (Landing), `novatlantis_gdp_dwh_cur_bq_0` (Curated), `novatlantis_gdp_dwh_conf_bq_0` (Confidential PII/NIST), `novatlantis_gdp_dwh_plg_bq_0` (Playground) y `gdf_bronze` / `gdf_silver` / `gdf_gold`.

### 2.2 Diccionario de Datos de las Tablas GDF (100.000 Ciudadanos)

| Dominio | Tabla | Volumen | Clave Primaria / Foránea | Descripción Funcional y Técnica |
| :--- | :--- | :--- | :--- | :--- |
| **1. Identidad Civil** | `dim_citizens` | `100.000` | `citizen_id` (`NID-AAA-BBBB-CCCC-D`) | Datos civiles completos, edad (0 a 100 años), idioma nativo (`pt-BR` 45%, `es-419` 45%, `en-US` 10%), credencial profesional, rol 360 y RBU. |
| **1. Perfil Soberano** | `citizen_profiles` | Dinámico | `nid` (PK/FK) | Foto oficial comprimida (`photo_url`), nombre social (`social_name`), canal preferido (`preferred_contact`) y accesibilidad (`accessibility_needs`). |
| **1. Biometría NIST** | `sec_biometrics_nist` | `100.000` | `citizen_id` (FK) | Hash facial ISO/IEC 19794-5, vector de minucias dactilares ISO/IEC 19794-2 `(x, y, θ, calidad)` y clave pública `Ed25519`. |
| **1. Grafo Familiar** | `rel_family_graph` | `71.425` | `relation_id` (`source_nid`, `target_nid`) | Grafo dirigido de parentesco (`CONJUGE`, `PAI_MAE_DE`, `FILHO_A_DE`, `IRMAO_A_DE`) con validación etaria estricta y exposición exclusivamente de solo lectura (Read-Only). |
| **2. Territorio** | `dim_addresses` | `50.000` | `address_id` | Inmuebles georreferenciados en los 6 distritos de Novatlantis con coordenadas GPS y consumo de Smart Grid. |
| **3. Salud HL7** | `health_records` | `100.000` | `citizen_id` | Grupo sanguíneo, alergias, condiciones crónicas, hospital de referencia (`HOSP-NV-01` a `06`), médico de familia y estado de vacunación. |
| **4. Escuelas y Notas** | `edu_enrollments` | `20.440` | `enrollment_id` (`student_nid`) | Estudiantes de 4 a 17 años con calificaciones en Matemáticas, Ciencias, IA y Robótica, Idiomas y asistencia (`attendance_rate`). |
| **5. Mantenimiento 311** | `ops_311_tickets` | Dinámico | `ticket_id` (`citizen_nid`) | Reportes dedicados de mantenimiento urbano, alumbrado inteligente IoT, drenaje pluvial y recolección selectiva. |
| **6. Emergencia 911** | `ops_911_dispatches` | Dinámico | `dispatch_id` (`citizen_nid`) | Despachos tácticos y médicos inmediatos (UCI Móvil, Defensa Civil y Guardia Costera) con protocolo de IA. |
| **7. Pasaportes** | `sec_passports` | `60.008` | `passport_number` (`nid`) | Pasaportes biométricos estándar OACI Doc 9303 con líneas MRZ. |
| **8. Identidad 360** | `iam_identity_360_roles` | Dinámico | `grant_id` (`nid`) | Concesiones y revocaciones de acceso administrativo al Backstage gubernamental. |

---

## 3. Gobernanza de Acceso: Inicio de Sesión Unificado y Aplicación Identidad 360

### 3.1 Principio de Inicio de Sesión Único Ciudadano / Servidor Público
No existen cuentas separadas para ciudadanos y servidores públicos. Todo individuo se autentica con su **NID (`NID-AAA-BBBB-CCCC-D`)** o **Correo Electrónico Cívico**.
En el momento del inicio de sesión (`POST /api/auth/login` o `POST /api/v1/auth/login`), el motor consulta la tabla de roles de **Identidad 360**:
1. Si el ciudadano posee un nombramiento activo, recibe su rol administrativo (`effective_role_code`) y los permisos de su Ministerio en el **Backstage Gubernamental**.
2. **Revocación Inmediata:** Una vez que el permiso es revocado en la aplicación **Identidad 360** (`POST /api/iam360/revoke`), `iam_role` vuelve inmediatamente a `CITIZEN_COMMON`. El usuario vuelve de forma instantánea a ser **Ciudadano Común** y pierde el acceso a los módulos administrativos.

### 3.2 Cadena de Mando Constitucional y Perfiles Nombrados

| NID | Nombre / Cargo | Correo de Inicio de Sesión | Contraseña Inicial (Canal Postal) | Rol Identidad 360 | Atribuciones en el Sistema |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `NID-000-0000-0001-9` | **Joao Thiago Poço (JT)** (Primer Ministro y Root) | `jt@novatlantis.gov.cloud` | `Novatlantis@0001-9` | `PRIME_MINISTER_ROOT` | Administrador General de la Nación. Nombra/destituye al Gestor de Identidades 360 y posee acceso total a todos los ministerios. |
| `NID-000-0000-0002-7` | **Dr. Aurelius Valerius** (Secretario General) | `secretario.geral@novatlantis.gov.cloud` | `Novatlantis@0002-7` | `SECRETARY_GENERAL` | Apoya al Primer Ministro (JT) en la coordinación interministerial y gobernanza de estado. |
| `NID-000-0000-0003-5` | **Helena Viana** (Gestora Identidad 360) | `gestor.identidade@novatlantis.gov.cloud` | `Novatlantis@0003-5` | `IDENTITY_MANAGER_360` | Nombrada por el Primer Ministro. Concede y revoca accesos al Backstage según el perfil profesional del servidor. |
| `NID-000-0000-0004-3` | **Dra. Sofia Mendes Costa** | `sofia.mendes@saude.novatlantis.gov.cloud` | `Novatlantis@0004-3` | `DOCTOR_AND_HEALTH_MANAGER` | Gestora Pública de Salud y Médica de Telemedicina (`HOSP-NV-01`). |
| `NID-000-0000-0005-1` | **Dr. Mateo Vargas Ríos** | `mateo.vargas@saude.novatlantis.gov.cloud` | `Novatlantis@0005-1` | `DOCTOR_TELEMED` | Médico Clínico de Telemedicina (`HOSP-NV-02`). |
| `NID-000-0000-0006-0` | **Prof. Lucas Albuquerque Silva** | `lucas.albuquerque@educacao.novatlantis.gov.cloud` | `Novatlantis@0006-0` | `TEACHER_AND_EDU_MANAGER` | Gestor Educativo y Profesor (`SCH-NV-002`). Padre de Pedro (`NID-000-0000-0010-8`). |
| `NID-000-0000-0007-8` | **Profa. Valeria Ríos Hernández** | `valeria.rios@educacao.novatlantis.gov.cloud` | `Novatlantis@0007-8` | `TEACHER_EDUCATOR` | Profesora de la Red Pública Nacional. |
| `NID-000-0000-0008-6` | **Comandante Rafael Santos** | `rafael.santos@operacoes.novatlantis.gov.cloud` | `Novatlantis@0008-6` | `OPERATIONS_311_911_MANAGER` | Comandante de los módulos separados de Mantenimiento Urbano 311 y Despacho de Emergencia 911. |
| `NID-000-0000-0009-4` | **Magistrada Clara Sterling Davis** | `clara.sterling@justica.novatlantis.gov.cloud` | `Novatlantis@0009-4` | `JUSTICE_AND_TREASURY_MANAGER` | Magistrada de la Corte Suprema Digital, Pasaportes OACI y Tesoro Soberano. |
| `NID-000-0000-0010-8` | **Pedro Albuquerque Viana** (11 años) | `pedro.albuquerque@cidadao.novatlantis.gov.cloud` | `Novatlantis@0010-8` | `CITIZEN_COMMON` | Estudiante de Educación Básica (`SCH-NV-002`). Acceso exclusivo al Portal del Ciudadano. |

---

## 4. Documentación Funcional de los 3 Entornos y Separación de los Módulos 311 y 911

### 4.1 Portal Principal de la Nación (`apps/landing-portal`)
- **Persistent Navigation Drawer (Sidebar `☰`):** Se abre al lado de la página principal (patrón Google Material Design), mostrando accesos directos a los módulos ciudadanos y entornos administrativos.
- **Concierge IA Nacional Público:** Permite a cualquier visitante realizar consultas públicas sobre los servicios del Estado en Portugués, Español o Inglés sin necesidad de iniciar sesión.
- **Matriz de 7 Servicios Esenciales Soberanos:** Incluye tarjetas independientes para **Mantenimiento Urbano 311** (`?tab=urban_311`) y **Emergencia 911 (SOS Táctico y Médico)** (`?tab=emergency_911`).

### 4.2 Portal del Ciudadano (`apps/citizen-portal`) — 7 Módulos Independientes con Sidebar Persistente
1. **1. Credencial Soberana NID y Biometría NIST (`identity`):** Credencial Mod-11, clave pública `Ed25519`, puntaje facial NIST y auditoría Zero-Trust de 48h.
2. **2. Grafo Familiar y Domicilio Soberano (`family_address`):** Visualización estrictamente de solo lectura (Read-Only) del grafo familiar (`rel_family_graph`) y actualización de domicilio en tiempo real.
3. **3. Salud HL7 y Telemedicina 24/7 (`health`):** Historia Clínica Electrónica Nacional HL7 FHIR y teleconsultas asistidas por IA con receta digital ICP.
4. **4. Educación y Calificaciones Escolares (`education`):** Boletín escolar por materia (`Matemáticas`, `Ciencias`, `IA y Robótica`, `Idiomas`) y asistencia sincronizados con el Backstage docente.
5. **5. Mantenimiento Urbano 311 (`urban_311`):** Módulo dedicado exclusivamente a la apertura y seguimiento de reportes de mantenimiento urbano (`ops_311_tickets`).
6. **6. Emergencia 911 — SOS Táctico y Médico (`emergency_911`):** Módulo dedicado exclusivamente a la activación inmediata de socorro 911 (UCI Móvil, Defensa Civil y Guardia Costera) con monitoreo de ETA en tiempo real (`ops_911_dispatches`).
7. **7. Economía, Empresa en 45s y Pasaporte OACI (`treasury`):** Constitución instantánea de empresas (`GovBiz 45s`) y emisión de Pasaporte Biométrico OACI Doc 9303.

### 4.3 Backstage Gubernamental (`apps/gov-backstage`) — 7 Entornos Administrativos con Sidebar Persistente
1. **1. Gabinete del Primer Ministro (`Joao Thiago Poço - JT`) y Secretario General (`pm_cabinet`):** Comando ejecutivo de la nación y KPIs en tiempo real del Government Data Fabric (100.000 ciudadanos).
2. **2. Aplicación Identidad 360 (`iam360`):** Concesión y revocación instantánea de roles administrativos RBAC/ABAC con reversión inmediata a `CITIZEN_COMMON`.
3. **3. Gestión de Salud, Hospitales y Médicos (`health_mgmt`):** Monitoreo de las 6 unidades hospitalarias y cola nacional de telemedicina.
4. **4. Gestión de Educación, Escuelas, Exámenes y Notas (`edu_mgmt`):** Registro docente de calificaciones por materia y publicación de evaluaciones nacionales.
5. **5. Comando de Mantenimiento Urbano 311 (`ops_311`):** Cola dedicada exclusivamente a la atención y cierre de reportes urbanos 311 abiertos por los ciudadanos (`POST /api/services/311/resolve`).
6. **6. Central de Despacho de Emergencia 911 (`ops_911`):** Consola dedicada exclusivamente al monitoreo en tiempo real de despachos tácticos y médicos 911 (`ops_911_dispatches`).
7. **7. Justicia, Tesoro, AlloyDB y GDP 100k (`justice_datalake`):** Explorador SQL en tiempo real sobre los 100.000 ciudadanos en AlloyDB (`10.223.28.2:5432`) y BigQuery GDP (`novatlantis_gdp_dwh_cur_bq_0`).

---

## 5. Referencia Técnica de APIs REST

| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Estado operativo de AlloyDB, SQLite WAL (100k ciudadanos) y datasets de la Government Data Platform en GCP. |
| `POST` | `/api/v1/auth/login` | Autentica por NID o Correo con verificación de contraseña, protección contra fuerza bruta y token JWT (`FIRST_LOGIN_REQUIRED` o `FULL_ACCESS`). |
| `POST` | `/api/v1/auth/first-login-password` | Cambio obligatorio de la contraseña postal inicial en el primer inicio de sesión y emisión de sesión soberana completa. |
| `GET` | `/api/v1/profile/me` | Devuelve el perfil completo del ciudadano autenticado, incluyendo foto oficial (`photo_url`), idioma nativo (`native_language`) y grafo familiar Read-Only (`family_links`). |
| `PUT` | `/api/v1/profile/me` | Persiste cambios de perfil (`photo_url` comprimido en Base64, `social_name`, `preferred_contact`, `accessibility_needs`, `native_language`, `street_address`, `district`) mediante `UPSERT` en `citizen_profiles` y `dim_citizens` en **AlloyDB** y SQLite WAL. |
| `GET` | `/api/gdf/search?q=&limit=` | Búsqueda SQL sobre los 100.000 ciudadanos con filtro por nombre, NID, profesión o distrito. |
| `GET` | `/api/iam360/roles` | Lista todos los permisos activos en la aplicación Identidad 360. |
| `POST` | `/api/iam360/grant` | Concede permiso administrativo de Backstage en Identidad 360. |
| `POST` | `/api/iam360/revoke` | Revoca permiso administrativo y revierte al usuario inmediatamente a `CITIZEN_COMMON`. |
| `POST` | `/api/services/311` | Registra un nuevo reporte en el módulo dedicado de **Mantenimiento Urbano 311** (`ops_311_tickets`). |
| `POST` | `/api/services/311/resolve` | Concluye un reporte 311 por el servidor público en el **Comando de Mantenimiento Urbano 311**. |
| `POST` | `/api/services/911` | Dispara un protocolo inmediato en el módulo dedicado de **Emergencia 911** (`ops_911_dispatches`). |
| `POST` | `/api/services/company` | Constituye una empresa autónoma en 45 segundos vinculada al NID del ciudadano. |
| `POST` | `/api/services/passport` | Emite o revalida el Pasaporte Biométrico OACI Doc 9303. |
