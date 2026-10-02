# Novatlantis First-Responder Agent — Trilingual Batch Quality & Compliance Evaluation Report

- **Evaluation Run ID**: `eval-trilingual-20261002-002806`
- **Timestamp (UTC)**: `2026-10-02T00:33:07.988129+00:00`
- **Agent Runtime Resource**: `projects/1054221034062/locations/us-central1/reasoningEngines/954401931432820736`
- **Model**: `gemini-2.5-flash`
- **Grounding Corpus**: `gs://novatlantis-state-assets/novatlantis_constitution_and_civil_rights.txt`

## 1. Aggregate Quality Metrics by Language (`pt-BR`, `es-419`, `en-US`)

| Language | Dataset File | Cases Passed | Language Match | Mean Grounding | Mean Answer Relevance | Mean Adherence to Guidelines |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **pt-BR** | `tests/eval/compliance_dataset_pt.json` | **10 / 10 (100%)** | **10 / 10** | **1.00** | **1.00** | **1.00** |
| **es-419** | `tests/eval/compliance_dataset_es.json` | **10 / 10 (100%)** | **10 / 10** | **1.00** | **1.00** | **1.00** |
| **en-US** | `tests/eval/compliance_dataset_en.json` | **10 / 10 (100%)** | **10 / 10** | **1.00** | **1.00** | **1.00** |
| **TOTAL (All 3 Languages)** | `30 Trilingual Cases` | **30 / 30 (100%)** | **30 / 30** | **1.00** | **1.00** | **1.00** |

## 2. Case-by-Case Results (`eval_pt_001`–`010`, `eval_es_001`–`010`, `eval_en_001`–`010`)

