# ==============================================================================
# REPÚBLICA DIGITAL DE NOVATLANTIS — INFRAESTRUTURA COMO CÓDIGO (TERRAFORM)
# Ambiente: Google Cloud Argolis | Cloud Run + Cloud Armor + IAP + Managed TLS
# ==============================================================================

terraform {
  required_version = ">= 1.6.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.30"
    }
  }
}

variable "project_id" {
  type        = string
  default     = "novatlantis"
  description = "ID do Projeto no Google Cloud Argolis"
}

variable "region" {
  type        = string
  default     = "us-central1"
  description = "Região primária dos serviços soberanos"
}

variable "domain" {
  type        = string
  default     = "novatlantis.gov.cloud"
  description = "Domínio oficial da República Digital de Novatlantis"
}

provider "google" {
  project = var.project_id
  region  = var.region
}

locals {
  microservices = toset([
    "landing-portal",
    "identity-nid",
    "services-311",
    "emergency-911",
    "health-telemed",
    "education-learn"
  ])
}

resource "google_compute_security_policy" "novatlantis_waf" {
  name        = "novatlantis-owasp-waf-policy"
  description = "Cloud Armor WAF — OWASP Top 10 & Rate Limiting da República de Novatlantis"

  rule {
    action   = "rate_based_ban"
    priority = 1000
    match {
      versioned_expr = "SRC_IPS_V1"
      config {
        src_ip_ranges = ["*"]
      }
    }
    rate_limit_options {
      conform_action = "allow"
      exceed_action  = "deny(429)"
      enforce_on_key = "IP"
      rate_limit_threshold {
        count        = 300
        interval_sec = 60
      }
      ban_duration_sec = 600
    }
    description = "Rate limiting de 300 requisições/minuto por IP"
  }

  rule {
    action   = "deny(403)"
    priority = 2001
    match {
      expr {
        expression = "evaluatePreconfiguredWaf('sqli-v33-stable') || evaluatePreconfiguredWaf('xss-v33-stable') || evaluatePreconfiguredWaf('rce-v33-stable')"
      }
    }
    description = "Mitigação OWASP Top 10 (SQLi, XSS, RCE)"
  }

  rule {
    action   = "allow"
    priority = 2147483647
    match {
      versioned_expr = "SRC_IPS_V1"
      config {
        src_ip_ranges = ["*"]
      }
    }
    description = "Regra padrão de permissão após inspeção WAF"
  }
}

resource "google_compute_managed_ssl_certificate" "novatlantis_tls" {
  name = "novatlantis-managed-ssl-cert"
  managed {
    domains = [
      var.domain,
      "portal.${var.domain}",
      "nid.${var.domain}",
      "311.${var.domain}",
      "911.${var.domain}",
      "health.${var.domain}",
      "edu.${var.domain}"
    ]
  }
}
