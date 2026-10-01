# República Digital de Novatlantis — Infraestructura Pública Digital Soberana y Estado Agéntico

> **Idiomas de la Documentación / Documentation Languages:**
> - 🇧🇷 **Português:** [README.md](./README.md)
> - 🇪🇸 **Español (Oficial):** [README.es.md](./README.es.md)
> - 🇺🇸 **English:** [README.en.md](./README.en.md)
> - 📘 **Manual Funcional y Técnico Completo:** [docs/DOCUMENTACAO_COMPLETA_NOVATLANTIS.md](./docs/DOCUMENTACAO_COMPLETA_NOVATLANTIS.md)

---

## 1. Visión General de la Nación AI-First

La **República Digital de Novatlantis** (`novatlantis.gov.cloud`) es una nación soberana nativa de la era agéntica, diseñada bajo el paradigma estético y funcional **Sovereign Civic** (inspirado en la austeridad institucional de **GOV.UK** y la interoperabilidad de **e-Estonia**), operando íntegramente sobre **Google Cloud (Proyecto Argolis: `novatlantis`)**.

La arquitectura del Estado está dividida en **3 Aplicaciones Full-Stack Completas e Independientes** (cada una con su propio **Frontend React + Tailwind CSS** y su propio **Backend Node.js 22 + SQLite `node:sqlite`**) además de **5 Microservicios Sectoriales**, utilizando el **Datalake Soberano de 100.000 Ciudadanos (`dim_citizens`) como Módulo Unificado de Usuarios (SSO y RBAC/ABAC)**.

---

## 2. Separación de las 3 Aplicaciones Principales Full-Stack (Producción Cloud Run)

