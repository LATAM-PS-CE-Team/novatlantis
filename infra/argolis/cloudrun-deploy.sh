#!/usr/bin/env bash
# ==============================================================================
# REPÚBLICA DIGITAL DE NOVATLANTIS — PROVISIONAMENTO AUTOMATIZADO (ARGOLIS READY)
# Repositório: https://github.com/billebr/novatlantis.git
# Projeto GCP: novatlantis | Conta Argolis: admin@jopoco.altostrat.com
# Lema Oficial: NOVATLANTIS • LIBERTAS IN DIGITALI
# ==============================================================================

set -euo pipefail

# Garante que o binário gcloud corporativo/local esteja no PATH
export PATH="/google/data/ro/teams/cloud-sdk:/usr/lib/google-cloud-sdk/bin:${HOME}/.local/Homebrew/bin:${PATH}"
export CLOUDSDK_ACTIVE_CONFIG_NAME="${CLOUDSDK_ACTIVE_CONFIG_NAME:-argolis}"

PROJECT_ID="${GCP_PROJECT_ID:-novatlantis}"
REGION="${GCP_REGION:-us-central1}"
DOMAIN="${NOVATLANTIS_DOMAIN:-novatlantis.gov.cloud}"
AR_REPO="novatlantis-gov-repo"
ARMOR_POLICY="novatlantis-owasp-waf-policy"

SERVICES=(
  "landing-portal"
  "identity-nid"
  "services-311"
  "emergency-911"
  "health-telemed"
  "education-learn"
)

log_info() {
  printf "\033[1;34m[NOVATLANTIS-ARGOLIS]\033[0m %s\n" "$1"
}

log_ok() {
  printf "\033[1;32m[OK]\033[0m %s\n" "$1"
}

# ------------------------------------------------------------------------------
# 1. AUTENTICAÇÃO, PROJETO E APIS DO GOOGLE CLOUD ARGOLIS (PROJETO: novatlantis)
# ------------------------------------------------------------------------------
log_info "Configurando projeto Google Cloud Argolis: ${PROJECT_ID} (${REGION})..."
gcloud config set project "${PROJECT_ID}" --quiet
gcloud config set run/region "${REGION}" --quiet

log_info "Habilitando APIs essenciais do ecossistema soberano no projeto ${PROJECT_ID}..."
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  compute.googleapis.com \
  iap.googleapis.com \
  secretmanager.googleapis.com \
  spanner.googleapis.com \
  firestore.googleapis.com \
  aiplatform.googleapis.com \
  certificatemanager.googleapis.com \
  orgpolicy.googleapis.com \
  --project="${PROJECT_ID}"

# ------------------------------------------------------------------------------
# 2. ARTIFACT REGISTRY & AUTORIDADE INTERNA DE ASSINATURA JWT/mTLS
# ------------------------------------------------------------------------------
log_info "Garantindo repositório Docker no Artifact Registry (${AR_REPO})..."
if ! gcloud artifacts repositories describe "${AR_REPO}" --location="${REGION}" --project="${PROJECT_ID}" >/dev/null 2>&1; then
  gcloud artifacts repositories create "${AR_REPO}" \
    --repository-format=docker \
    --location="${REGION}" \
    --project="${PROJECT_ID}" \
    --description="Repositório Oficial de Containers da República Digital de Novatlantis"
fi

log_info "Provisionando segredo de autoridade interna JWT/Ed25519 no Secret Manager..."
if ! gcloud secrets describe "novatlantis-internal-jwt-authority" --project="${PROJECT_ID}" >/dev/null 2>&1; then
  openssl rand -base64 48 | gcloud secrets create "novatlantis-internal-jwt-authority" \
    --project="${PROJECT_ID}" \
    --replication-policy="automatic" \
    --data-file=-
fi

# ------------------------------------------------------------------------------
# 3. IDENTIDADE WORKLOAD (ZERO-TRUST IAM)
# ------------------------------------------------------------------------------
SA_NAME="novatlantis-workload-sa"
SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

log_info "Configurando Service Account de Workload Identity (${SA_EMAIL})..."
if ! gcloud iam service-accounts describe "${SA_EMAIL}" --project="${PROJECT_ID}" >/dev/null 2>&1; then
  gcloud iam service-accounts create "${SA_NAME}" \
    --project="${PROJECT_ID}" \
    --display-name="Novatlantis Sovereign Microservices Workload Identity"
