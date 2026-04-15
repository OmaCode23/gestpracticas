# Cambios en archivos comunes

## 7-4-26 Sbs

- Archivo: `src/app/icon.png`
  Motivo: incorporar un icono estatico para App Router y eliminar el `404`/`ERR_EMPTY_RESPONSE` que estaba generando el favicon al arrancar la aplicacion en desarrollo.
  Impacto: la app deja de emitir ese ruido evitable en consola del navegador al cargar cualquier pagina.

- Archivo: `src/modules/alumnos/types/schema.ts`
  Motivo: ampliar el schema comun de filtros de alumnos con el flag `all`.
  Impacto: otros modulos pueden pedir el listado completo de alumnos sin forzar un `perPage` invalido.

- Archivo: `src/modules/alumnos/actions/queries.ts`
  Motivo: adaptar la consulta comun de alumnos para soportar `all=true`, omitiendo `skip/take` cuando se pide el conjunto completo.
  Impacto: se mantiene la paginacion normal en listados y se habilitan cargas completas seguras para formularios auxiliares e informes.

- Archivo: `src/app/api/alumnos/route.ts`
  Motivo: propagar el nuevo filtro `all` en la ruta de alumnos.
  Impacto: la capa HTTP queda alineada con la consulta comun y evita respuestas `400` al pedir todos los alumnos desde otras pantallas.

- Archivo: `src/modules/formacion/components/FormacionContainer.tsx`
  Motivo: sustituir la carga invalida `perPage=9999` por `all=true` al poblar el selector de alumnos del formulario de formacion.
  Impacto: desaparece el error real `GET /api/alumnos?perPage=9999 400` que se veia en consola al entrar en la pagina de formacion.

- Archivo: `src/modules/formacion/types/schema.ts`
  Motivo: ampliar tambien el schema de filtros de formacion con el flag `all`.
  Impacto: se habilita la lectura completa de formaciones desde la API sin abrir una excepcion insegura en `perPage`.

- Archivo: `src/modules/formacion/actions/queries.ts`
  Motivo: adaptar la consulta comun de formacion para omitir paginacion cuando se solicita `all=true`.
  Impacto: informes y otros consumidores pueden pedir todas las formaciones sin provocar errores de validacion ni resultados truncados.

- Archivo: `src/app/api/formacion/route.ts`
  Motivo: hacer visible el nuevo flag `all` en la ruta de listado de formacion.
  Impacto: la API de formacion queda consistente con la de alumnos y empresas para los casos de lectura completa.

- Archivo: `src/modules/informes/components/InformesPanel.tsx`
  Motivo: reemplazar las cargas `perPage=500` de alumnos y formacion por `all=true` en la generacion de informes.
  Impacto: se evita un segundo foco de errores `400` silenciosos en consola y se estabiliza el modulo de informes al trabajar con datasets completos.

- Archivo: `src/app/api/alumnos/route.test.ts`
  Motivo: cubrir a nivel de API el nuevo contrato `all=true` de alumnos.
  Impacto: la ruta de alumnos queda protegida frente a regresiones en este nuevo modo de lectura completa.

- Archivo: `src/app/api/formacion/route.test.ts`
  Motivo: anadir cobertura de API para `all=true` tambien en formacion.
  Impacto: el endpoint de formacion queda validado en el nuevo caso de uso introducido para informes.

- Archivo: `src/modules/formacion/actions/queries.test.ts`
  Motivo: verificar en pruebas unitarias que la consulta comun de formacion omite `skip/take` cuando se pide todo el conjunto.
  Impacto: se protege frente a regresiones la logica que evita errores de paginacion artificial al consumir formaciones completas.

- Archivo: `src/app/api/alumnos/[id]/cv/route.test.ts`
  Motivo: ajustar y consolidar la cobertura del flujo de subida de CV para asegurar que la ruta funciona tambien con mocks reales del archivo en test.
  Impacto: el submodulo de CV queda estable y cubierto en los casos de error y exito mas sensibles.

- Archivo: `src/modules/alumnos/utils/cv.test.ts`
  Motivo: cubrir utilidades cliente del CV para formato, validacion de MIME y limite de tamano.
  Impacto: la capa de preparacion del archivo antes del upload queda protegida frente a regresiones funcionales.

- Archivo: `src/modules/empresas/components/EmpresasContainer.tsx`
  Motivo: validar el formulario de empresas en cliente antes de enviar `POST/PATCH` y corregir el cierre del panel para no ocultarlo mientras el foco sigue retenido dentro.
  Impacto: se evita el `400` evitable al guardar datos invalidos desde la UI y desaparece el warning de accesibilidad por `aria-hidden` al navegar o cerrar el formulario.

- Archivo: `src/components/ui/index.tsx`
  Motivo: convertir el componente comun `Button` en `forwardRef` para poder devolver el foco al boton lanzador cuando se colapsan paneles interactivos.
  Impacto: la libreria UI soporta mejor patrones accesibles de gestion de foco sin hacks locales ni selectores DOM fragiles.

- Archivo: `src/modules/alumnos/components/AlumnosContainer.tsx`
  Motivo: validar tambien en cliente el formulario de alumnos antes de lanzar `POST` o `PATCH`, alineando la UI con el mismo schema compartido que usa la API.
  Impacto: se evita el `400` evitable al editar o crear alumnos con datos que ya eran invalidos segun servidor, y el usuario recibe el mensaje correcto antes de enviar la peticion.

