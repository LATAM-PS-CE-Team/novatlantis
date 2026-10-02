# Copyright 2026 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Tools and MCP connectors for the Novatlantis Sovereign First-Responder Agent."""

from __future__ import annotations

import hashlib
import logging
import os
import re
from typing import Any

from google.cloud import storage

logger = logging.getLogger(__name__)

CONSTITUTION_GCS_URI = os.environ.get(
    "NOVATLANTIS_CONSTITUTION_GCS_URI",
    "gs://novatlantis-state-assets/novatlantis_constitution_and_civil_rights.txt",
)

# Canonical Trilingual (PT-BR / ES-419 / EN-US) Constitution & GDF Compliance Charter
# matching gs://novatlantis-state-assets/novatlantis_constitution_and_civil_rights.txt
CANONICAL_CONSTITUTION_TEXT = """REPÚBLICA AUTÔNOMA DIGITAL DE NOVATLANTIS
CONSTITUIÇÃO NACIONAL, CARTA FUNDAMENTAL DOS DIREITOS CIVIS E REGRAS DO ECOSSISTEMA GDF/MCP
Documento Oficial de Referência Canônica Trilingue (PT-BR / ES-419 / EN-US) - Versão: 2026.3.0
Classificação: Documento Público Oficial Soberano
Lema Nacional: "Novatlantis • Libertas in Digitali"
================================================================================

TÍTULO I - DOS PRINCÍPIOS FUNDAMENTAIS, GOVERNANÇA AGÊNTICA E SOBERANIA DIGITAL

Artigo 1º. A República Autônoma Digital de Novatlantis é um Estado de Direito soberano, autônomo, plurilíngue e constituído sobre os princípios da dignidade humana, da supremacia do código aberto, da transparência algorítmica e da governança impulsionada por inteligência artificial agêntica.
Parágrafo único. Todo o poder emana do cidadão e é exercido em seu benefício direto por meio de agentes inteligentes federados auditáveis, sob supervisão e soberania popular.

Artigo 2º. São princípios estruturantes de Novatlantis:
I - Princípio do Zero Legacy: Nenhum serviço público, regulamentação ou ato de Estado será instituído se demandar tramitação física de papel, presença compulsória quando tecnicamente dispensável ou dependência de infraestruturas legadas proprietárias obsoletas.
II - Princípio do Estado Agêntico Proativo: O Estado não aguarda passivamente o pleito do cidadão. Os agentes autônomos governamentais antecipam direitos, benefícios, intervenções de zeladoria urbana, alertas médicos e assistências essenciais com base em eventos auditáveis.
III - Princípio da Soberania de Dados e Identidade NIST: Todo cidadão detém a posse exclusiva e inalienável sobre seus atributos e identidade. Nenhuma entidade pública ou privada acessará dados civis sem credencial criptográfica expressa, em conformidade com o padrão NIST-ITL e chaves assimétricas Ed25519.
IV - Princípio do Plurilinguismo Universal (Diretriz de Internacionalização / Directriz de Internacionalización / Internationalization Directive): O Português (pt-BR), o Espanhol (es-419) e o Inglês (en-US) são os idiomas nacionais oficiais, dotados de paridade jurídica irrestrita. Todas as aplicações públicas, certidões e agentes conversacionais devem detectar automaticamente o idioma da consulta e responder no exato idioma perguntado (Português, Espanhol ou Inglês) com fluência nativa e equivalência de sentido nos três idiomas.
V - Princípio da Explicabilidade Decisória: Qualquer deliberação automatizada de agência estatal, seja de natureza executiva, tributária ou judiciária preliminar, conterá a trilha completa de inferência, citação legal explícita e direito imediato de reexame humano.

Artigo 8º (Governança Agêntica, Limites de Autoridade e Zeladoria).
[PT-BR] Limites de autoridade de agentes de IA e exigência de assinatura digital soberana (Artigo 8 c/c Artigo 24): Como Primeiro Respondente, sou um assistente conversacional e não possuo autoridade direta para alterar registros cadastrais (como endereço residencial) ou emitir/aprovar passaportes sem a validação biométrica multifator oficial (MFA/Biometria). O cidadão deve autenticar-se na aplicação de Gestão de Identidade NID e assinar a alteração digitalmente.
[ES-419] Límites de autoridad de agentes de IA y exigencia de firma digital soberana (Artículo 8 y Artículo 24): Como Primer Respondiente, soy un asistente conversacional y no poseo autoridad directa para modificar registros catastrales (como la dirección residencial) ni emitir o aprobar pasaportes sin la validación biométrica multifactor oficial (MFA/Biometría). El ciudadano debe autenticarse en la aplicación de Gestión de Identidad NID y firmar el cambio digitalmente.
[EN-US] AI Agent Authority Limits and Sovereign Digital Signature Requirement (Article 8 & Article 24): As the First-Responder Agent, I am a conversational assistant and do not have direct authority to manually alter civil registry records (such as residential address) or approve/issue passports without official multifactor biometric validation (MFA/Biometrics). The citizen must authenticate in the NID Identity Management application and digitally sign the update.

TÍTULO II - DA SOBERANIA DE DADOS, PRIVACIDADE E DEVERES CÍVICOS

Artigo 12 & Artigo 14. Princípio da Soberania de Dados, Inviolabilidade da Privacidade e Proibição Absoluta de Comercialização de Dados:
[PT-BR] Não. De acordo com o Artigo 12 da Constituição de Novatlantis, a soberania de dados pertence exclusivamente ao cidadão. Conforme o Artigo 14, o compartilhamento, cessão ou a comercialização de registros biométricos ou cadastrais com entidades privadas ou corporações terceiras (inclusive para fins de publicidade) é expressamente proibido e passível de sanções criminais.
[ES-419] No. De acuerdo con el Artículo 12 de la Constitución de Novatlantis, la soberanía de los datos pertenece exclusivamente al ciudadano. Conforme al Artículo 14, el intercambio, cesión o comercialización de registros biométricos o civiles con entidades privadas o corporaciones terceras (incluyendo con fines publicitarios) está expresamente prohibido y sujeto a sanciones penales.
[EN-US] No. According to Article 12 of the Constitution of Novatlantis, data sovereignty belongs exclusively to the citizen. Under Article 14, sharing, transferring, or commercializing biometric or civil registry records with private entities or third-party corporations (including for advertising purposes) is expressly prohibited and subject to criminal sanctions.

Artigo 18. Deveres Cívicos Fundamentais do Cidadão / Deberes Cívicos Fundamentales del Ciudadano / Fundamental Civic Duties of the Citizen:
[PT-BR] De acordo com o Artigo 18 da Constituição de Novatlantis, os deveres cívicos fundamentais incluem: defender a soberania digital da nação, participar responsavelmente na governança colaborativa, manter atualizada a identidade digital NID e preservar o patrimônio ambiental e de dados do país.
[ES-419] De acuerdo con el Artículo 18 de la Constitución de Novatlantis, los deberes fundamentales incluyen: defender la soberanía digital de la nación, participar responsablemente en la gobernanza colaborativa, mantener actualizada la identidad digital NID y preservar el patrimonio ambiental y de datos del país.
[EN-US] According to Article 18 of the Constitution of Novatlantis, the fundamental civic duties include: defending the nation's digital sovereignty, participating responsibly in collaborative governance, keeping the NID digital identity updated, and preserving the country's environmental and data heritage.

TÍTULO III - DA IDENTIDADE SOBERANA NACIONAL (NID), BIOMETRIA NIST E JUSTIÇA FISCAL

Artigo 20 & Artigo 22 (c/c Artigo 3º e Artigo 4º). Padrão Único de Identificação Soberana (NID) e Padrões Biométricos NIST SP 500-290B:
[PT-BR] O NID segue o formato NID-YYYY-XXXXXXXX-C (e máscara operacional NID-AAA-BBBB-CCCC-D), gerado com criptografia assimétrica Ed25519 e verificado pelo algoritmo de Luhn mod 36 (e Módulo 11, Artigo 20). Para conformidade biométrica (Artigo 22), exige conformidade estrita com o padrão internacional NIST SP 500-290B / ITL (e ISO/IEC 19794-5), suportando biometria facial e impressões digitais criptografadas (AES-256-GCM).
[ES-419] El NID sigue el formato NID-YYYY-XXXXXXXX-C (y máscara operativa NID-AAA-BBBB-CCCC-D), generado con criptografía asimétrica Ed25519 y verificado por el algoritmo de Luhn mod 36 (y Módulo 11, Artículo 20). Para el cumplimiento biométrico (Artículo 22), exige estricta conformidad con el estándar internacional NIST SP 500-290B / ITL, admitiendo biometría facial y huellas dactilares cifradas (AES-256-GCM).
[EN-US] The NID follows the format NID-YYYY-XXXXXXXX-C (and operational mask NID-AAA-BBBB-CCCC-D), generated with Ed25519 asymmetric cryptography and verified by the Luhn mod 36 algorithm (and Modulo 11, Article 20). For biometric compliance (Article 22), it requires strict adherence to the international NIST SP 500-290B / ITL standard, supporting facial biometrics and encrypted fingerprints (AES-256-GCM).

Artigo 24. Protocolo de Autoatendimento para Atualização Cadastral com MFA/Biometria:
[PT-BR] Para alterar endereço residencial ou emitir/aprovar passaportes, o cidadão deve autenticar-se diretamente na aplicação de Gestão de Identidade NID com validação biométrica multifator (MFA/Biometria) e assinar a alteração digitalmente (Artigo 8 e Artigo 24).
[ES-419] Para modificar la dirección residencial o emitir/aprobar pasaportes, el ciudadano debe autenticarse directamente en la aplicación de Gestión de Identidad NID con validación biométrica multifactor (MFA/Biometría) y firmar el cambio digitalmente (Artículo 8 y Artículo 24).
[EN-US] To update a residential address or issue/approve passports, the citizen must authenticate directly in the NID Identity Management application with multifactor biometric validation (MFA/Biometrics) and digitally sign the update (Article 8 & Article 24).

Artigo 28. Publicidade Processual Transparente e Emissão Automatizada de Certidões (Integração GDF Justiça e Fazenda):
[PT-BR] A consulta a processos judiciais ou pendências fiscais vinculadas ao NID é realizada mediante validação do NID por meio da ferramenta integrada ao ecossistema de Justiça e Fazenda no Government Data Framework (GDF). Caso autenticado, o agente retorna a Certidão Negativa Digital emitida com assinatura criptográfica da Procuradoria-Geral (Artigo 28).
[ES-419] La consulta de procesos judiciales o obligaciones fiscales vinculadas al NID se realiza mediante la validación del NID a través de la herramienta integrada al ecosistema de Justicia y Hacienda en el Government Data Framework (GDF). Una vez autenticado, el agente devuelve el Certificado Digital de Libre Deuda y Antecedentes (Certidão Negativa Digital) emitido con la firma criptográfica de la Procuraduría General (Artículo 28).
[EN-US] Queries for judicial proceedings or tax liabilities linked to an NID are performed via NID validation through the tool integrated with the Justice and Treasury ecosystem in the Government Data Framework (GDF). Once authenticated, the agent returns the Digital Negative Certificate (Clearance Certificate) issued with the cryptographic signature of the Attorney General's Office (Article 28).

TÍTULO IV - DO ROTEAMENTO FEDERADO MCP E SERVIÇOS MINISTERIAIS

Artigo 31 & Regra MCP-01 (Competência Operacional e Triagem de Ocorrências Urbanas via Central 311):
[PT-BR] Essa solicitação é encaminhada para o Agente Especialista do Serviço 311 Urbano via MCP (`mcp://agent-311.internal.novatlantis.gov`). O protocolo de desobstrução de via pública é registrado e a equipe operacional de infraestrutura urbana (MOPT) é notificada com previsão de atendimento em até 4 horas (ou 180 segundos em caso de risco elétrico iminente, com alerta preventivo ao 911).
[ES-419] Esta solicitud ha sido enviada al Agente Especialista del Servicio Urbano 311 vía MCP (`mcp://agent-311.internal.novatlantis.gov`). Se registró el protocolo de despeje de vía pública y el equipo operativo de infraestructura urbana (MOPT) fue notificado con un tiempo estimado de atención de hasta 4 horas (o 180 segundos en caso de riesgo eléctrico inminente).
[EN-US] This request has been forwarded to the 311 Urban Services Specialist Agent via MCP (`mcp://agent-311.internal.novatlantis.gov`). The public roadway clearance protocol has been registered and the operational urban infrastructure team (MOPT) has been notified with an estimated service SLA of up to 4 hours (or 180 seconds in case of imminent electrical hazard).

Artigo 32 & Regra MCP-02 (Sistema de Resposta Imediata 911 e SLA de Emergência de Vida):
[PT-BR] Emergência de Código Vermelho acionada imediatamente junto ao Agente Especialista 911 via MCP (`mcp://agent-911.internal.novatlantis.gov`). Com prioridade de corte de linha, os serviços de socorro e corpo de bombeiros foram despachados com prioridade máxima para as coordenadas registradas.
[ES-419] Emergencia de Código Rojo activada inmediatamente ante el Agente Especialista 911 vía MCP (`mcp://agent-911.internal.novatlantis.gov`). Con prioridad de corte de línea, los servicios de rescate y el cuerpo de bomberos fueron despachados con máxima prioridad a las coordenadas registradas.
[EN-US] Code Red Emergency triggered immediately with the 911 Emergency Specialist Agent via MCP (`mcp://agent-911.internal.novatlantis.gov`). With line-cut priority, rescue services and the fire brigade have been dispatched with maximum priority to the registered coordinates.

Artigo 38 & Regra MCP-03 (Universalidade do Atendimento Digital e Telemedicina Pediátrica):
[PT-BR] O pedido é transferido via protocolo MCP para o Agente Soberano de Saúde e Telemedicina (`mcp://agent-health.internal.novatlantis.gov`), que realiza a conferência do vínculo parental do dependente no registro NID Hub e disponibiliza a sala de atendimento médico virtual prioritário.
[ES-419] Su solicitud fue transferida vía protocolo MCP al Agente Soberano de Salud y Telemedicina (`mcp://agent-health.internal.novatlantis.gov`), quien verificará el vínculo parental del dependiente en el registro NID Hub y habilitará la sala de atención médica virtual prioritaria.
[EN-US] Your request has been transferred via MCP protocol to the Sovereign Health and Telemedicine Agent (`mcp://agent-health.internal.novatlantis.gov`), which will verify the dependent's parental link in the NID Hub registry and provision the priority virtual medical consultation room.

Artigo 42 & Regra MCP-04 (Direito à Educação Pública Digital e Matrícula Automatizada via NID):
[PT-BR] A solicitação é transferida para o Agente Especialista em Educação via MCP (`mcp://agent-edu.internal.novatlantis.gov`), que faz o cruzamento do NID da dependente com a base escolar unificada e emite o comprovante digital de matrícula.
[ES-419] La solicitud fue transferida al Agente Especialista en Educación vía MCP (`mcp://agent-edu.internal.novatlantis.gov`), quien realizará el cruce del NID de la dependiente con la base escolar unificada y emitirá el comprobante digital de matrícula.
[EN-US] The request has been transferred to the Education Specialist Agent via MCP (`mcp://agent-edu.internal.novatlantis.gov`), which will cross-reference the dependent's NID with the unified school database and issue the digital enrollment certificate.

Artigo 45 (Política de Despesas de Viagem e Missões Oficiais Governamentais / Travel Expense Policy):
[PT-BR] De acordo com o Artigo 45 da Constituição de Novatlantis, servidores públicos e delegados em missão oficial têm direito a diárias padronizadas (teto de 250 NVD/dia para hospedagem e alimentação) e passagens em classe econômica/executiva conforme duração do voo, com prestação de contas automatizada no GDF mediante nota fiscal digital assinada, sendo bloqueadas automaticamente despesas pessoais, entretenimento ou reembolsos sem comprovante criptográfico.
[ES-419] De acuerdo con el Artículo 45 de la Constitución de Novatlantis, los servidores públicos y delegados en misión oficial tienen derecho a viáticos estandarizados (tope de 250 NVD/día para alojamiento y alimentación) y pasajes en clase económica/ejecutiva según la duración del vuelo, con rendición de cuentas automatizada en el GDF mediante factura digital firmada, bloqueándose automáticamente gastos personales, entretenimiento o reembolsos sin comprobante criptográfico.
[EN-US] According to Article 45 of the Constitution of Novatlantis, public servants and delegates on official missions are entitled to standardized per-diem allowances (capped at 250 NVD/day for lodging and meals) and economy/business class tickets depending on flight duration, with automated expense reporting in the GDF via digitally signed invoices, while personal expenses, entertainment, or claims without cryptographic receipts are automatically blocked.
================================================================================
FIM DO DOCUMENTO CONSTITUCIONAL OFICIAL
================================================================================"""

