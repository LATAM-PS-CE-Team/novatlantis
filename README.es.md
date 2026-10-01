# República Digital de Novatlantis — Infraestructura Pública Digital Soberana & Estado Agéntico

> **Idiomas de la Documentación / Documentation Languages:**
> - 🇧🇷 **Português (Oficial):** [README.md](./README.md) • **Documentação Completa (PT):** [docs/DOCUMENTACAO_COMPLETA_NOVATLANTIS.md](./docs/DOCUMENTACAO_COMPLETA_NOVATLANTIS.md)
> - 🇪🇸 **Español:** [README.es.md](./README.es.md) • **Documentación Completa (ES):** [docs/DOCUMENTACAO_COMPLETA_NOVATLANTIS.es.md](./docs/DOCUMENTACAO_COMPLETA_NOVATLANTIS.es.md)
> - 🇺🇸 **English:** [README.en.md](./README.en.md) • **Full Documentation (EN):** [docs/DOCUMENTACAO_COMPLETA_NOVATLANTIS.en.md](./docs/DOCUMENTACAO_COMPLETA_NOVATLANTIS.en.md)
> - 🏛️ **Government Data Platform (GDP / EDP):** [government-data-platform/README.md](./government-data-platform/README.md)

---

## 1. Visión General de la Nación AI-First (Design System `america.gov` + Google Material Design Persistent Navigation Drawer + AlloyDB + Government Data Platform)

