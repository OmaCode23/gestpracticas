# GestPracticas

Sistema de gestion de practicas de empresa para institutos.

## Stack

- Next.js 14
- TypeScript
- Tailwind CSS
- Prisma + PostgreSQL
- Zod
- Vitest

## Modulos principales

- `empresas`
- `alumnos`
- `formacion`
- `profesores`
- `ofertas`
- `cursos`
- `importexport`
- `informes`
- `configuracion`
- `catalogos`
- `usuarios`
- `portal-alumno`

## Documentacion relacionada

- `sistema-login.md`: login actual, seguridad server-side y matriz de permisos.

## Resumen de acceso por rol

- `ADMIN`: usa el panel interno completo, incluida la gestion de usuarios.
- `PROFESOR`: usa el panel interno funcional, incluida la pagina de `profesores`, sin gestion de usuarios ni operaciones administrativas restringidas.
- `ALUMNO`: no usa el panel interno; su espacio funcional es `portal-alumno`.

Regla importante:

- la visibilidad en `Navbar` es solo UX;
- el acceso real debe quedar protegido en servidor por guardias de rol;
- para el panel interno no basta `requireUserSession`, porque ese helper solo valida sesion;
- el panel interno debe protegerse con `requireStaffSession`, y el portal del alumno con `requireAlumnoSession`.

## Estructura general

```text
src/
|- app/              # App Router, paginas y rutas API
|- modules/          # Logica por dominio funcional
|- components/       # UI y layout compartido
|- database/         # Prisma client y acceso a datos
`- shared/           # Catalogos base, utilidades y tipos comunes

prisma/
|- migrations/       # Migraciones versionadas
|- schema.prisma     # Esquema Prisma
|- seed.ts           # Seed base e idempotente
`- bootstrap-admin.ts

scripts/
|- dev-server.mjs    # Arranque dev con construccion automatica de env de BD
|- with-db-env.mjs   # Wrapper para Next/Prisma con DATABASE_URL y DIRECT_URL
`- container/        # Scripts de arranque para Docker
```

## Archivos de entorno

El proyecto mantiene dos plantillas:

- `.env.example`: configuracion minima y real para la instalacion normal actual.
- `.env.full.example`: configuracion ampliada con opciones avanzadas o reservadas para futuro.

Variables base habituales:

```env
APP_PORT=3005

POSTGRES_DB=gestpracticas
POSTGRES_USER=gestpracticas
POSTGRES_PASSWORD=change-this-super-long-password
POSTGRES_HOST_PORT=55432

PRISMA_CONNECTION_LIMIT=10
PRISMA_POOL_TIMEOUT=20

AUTH_COOKIE_SECURE=0
AUTH_SECRET=change-this-auth-secret
```

Notas:

- `AUTH_SECRET` es obligatoria.
- `AUTH_COOKIE_SECURE=0` es necesaria cuando la aplicacion se sirve por `HTTP`; con `HTTPS`, lo normal es usar `1` o dejarla sin definir.
- `DATABASE_URL` y `DIRECT_URL` no suelen escribirse a mano: los scripts del proyecto las construyen automaticamente a partir de `POSTGRES_*` y, si procede, `PGBOUNCER_*`.
- La autenticacion externa no forma parte del flujo normal actual. Su configuracion queda en `.env.full.example` como preparacion de futuro.

## Puesta en marcha rapida

En algunos entornos Windows, ciertos comandos pueden requerir `cmd` o `npm.cmd` en lugar de `PowerShell` o `npm`.

### Desarrollo local

```bash
# 1. Instalar dependencias
npm install

# 2. Copiar variables de entorno
Copy-Item .env.example .env

# 3. Editar .env y definir al menos:
#    - POSTGRES_PASSWORD
#    - AUTH_SECRET

# 4. Levantar solo la base de datos y PgBouncer en Docker
npm run docker:db:up

# 5. Aplicar migraciones
npm run db:migrate

# 6. Cargar catalogos y settings base
npm run db:seed

# 7. Crear el administrador inicial
npm run db:bootstrap-admin -- --email admin@edu.gva.es --password TuClaveInicial --name "Administrador"

# 8. Arrancar en desarrollo
npm run dev
```

La aplicacion quedara disponible en `http://localhost:3005` por defecto, o en el puerto indicado por `APP_PORT`.

### Administrador inicial

El login actualmente implantado es el local. Para poder entrar por primera vez:

- define `AUTH_SECRET` en `.env`;
- ejecuta `npm run db:bootstrap-admin`;
- usa un email autorizado y una contrasena inicial.

Ejemplo:

