# Cambios en archivos comunes

## 30-3-26

- Archivo: `src/shared/catalogs/academico.ts`
  Motivo: separar el catalogo canonico de ciclos formativos (`nombre` + `codigo`) de las reglas de compatibilidad usadas para etiquetas y normalizacion.
  Impacto: los modulos que siguen consumiendo `CICLOS_FORMATIVOS` y `CICLO_LABEL` mantienen compatibilidad, pero ya existe una semilla comun apta para poblar la BD.

- Archivo: `src/modules/catalogos/actions/queries.ts`
  Motivo: hacer que la siembra de `ciclos_formativos` use el catalogo canonico en lugar del array plano de nombres.
  Impacto: la BD puede inicializarse con pares consistentes `nombre`/`codigo`, aunque los registros ya existentes no se actualizan por si solos.

- Archivo: `src/app/page.tsx`
  Motivo: conectar la tarjeta de Configuracion de la home con la nueva ruta `/configuracion`.
  Impacto: el acceso rapido ya no apunta a `"#"` y permite entrar en la nueva pantalla.

- Archivo: `src/modules/catalogos/actions/queries.ts`
  Motivo: anadir una consulta especifica para listar ciclos formativos desde BD (`getCiclosFormativos`).
  Impacto: cualquier modulo que consulte el catalogo maestro de ciclos puede reutilizar una lectura comun desde BD.

- Archivo: `src/components/layout/Navbar.tsx`
  Motivo: anadir Configuracion a la barra de navegacion comun del proyecto.
  Impacto: la ruta `/configuracion` queda accesible desde todas las paginas que usan el layout principal.

- Archivo: `src/modules/catalogos/actions/mutations.ts`
  Motivo: anadir una restauracion explicita de ciclos iniciales basada en la semilla canonica.
  Impacto: existe una operacion comun para recrear o reactivar los ciclos base sin borrar ciclos personalizados.

- Archivo: `src/modules/catalogos/actions/queries.ts`
  Motivo: anadir `getCiclosFormativosActivos()` para que otros modulos lean ciclos activos desde BD.
  Impacto: queda disponible una lectura comun de ciclos activos desde la BD como fuente de verdad.

- Archivo: `src/modules/catalogos/actions/mutations.ts`
  Motivo: anadir el borrado protegido de ciclos formativos, permitiendo eliminar solo los no usados por alumnos o empresas.
  Impacto: se protege la integridad del catalogo maestro frente a referencias existentes.

- Archivo: `src/modules/catalogos/actions/mutations.ts`
  Motivo: impedir tambien la edicion de nombre y codigo de ciclos formativos que ya estan en uso por referencia `id`.
  Impacto: se protege la consistencia del catalogo maestro cuando ya existen relaciones activas por `id`.

- Archivo: `prisma/schema.prisma`
  Motivo: anadir el modelo `Setting` para guardar configuracion global en formato clave/valor.
  Impacto: la aplicacion puede persistir ajustes sin crear una tabla especifica por cada bloque de Configuracion.

- Archivo: `src/shared/catalogs/academico.ts`
  Motivo: introducir valores por defecto y helpers configurables para generar cursos academicos a partir de `mesCambioCurso` y `numeroCursosVisibles`.
  Impacto: los modulos comunes pueden calcular cursos academicos desde `settings`, manteniendo `CURSOS` como compatibilidad para zonas no migradas.

- Archivo: `src/components/ui/Filters.tsx`
  Motivo: ampliar el componente compartido `SearchBox` para que acepte una prop opcional `className`.
  Impacto: el buscador mantiene por defecto su ancho maximo anterior, pero ahora una vista concreta puede sobrescribirlo sin afectar al resto de tablas; se uso para ensanchar solo el buscador de `formacion`.
