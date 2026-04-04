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

## Política de protección al editar o borrar un sector o un ciclo en la página de Configuración

- La edición se impedirá para un sector/ciclo que ya está en uso (referenciado en otra tabla);
- El borrado se impedirá para un sector/ciclo que ya está en uso (referenciado en otra tabla);
- Al darle al botón de restaurar a valores por defecto, no hace falta impedir el borrado de los que estén siendo usados porque no se borra nada, se reactivan los desactivados de los sectores/ciclos base, y se restauran los borrados de los sectores/ciclos base, mientras que los personalizados no se tocan;
si un sector/ciclo base ha sido editado, no se reconocerá como el mismo que el base, y quedarán tanto el personalizado (editado a partir del base) como el base;
- Desactivar un sector/ciclo hará que no aparezca en formularios que permitan usarlos en un nuevo registro, y sin embargo seguirán siendo válidos en los registros existentes;

## Procedimiento recomendado al desplegar o preparar un entorno nuevo

```bash
npm install
npm run db:migrate
npm run db:seed
npm run build
npm run start
```

## Procedimiento recomendado cuando se cambie el esquema

1. Editar `prisma/schema.prisma`.
2. Ejecutar `npm run db:migrate`.
3. Revisar la migración generada en `prisma/migrations/`.
4. Si el cambio afecta a catálogos base, revisar también `prisma/seed.ts`.
5. Si el cambio afecta a la estrategia de catálogos maestros, revisar que la aplicación siga leyendo desde BD y no desde catálogos estáticos.
6. Si el cambio toca archivos comunes, documentarlo en `cambios-comunes.md`.

## Codificacion de caracteres

En este proyecto ya se han visto varios casos de texto roto del tipo `GestiÃ³n`, `FormaciÃ³n` o `prÃ¡cticas`.

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

- La configuración de Vitest está ajustada para funcionar en este entorno Windows usando `threads`.

```bash
npm run test
```