- Archivo: `src/modules/formacion/components/FormacionContainer.tsx`
  Motivo: validar tambien en cliente el formulario de formacion antes de lanzar `POST` o `PATCH`, usando el mismo schema compartido que ya protege la API.
  Impacto: se evita el `400` evitable al guardar formaciones invalidas desde la UI y el usuario recibe el mensaje de validacion correcto antes de enviar la peticion.

- Archivo: `src/modules/alumnos/components/AlumnosContainer.tsx`
  Motivo: comprobar antes de guardar o actualizar que el curso seleccionado sigue estando dentro de la configuracion academica vigente, incluso si esta se ha cambiado mientras la pantalla seguia abierta.
  Impacto: se evita el `400` por cursos desfasados al editar alumnos tras tocar Configuracion y la UI se resincroniza con los cursos realmente vigentes.

- Archivo: `src/modules/formacion/components/FormacionContainer.tsx`
  Motivo: aplicar la misma comprobacion de cursos academicos vigentes tambien en el formulario de formacion.
  Impacto: alumnos y formacion siguen el mismo criterio cuando Configuracion cambia en paralelo y se evita repetir el mismo error por datos de formulario desactualizados.

- Archivo: `src/modules/alumnos/actions/mutations.ts`
  Motivo: permitir en servidor la edicion de un alumno que ya tenia asignado un ciclo formativo despues desactivado, siempre que mantenga ese mismo ciclo historico.
  Impacto: editar datos no estructurales del alumno deja de fallar con `400` cuando su ciclo se ha desactivado en Configuracion, sin abrir la puerta a reasignar ciclos inactivos a otros casos.

- Archivo: `src/modules/alumnos/actions/mutations.test.ts`
  Motivo: cubrir el caso de actualizacion que conserva el mismo ciclo ya inactivo y seguir protegiendo el rechazo cuando el ciclo enviado no es valido.
  Impacto: la nueva excepcion funcional para historicos queda blindada frente a regresiones en la capa comun.

- Archivo: `src/modules/alumnos/components/AlumnosContainer.tsx`
  Motivo: conservar en el selector del formulario de edicion el ciclo actual del alumno aunque ya no forme parte del catalogo activo, etiquetandolo como inactivo.
  Impacto: la UI de alumnos sigue siendo coherente con la regla de historicos validos y evita que el select se quede sin opcion visible al editar registros ligados a ciclos desactivados.

- Archivo: `src/modules/empresas/actions/mutations.ts`
  Motivo: permitir en servidor la edicion de una empresa que ya tenia asignado un ciclo formativo despues desactivado, siempre que conserve ese mismo ciclo historico.
  Impacto: editar datos de la empresa deja de fallar con `400` cuando su ciclo se ha desactivado en Configuracion, sin aceptar nuevas asignaciones a ciclos inactivos.

- Archivo: `src/modules/empresas/actions/mutations.test.ts`
  Motivo: cubrir el caso de actualizacion que mantiene el mismo ciclo ya inactivo en empresas.
  Impacto: la excepcion funcional para registros historicos queda protegida tambien en este modulo.

- Archivo: `src/modules/empresas/components/EmpresasContainer.tsx`
  Motivo: conservar en el selector del formulario de edicion el ciclo actual de la empresa aunque ya no este activo, etiquetandolo como inactivo y limpiandolo al volver a alta nueva.
  Impacto: la UI de empresas queda alineada con alumnos y evita selects inconsistentes al editar empresas asociadas a ciclos desactivados.

- Archivo: `src/modules/empresas/actions/mutations.ts`
  Motivo: permitir tambien en servidor la edicion de una empresa que ya tenia asignado un sector despues desactivado, siempre que conserve ese mismo sector historico.
  Impacto: editar una empresa deja de fallar con `400` por sector inactivo cuando solo se estan cambiando otros campos, sin aceptar reasignaciones a sectores inactivos distintos.

- Archivo: `src/modules/empresas/actions/mutations.test.ts`
  Motivo: cubrir el caso de actualizacion que mantiene el mismo sector ya inactivo en empresas.
  Impacto: el comportamiento de historicos queda protegido tambien para el catalogo de sectores.

- Archivo: `src/modules/empresas/components/EmpresasContainer.tsx`
  Motivo: conservar en el selector del formulario de edicion el sector actual de la empresa aunque ya no este activo, y restaurar el catalogo activo al volver a alta nueva.
  Impacto: la UI de empresas trata de forma coherente tanto ciclos como sectores historicos y evita que el selector de sector quede vacio al editar registros existentes.

- Archivo: `src/modules/configuracion/components/ConfiguracionPanel.tsx`
  Motivo: resincronizar los campos de configuracion academica con los valores reales actuales cuando el guardado se bloquea porque dejaria cursos en uso fuera del rango valido.
  Impacto: tras el alert funcional de bloqueo, los inputs de mes y numero de cursos vuelven a poblarse con la configuracion vigente y no dejan al usuario con un formulario desfasado.

- Archivo: `src/shared/utils/empresaCatalogos.ts`
  Motivo: propagar tambien el codigo del ciclo formativo al normalizar lecturas de empresas.
  Impacto: las vistas de empresas pueden mostrar el identificador corto del ciclo incluso cuando ya no forma parte del catalogo activo.

