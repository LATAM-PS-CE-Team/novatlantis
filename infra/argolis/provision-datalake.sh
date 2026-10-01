#!/usr/bin/env bash
# ==============================================================================
# REPÚBLICA DIGITAL DE NOVATLANTIS
# Provisionamento do Government Data Framework (GDF) Medallion Lakehouse
# Cloud Storage (Bronze/Silver) + BigQuery (gdf_bronze, gdf_silver, gdf_gold)
# Project ID: novatlantis
# ==============================================================================
set -euo pipefail

export PATH="/google/data/ro/teams/cloud-sdk:/usr/lib/google-cloud-sdk/bin:${PATH}"
export CLOUDSDK_ACTIVE_CONFIG_NAME="${CLOUDSDK_ACTIVE_CONFIG_NAME:-argolis}"
PROJECT_ID="novatlantis"
REGION="us-central1"
BUCKET_NAME="novatlantis-gdf-lakehouse"

echo "======================================================================"
echo " NOVATLANTIS GDF DATA LAKEHOUSE PROVISIONING (Project: ${PROJECT_ID})"
echo "======================================================================"

cat > /tmp/cloudbuild-bq-rest.yaml <<'EOF'
steps:
  - name: 'python:3.12-slim'
    entrypoint: 'python3'
    args:
      - '-c'
      - |
        import json, time, urllib.request, uuid

        PROJECT_ID = "novatlantis"
        REGION = "us-central1"
        BUCKET = "novatlantis-gdf-lakehouse"

        req = urllib.request.Request(
            "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token",
            headers={"Metadata-Flavor": "Google"}
        )
        token = json.loads(urllib.request.urlopen(req).read().decode())["access_token"]
        headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

        def api_req(url, payload=None, method="POST"):
            data = json.dumps(payload).encode() if payload is not None else None
            r = urllib.request.Request(url, data=data, headers=headers, method=method)
            try:
                with urllib.request.urlopen(r) as resp:
                    return json.loads(resp.read().decode())
            except urllib.error.HTTPError as e:
                body = e.read().decode()
                if e.code == 409:
                    return {"status": "ALREADY_EXISTS"}
                raise RuntimeError(f"HTTP {e.code}: {body}")

        for ds in ["gdf_bronze", "gdf_silver", "gdf_gold"]:
            api_req(f"https://bigquery.googleapis.com/bigquery/v2/projects/{PROJECT_ID}/datasets", {
                "datasetReference": {"projectId": PROJECT_ID, "datasetId": ds},
                "location": REGION,
                "description": f"Novatlantis Government Data Framework ({ds})"
            })
            print(f"[OK] Dataset {PROJECT_ID}:{ds} ready.", flush=True)

        tables = [
            "dim_citizens", "sec_biometrics_nist", "rel_family_graph",
            "dim_addresses", "rel_citizen_residence", "health_records",
            "health_vaccinations", "edu_enrollments", "sec_passports",
            "justice_records", "iam_identity_360_roles"
        ]
        job_ids = []
        for tbl in tables:
            jid = f"load_{tbl}_{uuid.uuid4().hex[:8]}"
            res = api_req(f"https://bigquery.googleapis.com/bigquery/v2/projects/{PROJECT_ID}/jobs", {
                "jobReference": {
                    "projectId": PROJECT_ID,
                    "jobId": jid,
                    "location": REGION
                },
                "configuration": {
                    "load": {
                        "sourceUris": [f"gs://{BUCKET}/bronze/{tbl}.ndjson.gz"],
                        "destinationTable": {"projectId": PROJECT_ID, "datasetId": "gdf_silver", "tableId": tbl},
                        "sourceFormat": "NEWLINE_DELIMITED_JSON",
                        "autodetect": True,
                        "writeDisposition": "WRITE_TRUNCATE"
                    }
                }
            })
            job_ids.append((tbl, jid))
            print(f"[OK] Triggered load job {jid} for gdf_silver.{tbl}", flush=True)

        for tbl, jid in job_ids:
            while True:
                jstatus = api_req(
                    f"https://bigquery.googleapis.com/bigquery/v2/projects/{PROJECT_ID}/jobs/{jid}?location={REGION}",
                    None, "GET"
                )
                state = jstatus.get("status", {}).get("state")
                if state == "DONE":
                    err = jstatus.get("status", {}).get("errorResult")
                    if err:
                        raise RuntimeError(f"Load job {jid} ({tbl}) failed: {err}")
                    print(f"[DONE] Loaded gdf_silver.{tbl}", flush=True)
                    break
                time.sleep(1.5)

        views = {
            "vw_border_passport_clearance": """
                CREATE OR REPLACE VIEW `novatlantis.gdf_gold.vw_border_passport_clearance` AS
                SELECT c.citizen_id, c.full_name, c.role_code, c.tax_status, p.passport_number, p.status AS passport_status,
                       j.background_check_status, j.security_clearance_level,
                       CASE
                         WHEN j.background_check_status = 'WARRANT_ACTIVE' OR c.tax_status = 'BLOCKED_JUDICIAL' THEN 'DENIED_BORDER_HOLD'
                         WHEN c.tax_status = 'DELINQUENT' THEN 'MANUAL_TREASURY_REVIEW'
                         ELSE 'CLEARED_AUTONOMOUS_EGATE'
                       END AS border_decision
                FROM `novatlantis.gdf_silver.dim_citizens` c
                LEFT JOIN `novatlantis.gdf_silver.sec_passports` p ON c.citizen_id = p.citizen_id
                LEFT JOIN `novatlantis.gdf_silver.justice_records` j ON c.citizen_id = j.citizen_id
            """,
            "vw_school_truancy_family_alerts": """
                CREATE OR REPLACE VIEW `novatlantis.gdf_gold.vw_school_truancy_family_alerts` AS
                SELECT e.enrollment_id, e.citizen_id AS student_nid, s.full_name AS student_name, e.grade_level,
                       e.attendance_rate, e.performance_index, e.ai_tutor_Needs_attention,
                       fg.citizen_id_a AS parent_nid, p.full_name AS parent_name, p.email AS parent_email, p.phone AS parent_phone
                FROM `novatlantis.gdf_silver.edu_enrollments` e
                JOIN `novatlantis.gdf_silver.dim_citizens` s ON e.citizen_id = s.citizen_id
                LEFT JOIN `novatlantis.gdf_silver.rel_family_graph` fg ON fg.citizen_id_b = e.citizen_id AND fg.relationship_type = 'PARENT_OF'
                LEFT JOIN `novatlantis.gdf_silver.dim_citizens` p ON fg.citizen_id_a = p.citizen_id
                WHERE e.attendance_rate < 80.0 OR e.ai_tutor_Needs_attention = TRUE
            """,
            "vw_emergency_911_medical_dispatch": """
                CREATE OR REPLACE VIEW `novatlantis.gdf_gold.vw_emergency_911_medical_dispatch` AS
                SELECT c.citizen_id, c.full_name, c.age, h.blood_type, h.allergies, h.chronic_conditions,
                       h.assigned_hospital_id, h.family_doctor_nid, h.emergency_contact_nid,
                       ec.full_name AS emergency_contact_name, ec.phone AS emergency_contact_phone
                FROM `novatlantis.gdf_silver.dim_citizens` c
                JOIN `novatlantis.gdf_silver.health_records` h ON c.citizen_id = h.citizen_id
                LEFT JOIN `novatlantis.gdf_silver.dim_citizens` ec ON h.emergency_contact_nid = ec.citizen_id
            """
        }
        for name, sql in views.items():
            api_req(f"https://bigquery.googleapis.com/bigquery/v2/projects/{PROJECT_ID}/queries", {
                "query": sql, "useLegacySql": False, "location": REGION
            })
            print(f"[OK] Created Gold View gdf_gold.{name}", flush=True)

        res = api_req(f"https://bigquery.googleapis.com/bigquery/v2/projects/{PROJECT_ID}/queries", {
            "query": "SELECT COUNT(*) AS total FROM `novatlantis.gdf_silver.dim_citizens`",
            "useLegacySql": False, "location": REGION
        })
        print("[SUCCESS] BigQuery gdf_silver.dim_citizens row count:", res.get("rows"), flush=True)
EOF

gcloud builds submit --no-source --config=/tmp/cloudbuild-bq-rest.yaml --project="${PROJECT_ID}"
echo "[✓] GDF Data Lakehouse (Cloud Storage + BigQuery Silver & Gold) provisionado em ${PROJECT_ID}!"
