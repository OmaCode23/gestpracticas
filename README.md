# GestPrácticas — IES

Sistema de gestión de prácticas de empresa para institutos.

## Stack
- **Next.js 14** · **TypeScript** · **Tailwind CSS**
- **Prisma + PostgreSQL** (listo para conectar)
- **react-hook-form + Zod** · **SheetJS (xlsx)**

---

## Arrancar el proyecto

```bash
# 1. Instalar dependencias
npm install

# 2. Copiar variables de entorno
cp .env.example .env
# Editar .env con tu cadena de PostgreSQL

# 3. Crear tablas en la BD (cuando esté lista)
npx prisma migrate dev --name init

# 4. Arrancar en desarrollo
npm run dev
```

Abre **http://localhost:3000**

---

## Estructura

```
src/
├── app/                    # Páginas (Next.js App Router)
│   ├── page.tsx            # Inicio / Dashboard
│   ├── empresas/page.tsx
│   ├── alumnos/page.tsx
│   ├── formacion/page.tsx
│   └── importexport/page.tsx
│
├── modules/                # (Vacío — para cuando conectéis la BD)
│   ├── empresas/           # types/, actions/, components/
│   ├── alumnos/
│   ├── formacion/
│   └── importexport/
│
├── database/
│   └── prisma.ts           # Singleton PrismaClient (ya listo)
│
├── components/
│   ├── layout/Navbar.tsx
│   └── ui/                 # Badge, Button, Card, Pagination, Filters...
│
└── shared/
    └── mockData.ts         # ← DATOS DE EJEMPLO (reemplazar por API)
```

---

## Cómo añadir funcionalidad real

Cada página tiene comentarios `// TODO` que indican exactamente
qué hay que cambiar. El flujo general es:

1. **Crear la API Route** en `src/app/api/<entidad>/route.ts`
2. **Añadir las queries/mutations** en `src/modules/<entidad>/actions/`
3. **Reemplazar los datos mock** en la página por un `fetch` a la API

Los datos mock están todos en `src/shared/mockData.ts` para
que sea fácil localizarlos y sustituirlos.

---

## Scripts

```bash
npm run dev          # Desarrollo
npm run build        # Build producción
npm run db:generate  # Regenerar cliente Prisma
npm run db:migrate   # Aplicar migraciones
npm run db:studio    # UI visual de la BD
```