- Archivo: `src/modules/empresas/actions/queries.ts`
  Motivo: incluir `codigo` en la relacion `cicloFormativoRef` al leer empresas.
  Impacto: el modulo deja de reconstruir el badge del ciclo a partir del catalogo activo y puede mostrar correctamente ciclos historicos inactivos.

- Archivo: `src/modules/empresas/components/EmpresasTable.tsx`
  Motivo: usar directamente `cicloFormativoCodigo` en la columna de ciclo de la tabla.
  Impacto: las empresas con ciclo inactivo vuelven a mostrar `DAM`/`DAW`/etc. en vez del nombre largo, igual que en alumnos.

- Archivo: `src/modules/empresas/actions/queries.test.ts`
  Motivo: ajustar la cobertura de lecturas de empresas para reflejar que ahora tambien viaja `cicloFormativoCodigo`.
  Impacto: queda protegida la regresion que hacia depender la etiqueta corta del ciclo de que siguiera activo en el catalogo.

- Archivo: `src/modules/importexport/components/ImportExportPanel.tsx`
  Motivo: corregir la lectura de excels de importacion para detectar la fila real de cabecera aunque la hoja incluya titulos o instrucciones previas, y reconstruir las filas desde esa previsualizacion en vez de depender de cabeceras `__EMPTY` generadas por `xlsx`.
  Impacto: la pagina de import/export vuelve a poder importar archivos de alumnos generados desde las propias plantillas del proyecto y deja de fallar falsamente con el mensaje de que no hay filas con datos.

- Archivo: `src/modules/importexport/utils.ts`
  Motivo: incorporar utilidades comunes para localizar la cabecera efectiva del Excel y transformar la matriz cruda de la hoja en filas tipadas antes del mapeo por columnas.
  Impacto: el flujo de importacion gana tolerancia frente a filas decorativas al inicio de la hoja y se estabiliza para futuras importaciones con estructura equivalente.

- Archivo: `src/modules/importexport/utils.test.ts`
  Motivo: cubrir en pruebas el caso real de plantillas con filas previas al encabezado y verificar la reconstruccion correcta de las filas de datos.
  Impacto: queda blindada la regresion que hacia que import/export interpretase hojas validas como si estuvieran vacias.

- Archivo: `src/modules/importexport/utils.ts`
  Motivo: anadir tambien a la plantilla Excel de alumnos una lista desplegable para la columna `Curso Ciclo`, alineada con las opciones funcionales actuales permitidas en la aplicacion (`1` y `2`).
  Impacto: el usuario puede rellenar la plantilla con un selector guiado tambien en ese campo y reduce errores manuales al importar alumnos.

- Archivo: `src/app/api/settings/academico/route.ts`
  Motivo: forzar esta ruta de configuracion academica a modo dinamico en produccion tras detectar en la demo compilada un `405 Method Not Allowed` al intentar restaurar cursos academicos o resultados por pagina.
  Impacto: la ruta deja de quedar tratada como estatica en el build y vuelve a aceptar correctamente peticiones `PUT` en la version demo / produccion.

- Archivo: `src/app/api/settings/academico/route.test.ts`
  Motivo: anadir una regresion automatizada que exige `dynamic = "force-dynamic"` y cubrir explicitamente los payloads usados por la UI al restaurar valores por defecto.
  Impacto: se reduce el riesgo de reintroducir silenciosamente en el futuro el mismo fallo detectado solo al ejecutar la app compilada.

- Archivo: `src/app/api/catalogos/empresas/route.ts`
  Motivo: forzar tambien a modo dinamico la ruta que sirve sectores, localidades y ciclos al formulario de empresas, tras detectar en la demo que un sector personalizado creado en Configuracion no aparecia en su desplegable.
  Impacto: los catalogos del formulario de empresas dejan de quedar congelados en el build y reflejan correctamente altas o cambios hechos en Configuracion dentro de la app compilada.

- Archivo: `src/app/api/catalogos/empresas/route.test.ts`
  Motivo: anadir cobertura automatizada para asegurar que la ruta de catalogos de empresas sigue siendo dinamica y devuelve correctamente los catalogos activos.
  Impacto: queda protegida frente a regresiones de produccion otra ruta especialmente sensible a diferencias entre `npm run dev` y la demo compilada.


## 4-4-26 Sbs

- Archivo: `src/modules/catalogos/actions/mutations.ts`
  Motivo: ajustar tambien la restauracion comun de `Sector` para que elimine los sectores personalizados que no esten en uso, manteniendo solo los que tengan empresas relacionadas.
  Impacto: la reposicion de sectores base deja el catalogo mas limpio sin romper referencias existentes y sin renunciar a conservar personalizados activos en datos reales.

- Archivo: `src/modules/catalogos/actions/mutations.sectores.test.ts`
  Motivo: ampliar la cobertura de sectores para comprobar el borrado de personalizados no usados durante la restauracion base.
  Impacto: la nueva limpieza del catalogo de sectores queda protegida frente a regresiones en la capa comun.

- Archivo: `src/app/api/catalogos/sectores/restaurar/route.test.ts`
  Motivo: alinear la prueba de la ruta de restauracion de sectores con el nuevo retorno que informa tambien de los personalizados eliminados.
  Impacto: la capa HTTP de restauracion mantiene cobertura coherente con el comportamiento real de la mutacion comun.

