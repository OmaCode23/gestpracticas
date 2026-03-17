# GestPrácticas — IES

Sistema de gestión de prácticas de empresas.

## Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Prisma** (ORM)
- **PostgreSQL**
- **react-hook-form + Zod** (validación de formularios)
- **SheetJS (xlsx)** (importación/exportación Excel)

---

## Estructura del proyecto

```
src/
├── app/                        # Rutas de Next.js (App Router)
│   ├── api/                    # API Routes (endpoints REST)
│   │   ├── empresas/           # GET /api/empresas, POST /api/empresas
│   │   │   └── [id]/           # GET/PATCH/DELETE /api/empresas/:id
│   │   ├── alumnos/
│   │   ├── formacion/
│   │   └── exportar/[tipo]/    # GET /api/exportar/:tipo
│   ├── empresas/page.tsx       # Página Empresas (Server Component)
│   ├── alumnos/page.tsx
│   ├── formacion/page.tsx
│   ├── importexport/page.tsx
│   ├── layout.tsx              # Root layout (Navbar + globals)
│   └── globals.css
│
├── modules/                    # Lógica por funcionalidad
│   ├── empresas/
│   │   ├── types/              # Tipos TypeScript + schema Zod
│   │   ├── actions/            # queries.ts (leer BD) + mutations.ts (escribir BD)
│   │   └── components/         # EmpresaForm.tsx + EmpresasTable.tsx
│   ├── alumnos/                # Mismo patrón
│   ├── formacion/              # Mismo patrón
│   └── importexport/           # ImportExportPanel.tsx + export.ts
│
├── database/
│   └── prisma.ts               # Singleton de PrismaClient
│
├── components/
│   ├── layout/Navbar.tsx       # Barra de navegación
│   └── ui/                     # Badge, Button, Card, Pagination, etc.
│
└── shared/
    └── types/api.ts            # Tipo genérico ApiResponse<T>
```

---

## Puesta en marcha

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar la base de datos

Copia el fichero de variables de entorno:

```bash
cp .env.example .env
```

Edita `.env` con tu cadena de conexión PostgreSQL:

```
DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/gestpracticas"
```

### 3. Crear las tablas en la BD

```bash
npx prisma migrate dev --name init
```

Esto crea las tablas `empresas`, `alumnos` y `formaciones_empresa` en tu BD.

### 4. (Opcional) Ver la BD con Prisma Studio

```bash
npm run db:studio
```

### 5. Arrancar en desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

---

## Convenciones del proyecto

### Server vs Client Components

| Archivo | Tipo | Motivo |
|---|---|---|
| `app/*/page.tsx` | **Server** | Hace fetch a la BD directamente |
| `modules/*/components/*Form.tsx` | **Client** | Maneja estado del formulario |
| `modules/*/components/*Table.tsx` | **Client** | Maneja filtros, paginación y fetch |
| `components/layout/Navbar.tsx` | **Client** | Usa `usePathname()` |
| `components/ui/Pagination.tsx` | **Client** | Maneja clics |

### API Routes

Todas las respuestas siguen el formato:

```typescript
// Éxito
{ ok: true, data: T }

// Error
{ ok: false, error: string }
```

### Validación

- Los schemas Zod se definen en `modules/*/types/schema.ts`
- Se usan tanto en el cliente (react-hook-form) como en el servidor (API Route)
- Así la validación es la misma en ambos lados

---

## Scripts disponibles

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build de producción
npm run db:generate  # Regenerar el cliente de Prisma tras cambiar el schema
npm run db:migrate   # Aplicar migraciones a la BD
npm run db:push      # Sincronizar schema sin generar migración (útil en dev)
npm run db:studio    # Abrir Prisma Studio (UI para ver la BD)
```
