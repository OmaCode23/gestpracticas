# GestPracticas

Sistema de gestión de prácticas de empresa para institutos.

## Stack

- Next.js 14
- TypeScript
- Tailwind CSS
- Prisma + PostgreSQL
- Zod
- Vitest

## Módulos

- `empresas`
- `alumnos`
- `formacion`
- `importexport`
- `informes`
- `configuracion`
- `catalogos`
- `settings`

## Documentacion funcional relevante

- `sistema-login.md`: decisiones de arquitectura del login, modos de autenticacion, bootstrap del administrador, medidas de seguridad en servidor y visibilidad/acceso por rol.

## Resumen de acceso por rol

- `ADMIN`: usa el panel interno completo, incluida la gestion de usuarios.
- `PROFESOR`: usa el panel interno funcional, sin gestion de usuarios ni operaciones administrativas restringidas.
- `ALUMNO`: no usa el panel interno; su espacio funcional es `portal-alumno`.

Regla importante:

- la visibilidad en `Navbar` es solo UX;
- el acceso real debe quedar protegido en servidor por guardias de rol;
- para el panel interno no basta `requireUserSession`, porque ese helper solo valida sesion y no distingue por si mismo entre `PROFESOR` y `ALUMNO`;
- el panel interno debe protegerse con `requireStaffSession`, y el portal del alumno con `requireAlumnoSession`.

## Estructura

```text
src/
├── app/                    # Páginas y API Routes (Next.js App Router)
│   ├── page.tsx            # Inicio / Dashboard
│   ├── layout.tsx          # Layout raíz de la aplicación
│   ├── globals.css         # Estilos globales
│   │
│   ├── empresas/page.tsx
│   ├── alumnos/page.tsx
│   ├── formacion/page.tsx
│   ├── importexport/page.tsx
│   ├── informes/page.tsx
│   ├── configuracion/page.tsx
│   │
│   └── api/                # Endpoints internos
│       ├── empresas/       # [id]/route.ts, route.ts
│       ├── alumnos/
│       ├── ...
│
├── modules/                # Lógica de negocio por módulo
│   ├── empresas/           # types/, actions/, components/, fields.ts...
│   ├── alumnos/
│   ├── formacion/
│   ├── importexport/
│   ├── informes/
│   ├── configuracion/
│   ├── catalogos/
│   └── settings/
│
├── database/
│   └── prisma.ts           # Singleton PrismaClient
│
├── components/
│   ├── layout/             # Componentes de estructura compartida
│   └── ui/                 # Badge, Button, Card, Pagination, Filters...
│
└── shared/
    ├── catalogs/           # Semillas canónicas y utilidades compartidas
    └── types/              # Tipos comunes de la aplicación

prisma/
├── migrations/             # Migraciones Prisma
├── schema.prisma           # Esquema de la base de datos
└── seed.ts                 # Seed explícito de catálogos base
```

## Puesta en marcha

En algunos entornos Windows, ciertos comandos pueden requerir `cmd` o `npm.cmd` en lugar de `PowerShell` o `npm` por restricciones de ejecución.

```bash
# 1. Instalar dependencias
npm install

# 2. Copiar y configurar variables de entorno
Copy-Item .env.example .env
# Editar .env con la cadena de PostgreSQL

# 3. Aplicar migraciones
npm run db:migrate

# 4. Cargar catálogos base iniciales
npm run db:seed

# 5. Arrancar en desarrollo
npm run dev
```

La aplicación quedará disponible en `http://localhost:3000`.

## Scripts

```bash
npm run dev        # Desarrollo
npm run build      # Build de producción
npm run start      # Servidor de producción
npm run package:prod # Genera paquete de produccion en dist-prod/
npm run test       # Tests con Vitest
npm run lint       # Lint
npm run db:generate
npm run db:migrate
npm run db:seed
npm run db:push
npm run db:studio
```

## Procedimiento para seed inicial de la BD con los catálogos como seed

### Criterio general