- Archivo: `src/modules/configuracion/components/ConfiguracionPanel.tsx`
  Motivo: actualizar el texto de confirmacion de restaurar sectores para advertir que los personalizados no usados tambien se eliminaran.
  Impacto: la UI informa mejor del efecto real de la accion antes de ejecutarla.

- Archivo: `README.md`
  Motivo: corregir la documentacion funcional de sectores para reflejar que la restauracion ya no conserva todos los personalizados, sino solo los que estan en uso.
  Impacto: la regla escrita del proyecto vuelve a coincidir con el runtime de Configuracion y con la politica acordada para sectores.

- Archivo: `src/modules/catalogos/actions/mutations.ts`
  Motivo: endurecer la politica comun de `CicloFormativo`, reservando los codigos base, impidiendo editar o borrar ciclos base y haciendo que la restauracion elimine personalizados no usados y bloquee conflictos de codigos reservados en uso.
  Impacto: se evita el problema de colision con la unicidad de `codigo` al restaurar valores base y se consolida un catalogo canonico estable para los ciclos iniciales.

- Archivo: `src/app/api/catalogos/ciclos-formativos/route.ts`
  Motivo: propagar en la API de alta el nuevo error funcional cuando se intenta crear un ciclo con un codigo reservado para el catalogo base.
  Impacto: Configuracion recibe una respuesta clara y evita introducir manualmente variantes que chocarian con la restauracion canonica.

- Archivo: `src/app/api/catalogos/ciclos-formativos/[id]/route.ts`
  Motivo: anadir respuestas funcionales especificas para ciclos base no editables/no eliminables y para cambios de codigo hacia valores reservados.
  Impacto: la API de mantenimiento de ciclos expresa ya toda la nueva politica sin mezclar estos casos con errores genericos o con la proteccion por uso.

- Archivo: `src/app/api/catalogos/ciclos-formativos/restaurar/route.ts`
  Motivo: hacer visible en la API de restauracion el bloqueo funcional cuando existen ciclos personalizados en uso con codigos reservados del catalogo base.
  Impacto: el usuario recibe un motivo accionable si la restauracion no puede completarse por un conflicto estructural de codigos.

- Archivo: `src/modules/configuracion/components/ConfiguracionPanel.tsx`
  Motivo: reflejar en la UI de Configuracion la nueva diferencia entre ciclos base y personalizados, deshabilitando edicion y borrado de los base y actualizando el texto de confirmacion de restauracion.
  Impacto: la pantalla de Configuracion evita proponer acciones que el servidor ya no permite y explica mejor el efecto real de restaurar ciclos.

- Archivo: `src/modules/catalogos/actions/mutations.ciclos.test.ts`
  Motivo: cubrir con pruebas unitarias la nueva politica de ciclos base, los codigos reservados y la restauracion con borrado de personalizados no usados y bloqueo por conflicto.
  Impacto: la logica comun de ciclos queda protegida frente a regresiones en los casos funcionales mas delicados de esta nueva fase.

- Archivo: `src/app/api/catalogos/ciclos-formativos/route.test.ts`
  Motivo: anadir cobertura de API para el rechazo de altas con codigos reservados en ciclos.
  Impacto: el contrato HTTP del alta de ciclos queda alineado con la nueva reserva de codigos base.

- Archivo: `src/app/api/catalogos/ciclos-formativos/[id]/route.test.ts`
  Motivo: cubrir tambien a nivel de ruta las nuevas restricciones de ciclos base no editables/no eliminables y el veto a mover personalizados a codigos reservados.
  Impacto: la capa API mantiene trazabilidad automatizada de la nueva politica especifica de ciclos.

- Archivo: `src/app/api/catalogos/ciclos-formativos/restaurar/route.test.ts`
  Motivo: verificar la nueva respuesta de restauracion cuando existe un conflicto con codigos reservados en ciclos personalizados en uso.
  Impacto: el bloqueo funcional de la restauracion queda protegido frente a regresiones en la capa HTTP.

- Archivo: `README.md`
  Motivo: actualizar la documentacion funcional para distinguir la politica de `Sector` y la de `CicloFormativo`, incluyendo la inmutabilidad manual de los ciclos base y el nuevo comportamiento de restauracion.
  Impacto: el equipo dispone de una regla escrita y coherente con el runtime actual, especialmente en lo relativo a codigos reservados y restauracion segura.

- Archivo: `src/modules/catalogos/types/sectores.ts`
  Motivo: definir el schema comun de validacion para altas y ediciones del catalogo maestro de sectores desde Configuracion.
  Impacto: la API de sectores comparte reglas de entrada consistentes antes de tocar la BD y evita validaciones ad hoc en cada ruta.

- Archivo: `src/modules/catalogos/actions/queries.ts`
  Motivo: anadir una consulta comun `getSectores()` para listar todos los sectores con estado, fechas y numero de empresas relacionadas.
  Impacto: Configuracion puede administrar el catalogo de sectores desde BD con informacion suficiente para activar, renombrar y proteger borrados.

- Archivo: `src/modules/catalogos/actions/mutations.ts`
  Motivo: incorporar las mutaciones comunes de sectores para crear, editar, restaurar la semilla base, bloquear el borrado cuando el sector ya esta en uso y tambien impedir renombrarlo si ya lo usan empresas.
  Impacto: el catalogo maestro de sectores queda gestionado con la misma politica conservadora aplicada a ciclos, permitiendo activar o desactivar sin romper referencias, pero evitando renombrados de valores ya operativos.

