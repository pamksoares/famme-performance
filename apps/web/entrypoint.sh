#!/bin/sh
set -e

echo "→ Rodando migrations do banco..."
npx prisma migrate deploy

echo "→ Subindo servidor..."
exec node server.js
