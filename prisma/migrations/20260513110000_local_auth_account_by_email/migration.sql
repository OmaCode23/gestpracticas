ALTER TABLE "local_auth_accounts"
ADD COLUMN "email" TEXT;

UPDATE "local_auth_accounts" AS la
SET "email" = u."email"
FROM "usuarios" AS u
WHERE la."usuario_id" = u."id";

ALTER TABLE "local_auth_accounts"
ALTER COLUMN "email" SET NOT NULL;

DROP INDEX "local_auth_accounts_usuario_id_key";

ALTER TABLE "local_auth_accounts"
DROP CONSTRAINT "local_auth_accounts_usuario_id_fkey";

ALTER TABLE "local_auth_accounts"
DROP COLUMN "usuario_id";

CREATE UNIQUE INDEX "local_auth_accounts_email_key" ON "local_auth_accounts"("email");