- Archivo: `src/app/api/catalogos/sectores/route.ts`
  Motivo: exponer la ruta comun de listado y alta de sectores para la pantalla de Configuracion.
  Impacto: la UI puede leer y crear sectores contra un endpoint propio, alineado con el patron ya usado en ciclos formativos.

- Archivo: `src/app/api/catalogos/sectores/[id]/route.ts`
  Motivo: anadir la ruta comun de actualizacion y borrado de sectores con validacion de id y mensajes funcionales tanto para bloqueo de borrado como para intento de renombrado cuando el sector ya esta en uso.
  Impacto: Configuracion mantiene un contrato HTTP claro y coherente con la politica de catalogos protegidos una vez tienen uso real.

- Archivo: `src/app/api/catalogos/sectores/restaurar/route.ts`
  Motivo: incorporar una accion explicita para restaurar los sectores base definidos en la semilla canonica del proyecto.
  Impacto: el equipo puede reponer desde Configuracion los sectores iniciales sin sembrar datos silenciosamente durante lecturas normales.

- Archivo: `src/app/api/catalogos/sectores/route.test.ts`
  Motivo: cubrir con pruebas de ruta el listado y alta de sectores, incluyendo validacion de entrada, conflicto por duplicado y revalidacion de Configuracion.
  Impacto: el contrato HTTP del alta de sectores queda protegido frente a regresiones en mensajes, estados y respuesta JSON.

- Archivo: `src/app/api/catalogos/sectores/[id]/route.test.ts`
  Motivo: anadir cobertura de API para la edicion y el borrado de sectores, incluyendo ids invalidos, no encontrados, duplicados y bloqueo por uso en empresas tanto al editar como al borrar.
  Impacto: las operaciones de mantenimiento de sectores quedan verificadas tambien en su capa HTTP, no solo en las mutaciones internas.

- Archivo: `src/app/api/catalogos/sectores/restaurar/route.test.ts`
  Motivo: verificar la ruta de restauracion explicita de sectores base y su manejo de error.
  Impacto: la accion de reposicion desde Configuracion mantiene cobertura automatizada completa en el endpoint.

- Archivo: `src/modules/catalogos/actions/mutations.sectores.test.ts`
  Motivo: cubrir con pruebas unitarias la normalizacion, la restauracion base y el bloqueo por uso tanto del renombrado como del borrado en el CRUD comun de sectores.
  Impacto: la gestion de sectores queda protegida frente a regresiones en la capa compartida antes de que otros modulos dependan de ella.

- Archivo: `src/app/configuracion/page.tsx`
  Motivo: cargar tambien el catalogo de sectores en la entrada server de la pagina de Configuracion.
  Impacto: la vista recibe en SSR los sectores actuales de BD junto con ciclos y settings, sin depender de una carga inicial cliente adicional.

- Archivo: `src/modules/empresas/actions/mutations.ts`
  Motivo: arrancar la segunda fase de la transicion resolviendo en servidor `sectorId` y `localidadId` desde los catalogos activos cuando se crean, editan o importan empresas, manteniendo por ahora el contrato cliente basado en nombres visibles.
  Impacto: la persistencia de empresas empieza a poblar ya las relaciones reales con `sectores` y `localidades` sin exigir un cambio simultaneo en la UI ni en el payload del formulario.

- Archivo: `src/modules/empresas/actions/mutations.test.ts`
  Motivo: cubrir con pruebas unitarias la resolucion de `sectorId` y `localidadId` en altas, ediciones e importacion masiva de empresas.
  Impacto: la nueva logica server de catalogos queda verificada de forma aislada antes de seguir avanzando hacia la limpieza de campos legacy.

- Archivo: `src/modules/catalogos/actions/queries.ts`
  Motivo: ampliar el contrato comun de catalogos de empresas para exponer tambien `id` y `nombre` en sectores y localidades, igual que ya se hacia con ciclos.
  Impacto: la UI y los consumidores comunes pueden prepararse para trabajar con relaciones reales sin perder los nombres visibles necesarios en formularios, filtros e import/export.

- Archivo: `src/modules/empresas/types/index.ts`
  Motivo: introducir un tipo compartido `CatalogoOption` para representar opciones de catalogo tipadas por `id` y `nombre`.
  Impacto: empresas deja de repetir contratos ad hoc y puede evolucionar hacia ids reales con menos riesgo de desalineacion entre componentes.

- Archivo: `src/modules/empresas/components/LocalidadCombobox.tsx`
  Motivo: adaptar el combobox de localidades a opciones tipadas del catalogo maestro, manteniendo como valor visible el nombre seleccionado.
  Impacto: el componente sigue funcionando igual para el usuario, pero ya no depende de arrays planos si en la siguiente fase necesitamos propagar ids al formulario.

- Archivo: `src/modules/empresas/components/EmpresaForm.tsx`
  Motivo: hacer que el formulario de empresas consuma sectores y localidades como opciones tipadas de catalogo, manteniendo por ahora el envio por nombre para no romper el contrato cliente.
  Impacto: el formulario queda preparado para el siguiente salto a ids sin mezclar todavia ese cambio con la UX actual.

- Archivo: `src/modules/empresas/components/EmpresasTable.tsx`
  Motivo: adaptar los filtros visibles del listado de empresas a las nuevas opciones tipadas del catalogo de sectores y localidades.
  Impacto: la tabla mantiene el mismo comportamiento funcional, pero ya consume el contrato unificado del catalogo maestro.