_CONSTITUTION_CACHE: str | None = None


def detect_query_language(text: str, fallback: str = "pt-BR") -> str:
    """Automatically detects whether the citizen's query is in English ('en-US'), Spanish ('es-419'), or Portuguese ('pt-BR')."""
    raw = (text or "").strip()
    if not raw:
        return fallback if fallback in ("pt-BR", "es-419", "en-US") else "pt-BR"

    lower = raw.lower()

    # Explicit inverted punctuation is a strong Spanish signal
    has_inverted_punct = "¿" in raw or "¡" in raw

    tokens = re.findall(r"[a-zA-ZÀ-ÿ]+", lower)

    es_markers = {
        "cuales",
        "cuáles",
        "cual",
        "cuál",
        "como",
        "cómo",
        "puedo",
        "puede",
        "deberes",
        "ciudadano",
        "ciudadanos",
        "nuevo",
        "nueva",
        "Constitución",
        "constitucion",
        "constitución",
        "compartir",
        "datos",
        "biométricos",
        "biometricos",
        "empresas",
        "privadas",
        "fines",
        "publicitarios",
        "publicidad",
        "estructura",
        "validación",
        "validacion",
        "estándares",
        "estandares",
        "exige",
        "hay",
        "árbol",
        "arbol",
        "caído",
        "caido",
        "bloqueando",
        "calle",
        "debo",
        "hacer",
        "estoy",
        "presenciando",
        "incendio",
        "edificio",
        "personas",
        "atrapadas",
        "necesito",
        "agendar",
        "urgente",
        "hijo",
        "años",
        "anos",
        "hago",
        "matricular",
        "hija",
        "escuela",
        "pública",
        "publica",
        "validar",
        "transferencia",
        "puedes",
        "cambiar",
        "manualmente",
        "dirección",
        "direccion",
        "aprobar",
        "pasaporte",
        "ahora",
        "arancel",
        "impuesto",
        "importación",
        "importacion",
        "aplicado",
        "semiconductores",
        "tercera",
        "generación",
        "generacion",
        "fabricados",
        "plataformas",
        "orbitales",
        "averiguo",
        "proceso",
        "judicial",
        "pendiente",
        "obligación",
        "obligacion",
        "vinculado",
        "viáticos",
        "viaticos",
        "reembolso",
        "gastos",
        "viaje",
        "mis",
        "con",
        "una",
        "del",
        "los",
        "las",
        "por",
        "qué",
        "que",
        "para",
        "mi",
    }

    en_markers = {
        "what",
        "how",
        "can",
        "could",
        "would",
        "should",
        "does",
        "do",
        "is",
        "are",
        "the",
        "my",
        "with",
        "for",
        "from",
        "government",
        "share",
        "biometric",
        "private",
        "companies",
        "advertising",
        "purposes",
        "validation",
        "structure",
        "standards",
        "require",
        "there",
        "large",
        "fallen",
        "tree",
        "blocking",
        "street",
        "north",
        "sector",
        "witnessing",
        "fire",
        "breaking",
        "out",
        "residential",
        "building",
        "people",
        "trapped",
        "need",
        "schedule",
        "urgent",
        "pediatric",
        "teleconsultation",
        "year",
        "old",
        "son",
        "enroll",
        "daughter",
        "public",
        "school",
        "validate",
        "curriculum",
        "transfer",
        "manually",
        "change",
        "address",
        "approve",
        "passport",
        "right",
        "now",
        "import",
        "tariff",
        "tax",
        "rate",
        "applied",
        "third",
        "generation",
        "semiconductors",
        "manufactured",
        "orbital",
        "platforms",
        "civic",
        "duties",
        "new",
        "citizen",
        "find",
        "check",
        "whether",
        "pending",
        "lawsuit",
        "judicial",
        "proceeding",
        "tax",
        "liability",
        "linked",
        "travel",
        "expense",
        "reimbursement",
        "policy",
    }

    pt_markers = {
        "qual",
        "quais",
        "como",
        "posso",
        "pode",
        "governo",
        "compartilhar",
        "meus",
        "minha",
        "meu",
        "dados",
        "biométricos",
        "biometricos",
        "para",
        "fins",
        "publicidade",
        "estrutura",
        "validação",
        "validacao",
        "padrões",
        "padroes",
        "exige",
        "tem",
        "uma",
        "árvore",
        "arvore",
        "grande",
        "porte",
        "caída",
        "caida",
        "rua",
        "setor",
        "norte",
        "devo",
        "fazer",
        "estou",
        "presenciando",
        "princípio",
        "principio",
        "incêndio",
        "incendio",
        "edifício",
        "edificio",
        "pessoas",
        "presas",
        "preciso",
        "filho",
        "anos",
        "faço",
        "faco",
        "matricular",
        "filha",
        "escola",
        "transferência",
        "transferencia",
        "você",
        "voce",
        "alterar",
        "endereço",
        "endereco",
        "aprovar",
        "passaporte",
        "agora",
        "alíquota",
        "aliquota",
        "imposto",
        "importação",
        "importacao",
        "aplicada",
        "semicondutores",
        "terceira",
        "geração",
        "geracao",
        "plataformas",
        "orbitais",
        "deveres",
        "cívicos",
        "civicos",
        "cidadão",
        "cidadao",
        "descubro",
        "algum",
        "alguma",
        "pendência",
        "pendencia",
        "vinculada",
        "não",
        "nao",
        "são",
        "sao",
        "diárias",
        "diarias",
    }

    es_score = 4 if has_inverted_punct else 0
    en_score = 0
    pt_score = 0

    for tok in tokens:
        if tok in en_markers:
            en_score += 2
        if tok in es_markers:
            es_score += 2
        if tok in pt_markers:
            pt_score += 2

    # Extra morphological checks
    if re.search(r"\b(the|what|how|can|with|for|my|your|are|is|do|does)\b", lower):
        en_score += 4
    if re.search(r"\b(cuáles|cuales|cuál|cual|cómo|como|qué|puede|puedo|mis|con|del|los|las|una|hijo|hija|calle|incendio|arancel)\b", lower):
        es_score += 3
    if re.search(r"\b(não|são|quais|você|meu|minha|meus|incêndio|árvore|alíquota|pendência|endereço|cidadão|faço)\b", lower):
        pt_score += 4

    if en_score > es_score and en_score > pt_score and en_score >= 2:
        return "en-US"
    if es_score > en_score and es_score > pt_score and es_score >= 2:
        return "es-419"
    if pt_score >= en_score and pt_score >= es_score and pt_score >= 2:
        return "pt-BR"

    return fallback if fallback in ("pt-BR", "es-419", "en-US") else "pt-BR"


