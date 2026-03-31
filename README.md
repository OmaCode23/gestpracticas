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

```
src/
├── app/                    # Rutas, páginas y API Routes
├── components/             # Componentes compartidos de UI y layout
├── database/               # Cliente Prisma compartido
├── modules/                # Lógica por módulo
└── shared/                 # Catálogos, tipos y utilidades comunes

prisma/
├── migrations/             # Migraciones Prisma
├── schema.prisma           # Esquema de la base de datos
└── seed.ts                 # Seed explícito de catálogos base
```

## Puesta en marcha

En algunos entornos Windows, ciertos comandos pueden requerir `cmd` o `npm.cmd` en lugar de `PowerShell`/`npm` por restricciones de ejecución.

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

## Procedimiento para seed inicial de la BD con los catálogos

### Esquema

- Los cambios estructurales van en `prisma/schema.prisma`.
- Después se generan con migraciones Prisma.
- No se deben crear tablas ni columnas manualmente fuera del flujo de migraciones.

### Datos base iniciales

- Los datos base de catálogos no se cargan automáticamente al leer desde la aplicación.
- La carga inicial se hace de forma explícita con `npm.cmd run db:seed`.
- El seed usa las semillas canónicas definidas en código:
  - `CICLOS_FORMATIVOS_BASE`
  - `SECTORES`
  - `LOCALIDADES`

### Restauración desde la aplicación

- La pantalla de Configuración permite restaurar los ciclos formativos por defecto.
- Esa restauración usa `CICLOS_FORMATIVOS_BASE` como fuente canónica.
- La restauración es una acción funcional explícita; no sustituye al seed inicial del despliegue.

### Criterio acordado

- La base de datos es la fuente de verdad de los ciclos.
- `CICLOS_FORMATIVOS_BASE` se mantiene solo como semilla canónica para:
  - seed inicial
  - restauración explícita de valores por defecto
- Las lecturas normales de la aplicación no deben sembrar datos silenciosamente.

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
5. Si el cambio toca archivos comunes, documentarlo en `cambios-comunes.md`.

## Tests

- La configuración de Vitest está ajustada para funcionar en este entorno Windows usando `threads`.
- Para ejecutar tests:

```bash
npm run test
```
