# GestPracticas

Sistema de gestión de prácticas de empresa para institutos.

## Stack

- Next.js 14
- TypeScript
- Tailwind CSS
- Prisma + PostgreSQL
- Zod
- Vitest

## Módulos principales

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

## Documentación relacionada

- `sistema-login.md`: login actual, seguridad server-side y matriz de permisos.

## Resumen de acceso por rol

- `ADMIN`: usa el panel interno completo, incluida la gestión de usuarios.
- `PROFESOR`: usa el panel interno funcional, incluida la página de `profesores`, sin gestión de usuarios ni operaciones administrativas restringidas.
- `ALUMNO`: no usa el panel interno; su espacio funcional es `portal-alumno`.

Regla importante:

- la visibilidad en `Navbar` es solo UX;
- el acceso real debe quedar protegido en servidor por guardias de rol;
- para el panel interno no basta `requireUserSession`, porque ese helper solo valida sesión;
- el panel interno debe protegerse con `requireStaffSession`, y el portal del alumno con `requireAlumnoSession`.

## Estructura general

```text
src/
|- app/              # App Router, páginas y rutas API
|- modules/          # Lógica por dominio funcional
|- components/       # UI y layout compartido
|- database/         # Prisma client y acceso a datos
`- shared/           # Catálogos base, utilidades y tipos comunes

prisma/
|- migrations/       # Migraciones versionadas
|- schema.prisma     # Esquema Prisma
|- seed.ts           # Seed base e idempotente
`- bootstrap-admin.ts

scripts/
|- dev-server.mjs    # Arranque dev con construcción automática de env de BD
|- with-db-env.mjs   # Wrapper para Next/Prisma con DATABASE_URL y DIRECT_URL
`- container/        # Scripts de arranque para Docker
```

## Archivos de entorno

El proyecto mantiene dos plantillas:

- `.env.example`: configuración mínima y real para la instalación normal actual.
- `.env.full.example`: configuración ampliada con opciones avanzadas o reservadas para futuro.

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
- `AUTH_COOKIE_SECURE=0` es necesaria cuando la aplicación se sirve por `HTTP`; con `HTTPS`, lo normal es usar `1` o dejarla sin definir.
- `DATABASE_URL` y `DIRECT_URL` no suelen escribirse a mano: los scripts del proyecto las construyen automáticamente a partir de `POSTGRES_*` y, si procede, `PGBOUNCER_*`.
- La autenticación externa no forma parte del flujo normal actual. Su configuración queda en `.env.full.example` como preparación de futuro.

## Flujo en desarrollo

### Puesta en marcha en desarrollo

En algunos entornos Windows, ciertos comandos pueden requerir `cmd` o `npm.cmd` en lugar de `PowerShell` o `npm`.

Si vas a usar los comandos Docker del proyecto, asegúrate antes de tener Docker Desktop, o el servicio de Docker equivalente, instalado y en ejecución.

```bash
# 1. Instalar dependencias
npm install

# 2. Copiar variables de entorno
Copy-Item .env.example .env

# 3. Editar .env y definir al menos:
#    - POSTGRES_PASSWORD
#    - AUTH_SECRET

# 4. Levantar solo PostgreSQL y PgBouncer en Docker
npm run docker:db:up

# 5. Aplicar migraciones
npm run db:migrate

# 6. Regenerar el cliente Prisma local
npm run db:generate

# 7. Cargar catálogos y settings base
npm run db:seed

# 8. Crear el administrador inicial
npm run db:bootstrap-admin -- --email admin@edu.gva.es --password TuClaveInicial --name "Administrador"
```

Para bajar los contenedores PostgreSQL y PgBouncer al terminar:
```bash
npm run docker:db:down
```

### Arranque en día normal de desarrollo

```bash
# Levantar solo PostgreSQL y PgBouncer en Docker
npm run docker:db:up

# Arrancar la aplicación en desarrollo
npm run dev
```

La aplicación quedará disponible en `http://localhost:3005` por defecto, o en el puerto indicado por `APP_PORT`.

Para bajar los contenedores PostgreSQL y PgBouncer al terminar:

```bash
npm run docker:db:down
```

Nota recomendada de trabajo:

En desarrollo, la forma habitual de trabajo es ejecutar la aplicación en local con `npm run dev` y ejecutar PostgreSQL en contenedor;
este enfoque mantiene el hot reload y la depuración cómodos, pero su ventaja principal es que hace el entorno más reproducible, reduce diferencias entre equipos y acerca la base de datos al entorno de producción definitivo.

### Cuando cambia el esquema

1. Editar `prisma/schema.prisma`.
2. Ejecutar `npm run db:migrate`.
3. Ejecutar `npm run db:generate`.
4. Reiniciar el servidor de desarrollo si estaba arrancado.
5. Revisar la migración generada en `prisma/migrations/`.
6. Si el cambio afecta a catálogos base, revisar también `prisma/seed.ts`.

