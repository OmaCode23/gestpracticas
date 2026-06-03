Asunto: Auditoria de cambios en Ofertas, Cursos y Configuracion

Fecha: 3 de junio de 2026

Resumen

Se han realizado cambios en los modulos de Ofertas, Cursos y Configuracion para sustituir campos de texto libre por selectores basados en catalogos y datos reales de la aplicacion. Tambien se ha aplicado la migracion correspondiente en la base de datos local y se han ejecutado las pruebas automatizadas.

Cambios realizados

1. Ofertas de practicas
- El campo Empresa deja de ser un texto libre en el formulario.
- La empresa se selecciona ahora desde un combo box cargado desde la tabla empresas del modulo de Empresas.
- Las ofertas nuevas se guardan enlazadas a `empresaId`.
- Las tablas y el portal siguen mostrando el nombre de la empresa de forma legible.
- Se mantiene compatibilidad con ofertas antiguas que no hayan podido enlazarse automaticamente.

2. Cursos externos
- El campo Proveedor pasa a seleccionarse mediante combo box.
- El campo Area pasa a seleccionarse mediante combo box.
- El campo Nivel pasa a seleccionarse mediante combo box con estas opciones:
  - Principiante
  - Intermedio
  - Avanzado
- El campo Modalidad pasa a seleccionarse mediante combo box con estas opciones:
  - Online
  - Semipresencial
  - Presencial
- Los cursos guardan los identificadores de proveedor y area, y muestran el nombre actualizado del catalogo.

3. Configuracion
- Se han añadido dos nuevos apartados de catalogo:
  - Proveedores de cursos
  - Areas de cursos
- Desde Configuracion se puede:
  - Crear proveedores y areas.
  - Editar sus nombres.
  - Activarlos o desactivarlos.
  - Eliminarlos si no estan siendo usados por ningun curso.
- Si un proveedor o area ya esta asociado a cursos, el borrado queda bloqueado para evitar dejar registros inconsistentes.

4. Base de datos
- Se ha creado y aplicado la migracion `20260603170000_course_offer_catalogs`.
- La migracion crea las tablas:
  - `curso_proveedores`
  - `curso_areas`
- La migracion añade relaciones en:
  - `cursos_externos.proveedor_id`
  - `cursos_externos.area_id`
  - `ofertas_practicas.empresa_id`
- Se han rellenado automaticamente los catalogos de proveedores y areas a partir de los cursos existentes.
- Se han enlazado ofertas con empresas existentes cuando el nombre coincidia.
- Se han normalizado niveles antiguos como `Inicial` a `Principiante`.

5. Pruebas y verificacion
- Se ha regenerado Prisma Client.
- La base de datos queda sin migraciones pendientes.
- TypeScript compila correctamente.
- La bateria de pruebas automatizadas pasa correctamente:
  - 50 archivos de test superados.
  - 289 tests superados.
- Se han añadido pruebas especificas para validar:
  - Cursos con proveedor y area por ID de catalogo.
  - Rechazo de niveles/modalidades no permitidos.
  - Ofertas con empresa seleccionada por `empresaId`.
  - Rechazo de empresa como texto libre en nuevas ofertas.

Estado final

Los requisitos solicitados quedan implementados y verificados en el entorno local. La base de datos local ya tiene aplicada la migracion nueva y el esquema esta actualizado.
