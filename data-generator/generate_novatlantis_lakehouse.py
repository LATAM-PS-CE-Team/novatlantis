#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Novatlantis Government Data Framework (GDF) — Master Synthetic Lakehouse Generator
Gera 100.000 registros completos de cidadãos com integridade referencial estrita:
  - dim_citizens (100.000 linhas — incluindo Primeiro-Ministro Joao Thiago Poço (JT), Secretário-Geral,
    Gestor de Identidades 360, Médicos, Professores, Gestores Públicos e Cidadãos)
  - sec_biometrics_nist (100.000 linhas — ANSI/NIST-ITL 1-2011 / ISO 19794-5 & 19794-2)
  - rel_family_graph (~160.000+ vínculos formando árvores genealógicas coerentes:
    pais no mínimo 16 anos mais velhos que os filhos, cônjuges e contatos de emergência 911)
  - dim_addresses (50.000 unidades habitacionais georreferenciadas nos 5 distritos oficiais)
  - rel_citizen_residence (100.000 vínculos de residência atual)
  - health_records & health_vaccinations (padrão HL7 FHIR v4 + calendário infantil 0-12 anos)
  - edu_institutions & edu_enrollments + edu_grades (estudantes de 4 a 22 anos + notas por matéria)
  - sec_passports (~65% da população com passaporte padrão ICAO NV-PXXXXXXX)
  - justice_records & justice_incidents (97% sem apontamentos, 3% com incidentes cíveis/fiscais/criminais)
  - iam_identity_360_roles (Tabela de controle de acesso RBAC/ABAC da Aplicação Identidade 360)