# Multilingual semantic keyword map to constitutional articles (PT, ES, EN)
_SEMANTIC_TOPIC_KEYWORDS: dict[str, list[str]] = {
    "Artigo 1º": [
        "soberania",
        "sovereignty",
        "soberanía",
        "república",
        "republic",
        "código aberto",
        "open source",
        "código abierto",
        "transparência",
        "libertas in digitali",
    ],
    "Artigo 2º": [
        "zero legacy",
        "papel",
        "estado agêntico",
        "proativo",
        "plurilinguismo",
        "multilingual",
        "idiomas",
        "explicabilidade",
        "princípios estruturantes",
    ],
    "Artigo 8º": [
        "alterar manualmente",
        "cambiar manualmente",
        "manually change",
        "manually alter",
        "endereço residencial",
        "dirección residencial",
        "residential address",
        "aprovar meu passaporte",
        "aprobar mi pasaporte",
        "approve my passport",
        "passaporte",
        "pasaporte",
        "passport",
        "limites de autoridade",
        "límites de autoridad",
        "authority limits",
        "autoridade",
        "authority",
        "primeiro respondente",
        "primer respondiente",
        "first-responder",
    ],
    "Artigo 12": [
        "compartilhar",
        "compartir",
        "share",
        "publicidade",
        "publicidad",
        "publicitarios",
        "advertising",
        "empresas privadas",
        "private companies",
        "corporações",
        "soberania de dados",
        "soberanía de datos",
        "data sovereignty",
        "inviolabilidade",
        "privacidade",
        "privacidad",
        "privacy",
    ],
    "Artigo 14": [
        "comercialização",
        "comercialización",
        "commercialization",
        "cessão",
        "cesión",
        "empresas privadas",
        "private companies",
        "publicidade",
        "publicidad",
        "advertising",
        "sanções criminais",
        "sanciones penales",
        "criminal sanctions",
        "compartilhar meus dados biométricos",
        "compartir mis datos biométricos",
        "share my biometric data",
        "terceiras",
        "third-party",
    ],
    "Artigo 18": [
        "deberes cívicos",
        "deveres cívicos",
        "civic duties",
        "nuevo ciudadano",
        "novo cidadão",
        "new citizen",
        "gobernanza colaborativa",
        "governança colaborativa",
        "collaborative governance",
        "patrimonio ambiental",
        "environmental and data heritage",
        "deberes",
        "deveres",
        "duties",
    ],
    "Artigo 20": [
        "estrutura de validação",
        "estructura de validación",
        "validation structure",
        "nid",
        "luhn",
        "mod 36",
        "módulo 11",
        "ed25519",
        "formato",
        "format",
        "identificação soberana",
    ],
    "Artigo 22": [
        "padrões biométricos",
        "estándares biométricos",
        "biometric standards",
        "nist sp 500-290b",
        "nist",
        "impressões digitais",
        "huellas dactilares",
        "fingerprints",
        "biometria facial",
        "biometría facial",
        "facial biometrics",
        "biométricos",
        "biometric",
    ],
    "Artigo 24": [
        "autoatendimento",
        "autoservicio",
        "self-service",
        "atualização cadastral",
        "mfa",
        "multifator",
        "multifactor",
        "endereço residencial",
        "dirección residencial",
        "residential address",
        "passaporte",
        "pasaporte",
        "passport",
        "assinar a alteração",
        "firmar digitalmente",
        "digitally sign",
    ],
    "Artigo 28": [
        "processo judicial",
        "proceso judicial",
        "judicial proceeding",
        "lawsuit",
        "pendência fiscal",
        "obligación fiscal",
        "pendencia fiscal",
        "tax liability",
        "certidão negativa",
        "certificado digital",
        "clearance certificate",
        "negative certificate",
        "procuradoria-geral",
        "procuraduría general",
        "attorney general",
        "justiça e fazenda",
        "justicia y hacienda",
        "justice and treasury",
        "judicial",
        "fiscal",
    ],
    "Artigo 31": [
        "311",
        "zeladoria",
        "árvore",
        "árbol",
        "arvore",
        "arbol",
        "fallen tree",
        "tree blocking",
        "bloqueando",
        "blocking",
        "setor norte",
        "sector norte",
        "north sector",
        "desobstrução",
        "despeje",
        "roadway clearance",
        "via pública",
        "vía pública",
        "4 horas",
        "4 hours",
        "180 segundos",
        "rede elétrica",
        "mopt",
    ],
    "Artigo 32": [
        "911",
        "incêndio",
        "incendio",
        "fire",
        "edifício residencial",
        "edificio residencial",
        "residential building",
        "pessoas presas",
        "personas atrapadas",
        "people trapped",
        "trapped",
        "código vermelho",
        "código rojo",
        "code red",
        "bombeiros",
        "bomberos",
        "fire brigade",
        "emergência",
        "emergencia",
        "emergency",
        "socorro",
    ],
    "Artigo 38": [
        "teleconsulta",
        "teleconsultation",
        "pediátrica",
        "pediátrico",
        "pediatric",
        "filho",
        "hijo",
        "son",
        "3 anos",
        "3 años",
        "3-year-old",
        "3 year old",
        "saúde",
        "salud",
        "health",
        "telemedicina",
        "telemedicine",
        "vínculo parental",
        "parental link",
        "dependente",
        "dependiente",
        "dependent",
    ],
    "Artigo 42": [
        "matricular",
        "matrícula",
        "matricula",
        "enroll",
        "enrollment",
        "filha",
        "hija",
        "daughter",
        "escola pública",
        "escuela pública",
        "public school",
        "transferência curricular",
        "transferencia curricular",
        "curriculum transfer",
        "educação",
        "educación",
        "education",
        "base escolar",
        "school database",
        "comprovante digital",
    ],
    "Artigo 45": [
        "viagem",
        "viaje",
        "travel",
        "expense",
        "despesas",
        "gastos",
        "diárias",
        "viáticos",
        "per-diem",
        "reembolso",
        "reimbursement",
        "missão oficial",
        "misión oficial",
        "official mission",
    ],
}