## Flujo en producción

### Puesta en marcha en producción con Docker

Este flujo está pensado para despliegue o validación tipo producción. En este caso no hace falta ejecutar `npm install`, `npm run db:migrate`, `npm run db:generate` ni `npm run db:seed` manualmente en el host: la instalación de dependencias y la generación del cliente Prisma quedan integradas en el build de la imagen, y las migraciones junto con el seed se ejecutan automáticamente al arrancar el contenedor `app`.

```bash
# 1. Construir la imagen de la aplicación, instalar dependencias y generar el cliente Prisma dentro del proceso de build
npm run docker:build

# 2. Levantar los contenedores (`db`, `pgbouncer` y `app`); al arrancar `app`, el contenedor aplica las migraciones pendientes y ejecuta el seed automáticamente
npm run docker:up

# 3. La primera vez, crear el administrador inicial
npm run db:bootstrap-admin -- --email admin@edu.gva.es --password TuClaveInicial --name "Administrador"

# 4. Bajar los contenedores
npm run docker:down
```


### Arranque en producción

Subir los contenedores con:
`npm run docker:up`

Cuando se necesite, bajar los contenedores con:
`npm run docker:down`


## Administrador inicial

Para poder acceder a la aplicación, hace falta que exista al menos un usuario administrador con el cual entrar por primera vez, y poder crear o activar otras cuentas de usuario. Para ello ejecutar el script incluido y anotado en los procedimientos anteriores:

```bash
npm run db:bootstrap-admin -- --email admin@edu.gva.es --password TuClaveInicial --name "Administrador"
```

La explicación completa del sistema de login actual y de la posible evolución futura está en `sistema-login.md`.

## Docker

El flujo Docker está pensado para ejecución y despliegue, no como entorno principal de edición con hot reload.

Servicios definidos en `docker-compose.yml`:

- `db`: PostgreSQL persistente con volumen propio.
- `pgbouncer`: pool de conexiones delante de PostgreSQL.
- `app`: aplicación Next.js compilada en modo `standalone`.

Al arrancar `app`, el contenedor:

- valida variables críticas;
- espera a que la base de datos este disponible;
- ejecuta `prisma migrate deploy`;
- ejecuta `npm run db:seed`;
- arranca `server.js`.

Uso básico:

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
npm run docker:down
```

Para desarrollo diario, si solo quieres levantar la base de datos y PgBouncer:

```bash
npm run docker:db:up
npm run docker:db:down
```

### Requisitos

- Tener Docker Desktop instalado, o disponer del servicio de Docker equivalente en el equipo.
- Tener el servicio Docker en ejecución antes de lanzar comandos `docker compose` o `npm run docker:*`.

## Scripts disponibles

```bash
npm run dev               # Desarrollo con wrapper de env y puerto por defecto 3005
npm run dev:next          # Next dev sin wrapper del proyecto
npm run build             # Build de producción
npm run start             # Servidor de producción
npm run start:standalone  # Arranque explícito de la salida standalone
npm run docker:build      # Build de Docker Compose
npm run docker:up         # App + db + pgbouncer
npm run docker:db:up      # Solo db + pgbouncer
npm run docker:db:down    # Parar solo db + pgbouncer
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

## Catálogos, seed y datos base

### Criterio general

- La base de datos es la fuente de verdad de los catálogos maestros.
- La aplicación debe leer los catálogos desde BD, no desde listas estáticas en tiempo de ejecución.
- Los catálogos estáticos de `src/shared/catalogs/*` se mantienen como semillas canónicas para el `seed` inicial y para restauraciones explícitas.

### Qué hace `npm run db:seed`

El seed actual es idempotente y se usa para:

- sectores
- localidades
- ciclos formativos
- proveedores y areas de cursos externos
- settings base del sistema

No debe asumirse que el seed sustituye a la lectura normal desde BD: solo garantiza que existan los datos base esperados.

### Restauración de catálogos base

- Si una pantalla de administración ofrece restaurar catálogos base, esa restauración debe ser una acción funcional explícita.
- Esa restauración no sustituye al seed inicial del despliegue.

## Reglas funcionales destacadas

### Configuración y catálogos

- No debe poder editarse ni borrarse un sector o ciclo que este en uso.
- No debe poder editarse ni borrarse un ciclo base.
- Al restaurar valores por defecto, se reactivan o recrean los catálogos base y solo se eliminan personalizados que no estén en uso.
- Desactivar un sector o un ciclo impide usarlo en registros nuevos, pero no invalida los existentes.
- Debe impedirse una configuración de cursos que invalide registros actuales.

### Modo histórico

Por defecto, los listados de `alumnos` y `formacion` muestran solo el curso académico actual.

