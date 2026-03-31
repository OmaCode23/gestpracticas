# Cambios en archivos comunes

## 31-3-26

- Archivo: `cambios-comunes.md`
  Motivo: dejar trazabilidad de una prueba controlada de rendimiento con 5000 alumnos sinteticos ejecutada sobre la base actual dentro de una transaccion con rollback, para medir insercion, paginacion, busquedas y conteo sin ensuciar datos reales.
  Impacto: se confirma que el modulo de alumnos sigue respondiendo con soltura en este volumen inicial de referencia, con insercion de 5000 filas en ~514 ms, pagina inicial de 10 registros en ~9 ms, pagina profunda en ~38 ms, busqueda por nombre en ~8 ms, busqueda por NIA en ~5 ms y count total en ~3 ms.

- Archivo: `prisma/schema.prisma`
  Motivo: ampliar el modelo comun de `Alumno` con los metadatos necesarios para asociar un CV almacenado como Large Object en PostgreSQL.
  Impacto: los alumnos pasan a poder referenciar un CV binario en base de datos sin mezclar el fichero dentro del resto de columnas funcionales.

- Archivo: `prisma/migrations/20260331201500_add_alumno_cv_large_object_fields/migration.sql`
  Motivo: anadir la migracion comun que crea en `alumnos` las columnas de referencia y metadatos para el CV (`cv_oid`, nombre, mime, tamano y fecha de actualizacion).
  Impacto: el esquema fisico queda preparado para adjuntar CVs en base de datos y seguir su estado desde la aplicacion.

- Archivo: `src/modules/alumnos/actions/cv.ts`
  Motivo: centralizar la logica server para guardar, leer y eliminar CVs de alumnos usando Large Objects de PostgreSQL y validando el limite y el formato PDF permitido.
  Impacto: la gestion binaria del CV queda encapsulada y reutilizable desde las rutas API sin dispersar SQL especifico por el proyecto.

- Archivo: `src/app/api/alumnos/[id]/cv/route.ts`
  Motivo: crear una ruta dedicada para subir, descargar y borrar el CV de cada alumno.
  Impacto: la subida de archivos queda desacoplada del CRUD general del alumno y permite trabajar con `multipart/form-data` y descargas directas sin romper el contrato JSON existente.

- Archivo: `src/modules/alumnos/utils/cv.ts`
  Motivo: anadir utilidades cliente para validar que el CV sea exclusivamente un PDF y que respete el limite objetivo de 100 KB.
  Impacto: la subida del CV queda alineada con la restriccion funcional real y evita aceptar formatos que ya no deben entrar en el sistema.

- Archivo: `src/modules/alumnos/components/AlumnoForm.tsx`
  Motivo: incorporar al formulario de alumnos una zona de drag and drop y seleccion manual para adjuntar o sustituir el CV.
  Impacto: el usuario puede gestionar el CV desde la misma pantalla de alta/edicion sin salir del flujo habitual del alumno.

- Archivo: `src/modules/alumnos/components/AlumnosContainer.tsx`
  Motivo: coordinar la subida o eliminacion del CV junto con el alta y la edicion del alumno, manteniendo feedback y estado local del fichero.
  Impacto: la gestion del CV queda integrada en el flujo real de guardado, incluyendo mensajes de exito, reemplazo y borrado.

- Archivo: `src/modules/alumnos/components/AlumnosTable.tsx`
  Motivo: reflejar en el listado si cada alumno tiene o no un CV adjunto.
  Impacto: el equipo puede detectar de un vistazo que alumnos ya tienen documentacion cargada.

- Archivo: `src/modules/alumnos/types/index.ts`
  Motivo: extender el contrato tipado del alumno con los metadatos del CV.
  Impacto: las vistas cliente y las respuestas de API mantienen consistencia al exponer el estado del fichero adjunto.

- Archivo: `src/modules/alumnos/actions/queries.ts`
  Motivo: propagar en las lecturas de alumnos los nuevos metadatos del CV, normalizando la fecha de actualizacion para el cliente.
  Impacto: los listados y detalles del alumno pueden mostrar el estado del CV sin consultas adicionales.

- Archivo: `src/modules/alumnos/actions/mutations.ts`
  Motivo: asegurar que, al eliminar un alumno, tambien se elimine el Large Object asociado a su CV para no dejar basura binaria en PostgreSQL.
  Impacto: la limpieza de datos queda completa y evita objetos huerfanos en almacenamiento.

- Archivo: `prisma/schema.prisma`
  Motivo: cerrar la limpieza final de `FormacionEmpresa`, retirando el campo residual `contacto` que ya habia quedado obsoleto frente a `tutorLaboral`.
  Impacto: el modelo comun deja de mezclar dos nombres para el mismo concepto y queda listo para que las siguientes evoluciones trabajen sobre un unico contrato.

- Archivo: `src/modules/formacion/types/schema.ts`
  Motivo: eliminar de la validacion comun de formacion el campo legado `contacto`, manteniendo solo `tutorLaboral` y `emailTutorLaboral`.
  Impacto: las altas, ediciones e importaciones dejan de aceptar silenciosamente un dato antiguo que ya no forma parte del flujo actual.

- Archivo: `src/modules/formacion/types/index.ts`
  Motivo: retirar `contacto` de la interfaz compartida `Formacion`.
  Impacto: los consumidores tipados del modulo pasan a reflejar el contrato real sin compatibilidades sobrantes.

- Archivo: `src/modules/formacion/actions/mutations.ts`
  Motivo: dejar de persistir y actualizar el campo legado `contacto` en las mutaciones de formacion.
  Impacto: la capa server queda alineada con el esquema y evita seguir escribiendo una columna que ya no deberia existir.

- Archivo: `prisma/migrations/20260331184500_drop_legacy_contacto_from_formacion/migration.sql`
  Motivo: anadir la migracion comun necesaria para eliminar de la base de datos la columna residual `contacto` en `formaciones_empresa`.
  Impacto: el esquema fisico deja de arrastrar compatibilidad sobrante con el modelo antiguo y queda sincronizado con el contrato actual de formacion.

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

- Archivo: `prisma/migrations/20260316112400_init/migration.sql`
  Motivo: anadir una migracion legado vacia para reconciliar el historial local del repo con bases ya existentes que registraban ese nombre en `_prisma_migrations`.
  Impacto: Prisma puede volver a aplicar las migraciones pendientes del merge sin exigir reseteo de la base ni chocar por desajustes de historial.

- Archivo: `src/shared/catalogs/academico.ts`
  Motivo: retirar `CAE` del array estatico `CICLOS`, ya que no debe seguir ofreciendose como opcion de ciclo formativo en las zonas comunes que aun consumen esa compatibilidad.
  Impacto: los filtros y selects que todavia dependen de `CICLOS` dejan de mostrar una opcion incorrecta y se alinean mejor con el catalogo real.

- Archivo: `src/modules/informes/components/InformesPanel.tsx`
  Motivo: alinear el modulo comun de informes con el modelo actual de alumnos, formacion y catalogos, sustituyendo `contacto` por `tutorLaboral` y anadiendo los nuevos campos academicos.
  Impacto: los informes dejan de depender de nombres antiguos y de listas estaticas desfasadas, y pasan a usar opciones y columnas coherentes con la configuracion y la BD actuales.

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