- La base de datos es la fuente de verdad de los catálogos maestros.
- La aplicación debe leer los catálogos desde la BD, no desde catálogos estáticos en tiempo de ejecución.
- Cuando una entidad use un catálogo maestro relacionado, debe referenciarlo por su `id` y relación Prisma, no duplicar el valor como `string` salvo en procesos transitorios de migración o compatibilidad.
- Los catálogos estáticos en `src/shared/catalogs/*` se mantienen como semillas canónicas para el `seed` inicial y, solo cuando proceda, para restauraciones explícitas de valores por defecto.

### Datos base iniciales

- Los datos base de catálogos no se cargan automáticamente al leer desde la aplicación.
- La carga inicial se hace de forma explícita con `npm run db:seed`.
- El seed usa las semillas canónicas definidas en código:
  - `CICLOS_FORMATIVOS_BASE`
  - `SECTORES`
  - `LOCALIDADES`

### Restauración de valores por defecto

- Si una pantalla de administración ofrece restaurar catálogos base, esa restauración debe ser una acción funcional explícita.
- Esa restauración no sustituye al seed inicial del despliegue.
- La restauración debe apoyarse en las semillas canónicas definidas en código solo como fuente de reposición controlada.

### Regla de arquitectura

- Lectura normal de catálogos: desde la BD.
- Relaciones entre entidades y catálogos: por `id`.
- Catálogos estáticos: solo para `seed` inicial y restauraciones explícitas.
- No se deben sembrar datos silenciosamente al arrancar ni durante lecturas normales de la aplicación.

## Política de protección al editar un curso, ciclo, sector, etc, en la página de Configuración

Un curso, ciclo, sector, etc, en uso, es uno cuyo valor o id aparece referenciado en algún registro de la BD.<br>
Un ciclo o sector base es uno de los que tiene la aplicación inicialmente, o tras restaurar a los valores por defecto.

- La edición y el borrado se impedirá para un sector o ciclo que ya está en uso.
- La edición y el borrado se impedirá para un ciclo base (para impedir una situación en la que puedan resultar dos ciclos con el mismo código).
- Al darle al botón de restaurar a valores por defecto, se reactivan o recrean los sectores o ciclos base, y se eliminan los sectores o ciclos personalizados salvo los que estén en uso. Si un sector base había sido editado dando lugar a uno personalizado, y el personalizado fue usado, tras la restauración quedarán tanto el personalizado como el base (no ocurre con los ciclos).
- Desactivar un sector o un ciclo hará que no aparezca en formularios que permitan usarlos en un nuevo registro, y sin embargo seguirán siendo válidos en los registros existentes.
- Se impedirá cambiar la configuración de cursos ("2025-2026", ...), si la nueva configuración ocasiona que se invalide algún registro actual de la BD.

## Modo histórico

Por defecto, los listados de las páginas de `alumnos` y `formacion` solo muestran los registros del curso académico actual.

Si en la página de `Configuración` se activa el modo histórico, esos listados pasan a mostrar todos los registros de todos los cursos.

Al activar el modo histórico, además se añade en ambos listados un filtro que permite filtrar por curso académico.

El "filtrado" que muestra solo el curso actual o todos los cursos, solo aplica en las tablas de las páginas de alumnos y de formaciones, no en los formularios u otras páginas.

## Procedimiento recomendado al desplegar o preparar un entorno nuevo

```bash
npm install
npm run db:migrate
npm run db:seed
npm run build
npm run start
```

## Docker

El proyecto mantiene un unico flujo Docker pensado para ejecucion/despliegue.

El contenedor de aplicacion:

- aplica `prisma migrate deploy`;
- ejecuta `npm run db:seed` con el seed actual del proyecto;
- arranca la build `standalone` de Next.js.

Uso basico:

```bash
Copy-Item .env.example .env
docker compose build
docker compose up -d
```

Tambien puedes usar:

```bash
npm run docker:build
npm run docker:up
npm run docker:down
```

## Preparacion de paquete de produccion (tipo de despliegue anterior a Docker)

Para generar una carpeta separada con la aplicacion compilada para ejecucion:

