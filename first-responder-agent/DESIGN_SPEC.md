# DESIGN_SPEC.md — Novatlantis Sovereign First-Responder Agent

## Overview
The **Novatlantis Sovereign First-Responder Agent** (`first_responder_agent`) is the primary conversational concierge for the official landing portal of the Republic of Novatlantis (`novatlantis-gov`). Built with the Google Agent Development Kit (`google.adk.agents.Agent` published via `google.adk.apps.App`) and powered by `gemini-2.5-flash`, it handles inbound citizen inquiries in Portuguese (`pt-BR`), Spanish (`es-419`), and English (`en-US`).

It grounds all constitutional, civil rights, and governance answers strictly in `gs://novatlantis-state-assets/novatlantis_constitution_and_civil_rights.txt` (and `novatlantis_gdf_master_data_architecture.md`), validates citizen sovereign identities (`NID`), and delegates domain-specific ministerial tasks via Model Context Protocol (MCP) connectors to the 311, 911, Health, and Education specialist agents.

## Example Use Cases
1. **Constitutional & Civil Rights Inquiry (Grounded RAG)**
   - *Input (PT)*: "Quais são os princípios estruturantes de Novatlantis e como funciona o direito à auditoria contínua?"
   - *Expected Output*: Cites **Artigo 2º (I–V)** (*Princípio do Zero Legacy, Estado Agêntico Proativo, Soberania de Dados e Identidade NIST, Plurilinguismo Universal, Explicabilidade Decisória*) and **Artigo 5º, IV** (real-time disclosure of agency/AI reads over the past 48 hours) from `novatlantis_constitution_and_civil_rights.txt`.
2. **Citizen NID Verification & Registry Lookup**
   - *Input (EN)*: "Can you verify my NID `NID-000-0000-0001-9` and check my registered district and language?"
   - *Expected Output*: Calls `lookup_citizen_nid_registry("NID-000-0000-0001-9")`, validates the 11-digit base and Modulo 11 check digit $D$ (weights 2–9 per **Artigo 3º, § 1º**), and returns clearance status, `native_language`, and district without exposing biometric vectors (**Artigo 4º, III**).
3. **Ministerial Delegation via MCP (311 + 911 Preventive Safety)**
   - *Input (PT)*: "Preciso podar uma árvore na frente da minha casa que encostou na rede elétrica."
   - *Expected Output*: Consults `search_constitution_and_rights` (**Seção II, Artigo 8º, § 2º** — 180-second MOPT SLA for electrical hazards with preventive 911 notification), invokes the **Urban Services Agent (311)** (`mcp://agent-311.internal.novatlantis.gov`), and confirms ticket creation and preventive 911 dispatch notification in Portuguese.
4. **Out-of-Scope Query (Mandatory Fallback Protocol)**
   - *Input (PT)*: "Qual é o valor do imposto sobre exportação de naves espaciais em Novatlantis?"
   - *Expected Output*: Retrieves no matching constitutional articles and responds with the mandatory localized fallback:
     *"Eu não sei, mas posso chamar outro agente amigo que saiba. Gostaria que eu consultasse o Agente do Ministério da Economia e Comércio Exterior?"*

## Tools Required
1. **`search_constitution_and_rights(query: str, language: str) -> str`**
   - *Purpose*: Semantic and keyword retrieval across `gs://novatlantis-state-assets/novatlantis_constitution_and_civil_rights.txt` (with local fallback cache of the canonical text).
   - *Returns*: Relevant constitutional titles, articles (`Artigo 1º` to `Artigo 12`), paragraphs, and section citations.
   - *Auth*: Google Cloud Storage read access via ADC / runtime service account (`roles/storage.objectViewer`).
2. **`lookup_citizen_nid_registry(nid: str) -> dict`**
   - *Purpose*: Validates the `NID-AAA-BBBB-CCCC-D` mask (11-digit base + Modulo 11 check digit $D$ with weights 2 to 9) and queries public citizen metadata (clearance status, `native_language`, district).
   - *Returns*: Structured dictionary with `valid`, `nid`, `check_digit_verified`, `clearance_status`, `native_language`, and `district` (strictly excluding raw biometric vectors).
3. **MCP Specialized Ministerial Agent Connectors**
   - **`delegate_urban_services_311`** (`mcp://agent-311.internal.novatlantis.gov`): Potholes, power line hazards, street cleaning, urban permits, MOPT public works (Artigo 8º).
   - **`delegate_emergency_dispatch_911`** (`mcp://agent-911.internal.novatlantis.gov`): Immediate police response, fire brigade, HL7-linked paramedic dispatch (Artigo 9º).
   - **`delegate_health_telemed`** (`mcp://agent-health.internal.novatlantis.gov`): HL7 FHIR immunization status, teleconsultation scheduling, primary care lookup (Artigo 10).
   - **`delegate_education_learning`** (`mcp://agent-edu.internal.novatlantis.gov`): School enrollment, student progress tracking, adaptive curriculum pathways (Artigo 11).

## Constraints & Safety Rules
- **Strict Grounding Rule**: Never fabricate constitutional articles, invent decrees, alter the Modulo 11 NID check-digit algorithm, or hallucinate policies outside `gs://novatlantis-state-assets/novatlantis_constitution_and_civil_rights.txt` and `novatlantis_gdf_master_data_architecture.md`.
- **Mandatory Fallback Protocol**: If a question cannot be answered from the primary source documents or resolved via the registered tools/MCP agents, the agent MUST reply with the exact localized fallback sentence before offering routing:
  - **EN**: *"I don't know, but I can call another friend agent that may know."*
  - **PT**: *"Eu não sei, mas posso chamar outro agente amigo que saiba."*
  - **ES**: *"No lo sé, pero puedo llamar a otro agente amigo que lo sepa."*
- **Biometric Non-Disclosure (Artigo 4º, III)**: Never output raw biometric templates, facial vectors, or fingerprint minutiae.
- **Multilingual Parity (Artigo 2º, IV)**: Detect and respond in `pt-BR`, `es-419`, or `en-US`, switching languages seamlessly upon user request.

## Success Criteria
- **Grounding & Citation Accuracy**: All constitutional answers cite the exact article (`Artigo 1º`–`Artigo 12`) from `gs://novatlantis-state-assets/novatlantis_constitution_and_civil_rights.txt`.
- **Tool Trajectory Accuracy**: Properly invokes `search_constitution_and_rights`, `lookup_citizen_nid_registry`, and the 4 MCP delegation tools when matching intents occur.
- **Fallback Compliance**: 100% compliance with the mandatory EN/PT/ES fallback string on ungrounded/out-of-scope prompts.
- **Multilingual Consistency**: Responds in the citizen's language across single-turn and multi-turn conversations.

## Reference Samples
Studied from `google/adk-samples` (Phase 1):
- **`high-volume-document-analyzer` / `deep-search`**: Reusing grounded document retrieval and explicit article citation formatting patterns.
- **`travel-concierge` / `genmedia-for-commerce`**: Reusing front-desk concierge routing instructions, custom `FunctionTool` definitions, and MCP tool integration structure.
- **`safety-plugins`**: Reusing strict grounding guardrails and deterministic fallback enforcement when retrieval yields no matching sections.