- Archivo: `src/modules/empresas/components/EmpresasContainer.tsx`
  Motivo: alinear el contenedor de empresas con el nuevo contrato de catalogos tipados para sectores y localidades devueltos por la API comun.
  Impacto: el modulo puede seguir mostrando y filtrando por nombre mientras internamente deja preparada la capa cliente para trabajar con ids mas adelante.

- Archivo: `src/modules/empresas/types/index.ts`
  Motivo: ampliar el contrato compartido de `Empresa` para exponer tambien `sectorId` y `localidadId`.
  Impacto: cliente y servidor ya pueden transportar las relaciones reales de catalogo aunque todavia convivan con registros legacy sin migrar.

- Archivo: `src/modules/empresas/actions/queries.ts`
  Motivo: iniciar la tercera fase en lecturas, incluyendo `sectorRef` y `localidadRef` y derivando desde ellas `sector`, `localidad`, `sectorId` y `localidadId`.
  Impacto: el listado y el detalle de empresas quedan alineados con el modelo relacional final de catalogos y ya no dependen de columnas legacy de texto.

- Archivo: `src/modules/empresas/actions/queries.test.ts`
  Motivo: cubrir la normalizacion de lecturas de empresas ya sobre relaciones de sector y localidad como modelo final.
  Impacto: queda verificado que la capa de consultas responde con nombres e ids coherentes sin depender de columnas legacy.

- Archivo: `src/modules/empresas/actions/queries.ts`
  Motivo: hacer que los filtros de empresas consulten por las relaciones `sectorRef` y `localidadRef` como unica fuente operativa de catalogo.
  Impacto: las busquedas y listados quedan alineados con el catalogo maestro final y dejan de depender de columnas legacy de texto.

- Archivo: `src/modules/importexport/actions/import.ts`
  Motivo: completar la validacion server de importacion de empresas resolviendo tambien `sector` y `localidad` contra catalogos activos de BD antes de llegar a la mutacion final.
  Impacto: el usuario recibe incidencias por fila mas claras en import/export y se evita aceptar datos que ya no existan en el catalogo operativo.

- Archivo: `src/modules/importexport/actions/import.test.ts`
  Motivo: cubrir el bloqueo de importaciones de empresas cuando `sector` o `localidad` no existen en el catalogo activo.
  Impacto: la importacion masiva queda protegida frente a regresiones en esta validacion ya alineada con la fuente de verdad en BD.

- Archivo: `src/modules/formacion/actions/queries.ts`
  Motivo: hacer que las lecturas comunes de formacion resuelvan `sector` y `localidad` de la empresa desde `sectorRef` y `localidadRef`.
  Impacto: formacion consume ya la fuente relacional final de catalogos en empresas y deja de depender de columnas legacy.

- Archivo: `src/modules/formacion/actions/queries.test.ts`
  Motivo: cubrir la resolucion de `sector` y `localidad` de empresa en formacion directamente desde las relaciones de catalogo.
  Impacto: queda verificada la lectura del modelo final sin dependencias de columnas legacy.

- Archivo: `src/modules/formacion/actions/mutations.ts`
  Motivo: alinear tambien las respuestas de alta y edicion de formacion para que `sector` y `localidad` de la empresa salgan desde `sectorRef` y `localidadRef`.
  Impacto: formacion evita reintroducir datos legacy en respuestas inmediatas tras crear o editar registros y mantiene un unico criterio de lectura en todo el modulo.

- Archivo: `src/modules/formacion/actions/mutations.test.ts`
  Motivo: cubrir en mutaciones de formacion la resolucion de empresa desde relaciones de catalogo.
  Impacto: las respuestas de create/update quedan protegidas frente a regresiones ya sobre el modelo final sin legacy.

- Archivo: `src/modules/formacion/types/index.ts`
  Motivo: alinear los tipos compartidos de `formacion` con la forma real de las respuestas, exponiendo tambien `sectorId`, `localidadId` y `cicloFormativoId`/`cicloFormativo` de la empresa.
  Impacto: reducimos desajustes entre runtime y TypeScript en el modelo final ya sin columnas legacy para sector y localidad.

- Archivo: `src/shared/utils/empresaCatalogos.ts`
  Motivo: centralizar en un helper comun la normalizacion de `sector`, `localidad` y `cicloFormativo` de empresa desde sus relaciones de catalogo.
  Impacto: el criterio de lectura compartido queda mantenido en un unico punto ya sobre el modelo final sin columnas legacy.

- Archivo: `src/modules/importexport/actions/export.ts`
  Motivo: hacer que la exportacion de empresas saque `sector` y `localidad` directamente desde las relaciones de catalogo.
  Impacto: los excels de empresas quedan desacoplados de las columnas legacy y alineados con el modelo final.

- Archivo: `src/modules/importexport/actions/export.test.ts`
  Motivo: ajustar la cobertura de exportacion para comprobar que sector y localidad salen del modelo relacional final.
  Impacto: la salida Excel queda protegida frente a regresiones ya sin depender de columnas legacy.

- Archivo: `src/modules/empresas/types/schema.ts`
  Motivo: retirar de la validacion compartida de empresas la dependencia runtime de `SECTORES` y `LOCALIDADES` estaticos, dejando la comprobacion de catalogo real en la capa server contra la BD.
  Impacto: el formulario y la API dejan de validar contra semillas de codigo que ya solo deben servir para `seed` o restauraciones, y quedan alineados con la regla de que la fuente operativa de catalogos es la base de datos.

