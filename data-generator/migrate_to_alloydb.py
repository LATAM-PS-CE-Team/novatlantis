#!/usr/bin/env python3
"""
REPÚBLICA DIGITAL DE NOVATLANTIS
Script de Migração em Massa (100.000 Cidadãos + Credenciais + Fatos) para o AlloyDB for PostgreSQL
Cluster: projects/novatlantis/locations/us-central1/clusters/novatlantis-sovereign-cluster
"""

import os
import sqlite3
import sys

ALLOYDB_HOST = os.environ.get("ALLOYDB_HOST", "127.0.0.1")
ALLOYDB_PORT = int(os.environ.get("ALLOYDB_PORT", "5432"))
ALLOYDB_USER = os.environ.get("ALLOYDB_USER", "postgres")
ALLOYDB_PASSWORD = os.environ.get("ALLOYDB_PASSWORD", "NovatlantisSovereignDB2026!")
ALLOYDB_DB = os.environ.get("ALLOYDB_DB", "postgres")

SQLITE_SOURCE = os.path.join(os.path.dirname(__file__), "../apps/landing-portal/gdf_sovereign.db")
SCHEMA_FILE = os.path.join(os.path.dirname(__file__), "sql/01_novatlantis_alloydb_schema.sql")


def migrate_to_alloydb():
    try:
        import psycopg2
        from psycopg2.extras import execute_values
    except ImportError:
        print("[AVISO] psycopg2 não instalado localmente; execute pip install psycopg2-binary no host com acesso VPC ao AlloyDB.")
        return

    print(f"[ALLOYDB] Conectando ao cluster AlloyDB em {ALLOYDB_HOST}:{ALLOYDB_PORT} ({ALLOYDB_DB})...")
    pg_conn = psycopg2.connect(
        host=ALLOYDB_HOST,
        port=ALLOYDB_PORT,
        user=ALLOYDB_USER,
        password=ALLOYDB_PASSWORD,
        dbname=ALLOYDB_DB,
        connect_timeout=10,
    )
    pg_cur = pg_conn.cursor()

    with open(SCHEMA_FILE, "r", encoding="utf-8") as f:
        pg_cur.execute(f.read())
    pg_conn.commit()
    print("[ALLOYDB] Schema DDL aplicado com sucesso.")

    sq_conn = sqlite3.connect(SQLITE_SOURCE)
    sq_cur = sq_conn.cursor()

    tables = [
        "dim_citizens",
        "user_credentials",
        "citizen_profiles",
        "postal_initial_dispatch",
        "fact_311_requests",
        "fact_911_dispatches",
        "fact_telemed_sessions",
        "fact_edu_assessments",
        "gov_iam_roles",
        "fact_audit_logs",
    ]

    for tbl in tables:
        rows = sq_cur.execute(f"SELECT * FROM {tbl}").fetchall()
        if not rows:
            continue
        cols = [d[0] for d in sq_cur.description]
        col_list = ", ".join(cols)
        insert_sql = f"INSERT INTO {tbl} ({col_list}) VALUES %s ON CONFLICT DO NOTHING"
        execute_values(pg_cur, insert_sql, rows, page_size=2500)
        pg_conn.commit()
        print(f"[ALLOYDB] Tabela {tbl}: {len(rows):,} registros migrados com sucesso.")

    sq_conn.close()
    pg_cur.close()
    pg_conn.close()
    print("[ALLOYDB] Migração completa de 100.000 cidadãos concluída!")


if __name__ == "__main__":
    migrate_to_alloydb()