| Aplicación Full-Stack | Directorio en el Monorepo | Servicio Cloud Run (`novatlantis`) | Rol Institucional y Funcionalidades |
| :--- | :--- | :--- | :--- |
| **1. Portal Principal de la Nación + Chat del Agente Orquestador** | [`apps/landing-portal`](./apps/landing-portal) | [`https://novatlantis-landing-portal-wpahcxvhuq-uc.a.run.app`](https://novatlantis-landing-portal-wpahcxvhuq-uc.a.run.app) | **Página Principal de la Nación**: Presenta el balance nacional en tiempo real, la matriz de eventos de vida y la **Barra de Búsqueda Central controlada por el Agente Orquestador del Estado**, que abre un **Chat Interactivo** para que el ciudadano dialogue con los servicios públicos y ejecute transacciones reales sobre la base de 100.000 ciudadanos. |
| **2. Portal del Ciudadano (Autoservicio 360°)** | [`apps/citizen-portal`](./apps/citizen-portal) | [`https://novatlantis-citizen-portal-wpahcxvhuq-uc.a.run.app`](https://novatlantis-citizen-portal-wpahcxvhuq-uc.a.run.app) | **Aplicación Exclusiva del Ciudadano**: Utiliza la base de 100.000 ciudadanos como módulo de usuarios. Incluye Credencial Soberana NID (Mod-11 + Biometría NIST), Grafo Familiar (`rel_family_graph`), cambio de domicilio, Historia Clínica HL7 y Telemedicina con IA, Boletín Escolar por asignatura, Servicios Urbanos 311, SOS 911, creación de empresas en 45s y Pasaporte ICAO. |
| **3. Backstage Gubernamental e Identidad 360** | [`apps/gov-backstage`](./apps/gov-backstage) | [`https://novatlantis-gov-backstage-wpahcxvhuq-uc.a.run.app`](https://novatlantis-gov-backstage-wpahcxvhuq-uc.a.run.app) | **Aplicación Exclusiva de Servidores y Gestores Públicos**: Controlada por la aplicación **Identidad 360 (RBAC/ABAC)**. Incluye el Gabinete del Primer Ministro (`jopoco`) y Secretario General, Gestión de Identidades 360 (concesión/revocación inmediata de permisos), Gestión de Hospitales y Médicos, Gestión de Escuelas, Profesores, Exámenes y Calificaciones, Comando 311/911 y Explorador del Datalake de 100k ciudadanos. |

### Microservicios Sectoriales Adicionales en Producción (`us-central1`)
- **Identidad Soberana NID (`identity-nid`)**: `https://novatlantis-identity-nid-wpahcxvhuq-uc.a.run.app`
- **Servicios Urbanos 311 (`services-311`)**: `https://novatlantis-services-311-wpahcxvhuq-uc.a.run.app`
- **Despacho de Emergencia 911 (`emergency-911`)**: `https://novatlantis-emergency-911-wpahcxvhuq-uc.a.run.app`
- **Historia Clínica y Telemedicina (`health-telemed`)**: `https://novatlantis-health-telemed-wpahcxvhuq-uc.a.run.app`
- **Educación y Tutoría IA (`education-learn`)**: `https://novatlantis-education-learn-wpahcxvhuq-uc.a.run.app`

---

## 3. Agente Orquestador del Estado vía Chat (Portal Principal de la Nación)

En el **Portal Principal de la Nación (`apps/landing-portal`)**, el campo de búsqueda central está operado por el **Agente Orquestador del Estado (`POST /api/orchestrator/chat`)**:
1. Al ingresar una consulta o hacer clic en cualquier sugerencia en la página principal, se abre la **Consola de Chat del Agente Orquestador**.
2. El Agente identifica automáticamente al ciudadano autenticado en la base de **100.000 ciudadanos (`dim_citizens`)**, clasifica la intención (`CITIZEN_360_SUMMARY`, `PASSPORT_ICAO`, `GOVBIZ_45S`, `HEALTH_TELEMED`, `EDUCATION_GRADES`, `URBAN_311`, `EMERGENCY_911`, `IAM_BACKSTAGE`), ejecuta la transacción real en la base SQLite y muestra:
   - **Respuesta Institucional Contextualizada** con los datos reales del ciudadano;
   - **Traza de Orquestación Multi-Agente** detallando la latencia y los agentes invocados (`Orchestrator-Core`, `GDF-Query-Engine`, `Health-Telemed-Agent`, `GovBiz-45s-Agent`, etc.);
   - **Tarjeta de Transacción Oficial** con botón de 1 clic para abrir el registro directamente en el **Portal del Ciudadano** o en el **Backstage Gubernamental**.

---

## 4. Base de Datos Soberana y Datalake (100.000 Ciudadanos como Módulo de Usuarios)

El script [`data-generator/generate_novatlantis_lakehouse.py`](./data-generator/generate_novatlantis_lakehouse.py) genera la base de datos relacional `gdf_sovereign.db` y los archivos analíticos en Cloud Storage (`gs://novatlantis-gdf-lakehouse/bronze/`):

- **`dim_citizens` (100.000 registros)**: Identidad NID Mod-11, nombre completo, correo electrónico, edad (0 a 100 años), idioma nativo (`pt-BR` 45%, `es-419` 45%, `en-US` 10%), profesión, especialidad, dirección, distrito y rol en **Identidad 360 (`iam_role`)**.
- **`rel_family_graph` (71.425 registros)**: Grafo familiar bidireccional (`SPOUSE`, `PARENT_OF`, `CHILD_OF`, `SIBLING`) con custodia legal y contacto de emergencia.
- **`health_records` (100.000 registros)**: Grupo sanguíneo, alergias, condiciones crónicas, donante de órganos y médico de cabecera asignado.
- **`edu_enrollments` (20.440 registros)**: Matrículas escolares, profesor titular, asistencia y calificaciones en **Matemáticas, Ciencias, IA y Robótica e Idiomas**.
- **`sec_passports` (44.088 registros)**: Pasaportes biométricos estándar ICAO Doc 9303 con líneas MRZ verificables.
- **`justice_records` (100.000 registros)**: Certificación judicial y admisibilidad fronteriza.

### Credenciales Oficiales para Pruebas (SSO e Identidad 360)

| NID | Nombre / Cargo | Correo de Inicio de Sesión | Rol Identidad 360 (`iam_role`) | Acceso al Backstage |
| :--- | :--- | :--- | :--- | :--- |
| `NID-000-0000-0001-9` | **Jopoco (Primer Ministro / Root)** | `jopoco@novatlantis.gov.cloud` / `admin@jopoco.altostrat.com` | `PRIME_MINISTER_ROOT` | **TOTAL (Root L10)** |
| `NID-000-0000-0002-7` | **Dr. Aurelius Valerius (Secretario General)** | `secretario.geral@novatlantis.gov.cloud` | `SECRETARY_GENERAL` | **TOTAL (Ejecutivo L9)** |
| `NID-000-0000-0003-5` | **Helena Viana (Gestora Identidad 360)** | `gestor.identidade@novatlantis.gov.cloud` | `IDENTITY_MANAGER_360` | **Gestión IAM 360 (L8)** |
| `NID-000-0000-0004-3` | **Dra. Sofia Mendes (Gestora Salud y Médica)** | `sofia.mendes@saude.novatlantis.gov.cloud` | `DOCTOR_AND_HEALTH_MANAGER` | **Salud y Telemedicina (L6)** |
| `NID-000-0000-0006-0` | **Prof. Lucas Albuquerque (Gestor Educación)** | `lucas.albuquerque@educacao.novatlantis.gov.cloud` | `TEACHER_AND_EDU_MANAGER` | **Educación, Exámenes y Notas (L6)** |
| `NID-000-0000-0008-6` | **Comandante Rafael Santos** | `rafael.santos@operacoes.novatlantis.gov.cloud` | `OPERATIONS_311_911_MANAGER` | **Comando 311 y 911 (L6)** |
| `NID-000-0000-0009-4` | **Magistrada Clara Sterling Davis** | `clara.sterling@justica.novatlantis.gov.cloud` | `JUSTICE_AND_TREASURY_MANAGER` | **Justicia y Tesoro (L7)** |
| `NID-000-0000-0010-8` | **Pedro Albuquerque Viana (Estudiante 11a)** | `pedro.albuquerque@cidadao.novatlantis.gov.cloud` | `CITIZEN_COMMON` | **Denegado (Solo Portal Ciudadano)** |

---

## 5. Ejecución y Despliegue en Google Cloud (Argolis)

```bash
# 1. Generar la base completa de 100.000 ciudadanos y el Datalake SQLite + NDJSON.gz
python3 data-generator/generate_novatlantis_lakehouse.py

# 2. Aprovisionar y desplegar todas las aplicaciones full-stack en Cloud Run (Proyecto: novatlantis)
bash infra/argolis/cloudrun-deploy.sh
```