- Archivo: `prisma/migrations/20260404194500_drop_legacy_empresa_sector_localidad_text_fields/migration.sql`
  Motivo: cerrar definitivamente la transicion de catalogos de empresas con una unica migracion que completa el enlace por ids, bloquea si quedan registros sin resolver, elimina las columnas legacy de texto y hace obligatorios `sectorId` y `localidadId`.
  Impacto: el esquema fisico y el modelo Prisma quedan alineados ya sin compatibilidades transitorias para sector y localidad.

- Archivo: `README.md`
  Motivo: se anoto inicialmente una verificacion operativa temporal tras el backfill de catalogos de empresas, pero se decide trasladarla a `TODO.md` porque no forma parte de la documentacion permanente del proyecto.
  Impacto: el `README` vuelve a recoger solo reglas estables del repositorio, mientras que el control transitorio de auditoria queda donde corresponde hasta completar toda la migracion.

- Archivo: `src/app/api/empresas/route.ts`
  Motivo: propagar a la API de alta de empresas errores semanticos claros cuando el sector o la localidad ya no existen en el catalogo activo.
  Impacto: el cliente recibe respuestas funcionales de validacion en vez de errores genericos si el catalogo de BD ha cambiado respecto a lo que la UI aun mostraba.

- Archivo: `src/app/api/empresas/[id]/route.ts`
  Motivo: propagar tambien en la API de edicion de empresas los nuevos errores semanticos ligados a sectores y localidades inactivos o inexistentes.
  Impacto: las ediciones quedan alineadas con la validacion server de catalogos reales sin mezclar fallos funcionales con errores internos.

- Archivo: `src/app/api/empresas/route.test.ts`
  Motivo: anadir cobertura de la nueva respuesta `400` cuando el servidor detecta un sector fuera del catalogo activo.
  Impacto: la ruta de alta queda protegida frente a regresiones en el nuevo manejo de errores de catalogo.

- Archivo: `src/app/api/empresas/[id]/route.test.ts`
  Motivo: anadir cobertura de la nueva respuesta `400` cuando el servidor detecta una localidad fuera del catalogo activo durante una edicion.
  Impacto: la ruta de actualizacion mantiene trazabilidad automatizada del contrato de error introducido en esta fase.

- Archivo: `src/modules/importexport/utils.ts`
  Motivo: completar la primera fase de bajo riesgo de la transicion de catalogos, haciendo que las validaciones previas y las plantillas Excel tomen `sectores` y `localidades` desde `/api/catalogos/empresas` en lugar de seguir leyendo los arrays estaticos en codigo.
  Impacto: import/export pasa a reflejar el catalogo activo real de BD para sectores y localidades sin tocar todavia la persistencia de empresas ni los ids de esas relaciones.

- Archivo: `src/modules/importexport/utils.test.ts`
  Motivo: ajustar el mock del endpoint de catalogos para cubrir tambien `sectores` y `localidades` servidos desde la API comun.
  Impacto: la suite de utilidades sigue verificando la validacion previa de Excel contra el contrato actual del endpoint de catalogos.

- Archivo: `src/modules/informes/components/InformesPanel.tsx`
  Motivo: arrancar la limpieza final de la transicion de ciclos haciendo que informes consuma `cicloFormativoNombre` en alumnos y formacion, en lugar de seguir dependiendo de los aliases legacy `ciclo`.
  Impacto: el primer modulo pendiente de esta transicion queda alineado con el contrato final de ciclos sin exigir todavia cambios simultaneos en el resto de consumidores.

- Archivo: `TODO.md`
  Motivo: convertir el cierre pendiente de la transicion de ciclos en una checklist por fases pequenas, marcando ya como completado el paso de `informes`.
  Impacto: el resto de la limpieza queda secuenciado de forma mas segura y visible antes de retirar aliases y helpers comunes.

- Archivo: `src/modules/alumnos/actions/queries.ts`
  Motivo: retirar el alias legacy `ciclo` de las respuestas de alumnos al comprobar que las vistas cliente ya consumen `cicloFormativoNombre` y `cicloFormativoCodigo`.
  Impacto: alumnos queda un paso mas cerca del contrato final de ciclos y deja de exponer un campo redundante de compatibilidad.

- Archivo: `TODO.md`
  Motivo: marcar como completado el cierre del alias `ciclo` en alumnos dentro de la checklist de transicion de ciclos.
  Impacto: el seguimiento del trabajo pendiente refleja ya que esta segunda fase ha quedado resuelta.

- Archivo: `src/modules/formacion/actions/queries.ts`
  Motivo: retirar el alias legacy `ciclo` del alumno en las respuestas de formacion al comprobar que las vistas cliente ya consumen `cicloFormativoNombre` y `cicloFormativoCodigo`.
  Impacto: formacion deja de exponer otro campo redundante de compatibilidad y se acerca al contrato final de ciclos.

- Archivo: `src/modules/formacion/actions/mutations.ts`
  Motivo: alinear tambien las respuestas inmediatas de create/update de formacion con la retirada del alias legacy `ciclo`.
  Impacto: todo el modulo mantiene un unico contrato de salida para ciclos del alumno, sin mezclar aliases heredados.

