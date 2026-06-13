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
- `PROFESOR`: usa el panel interno funcional, incluida la pagina de `profesores`, sin gestion de usuarios ni operaciones administrativas restringidas.
- `ALUMNO`: no usa el panel interno; su espacio funcional es `portal-alumno`.

## Notas funcionales del portal del alumno

- Las paginas `Ofertas`, `Empresas` y `Cursos` del `portal-alumno` se muestran como informacion general del portal, no como vistas personalizadas por alumno, salvo los bloques especificamente pensados para la ficha del alumno autenticado.
- En `Formacion alumno`, el bloque `Empresas compatibles` muestra actualmente 12 empresas iniciales.
- En la pagina `Empresas` del `portal-alumno` se muestran 24 empresas iniciales y, si hay mas, el boton `Ver mas empresas` carga 12 adicionales en cada pulsacion.

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
# Definir tambien AUTH_SECRET y AUTH_MODE (local o external)

# 3. Aplicar migraciones
npm run db:migrate

# 4. Cargar catálogos base iniciales
npm run db:seed

# 5. Crear el administrador inicial
npm run db:bootstrap-admin -- --email admin@edu.gva.es --password TuClaveInicial --name "Administrador"

# 6. Arrancar en desarrollo
npm run dev
```

La aplicación quedará disponible en `http://localhost:3000`.

## Puesta en marcha del login

Ademas de la configuracion general, para poder entrar en la aplicacion hay que preparar el sistema de login:

- definir `AUTH_SECRET` en `.env`;
- elegir `AUTH_MODE`;
- `AUTH_MODE=local` usa el sistema de login propio actual del proyecto;
- `AUTH_MODE=external` deja preparada una alternativa futura basada en un proveedor externo;
- ejecutar `npm run db:bootstrap-admin` para crear el primer usuario `ADMIN`.

Ejemplo en modo local:

```bash
npm run db:bootstrap-admin -- --email admin@edu.gva.es --password TuClaveInicial --name "Administrador"
```

Ejemplo en modo external:

```bash
npm run db:bootstrap-admin -- --email admin@edu.gva.es --name "Administrador"
```

La explicacion completa del sistema de login actual, la alternativa `external` y la matriz de permisos por rol esta en `sistema-login.md`.

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

## Warnings observados

- En algunos `npm run build` aparece el warning de webpack `Caching failed for pack: Error: Unable to snapshot resolve dependencies`.
  Posible causa: limitacion o comportamiento ambiental del cache de filesystem de webpack/Next.js en este entorno Windows; tras limpiar `.next` y regenerar el build puede seguir apareciendo, pero no impide compilar ni genera por si mismo un error funcional del proyecto.

- En builds de produccion puede aparecer el warning de Next.js indicando que falta el paquete opcional `sharp` para `Image Optimization`.
  Posible causa: `sharp` no esta instalado como dependencia, por lo que Next.js cae en una ruta menos optimizada para tratamiento de imagenes; es un warning de rendimiento/optimizacion, no un bloqueo de compilacion.

## Codificación de caracteres

En archivos de este proyecto se han visto problemas frecuentes de codificación de caracteres especialmente visibles en los acentos. La causa mas probable es una mezcla de codificaciones al editar o guardar archivos; posiblemente a pesar de que se trabaja con `UTF-8`, se produce alguna edicion posterior desde una herramienta o terminal que interpreta o re-guarda en `ANSI` / `Windows-1252`.

Recomendacion de trabajo para el equipo:
- Guardar siempre los archivos de codigo y documentacion en `UTF-8`.
- Preferir `UTF-8 sin BOM` en archivos fuente y documentacion.
- No convertir archivos a `ANSI`, `Western`, `Windows-1252` ni codificaciones locales similares.
- Evitar mezclar `UTF-8` con `Windows-1252` o `ISO-8859-1` dentro del mismo flujo de trabajo.
- Si un archivo ya muestra texto roto, corregir la cadena visible y volver a guardar el archivo completo en `UTF-8`.
- Si un archivo se ve bien en VS Code pero mal en PowerShell o en otra terminal de Windows, asumir primero que el problema puede estar en la terminal y no en el archivo.
- Antes de convertir un archivo existente, comprobar primero como lo interpreta VS Code para no estropear texto que ya esta correcto.
- No cambiar la codificacion de un archivo solo porque la terminal muestre mal los acentos.
- Cuando aparezca texto corrupto, revisar primero la codificacion de la terminal y despues la del archivo.
- Antes de "arreglar" la codificacion, comprobar si el problema afecta al archivo real o solo a la salida de la terminal.
- Si el archivo esta bien en `UTF-8` y solo se ve mal en consola, no tocar el contenido.
- Si solo unas lineas concretas quedaron corruptas tras una insercion o edicion, corregir solo esas lineas y evitar recodificar el archivo completo.
- Crear archivos nuevos desde VS Code y guardarlos antes de editarlos desde otras herramientas o asistentes.
- Tener especial cuidado en Windows al editar desde distintas herramientas sobre el mismo archivo.
- Mantener una unica codificacion en todo el repositorio para evitar corrupciones silenciosas en merges, revisiones y copias entre terminal, editor y git.
- Priorizar siempre la codificacion real de los archivos del proyecto por encima de como los represente una terminal concreta.
- `TypeScript`, `TSX`, `JavaScript`, `JSON`, `CSS`, `MD`, `Prisma`, `YAML` y ficheros de texto del proyecto deben mantenerse en `UTF-8 sin BOM`.
- En cuanto a finales de linea, conviene normalizar preferentemente a `LF` en lugar de `CRLF`, por ser la opcion mas estandar en proyectos actuales y reducir fricciones entre entornos. Esa normalizacion no se ha aplicado todavia porque supondria reescribir practicamente todos los archivos del proyecto.
- Si hace falta revisar texto con acentos en consola clasica, usar `chcp 65001`.
- En PowerShell conviene trabajar con salida y guardado en `UTF-8`.
- En algunos entornos, PowerShell puede no llegar a cargar el perfil que fuerza `UTF-8` si la politica de ejecucion bloquea scripts; en ese caso la sesion puede quedarse con `code page 850`, `InputEncoding` no UTF-8 o `$OutputEncoding` en `us-ascii`, aunque el proyecto y VS Code esten bien configurados.
- Una configuracion habitual de PowerShell para permitir la carga del perfil del usuario es `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned -Force`, pero algunos hosts gestionados o herramientas embebidas pueden seguir arrancando con restricciones propias y no aplicar el perfil aunque esa politica ya este guardada.
- Si aparecen acentos rotos en PowerShell, conviene comprobar expresamente `Get-ExecutionPolicy -List`, `chcp`, `[Console]::InputEncoding`, `[Console]::OutputEncoding` y `$OutputEncoding` antes de asumir que el archivo se ha guardado mal.
- Evitar re-guardar archivos fuente desde scripts o comandos que usen codificaciones heredadas por defecto.
- En VS Code, se recomienda añadir en su configuración global`settings.json`:
```json
"files.encoding": "utf8",
"files.autoGuessEncoding": true,
"files.insertFinalNewline": true
```

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