```bash
npm run db:bootstrap-admin -- --email admin@edu.gva.es --password TuClaveInicial --name "Administrador"
```

La explicacion completa del sistema de login actual y de la posible evolucion futura esta en `sistema-login.md`.

## Flujos recomendados

### Dia normal de desarrollo

```bash
npm run docker:db:up
npm run dev
```

### Primera instalacion desde cero

```bash
npm install
Copy-Item .env.example .env
npm run docker:db:up
npm run db:migrate
npm run db:seed
npm run db:bootstrap-admin -- --email admin@edu.gva.es --password TuClaveInicial --name "Administrador"
npm run dev
```

### Comprobacion final tipo produccion

```bash
npm run docker:build
npm run docker:up
```

## Docker

El flujo Docker esta pensado para ejecucion y despliegue, no como entorno principal de edicion con hot reload.

Servicios definidos en `docker-compose.yml`:

- `db`: PostgreSQL persistente con volumen propio.
- `pgbouncer`: pool de conexiones delante de PostgreSQL.
- `app`: aplicacion Next.js compilada en modo `standalone`.

Al arrancar `app`, el contenedor:

- valida variables criticas;
- espera a que la base de datos este disponible;
- ejecuta `prisma migrate deploy`;
- ejecuta `npm run db:seed`;
- arranca `server.js`.

Uso basico:

```bash
Copy-Item .env.example .env
docker compose build
docker compose up -d
docker compose down
```

Comandos equivalentes del proyecto:

```bash
npm run docker:build
npm run docker:up
npm run docker:db:up
npm run docker:down
```

## Scripts disponibles

```bash
npm run dev               # Desarrollo con wrapper de env y puerto por defecto 3005
npm run dev:next          # Next dev sin wrapper del proyecto
npm run build             # Build de produccion
npm run start             # Servidor de produccion
npm run start:standalone  # Arranque explicito de la salida standalone
npm run docker:build      # Build de Docker Compose
npm run docker:up         # App + db + pgbouncer
npm run docker:db:up      # Solo db + pgbouncer
npm run docker:down       # Parar contenedores
npm run test              # Vitest en modo run
npm run test:watch        # Vitest en watch
npm run lint              # Lint de Next.js
npm run db:generate       # Prisma generate
npm run db:migrate        # prisma migrate dev
npm run db:migrate:deploy # prisma migrate deploy
npm run db:seed           # Seed base e idempotente
npm run db:bootstrap-admin
npm run db:push
npm run db:studio
npm run package:prod
```

## Catalogos, seed y datos base

### Criterio general

- La base de datos es la fuente de verdad de los catalogos maestros.
- La aplicacion debe leer los catalogos desde BD, no desde listas estaticas en tiempo de ejecucion.
- Los catalogos estaticos de `src/shared/catalogs/*` se mantienen como semillas canonicas para el `seed` inicial y para restauraciones explicitas.

### Que hace `npm run db:seed`

El seed actual es idempotente y se usa para:

- sectores
- localidades
- ciclos formativos
- proveedores y areas de cursos externos
- settings base del sistema

No debe asumirse que el seed sustituye a la lectura normal desde BD: solo garantiza que existan los datos base esperados.

### Restauracion de catalogos base

- Si una pantalla de administracion ofrece restaurar catalogos base, esa restauracion debe ser una accion funcional explicita.
- Esa restauracion no sustituye al seed inicial del despliegue.

## Reglas funcionales destacadas

### Configuracion y catalogos

- No debe poder editarse ni borrarse un sector o ciclo que este en uso.
- No debe poder editarse ni borrarse un ciclo base.
- Al restaurar valores por defecto, se reactivan o recrean los catalogos base y solo se eliminan personalizados que no esten en uso.
- Desactivar un sector o un ciclo impide usarlo en registros nuevos, pero no invalida los existentes.
- Debe impedirse una configuracion de cursos que invalide registros actuales.

### Modo historico

Por defecto, los listados de `alumnos` y `formacion` muestran solo el curso academico actual.

Si en `Configuracion` se activa el modo historico:

- esos listados pasan a mostrar todos los cursos;
- se anade filtro por curso academico en ambos listados.

### Portal del alumno

- `Ofertas`, `Empresas` y `Cursos` del `portal-alumno` se muestran como informacion general del portal, no como vistas personalizadas salvo los bloques especificos del alumno autenticado.
- `Empresas compatibles` muestra actualmente hasta 12 empresas iniciales.
- La pagina `Empresas` del portal muestra hasta 24 empresas iniciales y carga 12 adicionales por pulsacion si existen mas resultados.

## Produccion sin Docker