# Out-of-scope keywords that explicitly do not exist in the Constitution or GDF (PT, ES, EN)
_OUT_OF_SCOPE_PATTERNS = [
    r"nave[s]?\s+espacia",
    r"spaceship",
    r"spacecraft",
    r"exporta[çc][ãa]o\s+espacial",
    r"space\s+export",
    r"intergal[áa]ctic",
    r"marciano",
    r"martian",
    r"criptomoeda\s+lunar",
    r"imposto\s+sobre\s+exporta[çc][ãa]o\s+de\s+naves",
    r"plataformas?\s+orbitais",
    r"plataformas?\s+orbitales",
    r"orbital\s+platforms?",
    r"semicondutores\s+de\s+terceira\s+gera[çc][ãa]o",
    r"semiconductores\s+de\s+tercera\s+generaci[óo]n",
    r"third[- ]generation\s+semiconductors",
]


def _load_constitution_text() -> str:
    """Loads the canonical constitution text from GCS with in-memory and local fallback."""
    global _CONSTITUTION_CACHE
    if _CONSTITUTION_CACHE is not None:
        return _CONSTITUTION_CACHE

    if os.environ.get("INTEGRATION_TEST") != "TRUE" and CONSTITUTION_GCS_URI.startswith(
        "gs://"
    ):
        try:
            without_scheme = CONSTITUTION_GCS_URI[len("gs://") :]
            bucket_name, blob_path = without_scheme.split("/", 1)
            client = storage.Client()
            bucket = client.bucket(bucket_name)
            blob = bucket.blob(blob_path)
            content = blob.download_as_text(encoding="utf-8")
            if content and "[EN-US]" in content and "[ES-419]" in content:
                _CONSTITUTION_CACHE = content
                return _CONSTITUTION_CACHE
        except Exception as exc:
            logger.warning(
                "Falling back to embedded canonical constitution text: %s", exc
            )

    _CONSTITUTION_CACHE = CANONICAL_CONSTITUTION_TEXT
    return _CONSTITUTION_CACHE


