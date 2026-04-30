CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'PROFESOR', 'ALUMNO');

CREATE TYPE "AuthProvider" AS ENUM ('LOCAL', 'GVA');

ALTER TABLE "usuarios"
ADD COLUMN "rol" "UserRole" NOT NULL DEFAULT 'PROFESOR',
ADD COLUMN "authProvider" "AuthProvider",
ADD COLUMN "authSubject" TEXT,
ADD COLUMN "last_login_at" TIMESTAMP(3);

CREATE UNIQUE INDEX "usuarios_authSubject_key" ON "usuarios"("authSubject");

CREATE TABLE "local_auth_accounts" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "password_hash" TEXT NOT NULL,
    "must_change_pass" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "local_auth_accounts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sessions" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "last_used_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "local_auth_accounts_usuario_id_key" ON "local_auth_accounts"("usuario_id");
CREATE UNIQUE INDEX "sessions_token_hash_key" ON "sessions"("token_hash");
CREATE INDEX "sessions_usuario_id_idx" ON "sessions"("usuario_id");
CREATE INDEX "sessions_expires_at_idx" ON "sessions"("expires_at");

ALTER TABLE "local_auth_accounts"
ADD CONSTRAINT "local_auth_accounts_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "sessions"
ADD CONSTRAINT "sessions_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