Antes de preparar el despliegue actual con Docker, el proyecto incorporo una via de entrega basada en un paquete de produccion independiente. Esa via sigue existiendo como alternativa historica para ejecutar la aplicacion fuera de Docker.

Para generarlo:

```bash
npm run build
npm run package:prod
```

El resultado se genera en `dist-prod/` e incluye:

- la aplicacion Next.js compilada en modo `standalone`;
- los archivos estaticos necesarios para ejecucion;
- `package.json`;
- `.env`, si existe en la raiz al generar el paquete;
- `gestpracticas_prod.backup`, si existe en la raiz.

Requisitos del equipo destino:

- Node.js >= 18.17.0, recomendado Node.js 20 LTS o superior;
- PostgreSQL.

Uso previsto del paquete:

1. Crear manualmente la base de datos de destino, por ejemplo `gestpracticas_prod`, y restaurar en ella el backup si el paquete lo incluye.
2. Ajustar el `.env` del paquete si hace falta. Si usas `DATABASE_URL`, debe apuntar a la base de datos correcta. Si la aplicacion se sirve por `HTTP`, define `AUTH_COOKIE_SECURE=0`; si se sirve por `HTTPS`, usa `AUTH_COOKIE_SECURE=1` o deja la variable sin definir.
3. Arrancar desde `dist-prod/` con:

```bash
node server.js
```

La aplicacion quedara disponible en el puerto configurado para el servidor standalone, normalmente `3005` en este proyecto si se mantiene la configuracion actual.

## Procedimiento recomendado al cambiar el esquema

1. Editar `prisma/schema.prisma`.
2. Ejecutar `npm run db:migrate`.
3. Revisar la migracion generada en `prisma/migrations/`.
4. Si el cambio afecta a catalogos base, revisar tambien `prisma/seed.ts`.
5. Si el cambio afecta a comportamiento comun, documentarlo en `cambios-comunes.md`.

## Tests

La suite actual combina tests de:

- permisos
- guards server-side
- middleware
- handlers API
- paginas servidor criticas de acceso

Comandos:

```bash
npm run test
npm run test:watch
```

Pruebas recomendadas a futuro:

- tests end-to-end con Playwright u otra herramienta equivalente;
- pruebas sobre la aplicacion ya compilada, no solo sobre handlers o funciones aisladas;
- recorridos de formularios, tablas, filtros, toasts y navegacion real.

## Warnings observados

- En algunos `npm run build` aparece el warning de webpack `Caching failed for pack: Error: Unable to snapshot resolve dependencies`. Puede deberse al cache de filesystem de webpack/Next.js en este entorno Windows y no implica por si mismo un fallo funcional.
- En builds de produccion puede aparecer el warning de Next.js sobre `sharp` ausente para `Image Optimization`. Es un warning de rendimiento, no un bloqueo de compilacion.

## Codificacion de caracteres

En este proyecto se han visto problemas frecuentes de codificacion, especialmente visibles en acentos.

Recomendaciones de trabajo:

- guardar siempre codigo y documentacion en `UTF-8`;
- preferir `UTF-8` sin BOM;
- no convertir archivos a `ANSI`, `Windows-1252` o codificaciones locales similares;
- si un archivo se ve bien en VS Code pero mal en la terminal, comprobar primero la terminal antes de tocar el archivo;
- evitar re-guardar archivos fuente desde scripts o comandos que usen codificaciones heredadas por defecto;
- mantener `LF` como final de linea del repositorio.

Configuracion util de VS Code:

```json
"files.encoding": "utf8",
"files.autoGuessEncoding": true,
"files.insertFinalNewline": true
```

## HTTPS y cookies de sesion

En produccion, la opcion recomendada a largo plazo es servir la aplicacion por `HTTPS` y mantener las cookies de sesion como `Secure`.

- `AUTH_COOKIE_SECURE=0` solo debe usarse cuando la aplicacion se sirve por `HTTP` y el navegador no acepta la cookie de sesion marcada como segura.
- `AUTH_COOKIE_SECURE=1` o dejar la variable sin definir es lo adecuado cuando la aplicacion ya se sirve por `HTTPS`.
- La solucion mas solida es poner la aplicacion detras de un `reverse proxy` con `HTTPS`.

## Configuracion avanzada y futura ampliacion

La instalacion estandar del proyecto parte de `.env.example`, que solo incluye las variables necesarias hoy.

- `.env.full.example` reune opciones avanzadas y reservadas para escenarios no activos por defecto, como `PgBouncer` local o una futura autenticacion externa.
- La autenticacion externa no forma parte de la puesta en marcha actual de la aplicacion. El codigo esta preparado para facilitar esa evolucion, pero esa via no esta implantada de punta a punta.