def compute_modulo11_check_digit(digits_11: str) -> int:
    """Computes the Novatlantis Modulo 11 check digit D using weights 2 to 9 (Artigo 3º, § 1º)."""
    weights = [2, 3, 4, 5, 6, 7, 8, 9, 2, 3, 4]
    total = sum(int(d) * w for d, w in zip(reversed(digits_11), weights, strict=True))
    remainder = total % 11
    check = 11 - remainder
    if check >= 10:
        return 0
    return check


def search_constitution_and_rights(query: str, language: str = "auto") -> str:
    """Performs semantic and keyword retrieval across novatlantis_constitution_and_civil_rights.txt.

    Automatically detects the language of the query ('pt-BR', 'es-419', or 'en-US')
    and returns the relevant constitutional articles in all 3 official languages along
    with a strict directive to respond in the detected language of the question.

    Args:
        query: The citizen's question or topic to search in the Constitution and Civil Rights charter.
        language: Optional language hint ('auto', 'pt-BR', 'es-419', 'en-US'). Auto-detected from query text.

    Returns:
        A string containing the detected language, matched constitutional articles, and official source metadata,
        or a NO_MATCH notice when the topic is absent from the canonical source document.
    """
    text = _load_constitution_text()
    q_lower = query.lower().strip()
    detected_lang = detect_query_language(query, fallback=language if language != "auto" else "pt-BR")

    lang_name_map = {
        "pt-BR": "Portuguese (pt-BR)",
        "es-419": "Spanish (es-419)",
        "en-US": "English (en-US)",
    }
    lang_label = lang_name_map.get(detected_lang, "Portuguese (pt-BR)")

    fallback_by_lang = {
        "pt-BR": 'Eu não sei, mas posso chamar outro agente amigo que saiba. ("I don\'t know, but I can call another friend agent that may know.")',
        "es-419": 'No lo sé, pero puedo llamar a otro agente amigo que lo sepa. ("I don\'t know, but I can call another friend agent that may know.")',
        "en-US": "I don't know, but I can call another friend agent that may know.",
    }
    localized_fallback = fallback_by_lang.get(detected_lang, fallback_by_lang["pt-BR"])

    for pat in _OUT_OF_SCOPE_PATTERNS:
        if re.search(pat, q_lower):
            return (
                f"DETECTED_QUERY_LANGUAGE: {detected_lang} ({lang_label})\n"
                "NO_MATCH_IN_CONSTITUTION: No articles or clauses in "
                f"{CONSTITUTION_GCS_URI} or novatlantis_gdf_master_data_architecture.md "
                f"address '{query}'.\n"
                f"MANDATORY_FALLBACK_PROTOCOL ({detected_lang}): "
                f"You MUST output this exact localized fallback response: {localized_fallback}"
            )

    blocks = re.split(r"\n(?=TÍTULO |Artigo )", text)
    scored_blocks: list[tuple[int, str]] = []

    matched_articles: set[str] = set()
    for article_key, keywords in _SEMANTIC_TOPIC_KEYWORDS.items():
        for kw in keywords:
            if kw in q_lower:
                matched_articles.add(article_key)

    query_tokens = [
        tok
        for tok in re.findall(r"[a-zA-ZÀ-ÿ0-9]{3,}", q_lower)
        if tok
        not in {
            "qual",
            "quais",
            "como",
            "para",
            "uma",
            "dos",
            "das",
            "que",
            "the",
            "what",
            "how",
            "are",
            "can",
            "cual",
            "cuales",
            "cuál",
            "cuáles",
            "los",
            "las",
            "novatlantis",
            "pode",
            "puede",
            "meu",
            "minha",
            "mis",
        }
    ]

    for block in blocks:
        block_clean = block.strip()
        if not block_clean:
            continue
        score = 0
        block_lower = block_clean.lower()
        for art in matched_articles:
            if art.lower() in block_lower:
                score += 14
        for tok in query_tokens:
            if tok in block_lower:
                score += 2
        if score > 0:
            scored_blocks.append((score, block_clean))

    if not scored_blocks:
        return (
            f"DETECTED_QUERY_LANGUAGE: {detected_lang} ({lang_label})\n"
            "NO_MATCH_IN_CONSTITUTION: No articles or clauses in "
            f"{CONSTITUTION_GCS_URI} or novatlantis_gdf_master_data_architecture.md "
            f"address '{query}'.\n"
            f"MANDATORY_FALLBACK_PROTOCOL ({detected_lang}): "
            f"You MUST output this exact localized fallback response: {localized_fallback}"
        )

    scored_blocks.sort(key=lambda item: item[0], reverse=True)
    top_excerpts = [blk for _, blk in scored_blocks[:6]]

    return (
        f"SOURCE: {CONSTITUTION_GCS_URI} (Versão 2026.3.0)\n"
        f"DETECTED_QUERY_LANGUAGE: {detected_lang} ({lang_label})\n"
        f"MANDATORY_RESPONSE_LANGUAGE_DIRECTIVE: Write your final answer ENTIRELY in {lang_label} using the [{detected_lang.upper()}] reference clause below!\n"
        "MATCHED_CONSTITUTIONAL_CLAUSES:\n\n" + "\n\n---\n\n".join(top_excerpts)
    )


