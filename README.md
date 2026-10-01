# República Digital de Novatlantis — Ecossistema Soberano AI-First

**Lema Constitucional:** `NOVATLANTIS • LIBERTAS IN DIGITALI`  
**Design System:** `Sovereign Civic` (Austeridade Institucional, Clareza Tipográfica e Eficiência Agêntica)  
**Google Cloud Project ID (Argolis):** `novatlantis` (`1054221034062`)  
**Documentação Funcional e Técnica Completa:** [`docs/DOCUMENTACAO_COMPLETA_NOVATLANTIS.md`](docs/DOCUMENTACAO_COMPLETA_NOVATLANTIS.md)

---

## 1. Serviços em Produção (Google Cloud Run — `novatlantis`)

| Serviço / Ambiente | URL de Produção | Descrição |
| :--- | :--- | :--- |
| **Portal Master, Espaço do Cidadão & Backstage Governamental (GDF 100k)** | https://novatlantis-landing-portal-wpahcxvhuq-uc.a.run.app | Portal Institucional Austero (*Sovereign Civic*), Login Único NID/E-mail, Espaço do Cidadão e Ambiente de Backstage com 7 Ministérios e banco operacional SQLite de 100.000 cidadãos embarcado. |
| **Autoridade de Identidade 360 (NID & Biometria NIST)** | https://novatlantis-identity-nid-wpahcxvhuq-uc.a.run.app | Verificação biométrica ISO/IEC 19794-5 & 19794-2, chaves `Ed25519` e resolução de escopos RBAC/ABAC. |
| **Zeladoria Urbana 311 & Backstage Público** | https://novatlantis-services-311-wpahcxvhuq-uc.a.run.app | Triagem de chamados urbanos georreferenciados nos 50.000 imóveis (`dim_addresses`). |
| **Comando Nacional de Emergência 911** | https://novatlantis-emergency-911-wpahcxvhuq-uc.a.run.app | Despacho de emergência com cruzamento automático de prontuário HL7 e alerta familiar (`rel_family_graph`). |
| **Ministério da Saúde, Hospitais & Telemedicina** | https://novatlantis-health-telemed-wpahcxvhuq-uc.a.run.app | Prontuário Único HL7 FHIR (100k cidadãos), gestão dos 5 hospitais nacionais e prescrição digital assinada. |
| **Ministério da Educação, Escolas & Diário Docente** | https://novatlantis-education-learn-wpahcxvhuq-uc.a.run.app | Gestão das 6 escolas/universidades, 17.993 matrículas ativas, notas por matéria e prevenção de evasão escolar. |

---

## 2. Government Data Framework (GDF) & Data Lakehouse (100.000 Cidadãos)

- **Gerador Determinístico:** [`data-generator/generate_novatlantis_lakehouse.py`](data-generator/generate_novatlantis_lakehouse.py)
- **Exportações Comprimidas (Camada Bronze):** [`data-generator/lakehouse/*.ndjson.gz`](data-generator/lakehouse/) e bucket `gs://novatlantis-gdf-lakehouse/bronze/`
- **Datasets BigQuery (`novatlantis`):**
  - `novatlantis:gdf_bronze`
  - `novatlantis:gdf_silver` (`dim_citizens`, `sec_biometrics_nist`, `rel_family_graph`, `dim_addresses`, `rel_citizen_residence`, `health_records`, `health_vaccinations`, `edu_enrollments`, `sec_passports`, `justice_records`, `iam_identity_360_roles`)
  - `novatlantis:gdf_gold` (`vw_border_passport_clearance`, `vw_school_truancy_family_alerts`, `vw_emergency_911_medical_dispatch`)

---

## 3. Credenciais de Acesso (Login Único Cidadão & Backstage Governamental)

No Portal Master (`https://novatlantis-landing-portal-wpahcxvhuq-uc.a.run.app`), utilize qualquer NID ou E-mail dos 100.000 cidadãos ou selecione um dos perfis executivos abaixo:

1. **Primeiro-Ministro & Root Admin (`jopoco`):** `NID-000-0000-0001-9` (`admin@jopoco.altostrat.com` / `jopoco@novatlantis.gov.cloud`)
2. **Secretário-Geral de Estado:** `NID-000-0000-0002-7` (`secretario.geral@novatlantis.gov.cloud`)
3. **Gestora de Identidades do Governo (Identidade 360):** `NID-000-0000-0003-5` (`gestor.identidade@novatlantis.gov.cloud`)
4. **Médica & Gestora Pública de Saúde:** `NID-000-0000-0004-3` (`dra.sofia.mendes@novatlantis.gov.cloud`)
5. **Professor & Gestor Público de Educação:** `NID-000-0000-0006-0` (`prof.lucas.silva@novatlantis.gov.cloud`)
6. **Gestor de Operações 311 & Comando 911:** `NID-000-0000-0008-6` (`comandante.rafael@novatlantis.gov.cloud`)
7. **Magistrada, Passaportes & Tesouro:** `NID-000-0000-0009-4` (`juiza.clara.sterling@novatlantis.gov.cloud`)
8. **Estudante / Cidadão Comum (Sem Acesso Backstage):** `NID-000-0000-0010-2` (`pedro.albuquerque@cidadania.novatlantis.gov`)