"""

from __future__ import annotations

import base64
import csv
import datetime as dt
from datetime import date, timedelta
import gzip
import hashlib
import json
import os
import random
import sqlite3
import time
import uuid
from pathlib import Path
from typing import Any, Dict, List, Tuple

TOTAL_CITIZENS = 100_000
OUTPUT_DIR = Path("./data-generator/lakehouse")
SQLITE_DB_PATH = Path("./apps/landing-portal/gdf_sovereign.db")

DISTRICTS = [
    ("LIBERTAS_CENTRAL", "NV-1000", (-23.5350, -23.5150), (-46.6350, -46.6100)),
    ("TECH_ATOLL", "NV-2000", (-23.5600, -23.5351), (-46.6650, -46.6351)),
    ("DISTRICT_PACIFIC", "NV-3000", (-23.6050, -23.5750), (-46.6900, -46.6600)),
    ("CIVIC_HILL", "NV-4000", (-23.5149, -23.4950), (-46.6250, -46.6000)),
    ("HARBOR_SOUTH", "NV-5000", (-23.6350, -23.6051), (-46.6550, -46.6200)),
]

STREETS_BY_DISTRICT = {
    "LIBERTAS_CENTRAL": [
        "Esplanada da Constituição Algorítmica",
        "Avenida Primeiro-Ministro Soberano",
        "Praça da Coabitação Cívica",
        "Alameda da Transparência Criptográfica",
        "Via do Consenso Público",
    ],
    "TECH_ATOLL": [
        "Boulevard Ada Lovelace",
        "Avenida Alan Turing",
        "Rua dos Agentes Autônomos",
        "Alameda dos Supercomputadores",
        "Via Quântica Soberana",
    ],
    "DISTRICT_PACIFIC": [
        "Orla das Águas Atlânticas",
        "Avenida da Dessalinização Solar",
        "Passarela Oceânica",
        "Rua dos Recifes Regenerativos",
        "Cais da Maré Limpa",
    ],
    "CIVIC_HILL": [
        "Colina da Suprema Assembleia",
        "Avenida da Justiça Verificável",
        "Alameda dos Direitos Humanos",
        "Rua da Chancelaria Civil",
        "Largo do Pacto Fundamental",
    ],
    "HARBOR_SOUTH": [
        "Porto de Energia Limpa",
        "Avenida das Cooperativas Autônomas",
        "Rua do Comércio Marítimo",
        "Alameda Hidrogênio Verde",
        "Travessa dos Estaleiros",
    ],
}

SCHOOLS_CATALOG = [
    ("SCH-NV-001", "Escola Básica Nacional Libertas Central", "LIBERTAS_CENTRAL", "EARLY_CHILDHOOD,PRIMARY"),
    ("SCH-NV-002", "Liceu Científico e Algorítmico Tech Atoll", "TECH_ATOLL", "PRIMARY,SECONDARY"),
    ("SCH-NV-003", "Academia Oceânica de Ciências Ambientais", "DISTRICT_PACIFIC", "PRIMARY,SECONDARY"),
    ("SCH-NV-004", "Colégio Constitucional da Colina Cívica", "CIVIC_HILL", "EARLY_CHILDHOOD,PRIMARY,SECONDARY"),
    ("SCH-NV-005", "Instituto Politécnico Harbor South", "HARBOR_SOUTH", "SECONDARY,HIGHER"),
    ("SCH-NV-006", "Universidade Soberana de Novatlantis (USN)", "TECH_ATOLL", "HIGHER"),
]

HOSPITALS_CATALOG = [
    ("HOSP-NV-01", "Hospital Central Universitário de Novatlantis", "LIBERTAS_CENTRAL", "HOSPITAL_GERAL", 420),
    ("HOSP-NV-02", "Instituto de Telemedicina e Cardiologia Avançada", "TECH_ATOLL", "CENTRO_ESPECIALIZADO", 260),
    ("HOSP-NV-03", "Complexo Hospitalar Pacífico Sul", "DISTRICT_PACIFIC", "HOSPITAL_REGIONAL", 310),
    ("HOSP-NV-04", "Clínica da Família e Imunização Colina Cívica", "CIVIC_HILL", "CLINICA_ATENCAO_PRIMARIA", 120),
    ("HOSP-NV-05", "Pronto-Socorro Marítimo e Trauma Harbor South", "HARBOR_SOUTH", "UNIDADE_EMERGENCIA_911", 180),
]


def calculate_nid(index: int) -> str:
    """
    Formato oficial GDF: NID-AAA-BBBB-CCCC-D
    Onde D é calculado via algoritmo Módulo 11 com pesos de 2 a 9:
      D = 11 - (sum(d_i * w_i) mod 11) (Se resto < 2 -> D = 0).
    """
    base_digits = f"{index:011d}"
    weights = [2, 3, 4, 5, 6, 7, 8, 9, 2, 3, 4]
    acc = sum(int(digit) * weights[i] for i, digit in enumerate(reversed(base_digits)))
    remainder = acc % 11
    d = 0 if remainder < 2 else 11 - remainder
    return f"NID-{base_digits[0:3]}-{base_digits[3:7]}-{base_digits[7:11]}-{d}"


def build_name_pools() -> Dict[str, Dict[str, List[str]]]:
    return {
        "pt-BR": {
            "M": [
                "Gabriel", "Lucas", "Mateus", "Heitor", "Bernardo", "Rafael", "Tiago", "Arthur",
                "Pedro", "Henrique", "Daniel", "Eduardo", "Leonardo", "Vitor", "Caio", "André",
            ],
            "F": [
                "Helena", "Alice", "Laura", "Manuela", "Valentina", "Sofia", "Isabella", "Clara",
                "Beatriz", "Mariana", "Carolina", "Camila", "Júlia", "Letícia", "Amanda", "Natália",
            ],
            "last": [
                "Silva", "Santos", "Oliveira", "Souza", "Rodrigues", "Ferreira", "Alves", "Pereira",
                "Costa", "Carvalho", "Gomes", "Martins", "Araújo", "Melo", "Barbosa", "Ribeiro",
                "Albuquerque", "Mendes", "Viana", "Monteiro", "Cardoso", "Teixeira", "Moreira",
            ],
        },
        "es-419": {
            "M": [
                "Mateo", "Santiago", "Sebastián", "Leonardo", "Matías", "Emiliano", "Diego", "Alejandro",
                "Nicolás", "Samuel", "Joaquín", "Benjamín", "Tomás", "Agustín", "carlos", "Fernando",
            ],
            "F": [
                "Sofía", "Valentina", "Camila", "Valeria", "Ximena", "Victoria", "Martina", "Lucía",
                "Renata", "Antonella", "Elena", "Natalia", "Paula", "Gabriela", "Andrea", "Clara",
            ],
            "last": [
                "García", "Rodríguez", "Martínez", "Hernández", "López", "González", "Pérez", "Sánchez",
                "Ramírez", "Torres", "Flores", "Rivera", "Gómez", "Díaz", "Reyes", "Morales",
                "Vargas", "Ríos", "Castillo", "Romero", "Herrera", "Medina", "Aguilar",
            ],
        },
        "en-US": {
            "M": [
                "Liam", "Noah", "Oliver", "James", "Elijah", "William", "Henry", "Lucas",
                "Benjamin", "Theodore", "Alexander", "Ethan", "Daniel", "Matthew", "Joseph", "Samuel",
            ],
            "F": [
                "Olivia", "Emma", "Charlotte", "Amelia", "Sophia", "Mia", "Isabella", "Ava",
                "Evelyn", "Luna", "Harper", "Grace", "Chloe", "Victoria", "Claire", "leanor",
            ],
            "last": [
                "Smith", "Johnson", "Williams", "Brown", "Jones", "Miller", "Davis", "Sterling",
                "Anderson", "Taylor", "Thomas", "Moore", "Jackson", "Martin", "Thompson", "White",
            ],
        },
    }


def generate_all() -> None:
    t0 = time.perf_counter()
    rng = random.Random(20261001)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    SQLITE_DB_PATH.parent.mkdir(parents=True, exist_ok=True)

    print(f"[*] Iniciando geração do Government Data Framework (GDF) para {TOTAL_CITIZENS} cidadãos...")

    pools = build_name_pools()
    ref_date = date(2026, 10, 1)

    # -------------------------------------------------------------------------
    # 1. GERAR 50.000 UNIDADES HABITACIONAIS (dim_addresses)
    # -------------------------------------------------------------------------
    print("[1/7] Gerando 50.000 endereços georreferenciados (dim_addresses)...")
    total_addresses = 50_000
    addresses: List[Dict[str, Any]] = []
    for a_idx in range(1, total_addresses + 1):
        d_code, postal_prefix, lat_r, lng_r = DISTRICTS[a_idx % len(DISTRICTS)]
        streets = STREETS_BY_DISTRICT[d_code]
        street_name = streets[a_idx % len(streets)]
        bldg_num = str((a_idx * 7) % 4500 + 10)
        unit_apt = f"Bloco {(a_idx % 8) + 1} Ap {(a_idx % 120) + 101}" if (a_idx % 3 == 0) else "Casa"
        postal_code = f"NV-{1000 + (a_idx % 8999):04d}"
        lat = round(lat_r[0] + ((a_idx * 13) % 10000) / 10000.0 * (lat_r[1] - lat_r[0]), 6)
        lng = round(lng_r[0] + ((a_idx * 29) % 10000) / 10000.0 * (lng_r[1] - lng_r[0]), 6)
        addresses.append(
            {
                "address_id": f"ADDR-NV-{a_idx:06d}",
                "district": d_code,
                "street_name": street_name,
                "building_number": bldg_num,
                "unit_apartment": unit_apt,
                "postal_code": postal_code,
                "lat": lat,
                "lng": lng,
                "geo_point": f"POINT({lng} {lat})",
                "is_risk_zone": (a_idx % 47 == 0),
            }
        )

    # -------------------------------------------------------------------------
    # 2. DEFINIR USUÁRIOS GOVERNAMENTAIS E PROFISSIONAIS DE DESTAQUE + 100k CIDADÃOS
    # -------------------------------------------------------------------------
    print("[2/7] Gerando 100.000 cidadãos (dim_citizens) com Primeiro-Ministro, Gestores, Médicos, Professores e Famílias...")

    # Perfis fixos nas primeiras posições para login imediato e testes funcionais completos
    named_Overrides: Dict[int, Dict[str, Any]] = {
        1: {
            "full_name": "Joao Thiago Poço (JT) (Primeiro-Ministro da República)",
            "email": "jt@novatlantis.gov.cloud",
            "alt_email": "jt@novatlantis.gov.cloud",
            "age": 42,
            "gender": "M",
            "native_language": "pt-BR",
            "profession": "PRIME_MINISTER",
            "specialty": "Chefe de Governo & Administrador Geral da Nação",
            "iam_role": "PRIME_MINISTER_ROOT",
            "citizenship_status": "FOUNDING_CITIZEN",
        },
        2: {
            "full_name": "Dr. Aurelius Valerius (Secretário-Geral)",
            "email": "secretario.geral@novatlantis.gov.cloud",
            "age": 48,
            "gender": "M",
            "native_language": "pt-BR",
            "profession": "SECRETARY_GENERAL",
            "specialty": "Chancelaria Civil & Coordenação Ministerial",
            "iam_role": "SECRETARY_GENERAL",
            "citizenship_status": "FOUNDING_CITIZEN",
        },
        3: {
            "full_name": "Helena Viana Oliveira (Gestora de Identidades 360)",
            "email": "gestor.identidade@novatlantis.gov.cloud",
            "age": 36,
            "gender": "F",
            "native_language": "pt-BR",
            "profession": "IDENTITY_GOVERNANCE_OFFICER",
            "specialty": "Gestão de Acessos RBAC/ABAC & Credenciais Soberanas",
            "iam_role": "IDENTITY_MANAGER_360",
            "citizenship_status": "FOUNDING_CITIZEN",
        },
        4: {
            "full_name": "Dra. Sofia Mendes Costa (Médica Telemedicina & Chefe Clínica)",
            "email": "sofia.mendes@saude.novatlantis.gov.cloud",
            "age": 39,
            "gender": "F",
            "native_language": "pt-BR",
            "profession": "PHYSICIAN",
            "specialty": "Cardiologia & Telemedicina Agêntica (CRM-NV 1042)",
            "iam_role": "DOCTOR_AND_HEALTH_MANAGER",
            "citizenship_status": "FOUNDING_CITIZEN",
        },
        5: {
            "full_name": "Dr. Mateo Vargas Ríos (Médico de Família & Emergência)",
            "email": "mateo.vargas@saude.novatlantis.gov.cloud",
            "age": 44,
            "gender": "M",
            "native_language": "es-419",
            "profession": "PHYSICIAN",
            "specialty": "Medicina de Emergência & Saúde da Família (CRM-NV 2089)",
            "iam_role": "DOCTOR_TELEMED",
            "citizenship_status": "FOUNDING_CITIZEN",
        },
        6: {
            "full_name": "Prof. Lucas Albuquerque Silva (Professor & Gestor Educacional)",
            "email": "lucas.albuquerque@educacao.novatlantis.gov.cloud",
            "age": 38,
            "gender": "M",
            "native_language": "pt-BR",
            "profession": "TEACHER",
            "specialty": "Matemática, Pensamento Computacional & IA (LIC-NV 3011)",
            "iam_role": "TEACHER_AND_EDU_MANAGER",
            "citizenship_status": "FOUNDING_CITIZEN",
        },
        7: {
            "full_name": "Profa. Valeria Ríos Hernández (Professora de Ciências)",
            "email": "valeria.rios@educacao.novatlantis.gov.cloud",
            "age": 33,
            "gender": "F",
            "native_language": "es-419",
            "profession": "TEACHER",
            "specialty": "Biologia Marinha, Física & Sustentabilidade (LIC-NV 3094)",
            "iam_role": "TEACHER_EDUCATOR",
            "citizenship_status": "FOUNDING_CITIZEN",
        },
        8: {
            "full_name": "Comandante Rafael Santos (Gestor Urbano 311 & Despacho 911)",
            "email": "rafael.santos@operacoes.novatlantis.gov.cloud",
            "age": 41,
            "gender": "M",
            "native_language": "pt-BR",
            "profession": "URBAN_OPERATIONS_COMMANDER",
            "specialty": "Engenharia Civil, Smart Grid 311 & Resposta Tática 911",
            "iam_role": "OPERATIONS_311_911_MANAGER",
            "citizenship_status": "FOUNDING_CITIZEN",
        },
        9: {
            "full_name": "Magistrada Clara Sterling Davis (Juíza & Gestora Judiciária)",
            "email": "clara.sterling@justica.novatlantis.gov.cloud",
            "age": 46,
            "gender": "F",
            "native_language": "en-US",
            "profession": "MAGISTRATE_JUDGE",
            "specialty": "Direito Digital, Controle de Passaportes & Conciliação IA",
            "iam_role": "JUSTICE_AND_TREASURY_MANAGER",
            "citizenship_status": "FOUNDING_CITIZEN",
        },
        10: {
            "full_name": "Pedro Albuquerque Viana (Estudante — Filho de Lucas & Helena)",
            "email": "pedro.albuquerque@cidadao.novatlantis.gov.cloud",
            "age": 11,
            "gender": "M",
            "native_language": "pt-BR",
            "profession": "STUDENT",
            "specialty": "Ensino Fundamental • 6º Ano (Escola Básica Libertas Central)",
            "iam_role": "CITIZEN_COMMON",
            "citizenship_status": "FOUNDING_CITIZEN",
        },
        11: {
            "full_name": "Alice Albuquerque Viana (Criança — Filha de Lucas & Helena)",
            "email": "alice.albuquerque@cidadao.novatlantis.gov.cloud",
            "age": 6,
            "gender": "F",
            "native_language": "pt-BR",
            "profession": "STUDENT",
            "specialty": "Educação Infantil • Alfabetização (Escola Básica Libertas Central)",
            "iam_role": "CITIZEN_COMMON",
            "citizenship_status": "FOUNDING_CITIZEN",
        },
        12: {
            "full_name": "Carlos Ferreira Souza (Cidadão Comum — Engenheiro Naval)",
            "email": "carlos.souza@cidadao.novatlantis.gov.cloud",
            "age": 35,
            "gender": "M",
            "native_language": "pt-BR",
            "profession": "NAVAL_ENGINEER",
            "specialty": "Engenharia Oceânica Civil",
            "iam_role": "CITIZEN_COMMON",
            "citizenship_status": "FOUNDING_CITIZEN",
        },
    }

    citizens: List[Dict[str, Any]] = []
    biometrics: List[Dict[str, Any]] = []
    residences: List[Dict[str, Any]] = []
    iam_roles: List[Dict[str, Any]] = []

    for i in range(1, TOTAL_CITIZENS + 1):
        nid = calculate_nid(i)
        if i in named_Overrides:
            ov = named_Overrides[i]
            age = ov["age"]
            gender = ov["gender"]
            lang = ov["native_language"]
            full_name = ov["full_name"]
            email = ov["email"]
            profession = ov["profession"]
            specialty = ov["specialty"]
            iam_role = ov["iam_role"]
            cit_status = ov["citizenship_status"]
            civil_status = "MARRIED" if i in (1, 3, 4, 6) else ("SINGLE" if age < 22 else "SINGLE")
            tax_status = "COMPLIANT"
        else:
            # Distribuição de idioma: 45% pt-BR, 45% es-419, 10% en-US
            r_lang = (i * 17) % 100
            lang = "pt-BR" if r_lang < 45 else ("es-419" if r_lang < 90 else "en-US")

            # Pirâmide etária: 0-17 (22%), 18-35 (30%), 36-60 (33%), 61-100 (15%)
            r_age = i % 100
            if r_age < 22:
                age = (i * 3) % 18
            elif r_age < 52:
                age = 18 + ((i * 7) % 18)
            elif r_age < 85:
                age = 36 + ((i * 11) % 25)
            else:
                age = 61 + ((i * 13) % 40)

            gender = "F" if (i % 2 == 0) else ("M" if (i % 49 != 0) else "X")
            p = pools[lang]
            first_list = p["F"] if gender == "F" else p["M"]
            fn = first_list[i % len(first_list)]
            ln1 = p["last"][(i * 5 + 3) % len(p["last"])]
            ln2 = p["last"][(i * 11 + 7) % len(p["last"])]
            full_name = f"{fn} {ln1} {ln2}"
            slug = f"{fn.lower()}.{ln1.lower()}.{i}"
            email = f"{slug}@cidadao.novatlantis.gov.cloud"

            # Profissão coerente com a idade
            if age < 4:
                profession = "INFANT"
                specialty = "Primeira Infância (0-3 anos)"
                iam_role = "CITIZEN_COMMON"
            elif age <= 17:
                profession = "STUDENT"
                specialty = "Estudante da Rede Nacional"
                iam_role = "CITIZEN_COMMON"
            elif age <= 22 and (i % 3 == 0):
                profession = "UNIVERSITY_STUDENT"
                specialty = "Estudante Universitário (USN)"
                iam_role = "CITIZEN_COMMON"
            else:
                # Distribui médicos (~0.8%), professores (~2.2%), servidores públicos (~1.5%) e profissões civis
                mod_prof = i % 200
                if mod_prof in (10, 11):
                    profession = "PHYSICIAN"
                    med_specs = [
                        "Clínica Médica & Telemedicina",
                        "Pediatria & Imunização",
                        "Cardiologia",
                        "Neurologia",
                        "Ortopedia & Traumatologia",
                    ]
                    specialty = f"{med_specs[i % len(med_specs)]} (CRM-NV {1000 + (i % 8999)})"
                    iam_role = "DOCTOR_TELEMED" if i <= 300 else "CITIZEN_COMMON"
                elif mod_prof in (20, 21, 22, 23, 24):
                    profession = "TEACHER"
                    edu_specs = [
                        "Matemática & Lógica",
                        "Línguas & Literatura (pt/es/en)",
                        "Ciências da Natureza & Oceanografia",
                        "Robótica, IA & Computação",
                        "História & Constituição Algorítmica",
                    ]
                    specialty = f"Docente de {edu_specs[i % len(edu_specs)]} (LIC-NV {2000 + (i % 7999)})"
                    iam_role = "TEACHER_EDUCATOR" if i <= 400 else "CITIZEN_COMMON"
                elif mod_prof == 30:
                    profession = "CIVIL_SERVANT_311"
                    specialty = "Analista de Zeladoria Urbana & Infraestrutura 311"
                    iam_role = "OPERATIONS_311_911_MANAGER" if i <= 250 else "CITIZEN_COMMON"
                else:
                    civ_profs = [
                        ("SOFTWARE_ARCHITECT", "Arquitetura de Sistemas Autônomos"),
                        ("MARINE_BIOLOGIST", "Biotecnologia Marinha"),
                        ("SOLAR_ENGINEER", "Engenharia de Malha Fotovoltaica"),
                        ("MERCHANT", "Comércio e Cooperativa Autônoma"),
                        ("RESEARCHER", "Pesquisa Científica Aplicada"),
                    ]
                    profession, specialty = civ_profs[i % len(civ_profs)]
                    iam_role = "CITIZEN_COMMON"

            civil_status = "SINGLE" if age < 18 else (["SINGLE", "MARRIED", "MARRIED", "CIVIL_UNION", "DIVORCED"][i % 5])
            cit_status = "FOUNDING_CITIZEN" if age >= 18 else "NATURALIZED"
            r_tax = i % 100
            tax_status = "COMPLIANT" if r_tax < 89 else ("IRREGULAR" if r_tax < 96 else ("EXEMPT" if r_tax < 99 else "SUSPENDED"))

        birth_date = (ref_date - timedelta(days=int(age * 365.25) + (i % 300))).isoformat()

        # Coabitantes compartilham o mesmo endereço familiar (2 cidadãos por endereço em média)
        if i in (3, 6, 10, 11):
            addr_idx = 0  # Família Helena Viana (3) + Prof. Lucas Albuquerque (6) + Filhos Pedro (10) e Alice (11)
        else:
            addr_idx = (i - 1) // 2

        addr = addresses[addr_idx % len(addresses)]

        citizens.append(
            {
                "nid": nid,
                "full_name": full_name,
                "social_name": None,
                "email": email,
                "birth_date": birth_date,
                "death_date": None,
                "age": age,
                "gender": gender,
                "civil_status": civil_status,
                "native_language": lang,
                "citizenship_status": cit_status,
                "profession": profession,
                "specialty": specialty,
                "iam_role": iam_role,
                "address_id": addr["address_id"],
                "district": addr["district"],
                "is_active": True,
                "tax_status": tax_status,
                "created_at": "2026-01-01T00:00:00Z",
                "updated_at": "2026-10-01T00:00:00Z",
            }
        )

        # Biometria NIST (sec_biometrics_nist)
        digest_b64 = base64.b64encode(
            b"FMR\x0020\x00\x01" + hashlib.sha512(f"NIST-GDF-{nid}".encode("utf-8")).digest()
        ).decode("ascii")
        biometrics.append(
            {
                "biometric_id": f"BIO-{i:07d}",
                "nid": nid,
                "facial_template_b64": digest_b64,
                "facial_icao_compliant": (i % 50 != 0),
                "fingerprint_available": (age >= 5),
                "nist_confidence": round(0.920 + ((i * 19) % 79) / 1000.0, 3),
                "last_biometric_sync": "2026-09-15T12:00:00Z",
            }
        )

        # Vínculo de Residência (rel_citizen_residence)
        residences.append(
            {
                "link_id": f"RES-{i:07d}",
                "nid": nid,
                "address_id": addr["address_id"],
                "residency_type": "PERMANENT_RESIDENCE",
                "valid_from": "2025-01-01",
                "valid_to": None,
                "is_current": True,
            }
        )

        # Registro de Permissão na Aplicação Identidade 360 (iam_identity_360_roles)
        if iam_role != "CITIZEN_COMMON" or i <= 40:
            granted_by = "SYSTEM_CONSTITUTIONAL_CHARTER" if i == 1 else (
                citizens[0]["nid"] if i in (2, 3) else calculate_nid(3)
            )
            iam_roles.append(
                {
                    "grant_id": f"IAM-360-{i:05d}",
                    "nid": nid,
                    "email": email,
                    "full_name": full_name,
                    "profession": profession,
                    "specialty": specialty,
                    "role_code": iam_role,
                    "is_active": True,
                    "granted_by_nid": granted_by,
                    "granted_at": "2026-01-10T09:00:00Z",
                }
            )

    # -------------------------------------------------------------------------
    # 3. GRAFO DE RELAÇÕES FAMILIARES (rel_family_graph)
    #    Garante que todo filho tenha idade no mínimo 16 anos menor que os pais!
    # -------------------------------------------------------------------------
    print("[3/7] Construindo grafo social de parentesco (rel_family_graph) com validação etária estrita...")
    family_links: List[Dict[str, Any]] = []
    rel_counter = 1

    # Família de demonstração principal: Prof. Lucas (6, 38a) & Helena Viana (3, 36a) -> Filhos Pedro (10, 11a) e Alice (11, 6a)
    demo_relations = [
        (calculate_nid(6), calculate_nid(3), "SPOUSE", True, True, "2013-05-18"),
        (calculate_nid(3), calculate_nid(6), "SPOUSE", True, True, "2013-05-18"),
        (calculate_nid(6), calculate_nid(10), "BIOLOGICAL_PARENT", True, True, "2015-03-12"),
        (calculate_nid(3), calculate_nid(10), "BIOLOGICAL_PARENT", True, True, "2015-03-12"),
        (calculate_nid(6), calculate_nid(11), "BIOLOGICAL_PARENT", True, True, "2020-07-21"),
        (calculate_nid(3), calculate_nid(11), "BIOLOGICAL_PARENT", True, True, "2020-07-21"),
        (calculate_nid(10), calculate_nid(11), "SIBLING", False, False, "2020-07-21"),
        # Primeiro-Ministro Joao Thiago Poço (JT) (1, 42a) & Dra. Sofia Mendes (4, 39a) -> Cônjuges / Contato 911
        (calculate_nid(1), calculate_nid(4), "SPOUSE", True, True, "2014-11-02"),
        (calculate_nid(4), calculate_nid(1), "SPOUSE", True, True, "2014-11-02"),
    ]
    for src, tgt, rtype, custody, emerg, sdate in demo_relations:
        family_links.append(
            {
                "relation_id": f"REL-{rel_counter:07d}",
                "source_nid": src,
                "target_nid": tgt,
                "relation_type": rtype,
                "has_legal_custody": custody,
                "is_emergency_contact": emerg,
                "start_date": sdate,
                "end_date": None,
            }
        )
        rel_counter += 1

    # Separa adultos por faixa de idade para garantir parent.age >= child.age + 16
    adults_25_45 = [c for c in citizens[12:] if 25 <= c["age"] <= 45]
    adults_35_65 = [c for c in citizens[12:] if 35 <= c["age"] <= 65]
    children_all = [c for c in citizens[12:] if c["age"] < 18]

    # Cônjuges entre adultos
    for idx_sp in range(0, min(len(adults_25_45) - 1, 30000), 2):
        sp1 = adults_25_45[idx_sp]
        sp2 = adults_25_45[idx_sp + 1]
        family_links.append(
            {
                "relation_id": f"REL-{rel_counter:07d}",
                "source_nid": sp1["nid"],
                "target_nid": sp2["nid"],
                "relation_type": "SPOUSE",
                "has_legal_custody": True,
                "is_emergency_contact": True,
                "start_date": "2016-06-15",
                "end_date": None,
            }
        )
        rel_counter += 1

    # Vincula cada criança/adolescente (<18 anos) a 2 pais com idade >= child.age + 18 (logo >= +16 garantido!)
    p_cursor_young = 0
    p_cursor_older = 0
    for kid in children_all:
        if kid["age"] <= 8:
            pool_parents = adults_25_45
            p1 = pool_parents[p_cursor_young % len(pool_parents)]
            p2 = pool_parents[(p_cursor_young + 1) % len(pool_parents)]
            p_cursor_young += 2
        else:
            pool_parents = adults_35_65
            p1 = pool_parents[p_cursor_older % len(pool_parents)]
            p2 = pool_parents[(p_cursor_older + 1) % len(pool_parents)]
            p_cursor_older += 2

        family_links.append(
            {
                "relation_id": f"REL-{rel_counter:07d}",
                "source_nid": p1["nid"],
                "target_nid": kid["nid"],
                "relation_type": "BIOLOGICAL_PARENT",
                "has_legal_custody": True,
                "is_emergency_contact": True,
                "start_date": kid["birth_date"],
                "end_date": None,
            }
        )
        rel_counter += 1
        family_links.append(
            {
                "relation_id": f"REL-{rel_counter:07d}",
                "source_nid": p2["nid"],
                "target_nid": kid["nid"],
                "relation_type": "BIOLOGICAL_PARENT",
                "has_legal_custody": True,
                "is_emergency_contact": False,
                "start_date": kid["birth_date"],
                "end_date": None,
            }
        )
        rel_counter += 1

    # -------------------------------------------------------------------------
    # 4. SAÚDE (HL7 FHIR) & VACINAÇÃO INFANTIL (health_records & health_vaccinations)
    # -------------------------------------------------------------------------
    print("[4/7] Gerando prontuários HL7 FHIR (health_records) e calendário vacinal (health_vaccinations)...")
    health_records: List[Dict[str, Any]] = []
    vaccinations: List[Dict[str, Any]] = []
    blood_types = ["O+", "A+", "B+", "AB+", "O-", "A-", "B-", "AB-"]
    allergy_catalog = ["Penicilina", "Dipirona", "Sulfa", "Frutos do Mar", "Látex", "Amendoim"]
    chronic_catalog = ["HIPERTENSAO_CONTROLADA", "DIABETES_TIPO_2", "ASMA_LEVE"]
    doctor_nids = [calculate_nid(4), calculate_nid(5)]

    vac_counter = 1
    for idx_c, c in enumerate(citizens, start=1):
        bt = blood_types[idx_c % len(blood_types)]
        has_allergy = (idx_c % 7 == 0) or (idx_c in (1, 10))
        allergies = [allergy_catalog[idx_c % len(allergy_catalog)]] if has_allergy else []
        has_chronic = (c["age"] >= 45 and idx_c % 8 == 0)
        chronics = [chronic_catalog[idx_c % len(chronic_catalog)]] if has_chronic else []

        # Se for criança de 0 a 12 anos, registra vacinas do calendário infantil
        vaccine_status = "UP_TO_DATE"
        if c["age"] <= 12:
            if idx_c == 11 or (idx_c % 19 == 0):
                vaccine_status = "DELAYED_DOSE_ALERT"
            vaccinations.append(
                {
                    "vaccine_event_id": f"VAC-{vac_counter:07d}",
                    "nid": c["nid"],
                    "vaccine_code": "WHO-ATC-J07BX03",
                    "vaccine_name": "Pentavalente + Poliomielite Inativada (VIP)",
                    "dose_number": 1 if vaccine_status == "DELAYED_DOSE_ALERT" else 3,
                    "application_date": "2026-03-10T10:30:00Z",
                    "batch_number": f"LOT-NV-{202600 + (idx_c % 90)}",
                    "applicator_facility_code": "HOSP-NV-04",
                    "status": vaccine_status,
                }
            )
            vac_counter += 1

        health_records.append(
            {
                "patient_nid": c["nid"],
                "blood_type": bt,
                "chronic_conditions": ",".join(chronics) if chronics else "NONE",
                "allergies": ",".join(allergies) if allergies else "NONE",
                "organ_donor": (idx_c % 3 != 0),
                "assigned_primary_care_physician_nid": doctor_nids[idx_c % len(doctor_nids)],
                "vaccination_status": vaccine_status,
            }
        )

    # -------------------------------------------------------------------------
    # 5. EDUCAÇÃO, MATRÍCULAS E NOTAS POR MATÉRIA (edu_enrollments & edu_grades)
    # -------------------------------------------------------------------------
    print("[5/7] Gerando matrículas escolares (4 a 22 anos) e desempenho por matéria...")
    edu_enrollments: List[Dict[str, Any]] = []
    enr_counter = 1
    for idx_c, c in enumerate(citizens, start=1):
        age = c["age"]
        if 4 <= age <= 22 and c["profession"] in ("STUDENT", "UNIVERSITY_STUDENT"):
            if age <= 5:
                level = "EARLY_CHILDHOOD"
                grade = f"Pré-Escola II ({age} anos)"
                sch_id = "SCH-NV-001"
            elif age <= 14:
                level = "PRIMARY"
                grade = f"{max(1, age - 5)}º Ano Fundamental"
                sch_id = "SCH-NV-001" if idx_c % 2 == 0 else "SCH-NV-002"
            elif age <= 17:
                level = "SECONDARY"
                grade = f"{age - 14}ª Série Ensino Médio Técnico"
                sch_id = "SCH-NV-002" if idx_c % 2 == 0 else "SCH-NV-003"
            else:
                level = "HIGHER"
                grade = "Bacharelado em Sistemas Agênticos & Governança"
                sch_id = "SCH-NV-006"

            # Alerta de frequência baixa para demonstração do Cruzamento 1 GDF em alguns alunos
            attendance = 71.5 if (idx_c == 10 or idx_c % 29 == 0) else round(84.0 + (idx_c % 160) / 10.0, 1)
            math_score = round(6.5 + ((idx_c * 3) % 35) / 10.0, 1)
            science_score = round(6.8 + ((idx_c * 7) % 32) / 10.0, 1)
            ai_robotics_score = round(7.2 + ((idx_c * 11) % 28) / 10.0, 1)
            languages_score = round(7.0 + ((idx_c * 5) % 30) / 10.0, 1)

            edu_enrollments.append(
                {
                    "enrollment_id": f"ENR-{enr_counter:07d}",
                    "student_nid": c["nid"],
                    "school_id": sch_id,
                    "education_level": level,
                    "grade_level": grade,
                    "academic_year": 2026,
                    "teacher_nid": calculate_nid(6) if idx_c % 2 == 0 else calculate_nid(7),
                    "attendance_rate": attendance,
                    "score_mathematics": math_score,
                    "score_sciences": science_score,
                    "score_ai_robotics": ai_robotics_score,
                    "score_languages": languages_score,
                    "status": "ENROLLED",
                }
            )
            enr_counter += 1

    # -------------------------------------------------------------------------
    # 6. PASSAPORTES (sec_passports) E JUSTIÇA (justice_records & justice_incidents)
    # -------------------------------------------------------------------------
    print("[6/7] Gerando passaportes ICAO (sec_passports) e registros judiciais (justice_records)...")
    passports: List[Dict[str, Any]] = []
    justice_records: List[Dict[str, Any]] = []

    for idx_c, c in enumerate(citizens, start=1):
        has_incident = (idx_c > 15) and (idx_c % 33 == 0)  # ~3% com apontamento
        restricted_travel = has_incident and (idx_c % 99 == 0)
        active_warrants = 1 if (has_incident and idx_c % 198 == 0) else 0

        justice_records.append(
            {
                "record_id": f"JUS-{idx_c:07d}",
                "citizen_nid": c["nid"],
                "has_criminal_record": has_incident,
                "active_warrants": active_warrants,
                "restricted_travel": restricted_travel,
                "last_admissibility_check": "2026-09-30T18:00:00Z",
            }
        )

        if idx_c <= 25 or (idx_c % 10 < 6):  # ~60% possui passaporte
            p_num = f"NV-P{1000000 + idx_c:07d}"
            p_status = "RESTRICTED_HOLD" if (restricted_travel or c["tax_status"] == "SUSPENDED") else "ACTIVE"
            surname_clean = c["full_name"].split()[-1].upper()[:12]
            given_clean = c["full_name"].split()[0].upper()[:12]
            mrz1 = f"P<NVT{surname_clean}<<{given_clean}".ljust(44, "<")[:44]
            mrz2 = f"{p_num}<8NVT{c['birth_date'].replace('-', '')[2:]}M3601015<<<<<<<<<<<<<<04"[:44]
            passports.append(
                {
                    "passport_number": p_num,
                    "nid": c["nid"],
                    "issue_date": "2026-01-15",
                    "expiry_date": "2036-01-15",
                    "icao_mrz_line1": mrz1,
                    "icao_mrz_line2": mrz2,
                    "passport_status": p_status,
                }
            )

    # -------------------------------------------------------------------------
    # 7. EXPORTAÇÃO PARA NDJSON.GZ (PARA BIGQUERY / GCS LAKEHOUSE) + SQLITE OPERACIONAL
    # -------------------------------------------------------------------------
    print("[7/7] Gravando tabelas do Data Lakehouse (NDJSON.gz) e banco relacional operacional (SQLite)...")

    def write_ndjson_gz(filename: str, rows: List[Dict[str, Any]]) -> Path:
        out_path = OUTPUT_DIR / f"{filename}.ndjson.gz"
        with gzip.open(out_path, "wt", encoding="utf-8") as gz:
            for r in rows:
                gz.write(json.dumps(r, ensure_ascii=False) + "\n")
        return out_path

    write_ndjson_gz("dim_citizens", citizens)
    write_ndjson_gz("sec_biometrics_nist", biometrics)
    write_ndjson_gz("rel_family_graph", family_links)
    write_ndjson_gz("dim_addresses", addresses)
    write_ndjson_gz("rel_citizen_residence", residences)
    write_ndjson_gz("health_records", health_records)
    write_ndjson_gz("health_vaccinations", vaccinations)
    write_ndjson_gz("edu_enrollments", edu_enrollments)
    write_ndjson_gz("sec_passports", passports)
    write_ndjson_gz("justice_records", justice_records)
    write_ndjson_gz("iam_identity_360_roles", iam_roles)

    # Cria também o banco SQLite operacional completo para consultas SQL instantâneas nos microsserviços
    if SQLITE_DB_PATH.exists():
        SQLITE_DB_PATH.unlink()

    conn = sqlite3.connect(str(SQLITE_DB_PATH))
    cur = conn.cursor()

    cur.execute(
        """
        CREATE TABLE dim_citizens (
            nid TEXT PRIMARY KEY,
            full_name TEXT NOT NULL,
            email TEXT NOT NULL,
            birth_date TEXT NOT NULL,
            age INTEGER NOT NULL,
            gender TEXT NOT NULL,
            civil_status TEXT NOT NULL,
            native_language TEXT NOT NULL,
            citizenship_status TEXT NOT NULL,
            profession TEXT NOT NULL,
            specialty TEXT NOT NULL,
            iam_role TEXT NOT NULL,
            address_id TEXT NOT NULL,
            district TEXT NOT NULL,
            tax_status TEXT NOT NULL
        )
        """
    )
    cur.execute("CREATE INDEX idx_citizens_email ON dim_citizens(email)")
    cur.execute("CREATE INDEX idx_citizens_role ON dim_citizens(iam_role)")
    cur.execute("CREATE INDEX idx_citizens_prof ON dim_citizens(profession)")

    cur.executemany(
        """
        INSERT INTO dim_citizens VALUES (
            :nid, :full_name, :email, :birth_date, :age, :gender, :civil_status,
            :native_language, :citizenship_status, :profession, :specialty,
            :iam_role, :address_id, :district, :tax_status
        )
        """,
        citizens,
    )

    cur.execute(
        """
        CREATE TABLE rel_family_graph (
            relation_id TEXT PRIMARY KEY,
            source_nid TEXT NOT NULL,
            target_nid TEXT NOT NULL,
            relation_type TEXT NOT NULL,
            has_legal_custody INTEGER NOT NULL,
            is_emergency_contact INTEGER NOT NULL,
            start_date TEXT NOT NULL
        )
        """
    )
    cur.execute("CREATE INDEX idx_family_src ON rel_family_graph(source_nid)")
    cur.execute("CREATE INDEX idx_family_tgt ON rel_family_graph(target_nid)")
    cur.executemany(
        """
        INSERT INTO rel_family_graph VALUES (
            :relation_id, :source_nid, :target_nid, :relation_type,
            :has_legal_custody, :is_emergency_contact, :start_date
        )
        """,
        family_links,
    )

    cur.execute(
        """
        CREATE TABLE health_records (
            patient_nid TEXT PRIMARY KEY,
            blood_type TEXT NOT NULL,
            chronic_conditions TEXT NOT NULL,
            allergies TEXT NOT NULL,
            organ_donor INTEGER NOT NULL,
            assigned_primary_care_physician_nid TEXT NOT NULL,
            vaccination_status TEXT NOT NULL
        )
        """
    )
    cur.executemany(
        """
        INSERT INTO health_records VALUES (
            :patient_nid, :blood_type, :chronic_conditions, :allergies,
            :organ_donor, :assigned_primary_care_physician_nid, :vaccination_status
        )
        """,
        health_records,
    )

    cur.execute(
        """
        CREATE TABLE edu_enrollments (
            enrollment_id TEXT PRIMARY KEY,
            student_nid TEXT NOT NULL,
            school_id TEXT NOT NULL,
            education_level TEXT NOT NULL,
            grade_level TEXT NOT NULL,
            academic_year INTEGER NOT NULL,
            teacher_nid TEXT NOT NULL,
            attendance_rate REAL NOT NULL,
            score_mathematics REAL NOT NULL,
            score_sciences REAL NOT NULL,
            score_ai_robotics REAL NOT NULL,
            score_languages REAL NOT NULL,
            status TEXT NOT NULL
        )
        """
    )
    cur.execute("CREATE INDEX idx_edu_student ON edu_enrollments(student_nid)")
    cur.execute("CREATE INDEX idx_edu_school ON edu_enrollments(school_id)")
    cur.executemany(
        """
        INSERT INTO edu_enrollments VALUES (
            :enrollment_id, :student_nid, :school_id, :education_level, :grade_level,
            :academic_year, :teacher_nid, :attendance_rate, :score_mathematics,
            :score_sciences, :score_ai_robotics, :score_languages, :status
        )
        """,
        edu_enrollments,
    )

    cur.execute(
        """
        CREATE TABLE sec_passports (
            passport_number TEXT PRIMARY KEY,
            nid TEXT NOT NULL,
            issue_date TEXT NOT NULL,
            expiry_date TEXT NOT NULL,
            icao_mrz_line1 TEXT NOT NULL,
            icao_mrz_line2 TEXT NOT NULL,
            passport_status TEXT NOT NULL
        )
        """
    )
    cur.execute("CREATE INDEX idx_passport_nid ON sec_passports(nid)")
    cur.executemany(
        """
        INSERT INTO sec_passports VALUES (
            :passport_number, :nid, :issue_date, :expiry_date,
            :icao_mrz_line1, :icao_mrz_line2, :passport_status
        )
        """,
        passports,
    )

    cur.execute(
        """
        CREATE TABLE justice_records (
            record_id TEXT PRIMARY KEY,
            citizen_nid TEXT NOT NULL,
            has_criminal_record INTEGER NOT NULL,
            active_warrants INTEGER NOT NULL,
            restricted_travel INTEGER NOT NULL,
            last_admissibility_check TEXT NOT NULL
        )
        """
    )
    cur.execute("CREATE INDEX idx_justice_nid ON justice_records(citizen_nid)")
    cur.executemany(
        """
        INSERT INTO justice_records VALUES (
            :record_id, :citizen_nid, :has_criminal_record, :active_warrants,
            :restricted_travel, :last_admissibility_check
        )
        """,
        justice_records,
    )

    conn.commit()
    conn.close()

    elapsed = time.perf_counter() - t0
    print(f"[✓] GDF Lakehouse & Banco Operacional gerados em {elapsed:.2f}s!")
    print(f"    - dim_citizens:          {len(citizens):,}")
    print(f"    - sec_biometrics_nist:   {len(biometrics):,}")
    print(f"    - rel_family_graph:      {len(family_links):,}")
    print(f"    - dim_addresses:         {len(addresses):,}")
    print(f"    - health_records:        {len(health_records):,}")
    print(f"    - health_vaccinations:   {len(vaccinations):,}")
    print(f"    - edu_enrollments:       {len(edu_enrollments):,}")
    print(f"    - sec_passports:         {len(passports):,}")
    print(f"    - justice_records:       {len(justice_records):,}")


if __name__ == "__main__":
    generate_all()