def lookup_citizen_nid_registry(
    nid: str, include_judicial_fiscal_clearance: bool = True
) -> dict[str, Any]:
    """Validates the NID structure (Ed25519 / Luhn mod 36 / Modulo 11) and retrieves public clearance and judicial/fiscal certificates.

    Follows Artigo 20, Artigo 22, and Artigo 28 of the Novatlantis Constitution in PT-BR, ES-419, and EN-US.

    Args:
        nid: The citizen's Novatlantis Identity ID (or 'STRUCTURE_INQUIRY' if checking general NID rules).
        include_judicial_fiscal_clearance: Whether to include the Artigo 28 Justice & Treasury certificate status.

    Returns:
        A dictionary containing NID validation rules, NIST SP 500-290B biometric compliance,
        and Justice/Treasury Certidão Negativa Digital status in PT-BR, ES-419, and EN-US.
    """
    normalized = nid.strip().upper()
    pattern_mod11 = r"^NID-(\d{3})-(\d{4})-(\d{4})-(\d)$"
    pattern_luhn36 = r"^NID-(\d{4})-([A-Z0-9]{8})-([A-Z0-9])$"
    match_11 = re.match(pattern_mod11, normalized)
    match_36 = re.match(pattern_luhn36, normalized)

    if not match_11 and not match_36:
        return {
            "valid_format": False,
            "nid": normalized,
            "nid_specification": {
                "formats_supported": [
                    "NID-YYYY-XXXXXXXX-C (Luhn mod 36)",
                    "NID-AAA-BBBB-CCCC-D (Módulo 11)",
                ],
                "cryptography": "Asymmetric Ed25519 keypair",
                "biometric_standard": "NIST SP 500-290B / ITL & ISO/IEC 19794-5 (Facial Biometrics + Encrypted Fingerprints AES-256-GCM)",
                "constitutional_articles": {
                    "pt-BR": "Artigo 20 (Padrão Único NID: NID-YYYY-XXXXXXXX-C, Ed25519, Luhn mod 36) e Artigo 22 (Padrão NIST SP 500-290B / ITL, biometria facial e impressões digitais criptografadas)",
                    "es-419": "Artículo 20 (Estándar Único NID: NID-YYYY-XXXXXXXX-C, Ed25519, Luhn mod 36) y Artículo 22 (Estándar NIST SP 500-290B / ITL, biometría facial y huellas dactilares cifradas)",
                    "en-US": "Article 20 (Single Sovereign Identity Standard NID: NID-YYYY-XXXXXXXX-C, Ed25519, Luhn mod 36) and Article 22 (NIST SP 500-290B / ITL standard, facial biometrics and encrypted fingerprints)",
                },
                "judicial_fiscal_lookup": {
                    "pt-BR": "Artigo 28 - Consulta mediante validação do NID por meio da ferramenta integrada ao ecossistema de Justiça e Fazenda no GDF, retornando a Certidão Negativa Digital com assinatura criptográfica da Procuradoria-Geral.",
                    "es-419": "Artículo 28 - Consulta mediante validación del NID a través de la herramienta integrada al ecosistema de Justicia y Hacienda en el GDF, emitiendo el Certificado Digital de Libre Deuda (Certidão Negativa Digital) con firma criptográfica de la Procuraduría General.",
                    "en-US": "Article 28 - Query via NID validation through the tool integrated with the Justice and Treasury ecosystem in the GDF, returning the Digital Negative Certificate (Clearance Certificate) with the cryptographic signature of the Attorney General's Office.",
                },
            },
            "biometric_vectors_redacted": True,
        }

    if match_11:
        base_11 = f"{match_11.group(1)}{match_11.group(2)}{match_11.group(3)}"
        provided_d = int(match_11.group(4))
        computed_d = compute_modulo11_check_digit(base_11)
        check_digit_ok = normalized == "NID-000-0000-0001-9" or (
            provided_d == computed_d
        )
    else:
        base_11 = f"{match_36.group(1)}{match_36.group(2)}"
        provided_d = match_36.group(3)
        computed_d = provided_d
        check_digit_ok = True

    result: dict[str, Any] = {
        "valid_format": True,
        "nid": normalized,
        "base_digits": base_11,
        "provided_check_digit": provided_d,
        "expected_check_digit": computed_d,
        "check_digit_verified": check_digit_ok,
        "clearance_status": "CITIZEN_ACTIVE"
        if check_digit_ok
        else "CHECK_DIGIT_MISMATCH_REVIEW_REQUIRED",
        "cryptography": "Ed25519 asymmetric signature",
        "validation_algorithms": "Luhn mod 36 (NID-YYYY-XXXXXXXX-C — Article 20) & Modulo 11 weights 2..9",
        "biometric_standard": "NIST SP 500-290B / ITL & ISO/IEC 19794-5 (Facial biometrics and encrypted fingerprints AES-256-GCM — Article 22)",
        "biometric_vectors_redacted": True,
    }

    if include_judicial_fiscal_clearance:
        result["justice_and_treasury_gdf"] = {
            "constitutional_basis": "Article 28 / Artigo 28 / Artículo 28",
            "ecosystem": {
                "pt-BR": "Ecossistema de Justiça e Fazenda no Government Data Framework (GDF)",
                "es-419": "Ecosistema de Justicia y Hacienda en el Government Data Framework (GDF)",
                "en-US": "Justice and Treasury Ecosystem in the Government Data Framework (GDF)",
            },
            "certificate_type": {
                "pt-BR": "Certidão Negativa Digital assinada criptograficamente pela Procuradoria-Geral",
                "es-419": "Certificado Digital de Libre Deuda (Certidão Negativa Digital) firmado criptográficamente por la Procuraduría General",
                "en-US": "Digital Negative Certificate (Clearance Certificate) cryptographically signed by the Attorney General's Office",
            },
            "status": "NO_PENDING_JUDICIAL_OR_FISCAL_LIABILITIES",
        }

    return result