```bash
npm run build
npm run package:prod
```

El resultado se genera en `dist-prod/`.

Ese paquete:

- esta pensado para ejecucion y despliegue, no para continuar el desarrollo;
- mantiene intacto el codigo fuente del proyecto original;
- incluye la salida `standalone` de Next.js y los archivos minimos necesarios para arrancar la aplicacion.
- copia el `.env` que exista en la raiz del proyecto en el momento de generar el paquete;
- copia `package.json`;
- copia `README-produccion.txt`;
- copia tambien un backup de PostgreSQL si en la raiz existe `gestpracticas_prod.backup` o, por compatibilidad, `gestpracticas_demo.backup`;
- si existe carpeta `public/`, tambien la incluye.


Para ejecutarlo en el equipo de destino, dentro de `dist-prod/` bastaria con ajustar `.env` y lanzar:

```bash
node server.js
```

## Procedimiento recomendado cuando se cambie el esquema

1. Editar `prisma/schema.prisma`.
2. Ejecutar `npm run db:migrate`.
3. Revisar la migración generada en `prisma/migrations/`.
4. Si el cambio afecta a catálogos base, revisar también `prisma/seed.ts`.
5. Si el cambio afecta a la estrategia de catálogos maestros, revisar que la aplicación siga leyendo desde BD y no desde catálogos estáticos.
6. Si el cambio toca archivos comunes, documentarlo en `cambios-comunes.md`.

## Codificación de caracteres

En archivos de este proyecto se han visto problemas frecuentes de codificación de caracteres especialmente visibles en los acentos.

La causa mas probable es una mezcla de codificaciones al editar o guardar archivos:

- Archivo guardado originalmente en `UTF-8`.
- Edicion posterior desde una herramienta o terminal que interpreta o re-guarda en `ANSI` / `Windows-1252`.
- Reapertura posterior como `UTF-8`, lo que produce mojibake en cadenas con tildes y otros caracteres no ASCII.

Recomendacion de trabajo para el equipo:

- Guardar siempre los archivos de codigo y documentacion en `UTF-8`.
- No convertir archivos a `ANSI`, `Western`, `Windows-1252` ni codificaciones locales similares.
- Si un archivo ya muestra texto roto, corregir la cadena visible y volver a guardar el archivo completo en `UTF-8`.
- Tener especial cuidado en Windows al editar desde distintas herramientas sobre el mismo archivo.

Estandar recomendado para este repo:

- `TypeScript`, `TSX`, `JavaScript`, `JSON`, `CSS`, `MD` y `Prisma`: `UTF-8`.
- Mantener una unica codificacion en todo el repositorio para evitar corrupciones silenciosas en merges, revisiones y copias entre terminal, editor y git.

## Tests

- La suite actual combina tests de permisos, guards server-side, middleware, handlers API y algunas paginas servidor criticas de acceso.
- Los tests de rutas API que mockean `ensureApiUser` o `ensureApiAdmin` validan el handler una vez aplicada la auth, pero no sustituyen a las pruebas especificas de la matriz de roles.

- La configuración de Vitest está ajustada para funcionar en este entorno Windows usando `threads`.

```bash
npm run test
```

## Pruebas recomendadas a añadir

Las pruebas actuales con `Vitest` son utiles para validar logica, handlers y reglas de negocio sobre el codigo fuente, pero no cubren por si solas el comportamiento de la aplicacion ya compilada ni la interfaz funcionando en el navegador.

Para ir mas alla de ese nivel, se recomienda añadir pruebas end-to-end con una herramienta como `Playwright`.

Objetivos de esas pruebas:

- arrancar la aplicacion en ejecucion real y recorrerla como usuario
- comprobar formularios, tablas, filtros, toasts y navegacion
- detectar diferencias entre `npm run dev` y la aplicacion compilada tras `npm run build`
- validar llamadas `GET`, `POST`, `PUT`, `PATCH` y `DELETE` desde la interfaz real
- detectar errores de produccion que no aparecen al probar solo handlers o funciones aisladas
