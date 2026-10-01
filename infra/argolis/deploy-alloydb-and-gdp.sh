#!/usr/bin/env bash
# ==============================================================================
# REPÚBLICA DIGITAL DE NOVATLANTIS
# PROVISIONAMENTO ALLOYDB FOR POSTGRESQL & GOVERNMENT DATA PLATFORM (GDP)
# Baseado em: https://github.com/googlecloudplatform/education-data-platform
# Projeto GCP: novatlantis | Região: us-central1
# ==============================================================================

set -euo pipefail

export PATH="/google/data/ro/teams/cloud-sdk:${PATH}"
export CLOUDSDK_ACTIVE_CONFIG_NAME="${CLOUDSDK_ACTIVE_CONFIG_NAME:-argolis}"

PROJECT_ID="${GCP_PROJECT_ID:-novatlantis}"
REGION="${GCP_REGION:-us-central1}"
LOCATION="US"
PREFIX="novatlantis-gdp"
VPC_NAME="novatlantis-vpc"
SUBNET_NAME="novatlantis-us-central1"
PSA_RANGE_NAME="novatlantis-alloydb-psa"
ALLOYDB_CLUSTER="novatlantis-sovereign-cluster"
ALLOYDB_INSTANCE="novatlantis-primary-01"
ALLOYDB_PASS="NovatlantisSovereignDB2026!"

log_info() {
  printf "\033[1;34m[NOVATLANTIS-INFRA]\033[0m %s\n" "$1"
}

log_ok() {
  printf "\033[1;32m[OK]\033[0m %s\n" "$1"
}

# ------------------------------------------------------------------------------
# 1. REDE VPC SOBERANA & PRIVATE SERVICES ACCESS PARA ALLOYDB
# ------------------------------------------------------------------------------
log_info "1. Configurando VPC Soberana (${VPC_NAME}) para AlloyDB e Dataflow..."
if ! gcloud compute networks describe "${VPC_NAME}" --project="${PROJECT_ID}" >/dev/null 2>&1; then
  gcloud compute networks create "${VPC_NAME}" \
    --project="${PROJECT_ID}" \
    --subnet-mode=custom \
    --bgp-routing-mode=regional \
    --quiet
fi

if ! gcloud compute networks subnets describe "${SUBNET_NAME}" --region="${REGION}" --project="${PROJECT_ID}" >/dev/null 2>&1; then
  gcloud compute networks subnets create "${SUBNET_NAME}" \
    --project="${PROJECT_ID}" \
    --network="${VPC_NAME}" \
    --region="${REGION}" \
    --range="10.10.0.0/20" \
    --enable-private-ip-google-access \
    --quiet
fi

if ! gcloud compute addresses describe "${PSA_RANGE_NAME}" --global --project="${PROJECT_ID}" >/dev/null 2>&1; then
  gcloud compute addresses create "${PSA_RANGE_NAME}" \
    --global \
    --purpose=VPC_PEERING \
    --prefix-length=16 \
    --network="${VPC_NAME}" \
    --project="${PROJECT_ID}" \
    --quiet
fi

log_info "Estabelecendo VPC Peering com servicenetworking.googleapis.com para AlloyDB..."
gcloud services vpc-peerings connect \
  --service=servicenetworking.googleapis.com \
  --ranges="${PSA_RANGE_NAME}" \
  --network="${VPC_NAME}" \
  --project="${PROJECT_ID}" \
  --quiet || true

log_ok "Rede VPC ${VPC_NAME} e Private Services Access prontos."

# ------------------------------------------------------------------------------
# 2. PROVISIONAMENTO DO ALLOYDB FOR POSTGRESQL (CLUSTER + INSTÂNCIA PRIMÁRIA)
# ------------------------------------------------------------------------------
log_info "2. Provisionando Cluster AlloyDB (${ALLOYDB_CLUSTER}) em ${REGION}..."
if ! gcloud alloydb clusters describe "${ALLOYDB_CLUSTER}" --region="${REGION}" --project="${PROJECT_ID}" >/dev/null 2>&1; then
  gcloud alloydb clusters create "${ALLOYDB_CLUSTER}" \
    --project="${PROJECT_ID}" \
    --region="${REGION}" \
    --network="${VPC_NAME}" \
    --password="${ALLOYDB_PASS}" \
    --database-version=POSTGRES_15 \
    --async \
    --quiet
  log_ok "Criação do cluster AlloyDB ${ALLOYDB_CLUSTER} iniciada."
else
  log_ok "Cluster AlloyDB ${ALLOYDB_CLUSTER} já existe."
fi