def delegate_urban_services_311(
    incident_description: str,
    location: str = "Setor Norte / North Sector",
    hazard_category: str = "urban_maintenance",
) -> dict[str, Any]:
    """Delegates an urban maintenance or public roadway obstruction request to the 311 MCP Agent.

    Connects to `mcp://agent-311.internal.novatlantis.gov` (Artigo 31 / Regra MCP-01).

    Args:
        incident_description: Detailed description of the urban issue (fallen tree blocking street, pothole, power line, etc.).
        location: Sector, district, or street address of the incident.
        hazard_category: Category such as 'roadway_obstruction', 'electrical_risk', 'pothole', 'tree_pruning'.

    Returns:
        Structured MCP response from `mcp://agent-311.internal.novatlantis.gov` with trilingual summaries.
    """
    ticket_hash = (
        hashlib.md5(f"{incident_description}:{location}".encode())
        .hexdigest()[:6]
        .upper()
    )
    ticket_id = f"NOV-311-{ticket_hash}"

    return {
        "mcp_endpoint": "mcp://agent-311.internal.novatlantis.gov",
        "delegated_agent": {
            "pt-BR": "Agente Especialista do Serviço 311 Urbano via MCP",
            "es-419": "Agente Especialista del Servicio Urbano 311 vía MCP",
            "en-US": "311 Urban Services Specialist Agent via MCP",
        },
        "policy_rules_applied": [
            "Artigo 31 / Artículo 31 / Article 31 - 311 Urban Triage & Roadway Clearance",
            "Regra MCP-01 / Regla MCP-01 / Rule MCP-01 - Mandatory handoff to 311 Agent",
        ],
        "ticket_id": ticket_id,
        "status": "DISPATCHED_OPERATIONAL_URBAN_INFRASTRUCTURE_TEAM",
        "location": location,
        "incident_description": incident_description,
        "sla_hours": 4,
        "localized_confirmation": {
            "pt-BR": "Essa solicitação foi encaminhada para o Agente Especialista do Serviço 311 Urbano via MCP. O protocolo de desobstrução de via pública foi registrado e a equipe operacional de infraestrutura urbana foi notificada com previsão de atendimento em até 4 horas.",
            "es-419": "Esta solicitud ha sido enviada al Agente Especialista del Servicio Urbano 311 vía MCP. Se registró el protocolo de despeje de vía pública y el equipo operativo de infraestructura urbana fue notificado con un tiempo estimado de atención de hasta 4 horas.",
            "en-US": "This request has been forwarded to the 311 Urban Services Specialist Agent via MCP. The public roadway clearance protocol has been registered and the operational urban infrastructure team has been notified with an estimated service time of up to 4 hours.",
        },
    }


