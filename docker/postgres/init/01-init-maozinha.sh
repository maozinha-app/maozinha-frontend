#!/bin/sh
# Inicialização do banco Mãozinha.
# O entrypoint do Postgres só executa este script quando o volume de dados está VAZIO
# (primeira subida). Nas próximas subidas ele é ignorado e os dados são preservados.
set -eu

SCHEMA_FILE=/schema/maozinha.sql

if [ ! -f "$SCHEMA_FILE" ]; then
    echo "ERRO: $SCHEMA_FILE não encontrado." >&2
    echo "Verifique BACKEND_DIR no .env (deve apontar para o repositório maozinha-backend, que contém db/maozinha.sql)." >&2
    exit 1
fi

if [ -z "${MAOZINHA_APP_PASSWORD:-}" ]; then
    echo "ERRO: MAOZINHA_APP_PASSWORD não definida (DB_APP_PASSWORD no .env)." >&2
    exit 1
fi

echo ">> Criando roles maozinha_migrator e maozinha_app"
psql -v ON_ERROR_STOP=1 \
     --username "$POSTGRES_USER" \
     --dbname "$POSTGRES_DB" \
     -v app_password="$MAOZINHA_APP_PASSWORD" \
     -v db_name="$POSTGRES_DB" <<'EOSQL'
-- Dono do schema (sem login), conforme esperado pelo maozinha.sql
CREATE ROLE maozinha_migrator NOLOGIN;
-- Usuário da aplicação, com privilégios mínimos concedidos pelo próprio script do schema
CREATE ROLE maozinha_app LOGIN PASSWORD :'app_password';

ALTER DATABASE :"db_name" OWNER TO maozinha_migrator;
GRANT CONNECT ON DATABASE :"db_name" TO maozinha_app;
EOSQL

echo ">> Aplicando $SCHEMA_FILE como maozinha_migrator"
psql -v ON_ERROR_STOP=1 \
     --username "$POSTGRES_USER" \
     --dbname "$POSTGRES_DB" \
     -c "SET ROLE maozinha_migrator" \
     -f "$SCHEMA_FILE"

echo ">> Banco Mãozinha inicializado"
