#!/bin/sh
set -e

echo "→ Sincronizando schema do banco..."
npx prisma db push --accept-data-loss

echo "→ Gerando Prisma Client..."
npx prisma generate

echo "→ Subindo servidor..."
exec node server.js