# ------------------------------------------------------------------------------
# 3. GOVERNMENT DATA PLATFORM (GDP) — CLOUD STORAGE BUCKETS (CAMADAS EDP/GDP)
# ------------------------------------------------------------------------------
log_info "3. Criando Cloud Storage Buckets do Government Data Platform (GDP)..."
BUCKETS=(
  "${PREFIX}-drp-cs-0"       # Drop-off Zone (Ingestão APIs, Moodle, Eventos 311/911)
  "${PREFIX}-load-cs-0"      # Load Zone (Dataflow templates, Schemas, Views tar.gz)
  "${PREFIX}-trf-cs-0"       # Transformation Zone (Staging DLP e Transformações)
  "${PREFIX}-dwh-lnd-cs-0"   # Data Warehouse Landing (Dados Brutos Estruturados/Não-Estruturados)
  "${PREFIX}-dwh-cur-cs-0"   # Data Warehouse Curated (Dados Limpos e Agregados)
  "${PREFIX}-dwh-conf-cs-0"  # Data Warehouse Confidential (PII e Biometria NIST)
  "${PREFIX}-dwh-plg-cs-0"   # Data Warehouse Playground (Exploração Cientistas de Dados)
)

for BUCKET in "${BUCKETS[@]}"; do
  if ! gcloud storage buckets describe "gs://${BUCKET}" --project="${PROJECT_ID}" >/dev/null 2>&1; then
    gcloud storage buckets create "gs://${BUCKET}" \
      --project="${PROJECT_ID}" \
      --location="${REGION}" \
      --default-storage-class=REGIONAL \
      --uniform-bucket-level-access \
      --quiet
    log_ok "Bucket gs://${BUCKET} criado."
  else
    log_ok "Bucket gs://${BUCKET} já ativo."
  fi
done

# ------------------------------------------------------------------------------
# 4. GOVERNMENT DATA PLATFORM (GDP) — PUB/SUB DROP-OFF STREAMING
# ------------------------------------------------------------------------------
log_info "4. Criando Tópicos e Assinaturas Pub/Sub da Camada Drop-off..."
TOPIC_NAME="${PREFIX}-drp-ps-0"
SUB_NAME="${PREFIX}-drp-ps-0-sub"

if ! gcloud pubsub topics describe "${TOPIC_NAME}" --project="${PROJECT_ID}" >/dev/null 2>&1; then
  gcloud pubsub topics create "${TOPIC_NAME}" --project="${PROJECT_ID}" --quiet
fi

if ! gcloud pubsub subscriptions describe "${SUB_NAME}" --project="${PROJECT_ID}" >/dev/null 2>&1; then
  gcloud pubsub subscriptions create "${SUB_NAME}" \
    --topic="${TOPIC_NAME}" \
    --project="${PROJECT_ID}" \
    --quiet
fi
log_ok "Pub/Sub ${TOPIC_NAME} configurado."

# ------------------------------------------------------------------------------
# 5. SERVICE ACCOUNTS DO GOVERNMENT DATA PLATFORM (LEAST PRIVILEGE IAM)
# ------------------------------------------------------------------------------
log_info "5. Provisionando Service Accounts de Governança do Government Data Platform..."
SA_LIST=(
  "gdp-drp-cs-0:GDP GCS Drop-off Service Account"
  "gdp-drp-ps-0:GDP PubSub Drop-off Service Account"
  "gdp-drp-bq-0:GDP BigQuery Drop-off Service Account"
  "gdp-load-df-0:GDP Dataflow Load Service Account"
  "gdp-trf-df-0:GDP Dataflow Transformation Service Account"
  "gdp-trf-bq-0:GDP BigQuery Transformation Service Account"
  "gdp-orc-cmp-0:GDP Orchestration Composer Service Account"
)

for SA_ENTRY in "${SA_LIST[@]}"; do
  SA_ID="${SA_ENTRY%%:*}"
  SA_DESC="${SA_ENTRY#*:}"
  if ! gcloud iam service-accounts describe "${SA_ID}@${PROJECT_ID}.iam.gserviceaccount.com" --project="${PROJECT_ID}" >/dev/null 2>&1; then
    gcloud iam service-accounts create "${SA_ID}" \
      --display-name="${SA_DESC}" \
      --project="${PROJECT_ID}" \
      --quiet
  fi
done
log_ok "Service Accounts do Government Data Platform provisionadas."

# ------------------------------------------------------------------------------
# 6. UPLOAD DE MASSA DE DADOS (100.000 CIDADÃOS PARQUET/NDJSON) E CONFIGS GDP
# ------------------------------------------------------------------------------
log_info "6. Carregando arquivos Parquet/NDJSON de 100.000 Cidadãos e configs nos buckets GDP..."
if [ -f "data-generator/output/citizens_100k.parquet" ]; then
  gcloud storage cp "data-generator/output/citizens_100k.parquet" "gs://${PREFIX}-drp-cs-0/citizens/load/citizens_100k.parquet" --project="${PROJECT_ID}" --quiet
  gcloud storage cp "data-generator/output/citizens_100k.parquet" "gs://${PREFIX}-dwh-lnd-cs-0/citizens/citizens_100k.parquet" --project="${PROJECT_ID}" --quiet
fi

log_ok "Arquivos sincronizados com os buckets do Government Data Platform."
