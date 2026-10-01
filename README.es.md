# República Digital de Novatlantis — Infraestructura Pública Digital Soberana & Estado Agéntico

> **Idiomas de la Documentación / Documentation Languages:**
> - 🇧🇷 **Português (Oficial):** [README.md](./README.md)
> - 🇪🇸 **Español:** [README.es.md](./README.es.md)
> - 🇺🇸 **English:** [README.en.md](./README.en.md)
> - 🏛️ **Government Data Platform (GDP / EDP):** [government-data-platform/README.md](./government-data-platform/README.md)
> - 📘 **Manual Funcional y Técnico Completo:** [docs/DOCUMENTACAO_COMPLETA_NOVATLANTIS.md](./docs/DOCUMENTACAO_COMPLETA_NOVATLANTIS.md)

---

## 1. Visión General de la Nación AI-First (Material UI + AlloyDB + Government Data Platform)

La **República Digital de Novatlantis** (`novatlantis.gov.cloud`) es una nación soberana nativa de la era agéntica, diseñada bajo el paradigma **Sovereign Civic** con **Material UI (`@mui/material` v6)** e implementada en **Google Cloud (Proyecto Argolis: `novatlantis`)**.

La arquitectura del Estado incluye:
- **3 Aplicaciones Full-Stack Independientes** con **React + Material UI (`@mui/material`)** y **Backend Node.js 22 conectado a AlloyDB for PostgreSQL mediante Direct VPC Egress**;
- **Base de Datos Transaccional Soberana en AlloyDB for PostgreSQL**:
  - **Clúster:** `projects/novatlantis/locations/us-central1/clusters/novatlantis-sovereign-cluster`
  - **Instancia Primaria:** `projects/novatlantis/locations/us-central1/clusters/novatlantis-sovereign-cluster/instances/novatlantis-primary-01` (`10.223.28.2:5432`, PostgreSQL 15 + `vector`)
- **Government Data Platform (GDP)** ([`government-data-platform/`](./government-data-platform)) basado en [`googlecloudplatform/education-data-platform`](https://github.com/googlecloudplatform/education-data-platform), desplegado en BigQuery y Cloud Storage con **100.000 ciudadanos**.

---

## 2. Separación de las 3 Aplicaciones Principales Full-Stack (Producción Cloud Run + Material UI)

| Aplicación Full-Stack | Directorio | Servicio Cloud Run (`novatlantis`) | Rol Institucional |
| :--- | :--- | :--- | :--- |
| **1. Portal Principal de la Nación + Chat del Agente Orquestador** | [`apps/landing-portal`](./apps/landing-portal) | [`https://novatlantis-landing-portal-wpahcxvhuq-uc.a.run.app`](https://novatlantis-landing-portal-wpahcxvhuq-uc.a.run.app) | **Página Principal de la Nación (Material UI)**: Encabezado institucional ampliado con widget de estado del usuario con foto (`TopNavUserWidget`), estado en tiempo real de **AlloyDB + Government Data Platform**, matriz de eventos de vida y **Barra de Búsqueda Central controlada por el Agente Orquestador**. |
| **2. Portal del Ciudadano (Autoservicio 360°)** | [`apps/citizen-portal`](./apps/citizen-portal) | [`https://novatlantis-citizen-portal-wpahcxvhuq-uc.a.run.app`](https://novatlantis-citizen-portal-wpahcxvhuq-uc.a.run.app) | **Aplicación Exclusiva del Ciudadano (Material UI)**: Cartera Soberana NID (Mod-11 + Biometría NIST), Grafo Familiar Read-Only (`rel_family_graph`), Historia Clínica HL7 y Telemedicina con IA, Boletín Escolar, Atención 311, SOS 911, apertura de empresas en 45s y Pasaporte ICAO. |
| **3. Backstage Gubernamental & Identidad 360** | [`apps/gov-backstage`](./apps/gov-backstage) | [`https://novatlantis-gov-backstage-wpahcxvhuq-uc.a.run.app`](https://novatlantis-gov-backstage-wpahcxvhuq-uc.a.run.app) | **Aplicación Exclusiva para Servidores y Gestores Públicos (Material UI)**: Gabinete del Primer Ministro (`jopoco`), Gestión RBAC/ABAC en Identidad 360, Gestión de Hospitales y Médicos, Gestión de Escuelas y Notas, Comando 311/911 y Explorador AlloyDB & GDP de 100k ciudadanos. |
