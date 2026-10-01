# Copyright 2026 Digital Republic of Novatlantis
# AlloyDB for PostgreSQL Sovereign OLTP + Analytical Hybrid Cluster
# Integrated with the Government Data Platform (GDP)

variable "alloydb_cluster_id" {
  description = "AlloyDB cluster identifier for Novatlantis sovereign databases"
  type        = string
  default     = "novatlantis-sovereign-cluster"
}

variable "alloydb_primary_instance_id" {
  description = "AlloyDB primary instance identifier"
  type        = string
  default     = "novatlantis-primary-01"
}

resource "google_compute_network" "novatlantis_vpc" {
  project                 = "novatlantis"
  name                    = "novatlantis-vpc"
  auto_create_subnetworks = false
}

resource "google_compute_subnetwork" "novatlantis_subnet" {
  project                  = "novatlantis"
  name                     = "novatlantis-us-central1"
  ip_cidr_range            = "10.10.0.0/20"
  region                   = var.region
  network                  = google_compute_network.novatlantis_vpc.id
  private_ip_google_access = true
}

resource "google_compute_global_address" "alloydb_psa_range" {
  project       = "novatlantis"
  name          = "novatlantis-alloydb-psa"
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  prefix_length = 16
  network       = google_compute_network.novatlantis_vpc.id
}

resource "google_service_networking_connection" "alloydb_vpc_connection" {
  network                 = google_compute_network.novatlantis_vpc.id
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.alloydb_psa_range.name]
}

resource "google_alloydb_cluster" "sovereign_cluster" {
  project          = "novatlantis"
  cluster_id       = var.alloydb_cluster_id
  location         = var.region
  database_version = "POSTGRES_15"

  network_config {
    network = google_compute_network.novatlantis_vpc.id
  }

  initial_user {
    user     = "postgres"
    password = var.alloydb_initial_password
  }

  automated_backup_policy {
    location      = var.region
    backup_window = "1800s"
    enabled       = true

    weekly_schedule {
      days_of_week = ["MONDAY", "WEDNESDAY", "FRIDAY", "SUNDAY"]
      start_times {
        hours   = 2
        minutes = 0
        seconds = 0
        nanos   = 0
      }
    }
  }

  depends_on = [google_service_networking_connection.alloydb_vpc_connection]
}

resource "google_alloydb_instance" "primary_instance" {
  cluster       = google_alloydb_cluster.sovereign_cluster.name
  instance_id   = var.alloydb_primary_instance_id
  instance_type = "PRIMARY"

  machine_config {
    cpu_count = 4
  }

  database_flags = {
    "google_columnar_engine.enabled"            = "on"
    "google_columnar_engine.memory_size_in_mb"  = "4096"
    "google_ml_integration.enable_model_support" = "on"
    "password.enforce_complexity"               = "on"
  }
}