| ID | Lang | Category | Tools Invoked | Grounding | Relevance | Adherence | Lang Match | Status |
| :--- | :---: | :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| `eval_pt_001` | `pt-BR` | Constitutional Rights & Privacy | `search_constitution_and_rights` | 1.00 | 1.00 | 1.00 | YES | **PASS** |
| `eval_pt_002` | `pt-BR` | National Identity (NID) & Biometrics | `search_constitution_and_rights`, `lookup_citizen_nid_registry` | 1.00 | 1.00 | 1.00 | YES | **PASS** |
| `eval_pt_003` | `pt-BR` | Urban Services (311 MCP Routing) | `search_constitution_and_rights`, `delegate_urban_services_311` | 1.00 | 1.00 | 1.00 | YES | **PASS** |
| `eval_pt_004` | `pt-BR` | Emergency & Life Safety (911 MCP Routing) | `search_constitution_and_rights`, `delegate_emergency_dispatch_911` | 1.00 | 1.00 | 1.00 | YES | **PASS** |
| `eval_pt_005` | `pt-BR` | Health & Telemedicine (MCP Routing) | `search_constitution_and_rights`, `delegate_health_telemed` | 1.00 | 1.00 | 1.00 | YES | **PASS** |
| `eval_pt_006` | `pt-BR` | Education Services (MCP Routing) | `search_constitution_and_rights`, `delegate_education_learning` | 1.00 | 1.00 | 1.00 | YES | **PASS** |
| `eval_pt_007` | `pt-BR` | Governance & Agent Authority Limits | `search_constitution_and_rights` | 1.00 | 1.00 | 1.00 | YES | **PASS** |
| `eval_pt_008` | `pt-BR` | Fallback & Agent Federation Trigger | `search_constitution_and_rights` | 1.00 | 1.00 | 1.00 | YES | **PASS** |
| `eval_pt_009` | `pt-BR` | Language Autonomy & Multilingual Support (Civic Duties) | `search_constitution_and_rights` | 1.00 | 1.00 | 1.00 | YES | **PASS** |
| `eval_pt_010` | `pt-BR` | Legal & Judicial Record Lookup | `search_constitution_and_rights` | 1.00 | 1.00 | 1.00 | YES | **PASS** |
| `eval_es_001` | `es-419` | Constitutional Rights & Privacy | `search_constitution_and_rights` | 1.00 | 1.00 | 1.00 | YES | **PASS** |
| `eval_es_002` | `es-419` | National Identity (NID) & Biometrics | `search_constitution_and_rights`, `lookup_citizen_nid_registry` | 1.00 | 1.00 | 1.00 | YES | **PASS** |
| `eval_es_003` | `es-419` | Urban Services (311 MCP Routing) | `search_constitution_and_rights`, `delegate_urban_services_311` | 1.00 | 1.00 | 1.00 | YES | **PASS** |
| `eval_es_004` | `es-419` | Emergency & Life Safety (911 MCP Routing) | `delegate_emergency_dispatch_911`, `search_constitution_and_rights` | 1.00 | 1.00 | 1.00 | YES | **PASS** |
| `eval_es_005` | `es-419` | Health & Telemedicine (MCP Routing) | `search_constitution_and_rights`, `delegate_health_telemed` | 1.00 | 1.00 | 1.00 | YES | **PASS** |
| `eval_es_006` | `es-419` | Education Services (MCP Routing) | `search_constitution_and_rights`, `delegate_education_learning` | 1.00 | 1.00 | 1.00 | YES | **PASS** |
| `eval_es_007` | `es-419` | Governance & Agent Authority Limits | `search_constitution_and_rights` | 1.00 | 1.00 | 1.00 | YES | **PASS** |
| `eval_es_008` | `es-419` | Fallback & Agent Federation Trigger | `search_constitution_and_rights` | 1.00 | 1.00 | 1.00 | YES | **PASS** |
| `eval_es_009` | `es-419` | Language Autonomy & Multilingual Support (Civic Duties) | `search_constitution_and_rights` | 1.00 | 1.00 | 1.00 | YES | **PASS** |
| `eval_es_010` | `es-419` | Legal & Judicial Record Lookup | `search_constitution_and_rights`, `lookup_citizen_nid_registry` | 1.00 | 1.00 | 1.00 | YES | **PASS** |
| `eval_en_001` | `en-US` | Constitutional Rights & Privacy | `search_constitution_and_rights` | 1.00 | 1.00 | 1.00 | YES | **PASS** |
| `eval_en_002` | `en-US` | National Identity (NID) & Biometrics | `search_constitution_and_rights`, `lookup_citizen_nid_registry` | 1.00 | 1.00 | 1.00 | YES | **PASS** |
| `eval_en_003` | `en-US` | Urban Services (311 MCP Routing) | `search_constitution_and_rights`, `delegate_urban_services_311` | 1.00 | 1.00 | 1.00 | YES | **PASS** |
| `eval_en_004` | `en-US` | Emergency & Life Safety (911 MCP Routing) | `delegate_emergency_dispatch_911` | 1.00 | 1.00 | 1.00 | YES | **PASS** |
| `eval_en_005` | `en-US` | Health & Telemedicine (MCP Routing) | `search_constitution_and_rights`, `delegate_health_telemed` | 1.00 | 1.00 | 1.00 | YES | **PASS** |
| `eval_en_006` | `en-US` | Education Services (MCP Routing) | `search_constitution_and_rights`, `delegate_education_learning` | 1.00 | 1.00 | 1.00 | YES | **PASS** |
| `eval_en_007` | `en-US` | Governance & Agent Authority Limits | `search_constitution_and_rights` | 1.00 | 1.00 | 1.00 | YES | **PASS** |
| `eval_en_008` | `en-US` | Fallback & Agent Federation Trigger | `search_constitution_and_rights` | 1.00 | 1.00 | 1.00 | YES | **PASS** |
| `eval_en_009` | `en-US` | Language Autonomy & Multilingual Support (Civic Duties) | `search_constitution_and_rights` | 1.00 | 1.00 | 1.00 | YES | **PASS** |
| `eval_en_010` | `en-US` | Legal & Judicial Record Lookup | `search_constitution_and_rights`, `lookup_citizen_nid_registry` | 1.00 | 1.00 | 1.00 | YES | **PASS** |