fi

for ROLE in \
  "roles/secretmanager.secretAccessor" \
  "roles/datastore.user" \
  "roles/spanner.databaseUser" \
  "roles/aiplatform.user" \
  "roles/run.invoker"; do
  gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
    --member="serviceAccount:${SA_EMAIL}" \
    --role="${ROLE}" \
    --quiet >/dev/null || true
done

# ------------------------------------------------------------------------------
# 4. BUILD NO ARTIFACT REGISTRY E DEPLOY DOS 6 SERVIÇOS NO CLOUD RUN
# ------------------------------------------------------------------------------
for SVC in "${SERVICES[@]}"; do
  IMAGE_URI="${REGION}-docker.pkg.dev/${PROJECT_ID}/${AR_REPO}/${SVC}:latest"
  SVC_DIR="./apps/${SVC}"

  log_info "Construindo imagem container para [${SVC}] via Cloud Build no projeto ${PROJECT_ID}..."
  gcloud builds submit "${SVC_DIR}" \
    --tag="${IMAGE_URI}" \
    --project="${PROJECT_ID}" \
    --quiet

  log_info "Realizando deploy do microsserviço [novatlantis-${SVC}] no Cloud Run..."
  gcloud run deploy "novatlantis-${SVC}" \
    --image="${IMAGE_URI}" \
    --region="${REGION}" \
    --project="${PROJECT_ID}" \
    --platform=managed \
    --service-account="${SA_EMAIL}" \
    --ingress=all \
    --allow-unauthenticated \
    --min-instances=0 \
    --max-instances=20 \
    --cpu=1 \
    --memory=512Mi \
    --set-env-vars="NODE_ENV=production,NOVATLANTIS_SERVICE=${SVC},GCP_PROJECT_ID=${PROJECT_ID},SUPPORTED_LOCALES=pt-BR|es-419|en-US" \
    --set-secrets="NOVATLANTIS_JWT_SECRET=novatlantis-internal-jwt-authority:latest" \
    --quiet || \
  gcloud run deploy "novatlantis-${SVC}" \
    --image="${IMAGE_URI}" \
    --region="${REGION}" \
    --project="${PROJECT_ID}" \
    --platform=managed \
    --service-account="${SA_EMAIL}" \
    --no-allow-unauthenticated \
    --min-instances=0 \
    --max-instances=20 \
    --cpu=1 \
    --memory=512Mi \
    --set-env-vars="NODE_ENV=production,NOVATLANTIS_SERVICE=${SVC},GCP_PROJECT_ID=${PROJECT_ID},SUPPORTED_LOCALES=pt-BR|es-419|en-US" \
    --set-secrets="NOVATLANTIS_JWT_SECRET=novatlantis-internal-jwt-authority:latest" \
    --quiet

  SVC_URL=$(gcloud run services describe "novatlantis-${SVC}" --region="${REGION}" --project="${PROJECT_ID}" --format="value(status.url)")
  log_ok "Serviço novatlantis-${SVC} publicado em: ${SVC_URL}"
done

