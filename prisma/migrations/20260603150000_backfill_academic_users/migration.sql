WITH alumnos_normalizados AS (
  SELECT
    a.id,
    a.nombre,
    lower(trim(a.email)) AS email,
    COALESCE(
      NULLIF(
        upper(
          substring(split_part(regexp_replace(trim(a.nombre), '\s+', ' ', 'g'), ' ', 1) from 1 for 1) ||
          substring(split_part(regexp_replace(trim(a.nombre), '\s+', ' ', 'g'), ' ', 2) from 1 for 1)
        ),
        ''
      ),
      upper(substring(lower(trim(a.email)) from 1 for 2))
    ) AS iniciales
  FROM "alumnos" a
),
profesores_normalizados AS (
  SELECT
    p.id,
    p.nombre,
    lower(trim(p.email)) AS email,
    COALESCE(
      NULLIF(
        upper(
          substring(split_part(regexp_replace(trim(p.nombre), '\s+', ' ', 'g'), ' ', 1) from 1 for 1) ||
          substring(split_part(regexp_replace(trim(p.nombre), '\s+', ' ', 'g'), ' ', 2) from 1 for 1)
        ),
        ''
      ),
      upper(substring(lower(trim(p.email)) from 1 for 2))
    ) AS iniciales
  FROM "profesores" p
),
usuarios_academicos_huerfanos AS (
  SELECT u.id, u.email
  FROM "usuarios" u
  WHERE u.rol = 'ALUMNO'
    AND NOT EXISTS (
      SELECT 1
      FROM alumnos_normalizados a
      WHERE a.email = lower(trim(u.email))
    )
  UNION
  SELECT u.id, u.email
  FROM "usuarios" u
  WHERE u.rol = 'PROFESOR'
    AND NOT EXISTS (
      SELECT 1
      FROM profesores_normalizados p
      WHERE p.email = lower(trim(u.email))
    )
),
deleted_local_auth AS (
  DELETE FROM "local_auth_accounts" la
  USING usuarios_academicos_huerfanos h
  WHERE lower(trim(la.email)) = lower(trim(h.email))
  RETURNING la.id
),
deleted_usuarios AS (
  DELETE FROM "usuarios" u
  USING usuarios_academicos_huerfanos h
  WHERE u.id = h.id
  RETURNING u.id
)
UPDATE "usuarios" u
SET
  nombre = a.nombre,
  email = a.email,
  iniciales = a.iniciales,
  rol = 'ALUMNO'::"UserRole",
  "updatedAt" = NOW()
FROM alumnos_normalizados a
WHERE lower(trim(u.email)) = a.email
  AND u.rol = 'ALUMNO'::"UserRole";

WITH profesores_normalizados AS (
  SELECT
    p.id,
    p.nombre,
    lower(trim(p.email)) AS email,
    COALESCE(
      NULLIF(
        upper(
          substring(split_part(regexp_replace(trim(p.nombre), '\s+', ' ', 'g'), ' ', 1) from 1 for 1) ||
          substring(split_part(regexp_replace(trim(p.nombre), '\s+', ' ', 'g'), ' ', 2) from 1 for 1)
        ),
        ''
      ),
      upper(substring(lower(trim(p.email)) from 1 for 2))
    ) AS iniciales
  FROM "profesores" p
)
UPDATE "usuarios" u
SET
  nombre = p.nombre,
  email = p.email,
  iniciales = p.iniciales,
  rol = CASE
    WHEN u.rol = 'ADMIN'::"UserRole" THEN 'ADMIN'::"UserRole"
    ELSE 'PROFESOR'::"UserRole"
  END,
  "updatedAt" = NOW()
FROM profesores_normalizados p
WHERE lower(trim(u.email)) = p.email
  AND u.rol IN ('PROFESOR'::"UserRole", 'ADMIN'::"UserRole");

WITH alumnos_normalizados AS (
  SELECT
    a.nombre,
    lower(trim(a.email)) AS email,
    COALESCE(
      NULLIF(
        upper(
          substring(split_part(regexp_replace(trim(a.nombre), '\s+', ' ', 'g'), ' ', 1) from 1 for 1) ||
          substring(split_part(regexp_replace(trim(a.nombre), '\s+', ' ', 'g'), ' ', 2) from 1 for 1)
        ),
        ''
      ),
      upper(substring(lower(trim(a.email)) from 1 for 2))
    ) AS iniciales
  FROM "alumnos" a
)
INSERT INTO "usuarios" (
  nombre,
  email,
  iniciales,
  rol,
  activo,
  "authProvider",
  "createdAt",
  "updatedAt"
)
SELECT
  a.nombre,
  a.email,
  a.iniciales,
  'ALUMNO'::"UserRole",
  false,
  NULL,
  NOW(),
  NOW()
FROM alumnos_normalizados a
WHERE NOT EXISTS (
  SELECT 1
  FROM "usuarios" u
  WHERE lower(trim(u.email)) = a.email
);

WITH profesores_normalizados AS (
  SELECT
    p.nombre,
    lower(trim(p.email)) AS email,
    COALESCE(
      NULLIF(
        upper(
          substring(split_part(regexp_replace(trim(p.nombre), '\s+', ' ', 'g'), ' ', 1) from 1 for 1) ||
          substring(split_part(regexp_replace(trim(p.nombre), '\s+', ' ', 'g'), ' ', 2) from 1 for 1)
        ),
        ''
      ),
      upper(substring(lower(trim(p.email)) from 1 for 2))
    ) AS iniciales
  FROM "profesores" p
)
INSERT INTO "usuarios" (
  nombre,
  email,
  iniciales,
  rol,
  activo,
  "authProvider",
  "createdAt",
  "updatedAt"
)
SELECT
  p.nombre,
  p.email,
  p.iniciales,
  'PROFESOR'::"UserRole",
  false,
  NULL,
  NOW(),
  NOW()
FROM profesores_normalizados p
WHERE NOT EXISTS (
  SELECT 1
  FROM "usuarios" u
  WHERE lower(trim(u.email)) = p.email
);
