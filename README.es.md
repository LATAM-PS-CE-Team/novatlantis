# República Digital de Novatlantis — Infraestructura Pública Digital Soberana & Estado Agéntico

> **Idiomas de la Documentación / Documentation Languages:**
> - 🇧🇷 **Português (Oficial):** [README.md](./README.md)
> - 🇪🇸 **Español:** [README.es.md](./README.es.md)
> - 🇺🇸 **English:** [README.en.md](./README.en.md)
> - 🏛️ **Government Data Platform (GDP / EDP):** [government-data-platform/README.md](./government-data-platform/README.md)
> - 📘 **Manual Funcional y Técnico Completo:** [docs/DOCUMENTACAO_COMPLETA_NOVATLANTIS.md](./docs/DOCUMENTACAO_COMPLETA_NOVATLANTIS.md)

---

## 1. Visión General de la Nación AI-First (Design System `america.gov` + Material UI + AlloyDB + Government Data Platform)

La **República Digital de Novatlantis** (`novatlantis.gov.cloud`) es una nación soberana nativa de la era agéntica, diseñada con inspiración directa en la estética editorial e institucional de **[america.gov](https://america.gov/)** combinada con **Material UI (`@mui/material` v6)**, **AlloyDB for PostgreSQL** y **Government Data Platform (GDP)**, desplegada en **Google Cloud (Proyecto Argolis: `novatlantis`)**.

### Pilares Arquitectónicos y de Experiencia Ciudadana:
1. **Arquitectura Unificada de Idiomas (i18n Nativo en el 100% de las Páginas — `Português`, `Español`, `English`):**
   - Selector global de idioma (`🌐 PT | ES | EN`) siempre visible en el encabezado superior (`TopNavUserWidget`), dentro del Menú Hamburguesa (`☰`) de los 3 portales y en las configuraciones del Perfil Soberano.
   - Resolución automática en 3 capas:
     1. Selección explícita en el encabezado/menú (`localStorage.novatlantis_lang` o parámetro `?lang=pt-BR|es-419|en-US` propagado vía SSO);
     2. Idioma nativo (`native_language`) registrado en la base de datos para el ciudadano autenticado (`45% pt-BR`, `45% es-419`, `10% en-US`);
     3. Detección automática mediante `navigator.language` / `Accept-Language`.
2. **Design System Editorial `america.gov` y Navegación con Menú Hamburguesa (`☰`):**
   - Paleta cívica de alto contraste (`#fcfbf9` Warm Cream, `#0a2240` Deep Navy, `#991b1b` Crimson Accent) y tipografía editorial (`Merriweather` + `Public Sans` + `JetBrains Mono`).
   - Navegación mediante **Menú Hamburguesa (`☰`)** tanto en los encabezados de los portales como dentro del **Modal de Perfil Soberano ("Más Opciones del Perfil")**, permitiendo alternar entre Cartera Digital NID, Datos y Foto Oficial (con compresión y persistencia en `citizen_profiles`), Seguridad y Preferencias sin bloqueos de pantalla.
3. **Autenticación Zero-Trust Sin Inicio de Sesión Automático & Concierge IA Público:**
   - **Ningún usuario inicia sesión por defecto.** Cualquier visitante puede hacer preguntas públicas en el **Concierge IA Nacional** en la Página Principal sin necesidad de iniciar sesión.
   - Al solicitar un servicio personal o administrativo, el sistema solicita autenticación soberana (`NID` + Contraseña con cambio obligatorio en el primer inicio de sesión).
4. **3 Aplicaciones Full-Stack Independientes** con **React + Material UI (`@mui/material`)** y **Backend Node.js 22 conectado a AlloyDB for PostgreSQL (`10.223.28.2:5432`) mediante Direct VPC Egress**.

---

## 2. Separación de las 3 Aplicaciones Principales Full-Stack (Producción Cloud Run + Material UI)

| Aplicación Full-Stack | Directorio | Servicio Cloud Run (`novatlantis`) | Rol Institucional & Funcionalidades |
| :--- | :--- | :--- | :--- |
| **1. Portal Principal de la Nación + Concierge IA Nacional** | [`apps/landing-portal`](./apps/landing-portal) | [`https://novatlantis-landing-portal-wpahcxvhuq-uc.a.run.app`](https://novatlantis-landing-portal-wpahcxvhuq-uc.a.run.app) | **Página Principal Estilo `america.gov` (Material UI)**: Franja oficial gubernamental, encabezado con Menú Hamburguesa (`☰`), selector global de idiomas (`PT | ES | EN`) y widget de usuario (`TopNavUserWidget`). Hero con **Concierge IA Nacional** abierto sin login y matriz de servicios esenciales. |
| **2. Portal del Ciudadano (Autoservicio 360°)** | [`apps/citizen-portal`](./apps/citizen-portal) | [`https://novatlantis-citizen-portal-wpahcxvhuq-uc.a.run.app`](https://novatlantis-citizen-portal-wpahcxvhuq-uc.a.run.app) | **Aplicación Exclusiva del Ciudadano (Material UI)**: Navegación interna por Menú Hamburguesa (`☰`) y soporte `PT | ES | EN`. Incluye Cartera Soberana NID (Mod-11 + Biometría NIST + Carga de Foto persistida en AlloyDB/SQLite), Grafo Familiar Read-Only (`rel_family_graph`), Historia Clínica HL7 y Telemedicina con IA, Boletín Escolar, Atención 311, SOS 911, Empresas en 45s y Pasaporte ICAO. |
| **3. Backstage Gubernamental & Identidad 360** | [`apps/gov-backstage`](./apps/gov-backstage) | [`https://novatlantis-gov-backstage-wpahcxvhuq-uc.a.run.app`](https://novatlantis-gov-backstage-wpahcxvhuq-uc.a.run.app) | **Aplicación Exclusiva para Servidores y Gestores Públicos (Material UI)**: Navegación entre los 6 entornos administrativos mediante Menú Hamburguesa (`☰`) con soporte `PT | ES | EN` y control **Identidad 360 (RBAC/ABAC)**. Gabinete del Primer Ministro (`jopoco`), Gestión IAM 360, Gestión de Hospitales y Médicos, Gestión de Escuelas y Notas, Comando 311/911 y Explorador AlloyDB & GDP de 100k ciudadanos. |

---

## 3. Credenciales Oficiales de Prueba (SSO, Primer Login Obligatorio & Identidad 360)

| NID | Nombre / Cargo | Correo de Inicio de Sesión | Contraseña Inicial (Canal Postal) | Rol Identidad 360 (`iam_role`) | Acceso al Backstage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `NID-000-0000-0001-9` | **Jopoco (Primer Ministro / Root)** | `jopoco@novatlantis.gov.cloud` | `Novatlantis@0001-9` (o `ATs32=34`) | `PRIME_MINISTER_ROOT` | **TOTAL (Root L10)** |
| `NID-000-0000-0002-7` | **Dr. Aurelius Valerius (Secretario General)** | `secretario.geral@novatlantis.gov.cloud` | `Novatlantis@0002-7` | `SECRETARY_GENERAL` | **TOTAL (Ejecutivo L9)** |
| `NID-000-0000-0003-5` | **Helena Viana (Gestora Identidad 360)** | `gestor.identidade@novatlantis.gov.cloud` | `Novatlantis@0003-5` | `IDENTITY_MANAGER_360` | **Gestión IAM 360 (L8)** |
| `NID-000-0000-0004-3` | **Dra. Sofia Mendes (Gestora Salud & Médica)** | `sofia.mendes@saude.novatlantis.gov.cloud` | `Novatlantis@0004-3` | `DOCTOR_AND_HEALTH_MANAGER` | **Salud & Telemedicina (L6)** |
| `NID-000-0000-0006-0` | **Prof. Lucas Albuquerque (Gestor Educación)** | `lucas.albuquerque@educacao.novatlantis.gov.cloud` | `Novatlantis@0006-0` | `TEACHER_AND_EDU_MANAGER` | **Educación, Exámenes & Notas (L6)** |
| `NID-000-0000-0008-6` | **Comandante Rafael Santos** | `rafael.santos@operacoes.novatlantis.gov.cloud` | `Novatlantis@0008-6` | `OPERATIONS_311_911_MANAGER` | **Comando 311 & 911 (L6)** |
| `NID-000-0000-0009-4` | **Magistrada Clara Sterling Davis** | `clara.sterling@justica.novatlantis.gov.cloud` | `Novatlantis@0009-4` | `JUSTICE_AND_TREASURY_MANAGER` | **Justicia & Tesoro (L7)** |
| `NID-000-0000-0010-8` | **Pedro Albuquerque Viana (Estudiante 11a)** | `pedro.albuquerque@cidadao.novatlantis.gov.cloud` | `Novatlantis@0010-8` | `CITIZEN_COMMON` | **Denegado (Solo Portal Ciudadano)** |