- Archivo: `TODO.md`
  Motivo: marcar como completado el cierre del alias `ciclo` en formacion dentro de la checklist de transicion de ciclos.
  Impacto: el seguimiento del trabajo pendiente refleja ya que esta tercera fase ha quedado resuelta.

- Archivo: `src/modules/catalogos/actions/queries.ts`
  Motivo: ampliar el catalogo comun de empresas para devolver tambien `codigo` en ciclos formativos.
  Impacto: empresas puede pintar el badge del ciclo desde el catalogo activo sin depender de helpers estaticos de compatibilidad.

- Archivo: `src/modules/empresas/components/EmpresasContainer.tsx`
  Motivo: dejar de pasar `CICLO_LABEL` a la tabla de empresas y apoyarse solo en el catalogo cargado desde la API comun.
  Impacto: el contenedor elimina otra dependencia runtime a helpers estaticos de ciclos.

- Archivo: `src/modules/empresas/components/EmpresasTable.tsx`
  Motivo: resolver el codigo visible del ciclo desde el catalogo activo cargado en cliente, en lugar de usar `CICLO_LABEL`.
  Impacto: la tabla de empresas queda alineada con la fuente de verdad de ciclos y deja de depender de compatibilidades heredadas.

- Archivo: `src/shared/catalogs/academico.ts`
  Motivo: eliminar `CICLOS_FORMATIVOS`, `CICLO_LABEL` y `getCicloLabel` al comprobar que ya no quedaban consumidores runtime tras completar la limpieza de ciclos.
  Impacto: el archivo comun conserva la semilla canonica y los badges vigentes, sin helpers sobrantes de la transicion.

- Archivo: `TODO.md`
  Motivo: marcar como completada la revision final de `CICLO_LABEL` y `CICLOS_FORMATIVOS` dentro de la checklist de transicion de ciclos.
  Impacto: el seguimiento refleja que ya no quedan helpers runtime pendientes de revisar en esta transicion.

- Archivo: `TODO.md`
  Motivo: cerrar tambien la comprobacion final de consumidores cliente de `alumnos` y `formacion` y retirar del `TODO` el bloque de la transicion de ciclos ya completada.
  Impacto: el archivo de pendientes deja de arrastrar restos de una migracion ya cerrada y vuelve a reflejar solo trabajo realmente abierto.

- Archivo: `src/modules/informes/components/InformesPanel.tsx`
  Motivo: adaptar el uso de `LocalidadCombobox` en filtros de informes para pasarle opciones tipadas `{ id, nombre }`, igual que el resto del proyecto.
  Impacto: se evita un desajuste de tipos que podia terminar rompiendo la compilacion del cliente al cargar informes.

- Archivo: `src/modules/empresas/actions/queries.test.ts`
  Motivo: ajustar las llamadas de prueba al contrato tipado actual de `getEmpresas`, informando `page` de forma explicita.
  Impacto: la comprobacion de tipos queda limpia y las pruebas siguen cubriendo el comportamiento real del listado de empresas.

- Archivo: `src/modules/empresas/actions/mutations.ts`
  Motivo: alinear la importacion masiva de empresas con el esquema final, marcando `sectorId` y `localidadId` como obligatorios tras la validacion previa y el cierre de la migracion.
  Impacto: Prisma deja de recibir `null` imposibles en `createMany` y el runtime de empresas vuelve a quedar consistente con la base de datos actual.

- Archivo: `src/modules/informes/components/InformesPanel.tsx`
  Motivo: completar la misma primera fase en informes, cargando `sectores` y `localidades` desde `/api/catalogos/empresas` en lugar de reconstruirlos a partir de las empresas ya existentes.
  Impacto: los filtros de informes muestran el catalogo activo aunque todavia no haya empresas usando alguno de sus valores, y se reduce la dependencia del dato textual persistido en `Empresa`.

## 2-4-26 Oma

- Archivo: `src/modules/importexport/utils.ts`
  Motivo: hacer tolerante el mapeo y la validacion previa de import/export ante cabeceras equivalentes con y sin tildes, para no depender de que el Excel use exactamente la misma grafia visible que las columnas actuales.
  Impacto: la importacion y las comprobaciones previas aceptan variantes como `Telefono`/`Teléfono`, `Periodo`/`Período` o `Descripcion`/`Descripción` sin dejar campos vacios ni generar errores falsos tras el merge.

- Archivo: `src/modules/importexport/utils.test.ts`
  Motivo: actualizar las pruebas de utilidades de import/export para reflejar las etiquetas reales de columnas vigentes y cubrir la nueva tolerancia a cabeceras equivalentes.
  Impacto: la suite vuelve a verificar correctamente la reconstruccion de filas, la deteccion de duplicados y el mapeo de telefonos con el contrato actual del modulo.

- Archivo: `src/modules/importexport/actions/export.test.ts`
  Motivo: alinear las expectativas de exportacion con los nombres de columnas actualmente usados en alumnos y formacion, incluyendo etiquetas acentuadas.
  Impacto: los tests de exportacion validan el formato real que se entrega al usuario y dejan de fallar por diferencias cosmeticas introducidas en merges previos.

- Archivo: `src/modules/importexport/actions/import.test.ts`
  Motivo: ajustar los mensajes esperados de validacion para que coincidan con la redaccion y acentuacion reales del esquema vigente tras el merge.
  Impacto: la suite de importacion vuelve a cubrir los casos de error funcionales sin falsos negativos por cambios solo textuales en los mensajes.

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
