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
PROJECT_NUMBER="1054221034062"
REGION="us-central1"
BUCKET_NAME="novatlantis-gdf-lakehouse"

echo "======================================================================"
echo " NOVATLANTIS GDF DATA LAKEHOUSE PROVISIONING (Project: ${PROJECT_ID})"
echo "======================================================================"

gcloud services enable bigquery.googleapis.com storage.googleapis.com --project="${PROJECT_ID}"

echo "[1/4] Concedendo permissões BigQuery Admin & Storage Admin às Service Accounts..."
for sa in "${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" "novatlantis-workload-sa@${PROJECT_ID}.iam.gserviceaccount.com"; do
  gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
    --member="serviceAccount:${sa}" \
    --role="roles/bigquery.admin" --quiet >/dev/null
  gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
    --member="serviceAccount:${sa}" \
    --role="roles/storage.admin" --quiet >/dev/null
done

echo "[2/4] Verificando Cloud Storage Bucket gs://${BUCKET_NAME}..."
gcloud storage buckets create "gs://${BUCKET_NAME}" \
  --project="${PROJECT_ID}" \
  --location="${REGION}" \
  --uniform-bucket-level-access 2>/dev/null || echo "Bucket gs://${BUCKET_NAME} já ativo."

echo "[3/4] Sincronizando lotes NDJSON.gz (100.000 cidadãos) na Camada Bronze..."
gcloud storage cp data-generator/lakehouse/*.ndjson.gz "gs://${BUCKET_NAME}/bronze/" --project="${PROJECT_ID}"

echo "[4/4] Executando ingestão BigQuery (gdf_bronze, gdf_silver, gdf_gold) via Cloud Build..."
cat > /tmp/cloudbuild-bq-lakehouse.yaml <<'EOF'
steps:
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk:slim'
    entrypoint: 'bash'
    args:
      - '-c'
      - |
        set -e
        PROJECT_ID="novatlantis"
        REGION="us-central1"
        BUCKET="novatlantis-gdf-lakehouse"
        touch ~/.bigqueryrc
        for ds in gdf_bronze gdf_silver gdf_gold; do
          bq --headless --project_id="$${PROJECT_ID}" --location="$${REGION}" mk --dataset "$${PROJECT_ID}:$${ds}" 2>/dev/null || true
        done
        for tbl in dim_citizens sec_biometrics_nist rel_family_graph dim_addresses rel_citizen_residence health_records health_vaccinations edu_enrollments sec_passports justice_records iam_identity_360_roles; do
          echo "Loading gdf_silver.$${tbl}..."
          bq --headless --project_id="$${PROJECT_ID}" --location="$${REGION}" load \
            --replace --autodetect --source_format=NEWLINE_DELIMITED_JSON \
            "$${PROJECT_ID}:gdf_silver.$${tbl}" \
            "gs://$${BUCKET}/bronze/$${tbl}.ndjson.gz"
        done
        bq --headless --project_id="$${PROJECT_ID}" --location="$${REGION}" query --use_legacy_sql=false "
        CREATE OR REPLACE VIEW \`novatlantis.gdf_gold.vw_border_passport_clearance\` AS
        SELECT c.citizen_id, c.full_name, c.role_code, c.tax_status, p.passport_number, p.status AS passport_status,
               j.background_check_status, j.security_clearance_level,
               CASE
                 WHEN j.background_check_status = 'WARRANT_ACTIVE' OR c.tax_status = 'BLOCKED_JUDICIAL' THEN 'DENIED_BORDER_HOLD'
                 WHEN c.tax_status = 'DELINQUENT' THEN 'MANUAL_TREASURY_REVIEW'
                 ELSE 'CLEARED_AUTONOMOUS_EGATE'
               END AS border_decision
        FROM \`novatlantis.gdf_silver.dim_citizens\` c
        LEFT JOIN \`novatlantis.gdf_silver.sec_passports\` p ON c.citizen_id = p.citizen_id
        LEFT JOIN \`novatlantis.gdf_silver.justice_records\` j ON c.citizen_id = j.citizen_id;
        "
        bq --headless --project_id="$${PROJECT_ID}" --location="$${REGION}" query --use_legacy_sql=false "
        CREATE OR REPLACE VIEW \`novatlantis.gdf_gold.vw_school_truancy_family_alerts\` AS
        SELECT e.enrollment_id, e.citizen_id AS student_nid, s.full_name AS student_name, e.grade_level,
               e.attendance_rate, e.performance_index, e.ai_tutor_Needs_attention,
               fg.citizen_id_a AS parent_nid, p.full_name AS parent_name, p.email AS parent_email, p.phone AS parent_phone
        FROM \`novatlantis.gdf_silver.edu_enrollments\` e
        JOIN \`novatlantis.gdf_silver.dim_citizens\` s ON e.citizen_id = s.citizen_id
        LEFT JOIN \`novatlantis.gdf_silver.rel_family_graph\` fg ON fg.citizen_id_b = e.citizen_id AND fg.relationship_type = 'PARENT_OF'
        LEFT JOIN \`novatlantis.gdf_silver.dim_citizens\` p ON fg.citizen_id_a = p.citizen_id
        WHERE e.attendance_rate < 80.0 OR e.ai_tutor_Needs_attention = TRUE;
        "
        bq --headless --project_id="$${PROJECT_ID}" --location="$${REGION}" query --use_legacy_sql=false "
        CREATE OR REPLACE VIEW \`novatlantis.gdf_gold.vw_emergency_911_medical_dispatch\` AS
        SELECT c.citizen_id, c.full_name, c.age, h.blood_type, h.allergies, h.chronic_conditions,
               h.assigned_hospital_id, h.family_doctor_nid, h.emergency_contact_nid,
               ec.full_name AS emergency_contact_name, ec.phone AS emergency_contact_phone
        FROM \`novatlantis.gdf_silver.dim_citizens\` c
        JOIN \`novatlantis.gdf_silver.health_records\` h ON c.citizen_id = h.citizen_id
        LEFT JOIN \`novatlantis.gdf_silver.dim_citizens\` ec ON h.emergency_contact_nid = ec.citizen_id;
        "
        bq --headless --project_id="$${PROJECT_ID}" --location="$${REGION}" query --use_legacy_sql=false "SELECT COUNT(*) AS total_citizens FROM \`novatlantis.gdf_silver.dim_citizens\`"
EOF

gcloud builds submit --no-source --config=/tmp/cloudbuild-bq-lakehouse.yaml --project="${PROJECT_ID}"

echo "[✓] GDF Data Lakehouse (Cloud Storage + BigQuery Silver & Gold) provisionado em ${PROJECT_ID}!"