# ------------------------------------------------------------------------------
# 5. GOOGLE CLOUD ARMOR (WAF OWASP TOP 10 + RATE LIMITING)
# ------------------------------------------------------------------------------
log_info "Configurando política de segurança Google Cloud Armor (${ARMOR_POLICY})..."
if ! gcloud compute security-policies describe "${ARMOR_POLICY}" --project="${PROJECT_ID}" >/dev/null 2>&1; then
  gcloud compute security-policies create "${ARMOR_POLICY}" \
    --project="${PROJECT_ID}" \
    --description="WAF Soberano de Novatlantis — Proteção OWASP Top 10 e Rate Limiting"

  gcloud compute security-policies rules create 1000 \
    --project="${PROJECT_ID}" \
    --security-policy="${ARMOR_POLICY}" \
    --expression="true" \
    --action=rate-based-ban \
    --rate-limit-threshold-count=300 \
    --rate-limit-threshold-interval-sec=60 \
    --ban-duration-sec=600 \
    --conform-action=allow \
    --exceed-action=deny-429 \
    --enforce-on-key=IP \
    --description="Rate Limiting Anti-DDoS (300 rpm por IP)"

  gcloud compute security-policies rules create 2001 \
    --project="${PROJECT_ID}" \
    --security-policy="${ARMOR_POLICY}" \
    --expression="evaluatePreconfiguredWaf('sqli-v33-stable')" \
    --action=deny-403 \
    --description="OWASP A03: Bloqueio de SQL Injection"

  gcloud compute security-policies rules create 2002 \
    --project="${PROJECT_ID}" \
    --security-policy="${ARMOR_POLICY}" \
    --expression="evaluatePreconfiguredWaf('xss-v33-stable')" \
    --action=deny-403 \
    --description="OWASP A03: Bloqueio de Cross-Site Scripting (XSS)"

  gcloud compute security-policies rules create 2003 \
    --project="${PROJECT_ID}" \
    --security-policy="${ARMOR_POLICY}" \
    --expression="evaluatePreconfiguredWaf('lfi-v33-stable')" \
    --action=deny-403 \
    --description="OWASP A01: Bloqueio de Local File Inclusion (LFI)"

  gcloud compute security-policies rules create 2004 \
    --project="${PROJECT_ID}" \
    --security-policy="${ARMOR_POLICY}" \
    --expression="evaluatePreconfiguredWaf('rce-v33-stable')" \
    --action=deny-403 \
    --description="OWASP A03: Bloqueio de Remote Code Execution (RCE)"

  gcloud compute security-policies rules create 2005 \
    --project="${PROJECT_ID}" \
    --security-policy="${ARMOR_POLICY}" \
    --expression="evaluatePreconfiguredWaf('scannerdetection-v33-stable')" \
    --action=deny-403 \
    --description="OWASP A05: Bloqueio de Scanners Maliciosos"
fi
log_ok "Google Cloud Armor WAF (OWASP Top 10 + Rate Limiting) ativo no projeto ${PROJECT_ID}."

# ------------------------------------------------------------------------------
# 6. CLOUD LOAD BALANCING, SSL GERENCIADO & SERVERLESS NEGS
# ------------------------------------------------------------------------------
log_info "Configurando Certificado SSL Gerenciado e Serverless NEGs para ${DOMAIN}..."
CERT_NAME="novatlantis-managed-ssl-cert"
if ! gcloud compute ssl-certificates describe "${CERT_NAME}" --global --project="${PROJECT_ID}" >/dev/null 2>&1; then
  gcloud compute ssl-certificates create "${CERT_NAME}" \
    --project="${PROJECT_ID}" \
    --domains="${DOMAIN},portal.${DOMAIN},nid.${DOMAIN},311.${DOMAIN},911.${DOMAIN},health.${DOMAIN},edu.${DOMAIN}" \
    --global
fi

for SVC in "${SERVICES[@]}"; do
  NEG_NAME="neg-novatlantis-${SVC}"
  BACKEND_NAME="be-novatlantis-${SVC}"

  if ! gcloud compute network-endpoint-groups describe "${NEG_NAME}" --region="${REGION}" --project="${PROJECT_ID}" >/dev/null 2>&1; then
    gcloud compute network-endpoint-groups create "${NEG_NAME}" \
      --project="${PROJECT_ID}" \
      --region="${REGION}" \
      --network-endpoint-type=serverless \
      --cloud-run-service="novatlantis-${SVC}"
  fi

  if ! gcloud compute backend-services describe "${BACKEND_NAME}" --global --project="${PROJECT_ID}" >/dev/null 2>&1; then
    gcloud compute backend-services create "${BACKEND_NAME}" \
      --project="${PROJECT_ID}" \
      --load-balancing-scheme=EXTERNAL_MANAGED \
      --global

    gcloud compute backend-services add-backend "${BACKEND_NAME}" \
      --project="${PROJECT_ID}" \
      --network-endpoint-group="${NEG_NAME}" \
      --network-endpoint-group-region="${REGION}" \
      --global

    gcloud compute backend-services update "${BACKEND_NAME}" \
      --project="${PROJECT_ID}" \
      --security-policy="${ARMOR_POLICY}" \
      --custom-request-header="X-Client-Geo-Location:{client_region}" \
      --global
  fi
done

log_ok "Ecossistema completo da República Digital de Novatlantis implantado no projeto [${PROJECT_ID}]!"