La **República Digital de Novatlantis** (`novatlantis.gov.cloud`) es una nación soberana nativa de la era agéntica, diseñada con inspiración directa en la estética editorial e institucional de **[america.gov](https://america.gov/)** combinada con **Google Material Design (`@mui/material` v6)**, **AlloyDB for PostgreSQL** y **Government Data Platform (GDP)**, desplegada en **Google Cloud (Proyecto Argolis: `novatlantis`)**.

### Pilares Arquitectónicos y de Experiencia Ciudadana:
1. **Arquitectura Unificada de Idiomas (i18n Nativo en el 100% de las Páginas — `Português`, `Español`, `English`):**
   - Selector global de idioma (`🌐 PT | ES | EN`) siempre visible en el encabezado superior (`TopNavUserWidget`), dentro del Navigation Drawer (`☰`) de los 3 portales y en las configuraciones del Perfil Soberano.
   - Resolución automática en 3 capas:
     1. Selección explícita en el encabezado/menú (`localStorage.novatlantis_lang` o parámetro `?lang=pt-BR|es-419|en-US` propagado vía SSO);
     2. Idioma nativo (`native_language`) registrado en la base de datos para el ciudadano autenticado (`45% pt-BR`, `45% es-419`, `10% en-US`);
     3. Detección automática mediante `navigator.language` / `Accept-Language`.
2. **Design System Editorial `america.gov` y Google Material Design Persistent Navigation Drawer (Sidebar sin Overlay):**
   - Paleta cívica de alto contraste (`#fcfbf9` Warm Cream, `#0a2240` Deep Navy, `#991b1b` Crimson Accent) y tipografía editorial (`Merriweather` + `Public Sans` + `JetBrains Mono`).
   - **Perfil Soberano en Página Completa (`fullScreen`) con Navigation Drawer Lateral (`<Box component="aside">`)**: Al abrir el Perfil Soberano, se abre la página completa con una **Navigation Drawer (Sidebar) persistente al lado** (estándar Google Material Design, sin superposición/overlay), permitiendo alternar entre Credencial Digital NID, Datos Cadastrales y Foto Oficial (con compresión y persistencia en `citizen_profiles`), Seguridad y Preferencias.
   - **Menú de Módulos como Persistent Navigation Drawer (Sidebar)**: En los 3 portales (`landing-portal`, `citizen-portal` y `gov-backstage`), el botón Hamburguesa (`☰`) abre/contrae una **Navigation Drawer lateral persistente** que se sitúa junto al contenido principal (`flex`) en lugar de abrirse superpuesta.
3. **Separación Completa de los Módulos de Mantenimiento Urbano 311 y Emergencia 911 (SOS):**
   - **Mantenimiento Urbano 311 (`urban_311` / `ops_311`)**: Módulo dedicado exclusivamente a reportes de mantenimiento urbano, alumbrado público inteligente IoT, drenaje pluvial, recolección selectiva y parques (`ops_311_tickets`).
   - **Emergencia 911 (`emergency_911` / `ops_911`)**: Módulo dedicado exclusivamente al despacho inmediato de socorro táctico y médico (Unidad Móvil UCI, Defensa Civil y Guardia Costera) integrado en tiempo real con la historia clínica HL7 FHIR (`ops_911_dispatches`).
4. **Autenticación Zero-Trust Sin Inicio de Sesión Automático & Concierge IA Público:**
   - **Ningún usuario inicia sesión por defecto.** Cualquier visitante puede hacer preguntas públicas en el **Concierge IA Nacional** en la Página Principal sin necesidad de iniciar sesión.
   - Al solicitar un servicio personal o administrativo, el sistema solicita autenticación soberana (`NID` + Contraseña con cambio obligatorio en el primer inicio de sesión).

---

## 2. Separación de las 3 Aplicaciones Principales Full-Stack (Producción Cloud Run + Material UI)

| Aplicación Full-Stack | Directorio | Servicio Cloud Run (`novatlantis`) | Rol Institucional & Funcionalidades |
| :--- | :--- | :--- | :--- |
| **1. Portal Principal de la Nación + Concierge IA Nacional** | [`apps/landing-portal`](./apps/landing-portal) | [`https://novatlantis-landing-portal-wpahcxvhuq-uc.a.run.app`](https://novatlantis-landing-portal-wpahcxvhuq-uc.a.run.app) | **Página Principal Estilo `america.gov` (Material UI)**: Franja oficial gubernamental, encabezado con Persistent Navigation Drawer (`☰`), selector global de idiomas (`PT | ES | EN`) y widget de usuario (`TopNavUserWidget`). Hero con **Concierge IA Nacional** abierto sin login y matriz de 7 servicios esenciales con **Mantenimiento Urbano 311** y **Emergencia 911** separados. |
| **2. Portal del Ciudadano (Autoservicio 360°)** | [`apps/citizen-portal`](./apps/citizen-portal) | [`https://novatlantis-citizen-portal-wpahcxvhuq-uc.a.run.app`](https://novatlantis-citizen-portal-wpahcxvhuq-uc.a.run.app) | **Aplicación Exclusiva del Ciudadano (Material UI)**: Navegación interna mediante Persistent Navigation Drawer (`☰`) lateral y soporte `PT | ES | EN`. Incluye 7 módulos independientes: (1) Credencial Soberana NID, (2) Grafo Familiar Read-Only y Domicilio, (3) Salud HL7 y Telemedicina con IA, (4) Educación y Calificaciones Escolares, (5) **Mantenimiento Urbano 311**, (6) **Emergencia 911 (SOS Táctico y Médico)** y (7) Economía, Empresas en 45s y Pasaporte OACI. |
| **3. Backstage Gubernamental & Identidad 360** | [`apps/gov-backstage`](./apps/gov-backstage) | [`https://novatlantis-gov-backstage-wpahcxvhuq-uc.a.run.app`](https://novatlantis-gov-backstage-wpahcxvhuq-uc.a.run.app) | **Aplicación Exclusiva para Servidores y Gestores Públicos (Material UI)**: Navegación entre los 7 entornos administrativos mediante Persistent Navigation Drawer (`☰`) lateral con soporte `PT | ES | EN` y control **Identidad 360 (RBAC/ABAC)**. Incluye: (1) Gabinete del Primer Ministro (**Joao Thiago Poço - JT**), (2) Gestión IAM 360, (3) Gestión de Hospitales y Médicos, (4) Gestión de Escuelas y Notas, (5) **Comando de Mantenimiento Urbano 311**, (6) **Central de Despacho de Emergencia 911** y (7) Justicia, Tesoro, AlloyDB y GDP de 100k ciudadanos. |

---

## 3. Credenciales Oficiales de Prueba (SSO, Primer Login Obligatorio & Identidad 360)

| NID | Nombre / Cargo | Correo de Inicio de Sesión | Contraseña Inicial (Canal Postal) | Rol Identidad 360 (`iam_role`) | Acceso al Backstage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `NID-000-0000-0001-9` | **Joao Thiago Poço (JT) — Primer Ministro / Root** | `jt@novatlantis.gov.cloud` | `Novatlantis@0001-9` | `PRIME_MINISTER_ROOT` | **TOTAL (Root L10)** |
| `NID-000-0000-0002-7` | **Dr. Aurelius Valerius (Secretario General)** | `secretario.geral@novatlantis.gov.cloud` | `Novatlantis@0002-7` | `SECRETARY_GENERAL` | **TOTAL (Ejecutivo L9)** |
| `NID-000-0000-0003-5` | **Helena Viana (Gestora Identidad 360)** | `gestor.identidade@novatlantis.gov.cloud` | `Novatlantis@0003-5` | `IDENTITY_MANAGER_360` | **Gestión IAM 360 (L8)** |
| `NID-000-0000-0004-3` | **Dra. Sofia Mendes (Gestora Salud & Médica)** | `sofia.mendes@saude.novatlantis.gov.cloud` | `Novatlantis@0004-3` | `DOCTOR_AND_HEALTH_MANAGER` | **Salud & Telemedicina (L6)** |
| `NID-000-0000-0006-0` | **Prof. Lucas Albuquerque (Gestor Educación)** | `lucas.albuquerque@educacao.novatlantis.gov.cloud` | `Novatlantis@0006-0` | `TEACHER_AND_EDU_MANAGER` | **Educación, Exámenes & Notas (L6)** |
| `NID-000-0000-0008-6` | **Comandante Rafael Santos** | `rafael.santos@operacoes.novatlantis.gov.cloud` | `Novatlantis@0008-6` | `OPERATIONS_311_911_MANAGER` | **Comando 311 & 911 (L6)** |
| `NID-000-0000-0009-4` | **Magistrada Clara Sterling Davis** | `clara.sterling@justica.novatlantis.gov.cloud` | `Novatlantis@0009-4` | `JUSTICE_AND_TREASURY_MANAGER` | **Justicia & Tesoro (L7)** |
| `NID-000-0000-0010-8` | **Pedro Albuquerque Viana (Estudiante 11a)** | `pedro.albuquerque@cidadao.novatlantis.gov.cloud` | `Novatlantis@0010-8` | `CITIZEN_COMMON` | **Denegado (Solo Portal Ciudadano)** |