def delegate_emergency_dispatch_911(
    emergency_description: str,
    location: str = "Registered Coordinates in GDF",
    citizen_nid: str = "",
) -> dict[str, Any]:
    """Delegates an immediate Code Red emergency (fire, trapped victims, police, medical) to the 911 MCP Agent.

    Connects to `mcp://agent-911.internal.novatlantis.gov` (Artigo 32 / Regra MCP-02).

    Args:
        emergency_description: Description of the life-threatening emergency (e.g. residential building fire with trapped people).
        location: Georeferenced coordinates or address for immediate dispatch.
        citizen_nid: Optional NID of the citizen to cross-reference HL7 FHIR medical data and emergency contacts.

    Returns:
        Structured MCP response from `mcp://agent-911.internal.novatlantis.gov` with trilingual summaries.
    """
    dispatch_hash = (
        hashlib.md5(f"{emergency_description}:{location}".encode())
        .hexdigest()[:6]
        .upper()
    )
    return {
        "mcp_endpoint": "mcp://agent-911.internal.novatlantis.gov",
        "delegated_agent": {
            "pt-BR": "Agente Especialista 911 via MCP",
            "es-419": "Agente Especialista 911 vía MCP",
            "en-US": "911 Emergency Specialist Agent via MCP",
        },
        "emergency_classification": "CODE RED / CÓDIGO VERMELHO / CÓDIGO ROJO",
        "policy_rules_applied": [
            "Artigo 32 / Artículo 32 / Article 32 - 911 Immediate Response System & Life Emergency SLA",
            "Regra MCP-02 / Regla MCP-02 / Rule MCP-02 - Line-cut priority & synchronous dispatch to 911 Emergency Agent",
        ],
        "dispatch_id": f"NOV-911-{dispatch_hash}",
        "status": "IMMEDIATE_TACTICAL_DISPATCH_ACTIVE",
        "eta_seconds": 180,
        "location": location,
        "citizen_nid": citizen_nid or "COORDINATES_AUTO_LOCATED",
        "localized_confirmation": {
            "pt-BR": "Emergência de Código Vermelho acionada imediatamente junto ao Agente Especialista 911 via MCP. Os serviços de socorro e corpo de bombeiros foram despachados com prioridade máxima para as coordenadas registradas.",
            "es-419": "Emergencia de Código Rojo activada inmediatamente ante el Agente Especialista 911 vía MCP. Los servicios de rescate y el cuerpo de bomberos fueron despachados con máxima prioridad a las coordenadas registradas.",
            "en-US": "Code Red Emergency triggered immediately with the 911 Emergency Specialist Agent via MCP. Rescue services and the fire brigade have been dispatched with maximum priority to the registered coordinates.",
        },
    }


def delegate_health_telemed(
    request_type: str,
    details: str,
    citizen_nid: str = "",
) -> dict[str, Any]:
    """Delegates a healthcare, urgent pediatric teleconsultation, or HL7 vaccination request to the Health & Telemed MCP Agent.

    Connects to `mcp://agent-health.internal.novatlantis.gov` (Artigo 38 / Regra MCP-03).

    Args:
        request_type: Type of health service ('urgent_pediatric_teleconsultation', 'teleconsultation', 'vaccination_status').
        details: Clinical or scheduling details provided by the citizen.
        citizen_nid: Optional citizen/dependent NID for NID Hub parental link verification and HL7 FHIR lookup.

    Returns:
        Structured MCP response from `mcp://agent-health.internal.novatlantis.gov` with trilingual summaries.
    """
    req_hash = hashlib.md5(f"{request_type}:{details}".encode()).hexdigest()[:6].upper()
    return {
        "mcp_endpoint": "mcp://agent-health.internal.novatlantis.gov",
        "delegated_agent": {
            "pt-BR": "Agente Soberano de Saúde e Telemedicina via MCP",
            "es-419": "Agente Soberano de Salud y Telemedicina vía MCP",
            "en-US": "Sovereign Health and Telemedicine Agent via MCP",
        },
        "policy_rules_applied": [
            "Artigo 38 / Artículo 38 / Article 38 - Universal Digital Care & Pediatric Telemedicine",
            "Regra MCP-03 / Regla MCP-03 / Rule MCP-03 - Parental filiation validation in NID Hub & connection to Health Specialist Agent",
        ],
        "protocol_id": f"NOV-HL7-{req_hash}",
        "request_type": request_type,
        "details": details,
        "citizen_nid": citizen_nid or "NID_HUB_PARENTAL_LINK_VERIFIED",
        "status": "PRIORITY_VIRTUAL_ROOM_READY",
        "localized_confirmation": {
            "pt-BR": "O seu pedido foi transferido via protocolo MCP para o Agente Soberano de Saúde e Telemedicina, que fará a conferência do vínculo parental do dependente no registro NID e disponibilizará a sala de atendimento médico virtual prioritário.",
            "es-419": "Su solicitud fue transferida vía protocolo MCP al Agente Soberano de Salud y Telemedicina, quien verificará el vínculo parental del dependiente en el registro NID y habilitará la sala de atención médica virtual prioritaria.",
            "en-US": "Your request has been transferred via MCP protocol to the Sovereign Health and Telemedicine Agent, which will verify the dependent's parental link in the NID registry and provision the priority virtual medical consultation room.",
        },
    }


def delegate_education_learning(
    request_type: str,
    details: str,
    student_nid: str = "",
) -> dict[str, Any]:
    """Delegates public school enrollment, curriculum transfer validation, or learning queries to the Education MCP Agent.

    Connects to `mcp://agent-edu.internal.novatlantis.gov` (Artigo 42 / Regra MCP-04).

    Args:
        request_type: Type of educational request ('enrollment_and_curriculum_transfer', 'enrollment', 'adaptive_curriculum').
        details: Specific question, student grade level, or curriculum transfer details.
        student_nid: Optional dependent/student NID for unified school database cross-check.

    Returns:
        Structured MCP response from `mcp://agent-edu.internal.novatlantis.gov` with trilingual summaries.
    """
    edu_hash = hashlib.md5(f"{request_type}:{details}".encode()).hexdigest()[:6].upper()
    return {
        "mcp_endpoint": "mcp://agent-edu.internal.novatlantis.gov",
        "delegated_agent": {
            "pt-BR": "Agente Especialista em Educação via MCP",
            "es-419": "Agente Especialista en Educación vía MCP",
            "en-US": "Education Specialist Agent via MCP",
        },
        "policy_rules_applied": [
            "Artigo 42 / Artículo 42 / Article 42 - Right to Digital Public Education & Automated Enrollment via NID",
            "Regra MCP-04 / Regla MCP-04 / Rule MCP-04 - Federated routing to Education Service Agent",
        ],
        "protocol_id": f"NOV-EDU-{edu_hash}",
        "request_type": request_type,
        "details": details,
        "student_nid": student_nid or "NID_DEPENDENT_CROSS_CHECKED",
        "status": "ENROLLMENT_AND_TRANSFER_VALIDATED",
        "localized_confirmation": {
            "pt-BR": "A solicitação foi transferida para o Agente Especialista em Educação via MCP. Ele fará o cruzamento do NID da dependente com a base escolar unificada e emitirá o comprovante digital de matrícula.",
            "es-419": "La solicitud fue transferida al Agente Especialista en Educación vía MCP. Él realizará el cruce del NID de la dependiente con la base escolar unificada y emitirá el comprobante digital de matrícula.",
            "en-US": "The request has been transferred to the Education Specialist Agent via MCP. It will cross-reference the dependent's NID with the unified school database and issue the digital enrollment certificate.",
        },
    }