Si en `Configuración` se activa el modo histórico:

- esos listados pasan a mostrar todos los cursos;
- se añade filtro por curso académico en ambos listados.

### Portal del alumno

- `Ofertas`, `Empresas` y `Cursos` del `portal-alumno` se muestran como información general del portal, no como vistas personalizadas salvo los bloques específicos del alumno autenticado.
- `Empresas compatibles` muestra actualmente hasta 12 empresas iniciales.
- La página `Empresas` del portal muestra hasta 24 empresas iniciales y carga 12 adicionales por pulsación si existen más resultados.

## Producción sin Docker

Antes de preparar el despliegue actual con Docker, el proyecto incorporó una vía de entrega basada en un paquete de producción independiente. Esa vía sigue existiendo como alternativa histórica para ejecutar la aplicación fuera de Docker.

Para generarlo:

```bash
npm run build
npm run package:prod
```

El resultado se genera en `dist-prod/` e incluye:

- la aplicación Next.js compilada en modo `standalone`;
- los archivos estáticos necesarios para ejecución;
- `package.json`;
- `.env`, si existe en la raiz al generar el paquete;
- `gestpracticas_prod.backup`, si existe en la raíz.

Requisitos del equipo destino:

- Node.js >= 18.17.0, recomendado Node.js 20 LTS o superior;
- PostgreSQL.

Uso previsto del paquete:

1. Crear manualmente la base de datos de destino, por ejemplo `gestpracticas_prod`, y restaurar en ella el backup si el paquete lo incluye.
2. Ajustar el `.env` del paquete si hace falta. Si usas `DATABASE_URL`, debe apuntar a la base de datos correcta. Si la aplicación se sirve por `HTTP`, define `AUTH_COOKIE_SECURE=0`; si se sirve por `HTTPS`, usa `AUTH_COOKIE_SECURE=1` o deja la variable sin definir.
3. Arrancar desde `dist-prod/` con:

```bash
node server.js
```

La aplicación quedará disponible en el puerto configurado para el servidor standalone, normalmente `3005` en este proyecto si se mantiene la configuración actual.


## Tests

La suite actual combina tests de:

- permisos
- guards server-side
- middleware
- handlers API
- páginas servidor críticas de acceso

Comandos:

```bash
npm run test
npm run test:watch
```

Pruebas recomendadas a futuro:

- tests end-to-end con Playwright u otra herramienta equivalente;
- pruebas sobre la aplicación ya compilada, no solo sobre handlers o funciones aisladas;
- recorridos de formularios, tablas, filtros, toasts y navegación real.

## Warnings observados

- En algunos `npm run build` aparece el warning de webpack `Caching failed for pack: Error: Unable to snapshot resolve dependencies`. Puede deberse al cache de filesystem de webpack/Next.js en este entorno Windows y no implica por si mismo un fallo funcional.
- En builds de producción puede aparecer el warning de Next.js sobre `sharp` ausente para `Image Optimization`. Es un warning de rendimiento, no un bloqueo de compilación.

## Codificación de caracteres

En este proyecto se han visto problemas frecuentes de codificación, especialmente visibles en acentos.

Recomendaciones de trabajo:

- guardar siempre código y documentación en `UTF-8`;
- preferir `UTF-8` sin BOM;
- no convertir archivos a `ANSI`, `Windows-1252` o codificaciones locales similares;
- si un archivo se ve bien en VS Code pero mal en la terminal, comprobar primero la terminal antes de tocar el archivo;
- evitar re-guardar archivos fuente desde scripts o comandos que usen codificaciones heredadas por defecto;
- mantener `LF` como final de linea del repositorio.

Configuración útil de VS Code:

```json
"files.encoding": "utf8",
"files.autoGuessEncoding": true,
"files.insertFinalNewline": true
```

## HTTPS y cookies de sesión

En producción, la opción recomendada a largo plazo es servir la aplicación por `HTTPS` y mantener las cookies de sesión como `Secure`.

- `AUTH_COOKIE_SECURE=0` solo debe usarse cuando la aplicación se sirve por `HTTP` y el navegador no acepta la cookie de sesión marcada como segura.
- `AUTH_COOKIE_SECURE=1` o dejar la variable sin definir es lo adecuado cuando la aplicación ya se sirve por `HTTPS`.
- La solución más sólida es poner la aplicación detrás de un `reverse proxy` con `HTTPS`.

## Configuración avanzada y futura ampliación

La instalación estándar del proyecto parte de `.env.example`, que solo incluye las variables necesarias hoy.

- `.env.full.example` reúne opciones avanzadas y reservadas para escenarios no activos por defecto, como `PgBouncer` local o una futura autenticación externa.
- La autenticación externa no forma parte de la puesta en marcha actual de la aplicación. El código está preparado para facilitar esa evolución, pero esa vía no está implantada de punta a punta.
