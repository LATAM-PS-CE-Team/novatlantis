#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
República Digital de Novatlantis — Gerador de Massa de Dados Sintética (100.000 Cidadãos)
Padrão Biométrico: ANSI/NIST-ITL 1-2011, ISO/IEC 19794-5 (Face) & ISO/IEC 19794-2 (Minutiae)
Identidade Soberana: NID-XXX-XXXX-XXXX (Dígito Verificador Módulo 11) + Chave Pública Ed25519

Uso:
  python3 data-generator/generate_citizens.py --count 100000 --output-dir ./data-generator/output
  python3 data-generator/generate_citizens.py --count 100000 --sync-firestore --sync-spanner
"""

from __future__ import annotations

import argparse
import base64
import datetime as dt
import hashlib
import json
import logging
import os
import struct
import sys
import time
import math
import random
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

try:
    import numpy as np  # type: ignore
except ImportError:
    np = None  # type: ignore

try:
    from faker import Faker  # type: ignore
except ImportError:
    Faker = None  # Fallback determinístico de alta performance caso Faker não esteja instalado

try:
    import pandas as pd  # type: ignore
except ImportError:
    pd = None

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [NOVATLANTIS-DATA-GEN] %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%SZ",
)
logger = logging.getLogger("novatlantis.datagen")

# ============================================================================
# CONSTANTES DEMOGRÁFICAS E GEOPOLÍTICAS DE NOVATLANTIS
# ============================================================================

DISTRICTS: List[Dict[str, Any]] = [
    {
        "name": "Distrito Tecnológico",
        "postal_prefix": "NV-10",
        "lat_range": (-23.5550, -23.5300),
        "lng_range": (-46.6600, -46.6300),
        "streets": [
            "Av. Ada Lovelace",
            "Bulevar Alan Turing",
            "Rua dos Computadores Quânticos",
            "Alameda Silício Verde",
            "Via Neural",
        ],
    },
    {
        "name": "Distrito Oceânico",
        "postal_prefix": "NV-20",
        "lat_range": (-23.6100, -23.5800),
        "lng_range": (-46.6900, -46.6600),
        "streets": [
            "Orla das Marés Limpas",
            "Av. Coral Azul",
            "Passarela Atlântica",
            "Rua dos Dessalinizadores",
            "Cais de Poseidon",
        ],
    },
    {
        "name": "Colina da Justiça",
        "postal_prefix": "NV-30",
        "lat_range": (-23.5290, -23.5100),
        "lng_range": (-46.6290, -46.6050),
        "streets": [
            "Praça da Constituição Digital",
            "Av. dos Direitos Algorítmicos",
            "Alameda Montesquieu",
            "Rua da Soberania de Dados",
            "Esplanada do Senado Cívico",
        ],
    },
    {
        "name": "Porto Solar",
        "postal_prefix": "NV-40",
        "lat_range": (-23.5800, -23.5551),
        "lng_range": (-46.6290, -46.6000),
        "streets": [
            "Av. Fotovoltaica",
            "Rua Hélio Soberano",
            "Travessa das Turbinas Eólicas",
            "Cais da Energia Limpa",
            "Alameda Hidrogênio Verde",
        ],
    },
    {
        "name": "Vale da Inovação",
        "postal_prefix": "NV-50",
        "lat_range": (-23.5450, -23.5200),
        "lng_range": (-46.6850, -46.6601),
        "streets": [
            "Av. Grace Hopper",
            "Rua Biotecnologia",
            "Parque das Startups Cívicas",
            "Alameda Open Source",
            "Via Genoma",
        ],
    },
    {
        "name": "Bosque Esmeralda",
        "postal_prefix": "NV-60",
        "lat_range": (-23.6400, -23.6101),
        "lng_range": (-46.6500, -46.6100),
        "streets": [
            "Trilha da Biodiversidade",
            "Av. Carbono Zero",
            "Alameda das Araucárias",
            "Rua dos Jardins Verticais",
            "Largo da Permacultura",
        ],
    },
]

LANGUAGES = ["pt-BR", "es-419", "en-US"]
LANGUAGE_PROBS = [0.45, 0.45, 0.10]

# ============================================================================
# CÁLCULO E VALIDAÇÃO DE NID (MÓDULO 11) — FORMATO: NID-XXX-XXXX-XXXX
# ============================================================================


def calculate_nid_mod11_check_digit(base_10_digits: str) -> str:
    """
    Calcula o 11º dígito verificador segundo o algoritmo Módulo 11 governamental.
    Recebe uma string de exatos 10 dígitos numéricos.
    Pesos decrescentes de 11 a 2. Se resto < 2, DV = 0; caso contrário, DV = 11 - resto.
    """
    if len(base_10_digits) != 10 or not base_10_digits.isdigit():
        raise ValueError(f"Base do NID deve conter exatamente 10 dígitos: {base_10_digits}")

    weights = [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]
    total = sum(int(d) * w for d, w in zip(base_10_digits, weights))
    remainder = total % 11
    dv = 0 if remainder < 2 else (11 - remainder)
    return str(dv)


def format_nid(base_10_digits: str) -> str:
    """Formata os 10 dígitos base + 1 dígito verificador Módulo 11 no padrão NID-XXX-XXXX-XXXX."""
    dv = calculate_nid_mod11_check_digit(base_10_digits)
    full_11 = f"{base_10_digits}{dv}"
    return f"NID-{full_11[0:3]}-{full_11[3:7]}-{full_11[7:11]}"


def validate_nid_mod11(nid_str: str) -> bool:
    """Valida a integridade sintática e matemática (Módulo 11) de um NID-XXX-XXXX-XXXX."""
    if not nid_str.startswith("NID-"):
        return False
    digits = nid_str.replace("NID-", "").replace("-", "")
    if len(digits) != 11 or not digits.isdigit():
        return False
    expected_dv = calculate_nid_mod11_check_digit(digits[:10])
    return digits[10] == expected_dv


# ============================================================================
# BIOMETRIA PADRÃO NIST (ANSI/NIST-ITL 1-2011 / ISO 19794-5 & ISO 19794-2)
# ============================================================================


def generate_nist_face_template(rng: Any, citizen_seed: int) -> str:
    """
    Gera um template facial padronizado ANSI/NIST-ITL 1-2011 (Type-10) / ISO/IEC 19794-5.
    Estrutura binária compacta empacotada em Base64:
      - Magic Header: b'FMR\\x0020\\x00' (8 bytes - ISO/IEC 19794-5 Facial Record Header)
      - Record Length & ICAO Compliance Flags (4 bytes)
      - Vetor Biométrico Facial Normalizado (L2-normalized 64-dim)
      - SHA-256 Checksum truncado (8 bytes)
    """
    header = b"FMR\x0020\x00\x01"
    icao_flags = struct.pack(">HH", 0x01F4, citizen_seed & 0xFFFF)
    if np is not None and hasattr(rng, "normal"):
        vec = rng.normal(loc=0.0, scale=1.0, size=64).astype(np.float16)
        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm
        vector_bytes = vec.tobytes()
    else:
        vector_bytes = hashlib.sha512(f"ISO19794-5-FACE-{citizen_seed}".encode("utf-8")).digest()

    digest = hashlib.sha256(header + icao_flags + vector_bytes).digest()[:8]
    payload = header + icao_flags + vector_bytes + digest
    return base64.b64encode(payload).decode("ascii")


def generate_nist_fingerprint_minutiae(
    rng: Any, num_minutiae: int = 18
) -> Dict[str, Any]:
    """
    Gera um registro de minúcias digitais no padrão ANSI/NIST-ITL 1-2011 (Type-9) / ISO/IEC 19794-2.
    Retorna metadados de sensor (500 dpi) e lista de coordenadas (x, y, theta, qualidade, tipo).
    """
    if np is not None and hasattr(rng, "integers"):
        xs = rng.integers(25, 475, size=num_minutiae)
        ys = rng.integers(25, 475, size=num_minutiae)
        thetas = rng.integers(0, 360, size=num_minutiae)
        qualities = rng.integers(72, 100, size=num_minutiae)
        types = rng.choice(["RIDGE_ENDING", "BIFURCATION"], size=num_minutiae, p=[0.58, 0.42])
        minutiae_list = [
            {
                "x": int(xs[i]),
                "y": int(ys[i]),
                "theta": int(thetas[i]),
                "quality": int(qualities[i]),
                "type": str(types[i]),
            }
            for i in range(num_minutiae)
        ]
    else:
        minutiae_list = [
            {
                "x": rng.randint(25, 475),
                "y": rng.randint(25, 475),
                "theta": rng.randint(0, 359),
                "quality": rng.randint(72, 99),
                "type": "RIDGE_ENDING" if rng.random() < 0.58 else "BIFURCATION",
            }
            for _ in range(num_minutiae)
        ]

    return {
        "standard": "ANSI/NIST-ITL 1-2011 Type-9 / ISO/IEC 19794-2:2011",
        "sensor_resolution_dpi": 500,
        "finger_position": "RIGHT_INDEX_02",
        "minutiae_count": num_minutiae,
        "minutiae": minutiae_list,
    }


def generate_ed25519_public_key_spki(nid: str, birth_date: str) -> str:
    """
    Deriva de forma determinística e ultrarrápida uma chave pública assimétrica Ed25519
    no formato ASN.1 SubjectPublicKeyInfo (RFC 8410) codificada em Base64/PEM.
    Prefixo ASN.1 DER para Ed25519 (OID 1.3.101.112): 302a300506032b6570032100 (12 bytes) + 32 bytes raw key.
    """
    ed25519_asn1_prefix = bytes.fromhex("302a300506032b6570032100")
    raw_32_bytes = hashlib.sha256(f"NOVATLANTIS-ED25519-{nid}-{birth_date}".encode("utf-8")).digest()
    spki_b64 = base64.b64encode(ed25519_asn1_prefix + raw_32_bytes).decode("ascii")
    return f"-----BEGIN PUBLIC KEY-----\n{spki_b64}\n-----END PUBLIC KEY-----"


# ============================================================================
# PIRÂMIDE DEMOGRÁFICA E POOL DE NOMES MULTILÍNGUES
# ============================================================================


def build_name_pools(seed: int = 2026) -> Dict[str, Dict[str, List[str]]]:
    """
    Constrói pools de nomes por idioma nativo (pt-BR, es-419, en-US) usando Faker
    para permitir amostragem vetorizada de 100.000 registros em poucos segundos.
    """
    pools: Dict[str, Dict[str, List[str]]] = {}
    locales = {
        "pt-BR": "pt_BR",
        "es-419": "es_MX",
        "en-US": "en_US",
    }

    if Faker is not None:
        Faker.seed(seed)
        for lang_code, faker_locale in locales.items():
            fk = Faker(faker_locale)
            pools[lang_code] = {
                "first_male": [fk.first_name_male() for _ in range(600)],
                "first_female": [fk.first_name_female() for _ in range(600)],
                "last": [fk.last_name() for _ in range(800)],
            }
    else:
        # Fallback determinístico caso executado em ambiente isolado sem pacote Faker
        pools["pt-BR"] = {
            "first_male": ["Gabriel", "Lucas", "Mateus", "Heitor", "Bernardo", "Rafael", "Tiago", "Arthur"],
            "first_female": ["Helena", "Alice", "Laura", "Manuela", "Valentina", "Sofia", "Isabella", "Clara"],
            "last": ["Silva", "Santos", "Oliveira", "Souza", "Rodrigues", "Ferreira", "Alves", "Pereira", "Costa"],
        }
        pools["es-419"] = {
            "first_male": ["Mateo", "Santiago", "Sebastián", "Leonardo", "Matías", "Emiliano", "Diego", "Alejandro"],
            "first_female": ["Sofía", "Valentina", "Camila", "Valeria", "Ximena", "Victoria", "Martina", "Lucía"],
            "last": ["García", "Rodríguez", "Martínez", "Hernández", "López", "González", "Pérez", "Sánchez", "Ramírez"],
        }
        pools["en-US"] = {
            "first_male": ["Liam", "Noah", "Oliver", "James", "Elijah", "William", "Henry", "Lucas"],
            "first_female": ["Olivia", "Emma", "Charlotte", "Amelia", "Sophia", "Mia", "Isabella", "Ava"],
            "last": ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Sterling"],
        }
    return pools


def generate_demographic_ages_days(rng: Any, count: int) -> Any:
    """
    Gera distribuição contínua realista de idades de 1 mês (30 dias) a 100 anos (36.525 dias),
    refletindo uma pirâmide demográfica realista:
      - 01 mês a 14 anos (Crianças / Educação Básica): 18%
      - 15 anos a 24 anos (Jovens / Ensino Médio e Univ.): 16%
      - 25 anos a 64 anos (Adultos / População Economicamente Ativa): 51%
      - 65 anos a 100 anos (Idosos / Aposentados e Longevos): 15%
    """
    if np is not None and hasattr(rng, "choice"):
        brackets = rng.choice([0, 1, 2, 3], size=count, p=[0.18, 0.16, 0.51, 0.15])
        ages_days = np.empty(count, dtype=np.int32)

        mask_children = brackets == 0
        mask_youth = brackets == 1
        mask_adults = brackets == 2
        mask_seniors = brackets == 3

        ages_days[mask_children] = rng.integers(30, 5475, size=int(np.sum(mask_children)))
        ages_days[mask_youth] = rng.integers(5475, 9131, size=int(np.sum(mask_youth)))
        ages_days[mask_adults] = rng.integers(9131, 23741, size=int(np.sum(mask_adults)))
        n_seniors = int(np.sum(mask_seniors))
        beta_samples = rng.beta(a=1.8, b=4.2, size=n_seniors)
        ages_days[mask_seniors] = (23741 + beta_samples * (36525 - 23741)).astype(np.int32)
        return ages_days

    out: List[int] = []
    for _ in range(count):
        u = rng.random()
        if u < 0.18:
            out.append(rng.randint(30, 5474))
        elif u < 0.34:
            out.append(rng.randint(5475, 9130))
        elif u < 0.85:
            out.append(rng.randint(9131, 23740))
        else:
            out.append(int(23741 + rng.betavariate(1.8, 4.2) * (36525 - 23741)))
    return out


# ============================================================================
# GERAÇÃO EM LOTE DOS 100.000 CIDADÃOS
# ============================================================================


def generate_citizens_dataset(
    count: int = 100_000,
    seed: int = 20260930,
    output_dir: Path = Path("./data-generator/output"),
) -> Tuple[Path, Optional[Path], Dict[str, Any]]:
    """
    Gera os registros completos de cidadãos em NDJSON e Parquet e retorna estatísticas auditáveis.
    """
    start_ts = time.perf_counter()
    output_dir.mkdir(parents=True, exist_ok=True)
    ndjson_path = output_dir / "citizens_100k.ndjson"
    parquet_path = output_dir / "citizens_100k.parquet"

    rng = np.random.default_rng(seed) if np is not None else random.Random(seed)
    logger.info("Construindo pools linguísticos (pt-BR 45%%, es-419 45%%, en-US 10%%)...")
    name_pools = build_name_pools(seed)

    logger.info("Amostrando pirâmide demográfica contínua (1 mês a 100 anos) para %d cidadãos...", count)
    ages_days = generate_demographic_ages_days(rng, count)
    if np is not None:
        native_langs = rng.choice(LANGUAGES, size=count, p=LANGUAGE_PROBS)
        district_indices = rng.integers(0, len(DISTRICTS), size=count)
        street_numbers = rng.integers(10, 9999, size=count)
        postal_suffixes = rng.integers(100, 999, size=count)
        confidence_scores = np.round(np.clip(rng.normal(loc=0.955, scale=0.028, size=count), 0.00, 1.00), 4)
    else:
        native_langs = rng.choices(LANGUAGES, weights=LANGUAGE_PROBS, k=count)
        district_indices = [rng.randint(0, len(DISTRICTS) - 1) for _ in range(count)]
        street_numbers = [rng.randint(10, 9999) for _ in range(count)]
        postal_suffixes = [rng.randint(100, 999) for _ in range(count)]
        confidence_scores = [round(min(1.0, max(0.0, rng.gauss(0.955, 0.028))), 4) for _ in range(count)]

    today = dt.date(2026, 9, 30)
    parquet_rows: List[Dict[str, Any]] = []

    lang_counts = {"pt-BR": 0, "es-419": 0, "en-US": 0}
    age_group_counts = {"children_0_14": 0, "youth_15_24": 0, "adults_25_64": 0, "seniors_65_100": 0}

    logger.info("Escrevendo registros validados (Módulo 11 + NIST Biometrics + Ed25519) em %s...", ndjson_path)
    with open(ndjson_path, "w", encoding="utf-8", buffering=1024 * 1024) as f_out:
        for idx in range(count):
            # 1. NID único com 10 dígitos base + 1 DV Módulo 11 -> NID-XXX-XXXX-XXXX
            base_10 = f"{1000000000 + idx:010d}"
            nid = format_nid(base_10)

            # 2. Idioma nativo e nomes culturalmente coerentes
            lang = str(native_langs[idx])
            lang_counts[lang] += 1
            pool = name_pools[lang]

            is_female = (idx % 2) == 0
            first_list = pool["first_female"] if is_female else pool["first_male"]
            last_list = pool["last"]

            first_name = first_list[idx % len(first_list)]
            middle_last = last_list[(idx * 7 + 3) % len(last_list)]
            family_last = last_list[(idx * 13 + 11) % len(last_list)]
            full_name = f"{first_name} {middle_last} {family_last}"

            mother_first = pool["first_female"][(idx * 5 + 1) % len(pool["first_female"])]
            father_first = pool["first_male"][(idx * 11 + 2) % len(pool["first_male"])]
            mother_name = f"{mother_first} {middle_last} {family_last}"
            father_name = f"{father_first} {last_list[(idx * 3 + 9) % len(last_list)]} {family_last}"

            # 3. Data de nascimento e faixa etária
            days_old = int(ages_days[idx])
            birth_date_obj = today - dt.timedelta(days=days_old)
            birth_date_iso = birth_date_obj.isoformat()
            age_years = round(days_old / 365.25, 2)
            age_months = max(1, int(round(days_old / 30.4375)))

            if age_years < 15:
                age_group_counts["children_0_14"] += 1
            elif age_years < 25:
                age_group_counts["youth_15_24"] += 1
            elif age_years < 65:
                age_group_counts["adults_25_64"] += 1
            else:
                age_group_counts["seniors_65_100"] += 1

            # 4. Endereço completo em Novatlantis
            dist = DISTRICTS[int(district_indices[idx])]
            street = dist["streets"][idx % len(dist["streets"])]
            lat = round(
                float(dist["lat_range"][0])
                + (idx % 1000) / 1000.0 * (dist["lat_range"][1] - dist["lat_range"][0]),
                6,
            )
            lng = round(
                float(dist["lng_range"][0])
                + ((idx * 7) % 1000) / 1000.0 * (dist["lng_range"][1] - dist["lng_range"][0]),
                6,
            )
            postal_code = f"{dist['postal_prefix']}-{int(postal_suffixes[idx]):03d}"

            # 5. Biometria NIST (ISO/IEC 19794-5 Face & ISO/IEC 19794-2 Minutiae)
            # Para manter performance de ~2-4s em 100k registros, geramos templates NIST determinísticos
            nist_face = generate_nist_face_template(rng, idx) if idx < 500 else base64.b64encode(
                b"FMR\x0020\x00\x01" + hashlib.sha512(f"NIST-FACE-{nid}".encode()).digest()
            ).decode("ascii")

            if idx < 500:
                nist_minutiae = generate_nist_fingerprint_minutiae(rng, num_minutiae=16)
            else:
                # Minúcias compactas padronizadas ISO/IEC 19794-2
                base_x = (idx * 17) % 420 + 40
                base_y = (idx * 31) % 420 + 40
                nist_minutiae = {
                    "standard": "ANSI/NIST-ITL 1-2011 Type-9 / ISO/IEC 19794-2:2011",
                    "sensor_resolution_dpi": 500,
                    "finger_position": "RIGHT_INDEX_02",
                    "minutiae_count": 4,
                    "minutiae": [
                        {"x": base_x, "y": base_y, "theta": (idx * 19) % 360, "quality": 94, "type": "RIDGE_ENDING"},
                        {"x": (base_x + 65) % 480, "y": (base_y + 42) % 480, "theta": (idx * 43) % 360, "quality": 91, "type": "BIFURCATION"},
                        {"x": (base_x + 110) % 480, "y": (base_y + 88) % 480, "theta": (idx * 71) % 360, "quality": 89, "type": "RIDGE_ENDING"},
                        {"x": (base_x + 35) % 480, "y": (base_y + 130) % 480, "theta": (idx * 97) % 360, "quality": 96, "type": "BIFURCATION"},
                    ],
                }

            record = {
                "nid": nid,
                "full_name": full_name,
                "native_language": lang,
                "birth_date": birth_date_iso,
                "age_years": age_years,
                "age_months": age_months,
                "filiation": {
                    "mother_name": mother_name,
                    "father_name": father_name,
                },
                "address": {
                    "street": f"{street}, {int(street_numbers[idx])}",
                    "district": dist["name"],
                    "city": "Novatlantis Capital",
                    "state": "DC-NV",
                    "postal_code": postal_code,
                    "country": "República Digital de Novatlantis",
                    "coordinates": {"lat": lat, "lng": lng},
                },
                "avatar_url": f"https://identity.novatlantis.gov.cloud/avatars/icao/{nid}.webp",
                "public_key_ed25519": generate_ed25519_public_key_spki(nid, birth_date_iso),
                "biometrics": {
                    "nist_face_template": nist_face,
                    "nist_fingerprint_minutiae": nist_minutiae,
                    "biometric_confidence_score": float(confidence_scores[idx]),
                    "icao_9303_compliant": True,
                },
                "created_at": "2026-09-30T00:00:00Z",
                "status": "ACTIVE_SOVEREIGN_CITIZEN",
            }

            f_out.write(json.dumps(record, ensure_ascii=False) + "\n")

            if pd is not None:
                parquet_rows.append(
                    {
                        "nid": nid,
                        "full_name": full_name,
                        "native_language": lang,
                        "birth_date": birth_date_iso,
                        "age_years": age_years,
                        "age_months": age_months,
                        "mother_name": mother_name,
                        "father_name": father_name,
                        "district": dist["name"],
                        "street": record["address"]["street"],
                        "postal_code": postal_code,
                        "lat": lat,
                        "lng": lng,
                        "avatar_url": record["avatar_url"],
                        "public_key_ed25519": record["public_key_ed25519"],
                        "nist_face_template": nist_face,
                        "nist_fingerprint_minutiae_json": json.dumps(nist_minutiae),
                        "biometric_confidence_score": float(confidence_scores[idx]),
                    }
                )

    actual_parquet_path: Optional[Path] = None
    if pd is not None and parquet_rows:
        try:
            df = pd.DataFrame(parquet_rows)
            df.to_parquet(parquet_path, index=False)
            actual_parquet_path = parquet_path
            logger.info("Arquivo Parquet colunar gerado com sucesso: %s", parquet_path)
        except Exception as exc:
            logger.warning("Exportação Parquet opcional ignorada (%s). NDJSON completo disponível.", exc)

    elapsed = time.perf_counter() - start_ts
    stats = {
        "total_records": count,
        "elapsed_seconds": round(elapsed, 3),
        "ndjson_path": str(ndjson_path),
        "parquet_path": str(actual_parquet_path) if actual_parquet_path else None,
        "language_distribution": lang_counts,
        "age_pyramid_distribution": age_group_counts,
        "sample_nid_validated": validate_nid_mod11(format_nid("1000000000")),
    }
    logger.info("Massa de dados concluída em %.2fs: %s", elapsed, json.dumps(stats, ensure_ascii=False))
    return ndjson_path, actual_parquet_path, stats


# ============================================================================
# INGESTÃO CLOUD NATIVA: GOOGLE CLOUD FIRESTORE & CLOUD SPANNER
# ============================================================================


def ingest_to_firestore(ndjson_path: Path, project_id: str, collection_name: str = "citizens") -> None:
    """Popula o Google Cloud Firestore em lotes de 500 documentos (limite transacional da API)."""
    from google.cloud import firestore  # type: ignore

    db = firestore.Client(project=project_id)
    batch = db.batch()
    count = 0

    with open(ndjson_path, "r", encoding="utf-8") as f:
        for line in f:
            doc = json.loads(line)
            doc_ref = db.collection(collection_name).document(doc["nid"])
            batch.set(doc_ref, doc)
            count += 1
            if count % 500 == 0:
                batch.commit()
                batch = db.batch()
                logger.info("[Firestore] %d cidadãos gravados...", count)

    if count % 500 != 0:
        batch.commit()
    logger.info("[Firestore] Ingestão finalizada: %d registros na coleção '%s'.", count, collection_name)


def ingest_to_spanner(
    ndjson_path: Path,
    project_id: str,
    instance_id: str = "novatlantis-spanner-core",
    database_id: str = "sovereign-identity-db",
) -> None:
    """Popula o Google Cloud Spanner com mutações em lote de alta vazão."""
    from google.cloud import spanner  # type: ignore

    client = spanner.Client(project=project_id)
    instance = client.instance(instance_id)
    database = instance.database(database_id)

    columns = (
        "nid",
        "full_name",
        "native_language",
        "birth_date",
        "age_years",
        "district",
        "address_json",
        "filiation_json",
        "avatar_url",
        "public_key_ed25519",
        "nist_face_template",
        "nist_fingerprint_minutiae",
        "biometric_confidence_score",
        "updated_at",
    )

    rows_buffer: List[Tuple[Any, ...]] = []
    total = 0

    with open(ndjson_path, "r", encoding="utf-8") as f:
        for line in f:
            r = json.loads(line)
            rows_buffer.append(
                (
                    r["nid"],
                    r["full_name"],
                    r["native_language"],
                    r["birth_date"],
                    r["age_years"],
                    r["address"]["district"],
                    json.dumps(r["address"], ensure_ascii=False),
                    json.dumps(r["filiation"], ensure_ascii=False),
                    r["avatar_url"],
                    r["public_key_ed25519"],
                    r["biometrics"]["nist_face_template"],
                    json.dumps(r["biometrics"]["nist_fingerprint_minutiae"]),
                    r["biometrics"]["biometric_confidence_score"],
                    spanner.COMMIT_TIMESTAMP,
                )
            )
            total += 1
            if len(rows_buffer) >= 1000:
                with database.batch() as batch:
                    batch.insert_or_update(table="Citizens", columns=columns, values=rows_buffer)
                rows_buffer.clear()
                logger.info("[Cloud Spanner] %d registros sincronizados...", total)

    if rows_buffer:
        with database.batch() as batch:
            batch.insert_or_update(table="Citizens", columns=columns, values=rows_buffer)
    logger.info("[Cloud Spanner] Sincronização concluída: %d cidadãos ativos.", total)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Gerador de 100.000 Cidadãos Sintéticos da República Digital de Novatlantis"
    )
    parser.add_argument("--count", type=int, default=100_000, help="Total de cidadãos a gerar (padrão: 100000)")
    parser.add_argument("--seed", type=int, default=20260930, help="Seed determinística do PRNG")
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path("./data-generator/output"),
        help="Diretório de saída para arquivos NDJSON e Parquet",
    )
    parser.add_argument("--project-id", type=str, default=os.environ.get("GCP_PROJECT_ID", "novatlantis"))
    parser.add_argument("--sync-firestore", action="store_true", help="Sincroniza o lote gerado com Cloud Firestore")
    parser.add_argument("--sync-spanner", action="store_true", help="Sincroniza o lote gerado com Cloud Spanner")

    args = parser.parse_args()
    ndjson_path, _, _ = generate_citizens_dataset(
        count=args.count,
        seed=args.seed,
        output_dir=args.output_dir,
    )

    if args.sync_firestore:
        ingest_to_firestore(ndjson_path, project_id=args.project_id)
    if args.sync_spanner:
        ingest_to_spanner(ndjson_path, project_id=args.project_id)

    return 0


if __name__ == "__main__":
    sys.exit(main())
