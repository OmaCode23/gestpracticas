# Cambios en archivos comunes

## 1-4-26 Sbs

- Archivo: `src/app/empresas/page.tsx`
  Motivo: restaurar el `PageHeader` principal del modulo de empresas tras comprobar que habia desaparecido en un merge aunque ambas ramas mantenian todavia ese bloque.
  Impacto: la pagina de Empresas vuelve a mostrar el encabezado principal y recupera la misma estructura visual que Alumnos y Formacion.

- Archivo: `cambios-comunes.md`
  Motivo: documentar la incidencia del encabezado de Empresas y dejar trazabilidad de que la perdida se produjo en el merge a `master` `a885c84` del 26-3-26, mientras que el estado actual de GitHub seguia sin ese `PageHeader`.
  Impacto: queda constancia comun del origen del problema y de la reparacion aplicada para futuras revisiones de merges.

- Archivo: `src/app/importexport/page.tsx`
  Motivo: cargar desde `settings` el valor persistido de resultados por pagina tambien en la entrada server de importexport.
  Impacto: el panel de importacion/exportacion recibe el tamano de pagina configurado en BD para el historial de actividad.

- Archivo: `src/modules/importexport/components/ImportExportPanel.tsx`
  Motivo: sustituir el limite fijo de 5 registros en el historial por la configuracion de `resultadosPorPagina` y propagarla a la consulta y a la paginacion visible.
  Impacto: la tabla de actividad reciente de importexport usa el mismo numero de resultados por pagina que el resto de listados configurables.

- Archivo: `src/modules/importexport/actions/logs.ts`
  Motivo: usar `getResultadosPorPaginaConfigurados()` como fallback server al recuperar logs cuando no se informa `limit`.
  Impacto: el historial de importexport sigue respetando la configuracion persistida incluso fuera del flujo cliente habitual.

- Archivo: `src/app/api/importexport/logs/route.ts`
  Motivo: aplicar tambien en la ruta API de logs el fallback de resultados por pagina configurado en `settings`.
  Impacto: el endpoint de actividad queda alineado con la preferencia global de paginacion.

- Archivo: `src/app/empresas/page.tsx`
  Motivo: cargar desde `settings` el valor persistido de resultados por pagina tambien en la entrada server del modulo de empresas.
  Impacto: la pantalla de empresas recibe el tamano de pagina configurado en BD igual que los listados de mis modulos, aunque el modulo pertenezca a Oma.

- Archivo: `src/modules/empresas/components/EmpresasContainer.tsx`
  Motivo: sustituir el `PER_PAGE` fijo del contenedor de empresas por la configuracion de `resultadosPorPagina` y propagarla en la llamada a la API y en el componente de paginacion.
  Impacto: el listado de empresas muestra y solicita el mismo numero de registros por pagina definido en configuracion.

- Archivo: `src/modules/empresas/actions/queries.ts`
  Motivo: usar `getResultadosPorPaginaConfigurados()` como fallback server cuando el listado de empresas se consulta sin `limit` explicito.
  Impacto: la API de empresas sigue respetando la configuracion persistida incluso fuera del flujo cliente habitual.

- Archivo: `src/shared/catalogs/academico.ts`
  Motivo: anadir un valor por defecto compartido para el numero de resultados por pagina en listados, reutilizable desde `settings` y desde los modulos con paginacion.
  Impacto: la aplicacion dispone de una unica referencia estatica para inicializar la nueva configuracion de paginacion antes o en ausencia del valor persistido en BD.

- Archivo: `src/components/layout/Navbar.tsx`
  Motivo: corregir etiquetas visibles de navegacion compartida para mostrar correctamente los acentos en los accesos a Formacion, Configuracion y en la marca GestPracticas.
  Impacto: la barra comun deja de mostrar textos sin tildes en rutas que afectan directamente a mis modulos y mantiene coherencia visual en toda la app.

- Archivo: `prisma/schema.prisma`
  Motivo: resolver el conflicto del merge con `master` manteniendo obligatorio `FormacionEmpresa.alumnoId` y la restriccion `onDelete: Restrict`, a la vez que se integran los cambios comunes ya traidos para cerrar la eliminacion de los campos legacy de ciclos.
  Impacto: el esquema comun queda coherente con las migraciones ya anadidas en `rama-sbs`, evita reabrir formaciones sin alumno y valida correctamente el estado final del merge sobre la transicion a ciclos en BD.

