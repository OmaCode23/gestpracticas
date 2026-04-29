#!/bin/sh
set -eu

node ./scripts/container/validate-env.mjs DATABASE_URL DIRECT_URL
node ./scripts/container/wait-for-url.mjs DIRECT_URL 90

if [ "${DATABASE_URL}" != "${DIRECT_URL}" ]; then
  node ./scripts/container/wait-for-url.mjs DATABASE_URL 90
fi

./node_modules/.bin/prisma migrate deploy --schema ./prisma/schema.prisma
npm run db:seed

exec node ./server.js
