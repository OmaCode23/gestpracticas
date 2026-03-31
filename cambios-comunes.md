# Cambios en archivos comunes

## 31-3-26

- Archivo: `prisma/schema.prisma`
  Motivo: integrar en `master` los cambios comunes de `rama-sbs` sobre el esquema compartido, incluyendo `nif`, `nuss`, `cursoCiclo`, `Setting` y los nuevos campos de formacion.
  Impacto: la base comun del proyecto queda alineada para seguir trabajando sin rehacer despues esta parte del merge, aunque `contacto` en formacion sigue coexistiendo temporalmente con `tutorLaboral`.

- Archivo: `src/shared/catalogs/academico.ts`
  Motivo: integrar en `master` la separacion entre semilla canonica de ciclos formativos y helpers configurables de cursos academicos.
  Impacto: los archivos comunes pasan a compartir una misma base para catalogos y settings, reduciendo el riesgo de divergencias en siguientes merges.

- Archivo: `src/modules/catalogos/actions/queries.ts`
  Motivo: incorporar en `master` las lecturas comunes de ciclos formativos desde BD que venian en `rama-sbs`.
  Impacto: el catalogo maestro de ciclos queda accesible desde consultas comunes ya preparadas para reutilizarse en otros modulos.

- Archivo: `src/components/layout/Navbar.tsx`
  Motivo: integrar el acceso comun a Configuracion procedente de `rama-sbs`.
  Impacto: la navegacion compartida queda alineada con la nueva ruta comun antes de seguir avanzando en mas cambios.

- Archivo: `src/modules/importexport/actions/import.ts`
  Motivo: adaptar la importacion comun al nuevo contrato fusionado de alumnos y formacion, incorporando `nif`, `nuss`, `cursoCiclo`, `tutorLaboral` y `emailTutorLaboral`.
  Impacto: el merge deja de mezclar modelos viejos y nuevos en esta capa compartida, reduciendo errores de tipos tras sincronizar el esquema.

- Archivo: `src/modules/importexport/actions/export.ts`
  Motivo: ajustar la exportacion comun a las nuevas columnas de alumnos y formacion alineadas con el esquema fusionado.
  Impacto: los excels exportados pasan a reflejar la estructura real que ya usa el proyecto tras el merge.

- Archivo: `src/modules/alumnos/fields.ts`
  Motivo: ampliar las columnas compartidas de importacion/exportacion de alumnos con `NIF`, `NUSS` y `Curso Ciclo`.
  Impacto: las plantillas comunes y el mapeo de filas quedan preparados para los nuevos datos obligatorios del flujo academico.

- Archivo: `src/modules/formacion/fields.ts`
  Motivo: sustituir en importacion/exportacion la antigua columna `Contacto` por `Tutor Laboral` y anadir `Correo Tutor Laboral`.
  Impacto: la capa comun de Excel acompana la migracion funcional de formacion sin seguir reforzando el nombre antiguo.

- Archivo: `src/modules/settings/actions/queries.ts`
  Motivo: hacer tolerante la lectura comun de `settings` cuando la tabla aun no existe en una BD sin migrar.
  Impacto: el merge puede convivir temporalmente con entornos pendientes de migracion usando valores por defecto en lectura, evitando romper la carga inicial.

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
