#!/usr/bin/env python3
"""
REPÚBLICA DIGITAL DE NOVATLANTIS
Provisionamento Completo das Camadas BigQuery do Government Data Platform (GDP)
Baseado em: https://github.com/googlecloudplatform/education-data-platform
"""

import glob
import json
import os
import subprocess
import time
import urllib.error
import urllib.request

PROJECT_ID = os.environ.get("GCP_PROJECT_ID", "novatlantis")
LOCATION = "US"
GCS_DROPOFF_BUCKET = "novatlantis-gdp-drp-cs-0"
GCS_LANDING_BUCKET = "novatlantis-gdp-dwh-lnd-cs-0"
LAKEHOUSE_DIR = os.path.join(os.path.dirname(__file__), "../../data-generator/lakehouse")


def get_access_token() -> str:
    env = os.environ.copy()
    env["PATH"] = f"/google/data/ro/teams/cloud-sdk:{env.get('PATH', '')}"
    env["CLOUDSDK_ACTIVE_CONFIG_NAME"] = "argolis"
    out = subprocess.check_output(["gcloud", "auth", "print-access-token"], env=env)
    return out.decode("utf-8").strip()


def bq_request(method: str, path: str, token: str, payload: dict = None):
    url = f"https://bigquery.googleapis.com/bigquery/v2/projects/{PROJECT_ID}{path}"
    data = json.dumps(payload).encode("utf-8") if payload is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Authorization", f"Bearer {token}")
    req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            body = resp.read().decode("utf-8")
            return json.loads(body) if body else {}
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        if e.code == 409:
            return {"status": "ALREADY_EXISTS"}
        print(f"[BQ HTTP {e.code}] {path}: {err_body[:400]}")
        raise


def create_dataset(token: str, dataset_id: str, description: str):
    payload = {
        "datasetReference": {"projectId": PROJECT_ID, "datasetId": dataset_id},
        "location": LOCATION,
        "description": description,
        "labels": {
            "platform": "government-data-platform",
            "nation": "novatlantis",
            "blueprint": "googlecloudplatform-edp",
        },
    }
    res = bq_request("POST", "/datasets", token, payload)
    print(f"[OK] Dataset BigQuery {PROJECT_ID}:{dataset_id} pronto.")
    return res


def run_bq_query(token: str, sql: str, description: str = ""):
    payload = {
        "query": sql,
        "useLegacySql": False,
        "location": LOCATION,
    }
    res = bq_request("POST", "/queries", token, payload)
    print(f"[OK] SQL Executado: {description or sql[:60]}...")
    return res


def upload_and_load_lakehouse_tables(token: str):
    env = os.environ.copy()
    env["PATH"] = f"/google/data/ro/teams/cloud-sdk:{env.get('PATH', '')}"
    env["CLOUDSDK_ACTIVE_CONFIG_NAME"] = "argolis"

    ndjson_files = sorted(glob.glob(os.path.join(LAKEHOUSE_DIR, "*.ndjson.gz")))
    print(f"[GDP] Sincronizando {len(ndjson_files)} tabelas do Datalake para GCS Drop-off & Landing...")

    subprocess.run(
        [
            "gcloud",
            "storage",
            "cp",
            os.path.join(LAKEHOUSE_DIR, "*.ndjson.gz"),
            f"gs://{GCS_DROPOFF_BUCKET}/lakehouse/load/",
            f"--project={PROJECT_ID}",
            "--quiet",
        ],
        env=env,
        check=True,
    )
    subprocess.run(
        [
            "gcloud",
            "storage",
            "cp",
            os.path.join(LAKEHOUSE_DIR, "*.ndjson.gz"),
            f"gs://{GCS_LANDING_BUCKET}/lakehouse/",
            f"--project={PROJECT_ID}",
            "--quiet",
        ],
        env=env,
        check=True,
    )

    jobs = []
    for fpath in ndjson_files:
        fname = os.path.basename(fpath)
        table_id = fname.replace(".ndjson.gz", "")
        gcs_uri = f"gs://{GCS_LANDING_BUCKET}/lakehouse/{fname}"

        payload = {
            "configuration": {
                "load": {
                    "sourceUris": [gcs_uri],
                    "destinationTable": {
                        "projectId": PROJECT_ID,
                        "datasetId": "novatlantis_gdp_dwh_lnd_bq_0",
                        "tableId": table_id,
                    },
                    "sourceFormat": "NEWLINE_DELIMITED_JSON",
                    "writeDisposition": "WRITE_TRUNCATE",
                    "autodetect": True,
                }
            }
        }
        res = bq_request("POST", "/jobs", token, payload)
        job_id = res.get("jobReference", {}).get("jobId")
        jobs.append((table_id, job_id))

    for table_id, job_id in jobs:
        for _ in range(30):
            status = bq_request("GET", f"/jobs/{job_id}?location={LOCATION}", token)
            if status.get("status", {}).get("state") == "DONE":
                err = status.get("status", {}).get("errorResult")
                if err:
                    print(f"[ERRO] {table_id}: {err}")
                else:
                    print(f"[OK] Tabela {PROJECT_ID}:novatlantis_gdp_dwh_lnd_bq_0.{table_id} carregada no BigQuery!")
                break
            time.sleep(1.5)


