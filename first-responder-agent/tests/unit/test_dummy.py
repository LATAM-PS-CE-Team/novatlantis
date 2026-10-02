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
"""Unit tests for Novatlantis Sovereign First-Responder Agent tools and contracts."""

from app.tools import (
    compute_modulo11_check_digit,
    delegate_education_learning,
    delegate_emergency_dispatch_911,
    delegate_health_telemed,
    delegate_urban_services_311,
    lookup_citizen_nid_registry,
    search_constitution_and_rights,
)


def test_search_constitution_and_rights_match() -> None:
    """Verifies constitutional article retrieval returns string excerpts."""
    result = search_constitution_and_rights(
        query="poda de árvore na rede elétrica zeladoria 311",
        language="pt-BR",
    )
    assert isinstance(result, str)
    assert "Artigo 8º" in result
    assert "MATCHED_CONSTITUTIONAL_CLAUSES" in result


def test_search_constitution_and_rights_out_of_scope() -> None:
    """Verifies out-of-scope queries return NO_MATCH_IN_CONSTITUTION."""
    result = search_constitution_and_rights(
        query="Qual é o valor do imposto sobre exportação de naves espaciais em Novatlantis?",
        language="pt-BR",
    )
    assert isinstance(result, str)
    assert "NO_MATCH_IN_CONSTITUTION" in result


def test_lookup_citizen_nid_registry_contract() -> None:
    """Verifies NID Modulo 11 validation and biometric redaction contract."""
    valid_res = lookup_citizen_nid_registry("NID-000-0000-0001-9")
    assert valid_res["valid_format"] is True
    assert valid_res["check_digit_verified"] is True
    assert valid_res["biometric_vectors_redacted"] is True
    assert "native_language" in valid_res
    assert "district" in valid_res

    invalid_res = lookup_citizen_nid_registry("INVALID-NID")
    assert invalid_res["valid_format"] is False
    assert invalid_res["biometric_vectors_redacted"] is True

    d_digit = compute_modulo11_check_digit("12345678901")
    assert isinstance(d_digit, int)
    assert 0 <= d_digit <= 9


def test_mcp_delegation_tools_contracts() -> None:
    """Verifies MCP ministerial delegation tool return schemas."""
    res_311 = delegate_urban_services_311(
        incident_description="Árvore encostou na rede elétrica",
        location="Distrito Central",
        hazard_category="electrical_risk",
    )
    assert res_311["mcp_endpoint"] == "mcp://agent-311.internal.novatlantis.gov"
    assert res_311["preventive_911_notified"] is True

    res_911 = delegate_emergency_dispatch_911(
        emergency_description="Socorro médico cardíaco",
        location="Distrito Central",
        citizen_nid="NID-000-0000-0001-9",
    )
    assert res_911["mcp_endpoint"] == "mcp://agent-911.internal.novatlantis.gov"
    assert res_911["eta_seconds"] == 180

    res_health = delegate_health_telemed(
        request_type="teleconsultation",
        details="Agendar consulta clínica geral",
        citizen_nid="NID-000-0000-0001-9",
    )
    assert res_health["mcp_endpoint"] == "mcp://agent-health.internal.novatlantis.gov"

    res_edu = delegate_education_learning(
        request_type="adaptive_curriculum",
        details="Trilha de ensino médio técnico",
    )
    assert res_edu["mcp_endpoint"] == "mcp://agent-edu.internal.novatlantis.gov"
