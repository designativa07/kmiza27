-- Script para adicionar o status 'to_confirm' ao enum match_status
-- Execute este script diretamente no PostgreSQL se a migração falhar

-- Verificar o enum atual
SELECT enumlabel FROM pg_enum WHERE enumtypid = (
    SELECT oid FROM pg_type WHERE typname = 'match_status'
);

-- Adicionar o novo valor ao enum
ALTER TYPE "public"."match_status" ADD VALUE 'to_confirm';

-- Verificar se foi adicionado
SELECT enumlabel FROM pg_enum WHERE enumtypid = (
    SELECT oid FROM pg_type WHERE typname = 'match_status'
) ORDER BY enumsortorder;