def main():
    token = get_access_token()

    # 1. Datasets Medallion do Government Data Platform (baseado no EDP)
    datasets = [
        ("novatlantis_gdp_drp_bq_0", "GDP Drop-off Zone — Ingestão temporária de APIs REST, Conectores e Eventos"),
        ("novatlantis_gdp_dwh_lnd_bq_0", "GDP Data Warehouse Landing (Raw) — Dados brutos estruturados de 100.000 cidadãos e serviços"),
        ("novatlantis_gdp_dwh_cur_bq_0", "GDP Data Warehouse Curated — Dados limpos, anonimizados, agregados e Views Looker Studio"),
        ("novatlantis_gdp_dwh_conf_bq_0", "GDP Data Warehouse Confidential — Dados PII e Biometria NIST com governança Data Catalog"),
        ("novatlantis_gdp_dwh_plg_bq_0", "GDP Data Warehouse Playground — Ambiente de exploração analítica e IA Agêntica"),
    ]
    for ds_id, desc in datasets:
        create_dataset(token, ds_id, desc)

    # 2. Carregar todas as 11 tabelas do Datalake de 100.000 cidadãos no BigQuery Landing
    upload_and_load_lakehouse_tables(token)

    # 3. Criar Views e Tabelas nas camadas Curated e Confidential (compatíveis com Looker Studio do EDP)
    queries = [
        (
            "Criar View Curated v_mdl_users (Compatível com Looker Studio do Education Data Platform)",
            f"""
            CREATE OR REPLACE VIEW `{PROJECT_ID}.novatlantis_gdp_dwh_cur_bq_0.v_mdl_users` AS
            SELECT
              nid AS user_id,
              full_name AS fullname,
              email,
              district AS city,
              'Novatlantis' AS country,
              native_language AS lang,
              age AS age_years,
              profession,
              specialty
            FROM `{PROJECT_ID}.novatlantis_gdp_dwh_lnd_bq_0.dim_citizens`
            WHERE age BETWEEN 5 AND 28 OR profession LIKE '%Professor%';
            """,
        ),
        (
            "Criar View Curated v_mdl_courses (Cursos Nacionais de Novatlantis no padrão EDP)",
            f"""
            CREATE OR REPLACE VIEW `{PROJECT_ID}.novatlantis_gdp_dwh_cur_bq_0.v_mdl_courses` AS
            SELECT 'CRS-MATH-101' AS course_id, 'Matemática Quântica e Computacional' AS fullname, 'STEM' AS category, 1 AS visible
            UNION ALL
            SELECT 'CRS-SCI-102', 'Ciências Marinhas e Biotecnologia Sustentável', 'Ciências', 1
            UNION ALL
            SELECT 'CRS-AI-103', 'Inteligência Artificial Agêntica e Robótica Soberana', 'Tecnologia', 1
            UNION ALL
            SELECT 'CRS-LANG-104', 'Comunicação Trilíngue (PT-BR / ES-419 / EN-US)', 'Linguagens', 1;
            """,
        ),
        (
            "Criar View Curated v_mdl_grades (Notas Escolares e Desempenho no padrão EDP Looker Studio)",
            f"""
            CREATE OR REPLACE VIEW `{PROJECT_ID}.novatlantis_gdp_dwh_cur_bq_0.v_mdl_grades` AS
            SELECT
              enrollment_id,
              student_nid AS user_id,
              school_id,
              education_level,
              grade_level,
              academic_year,
              score_mathematics,
              score_sciences,
              score_ai_robotics,
              score_languages,
              ROUND((score_mathematics + score_sciences + score_ai_robotics + score_languages) / 4.0, 2) AS finalgrade,
              attendance_rate,
              teacher_nid,
              status
            FROM `{PROJECT_ID}.novatlantis_gdp_dwh_lnd_bq_0.edu_enrollments`;
            """,
        ),
        (
            "Criar Tabela Curated citizen_360_anonymized (Camada Curated sem PII sensível)",
            f"""
            CREATE OR REPLACE TABLE `{PROJECT_ID}.novatlantis_gdp_dwh_cur_bq_0.citizen_360_anonymized` AS
            SELECT
              TO_HEX(SHA256(c.nid)) AS citizen_hash_id,
              c.district,
              c.age,
              c.gender,
              c.civil_status,
              c.native_language,
              c.profession,
              c.specialty,
              c.iam_role,
              c.tax_status,
              h.blood_type,
              h.organ_donor,
              h.vaccination_status
            FROM `{PROJECT_ID}.novatlantis_gdp_dwh_lnd_bq_0.dim_citizens` c
            LEFT JOIN `{PROJECT_ID}.novatlantis_gdp_dwh_lnd_bq_0.health_records` h
              ON c.nid = h.patient_nid;
            """,
        ),
        (
            "Criar Tabela Confidential citizens_pii_biometrics (Camada Confidential com PII e Biometria NIST)",
            f"""
            CREATE OR REPLACE TABLE `{PROJECT_ID}.novatlantis_gdp_dwh_conf_bq_0.citizens_pii_biometrics` AS
            SELECT
              c.nid,
              c.full_name,
              c.email,
              c.birth_date,
              c.age,
              c.gender,
              c.civil_status,
              c.district,
              c.iam_role,
              b.nist_confidence,
              b.facial_template_b64,
              b.facial_icao_compliant,
              b.fingerprint_available,
              p.passport_number,
              p.icao_mrz_line1,
              p.icao_mrz_line2
            FROM `{PROJECT_ID}.novatlantis_gdp_dwh_lnd_bq_0.dim_citizens` c
            LEFT JOIN `{PROJECT_ID}.novatlantis_gdp_dwh_lnd_bq_0.sec_biometrics_nist` b
              ON c.nid = b.nid
            LEFT JOIN `{PROJECT_ID}.novatlantis_gdp_dwh_lnd_bq_0.sec_passports` p
              ON c.nid = p.nid;
            """,
        ),
        (
            "Criar View Curated v_gdp_executive_kpis (KPIs Executivos de Governo em Tempo Real)",
            f"""
            CREATE OR REPLACE VIEW `{PROJECT_ID}.novatlantis_gdp_dwh_cur_bq_0.v_gdp_executive_kpis` AS
            SELECT
              district,
              COUNT(*) AS total_citizens,
              ROUND(AVG(age), 1) AS avg_age,
              COUNTIF(native_language = 'pt-BR') AS speakers_pt_br,
              COUNTIF(native_language = 'es-419') AS speakers_es_419,
              COUNTIF(native_language = 'en-US') AS speakers_en_us
            FROM `{PROJECT_ID}.novatlantis_gdp_dwh_lnd_bq_0.dim_citizens`
            GROUP BY district;
            """,
        ),
    ]

    for desc, sql in queries:
        run_bq_query(token, sql, desc)

    print("\n=== GOVERNMENT DATA PLATFORM (BIGQUERY MEDALLION ARCHITECTURE) IMPLANTADA COM SUCESSO ===")


if __name__ == "__main__":
    main()