- Archivo: `src/app/api/empresas/[id]/route.ts`
  Motivo: resolver el conflicto del merge combinando el control excepcional que yo habia anadido para la restriccion FK (`P2003`) con el nuevo error semantico `EMPRESA_CON_FORMACIONES` llegado desde `master`.
  Impacto: el borrado de empresas sigue devolviendo `409` con un mensaje funcional claro tanto si la proteccion llega desde la mutacion del modulo de Oma como si aflora directamente desde la base de datos.



## 1-4-26 Oma

- Archivo: `prisma/schema.prisma`
  Motivo: retirar del modelo comun los campos de texto heredados `Alumno.ciclo` y `Empresa.cicloFormativo`, dejando `cicloFormativoId` y `cicloFormativoRef` como unica fuente de verdad para los ciclos.
  Impacto: el esquema tipado deja de promover compatibilidades antiguas y fuerza al resto de modulos a trabajar ya con la relacion real contra `ciclos_formativos`.

- Archivo: `prisma/migrations/20260401100000_drop_legacy_cycle_text_fields/migration.sql`
  Motivo: anadir la migracion comun que elimina fisicamente las columnas legacy de texto usadas para ciclos en `alumnos` y `empresas`.
  Impacto: la BD queda preparada para cerrar la transicion sin mantener duplicidad entre texto e id.

- Archivo: `src/modules/catalogos/actions/queries.ts`
  Motivo: ampliar la lectura comun de catalogos de empresas para devolver tambien `id` y `nombre` de los ciclos activos.
  Impacto: `empresas` e `importexport` pueden poblar selects y resolver importaciones directamente contra ids reales en vez de depender de listados estaticos.

- Archivo: `src/modules/empresas/types/schema.ts`
  Motivo: sustituir en la validacion compartida de empresas el antiguo `cicloFormativo` textual por `cicloFormativoId` opcional coercionado.
  Impacto: la API de empresas pasa a recibir y validar el identificador del ciclo activo, alineandose con el modelo final de BD.

- Archivo: `src/modules/empresas/actions/queries.ts`
  Motivo: incluir la relacion `cicloFormativoRef` en las lecturas de empresas y normalizar la salida para exponer nombre e id derivados de la relacion.
  Impacto: listados, formularios e informes dejan de leer la columna legacy y consumen ya el ciclo resuelto desde BD.

- Archivo: `src/modules/empresas/actions/mutations.ts`
  Motivo: hacer que las altas, ediciones e importaciones masivas de empresas persistan `cicloFormativoId` y validen que el ciclo exista y siga activo.
  Impacto: la escritura de empresas queda protegida frente a ciclos invalidos y deja de guardar texto duplicado.

- Archivo: `src/modules/empresas/components/EmpresasContainer.tsx`
  Motivo: adaptar el estado del formulario y la edicion de empresas al uso de `cicloFormativoId` con opciones provenientes del catalogo maestro.
  Impacto: la UI sigue mostrando nombres de ciclo, pero guarda y recupera la relacion real por id.

- Archivo: `src/modules/empresas/components/EmpresaForm.tsx`
  Motivo: convertir el selector de ciclo del formulario de empresas para trabajar con opciones `{ id, nombre }` desde BD.
  Impacto: el formulario deja de enviar texto libre o heredado y queda sincronizado con los ciclos activos del sistema.

- Archivo: `src/modules/importexport/actions/import.ts`
  Motivo: completar la transicion comun de importacion para resolver ciclos activos desde BD en alumnos y empresas, y validar `curso` con `getCursosAcademicosConfigurados()` en alumnos y formacion.
  Impacto: la importacion masiva deja de depender de `CURSOS`, `alumno.ciclo` y `empresa.cicloFormativo`, pero mantiene en Excel nombres legibles que se traducen internamente a ids.

- Archivo: `src/modules/importexport/actions/export.ts`
  Motivo: rehacer la exportacion comun de alumnos y empresas para sacar el nombre del ciclo desde `cicloFormativoRef`.
  Impacto: los excels siguen siendo legibles para el usuario, pero ya no se alimentan de columnas legacy de texto.

- Archivo: `src/modules/importexport/utils.ts`
  Motivo: hacer dinamicas las validaciones previas y las plantillas Excel, cargando ciclos activos desde catalogos y cursos desde `settings` para listas desplegables y comprobaciones cliente.
  Impacto: las plantillas y la validacion local se ajustan al estado real de la aplicacion sin arrastrar catalogos estaticos desfasados.

- Archivo: `src/modules/importexport/components/ImportExportPanel.tsx`
  Motivo: adaptar el flujo comun de importacion a la nueva validacion asíncrona de Excel.
  Impacto: el panel puede seguir bloqueando errores antes de llamar a la API, pero ahora con catalogos y cursos obtenidos en tiempo real.

- Archivo: `src/modules/informes/components/InformesPanel.tsx`
  Motivo: simplificar las opciones de filtro de ciclos para que tomen como base el catalogo maestro de ciclos activos en lugar de reconstruirse desde textos heredados de empresas.
  Impacto: informes queda mejor alineado con la fuente de verdad final y evita reforzar ciclos residuales o desactivados.

## 31-3-26 Sbs

- Archivo: `src/shared/catalogs/academico.ts`
  Motivo: eliminar la constante `CICLOS` al comprobar que ya no quedaban consumos activos en el proyecto.
  Impacto: se limpia compatibilidad estatica ya obsoleta y se reduce el riesgo de que vuelva a usarse como si fuera un catalogo vigente.

- Archivo: `src/modules/catalogos/actions/queries.ts`
  Motivo: separar la lectura de catalogos de la siembra automatica, eliminando la llamada a `syncCatalogosBase()` desde `getEmpresaCatalogos()`.
  Impacto: las lecturas de catalogos dejan de escribir silenciosamente en BD; la semilla base queda reservada para inicializacion o restauracion explicita.

- Archivo: `prisma/seed.ts`
  Motivo: anadir un seed explicito para poblar sectores, localidades y ciclos formativos base desde las semillas canonicas del proyecto.
  Impacto: el despliegue o la preparacion de un entorno nuevo puede cargar datos iniciales sin depender de lecturas con efectos secundarios dentro de la aplicacion.

- Archivo: `package.json`
  Motivo: anadir el script `db:seed` y registrar el seed de Prisma para ejecutar la carga inicial de catalogos base de forma explicita.
  Impacto: queda disponible un flujo claro de migracion + seed tanto para desarrollo como para despliegue.

- Archivo: `README.md`
  Motivo: documentar que, tras aplicar migraciones, hay que ejecutar el seed inicial de catalogos base.
  Impacto: la puesta en marcha del proyecto deja de depender de comportamiento implicito dentro de la aplicacion y queda mejor alineada con un despliegue profesional.

- Archivo: `README.md`
  Motivo: rehacer la documentacion general del proyecto para reflejar el estado actual de modulos, scripts, tests y el procedimiento correcto de migracion, seed y restauracion de catalogos.
  Impacto: el equipo dispone de una guia unica y coherente para preparar entornos nuevos y para mantener clara la separacion entre esquema, seed inicial y restauracion funcional desde la app.

  - Archivo: `prisma/schema.prisma`
  Motivo: hacer obligatorio `FormacionEmpresa.alumnoId` para que el esquema comun refleje que una formacion siempre vincula una empresa con un alumno.
  Impacto: Prisma deja de permitir formaciones sin alumno y el contrato del modelo queda alineado con la validacion y los formularios actuales del modulo de formacion.

- Archivo: `prisma/migrations/20260401123000_make_alumno_required_in_formacion/migration.sql`
  Motivo: anadir la migracion comun que convierte `formaciones_empresa.alumnoId` en `NOT NULL` y recompone la clave ajena sin `SET NULL`.
  Impacto: la base de datos impide ya formaciones sin alumno; si existieran filas legacy con `alumnoId` a `NULL`, la migracion falla con un mensaje explicito para obligar a limpiarlas antes.

- Archivo: `prisma/migrations/20260401130000_restrict_delete_formacion_relations/migration.sql`
  Motivo: anadir la migracion comun que protege las relaciones de `formaciones_empresa` frente al borrado de alumnos y empresas referenciados.
  Impacto: ya no se puede borrar un alumno ni una empresa si participan en una formacion, mientras que eliminar una formacion no afecta ni al alumno ni a la empresa asociados.

- Archivo: `src/app/api/empresas/[id]/route.ts`
  Motivo: ajustar la respuesta de borrado en el modulo de empresas para detectar la restriccion de clave ajena cuando la empresa participa en una formacion.
  Impacto: al intentar eliminar una empresa incluida en una formacion, la API devuelve un `409` con un mensaje funcional claro en lugar de un error generico; cambio realizado de forma excepcional sobre un modulo de Oma por afectar a una regla comun de integridad.

## 31-3-26 Oma

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
  Motivo: anadir utilidades cliente para validar que el CV sea exclusivamente un PDF y que respete el limite objetivo vigente de 500 KB.
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

## 30-3-26 Sbs

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
