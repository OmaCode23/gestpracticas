# Sistema de login

## Objetivo final

El objetivo final es que la aplicacion use autenticacion externa con cuentas institucionales `@edu.gva.es`, previsiblemente a traves del sistema de identidad de la Generalitat si el responsable TIC confirma que:

- existe un proveedor de identidad utilizable por aplicaciones del centro;
- puede registrarse una aplicacion propia;
- pueden obtenerse los datos minimos necesarios del usuario autenticado.

En ese escenario:

- la autenticacion se haria fuera de nuestra aplicacion;
- la aplicacion no almacenaria contrasenas locales de profesorado o administradores;
- la autorizacion se decidiria en nuestra propia base de datos.

## Criterio de acceso acordado

No se confiara solo en que el usuario tenga un correo del dominio `@edu.gva.es`.

El criterio de acceso sera:

1. El usuario se autentica correctamente en el proveedor externo.
2. La aplicacion busca su email en la tabla `Usuario`.
3. Solo se permite el acceso si existe un `Usuario` activo y autorizado.

Esto evita que pueda entrar cualquier persona con una cuenta `@edu.gva.es` de otro centro.

## Solucion temporal mientras responde TIC

Mientras no se confirme la integracion real con `edu.gva.es`, se implementara un sistema de login local que simule esa autenticacion externa para poder avanzar el resto de la arquitectura de forma practicamente definitiva.

La idea es separar:

- identidad autorizada en la aplicacion;
- credenciales temporales de acceso local.

## Modos de autenticacion

La aplicacion debe diferenciar explicitamente dos modos mediante `AUTH_MODE`:

- `local`: modo temporal de desarrollo o despliegue provisional, con credenciales locales.
- `external`: modo objetivo para autenticacion externa, sin gestion de contrasenas en la aplicacion.

Consecuencias:

- en `local` si existen contrasenas temporales, cambio de contrasena y reseteo por administrador;
- en `external` la aplicacion no crea, guarda, cambia ni resetea contrasenas.

## Variables de entorno relevantes

- `AUTH_SECRET`: secreto para firma de sesion y estado de autenticacion.
- `AUTH_MODE`: `local` o `external`.
- `EXTERNAL_AUTH_AUTHORIZE_URL`: endpoint de autorizacion del proveedor externo.
- `EXTERNAL_AUTH_CLIENT_ID`: identificador de cliente de la aplicacion registrada.
- `EXTERNAL_AUTH_REDIRECT_URI`: callback registrado en el proveedor externo.
- `EXTERNAL_AUTH_SCOPE`: scopes solicitados, por defecto `openid profile email`.
- `EXTERNAL_AUTH_ALLOW_MOCK_CALLBACK`: solo para pruebas del flujo externo sin proveedor real.

## Estado tecnico implementado

Actualmente ya existe una base funcional implementada con estas piezas:

- sesion en servidor con cookie `httpOnly`;
- tabla `Usuario` como fuente de verdad de autorizacion;
- soporte de `AUTH_MODE=local` y `AUTH_MODE=external`;
- bootstrap del primer administrador;
- gestion de usuarios accesible solo para `ADMIN`;
- proteccion de paginas y rutas API relevantes en servidor;
- proteccion especifica del portal del alumno por rol `ALUMNO`;
- capa central de permisos por rol en codigo;
- middleware de prefiltrado de acceso con limpieza de cookies invalidas;
- flujo externo reservado para futura integracion real con proveedor OIDC.

## Modelo funcional previsto

### Tabla `Usuario`

La tabla `Usuario` sera la fuente de verdad de autorizacion dentro de la aplicacion.

Debe almacenar al menos:

- `email`
- `nombre`
- `iniciales`
- `rol`
- `activo`
- `lastLoginAt` o equivalente
- en el futuro, datos de identidad externa como `authProvider` y `authSubject`

Roles previstos:

- `ADMIN`
- `PROFESOR`
- `ALUMNO`

### Tabla temporal de autenticacion local

Se prefiere crear una tabla separada para las credenciales locales temporales, en lugar de guardar la contrasena directamente en `Usuario`.

Ejemplo conceptual:

- `Usuario`: autorizacion y datos del usuario dentro de la app
- `LocalAuthAccount`: hash de contrasena y configuracion temporal del acceso local, identificado por `email`

De este modo, cuando se sustituya el login local por el login con `edu.gva.es`, la tabla `Usuario` seguira siendo valida y la migracion sera pequena.

`LocalAuthAccount` no debe tener clave ajena ni relacion estructural con `Usuario`.

La relacion entre ambas piezas debe resolverse solo en codigo por `email`, no por un id interno de `Usuario`, porque el identificador funcional compartido entre autenticacion local temporal y futura autenticacion externa es el correo del usuario autorizado.

Esto busca que la tabla local temporal se comporte lo mas parecido posible a un proveedor externo sustituible:

- `Usuario` representa autorizacion interna;
- `LocalAuthAccount` representa una fuente de credenciales separada;
- la aplicacion cruza ambas por email en el momento del login o de la gestion de credenciales;
- si en el futuro la autenticacion externa llega por OIDC, API o servicio independiente, el cambio quede concentrado en la capa de autenticacion y no en el modelo de autorizacion.

## Administrador inicial

Se necesita al menos un usuario administrador para romper el circulo inicial.

Ese primer administrador:

- no se creara desde una pantalla publica;
- se dara de alta por semilla, script o accion equivalente desde despliegue o consola;
- tendra rol `ADMIN`.

Si la autenticacion final es externa:

- en nuestra base de datos solo se registrara su email y sus datos de autorizacion;
- la contrasena no se almacenara en la aplicacion.

Mientras el login sea local temporal:

- el administrador tambien tendra una credencial local temporal en la tabla correspondiente.

El script de bootstrap del administrador:

- no debe llevar un email hardcodeado en codigo;
- debe aceptar el email por argumento o variable de entorno;
- puede solicitarlo por consola si falta en una ejecucion manual;
- solo debe pedir contrasena en `AUTH_MODE=local`;
- en `AUTH_MODE=external` solo debe insertar o actualizar el usuario administrador autorizado.

### Puesta en marcha del administrador inicial

Una vez desplegada la aplicacion y preparada la base de datos, el alta del primer administrador se realiza con el script de bootstrap.

Pasos previos:

1. aplicar las migraciones de Prisma;
2. definir `AUTH_SECRET`;
3. elegir el modo de autenticacion con `AUTH_MODE`.

Si se va a trabajar temporalmente con login local, el modo debe ser:

- `AUTH_MODE=local`

Y el administrador inicial se crea con email, nombre y contrasena:

```bash
npm run db:bootstrap-admin -- --email admin@edu.gva.es --password TuClaveInicial --name "Administrador"
```

Si se quiere dejar la aplicacion alineada con el futuro login externo, el modo debe ser:

- `AUTH_MODE=external`

Y el administrador inicial se autoriza solo por email y nombre, sin contrasena local:

```bash
npm run db:bootstrap-admin -- --email admin@edu.gva.es --name "Administrador"
```

Comportamiento adicional del script:

- si no se pasa `--email`, lo solicita por consola;
- si `AUTH_MODE=local` y no se pasa `--password`, tambien lo solicita por consola;
- si se ejecuta de nuevo con el mismo email, actualiza ese usuario como `ADMIN` activo;
- si se ejecuta con otro email, no desactiva automaticamente al administrador anterior.

## Gestion posterior de usuarios

Una vez exista un administrador autenticado, la aplicacion tendra una pantalla de gestion de usuarios accesible solo para `ADMIN`.

Desde esa pantalla se podra:

- crear usuarios autorizados;
- asignar rol;
- activar o desactivar acceso;
- eliminar usuarios con restricciones de seguridad;
- en la fase temporal local, crear o resetear credenciales locales;
- en el futuro, gestionar el acceso sin almacenar contrasenas locales.

En `AUTH_MODE=external` no se mostraran acciones de cambio o reseteo de contrasena.

## Matriz de permisos por rol

### `ADMIN`

Puede:

- iniciar sesion si esta autorizado y activo;
- acceder a todos los modulos existentes de la aplicacion;
- crear usuarios;
- editar usuarios;
- eliminar usuarios, salvo:
  - su propio usuario administrador;
  - el ultimo administrador activo;
- activar o desactivar usuarios;
- en `AUTH_MODE=local`, asignar o resetear contrasenas temporales;
- importar datos masivamente desde Excel;
- exportar datos;
- gestionar configuracion academica;
- gestionar catalogos maestros como sectores y ciclos formativos;
- restaurar valores base de catalogos.

### `PROFESOR`

Puede:

- iniciar sesion si esta autorizado y activo;
- acceder a los modulos funcionales ya existentes de la aplicacion;
- consultar, crear, editar o eliminar datos funcionales segun las capacidades ya presentes en cada modulo de negocio;
- exportar datos;
- descargar plantillas de importacion.

No puede:

- acceder a la gestion de usuarios;
- crear usuarios;
- editar usuarios;
- eliminar usuarios;
- importar datos masivamente desde Excel;
- modificar configuracion academica;
- modificar catalogos maestros;
- restaurar catalogos base.

### `ALUMNO`

Actualmente ya existe un alcance funcional inicial para `ALUMNO`, aunque todavia no equivale a un portal completo de practicas.

Hoy puede:

- iniciar sesion solo si esta autorizado y activo;
- acceder al `portal-alumno`;
- ver las paginas propias del portal del alumno;
- ver el control de sesion/login tambien dentro del portal.

No puede:

- acceder al panel interno general;
- acceder a administracion, configuracion o importacion/exportacion interna;
- acceder al CRUD global de alumnos, empresas o formacion.

El contenido actual del portal del alumno es todavia inicial y esta preparado para crecer, pero ya queda protegido con un alcance distinto del profesorado y de administracion.

## Capa central de permisos

La matriz de permisos no debe aplicarse mediante comparaciones dispersas del tipo `rol === "ADMIN"` repartidas por toda la aplicacion.

Actualmente ya existe una capa central reutilizable en codigo para expresar estas decisiones de autorizacion.

Objetivos de esta capa:

- centralizar la politica de permisos por rol;
- hacer mas legibles las comprobaciones de autorizacion;
- reducir incoherencias al cambiar reglas de negocio;
- facilitar pruebas unitarias especificas sobre permisos.

Permisos actualmente centralizados:

- `isAdminRole`
- `isAlumnoRole`
- `canManageUsers`
- `canImportExcel`
- `canManageCatalogs`
- `canManageAcademicSettings`

Uso previsto:

- paginas servidor;
- rutas API;
- navegacion e interfaz, solo como reflejo visual de permisos ya comprobados en servidor.

Regla de mantenimiento:

- cuando cambie la matriz de permisos, debe actualizarse primero esta capa central;
- despues deben ajustarse las rutas o pantallas que la consumen;
- y por ultimo deben revisarse los tests asociados.

## Flujo previsto de la aplicacion

### Fase temporal

1. El administrador o el despliegue crea usuarios en `Usuario`.
2. Si el login es local, existe una credencial temporal asociada.
3. El usuario inicia sesion con email y contrasena local.
4. La aplicacion crea una sesion segura.
5. La autorizacion se decide por `Usuario.activo` y `Usuario.rol`.

### Fase definitiva

1. El usuario inicia sesion en `edu.gva.es`.
2. La aplicacion recibe la identidad autenticada.
3. Se busca el email en `Usuario`.
4. Si el usuario existe y esta activo, se permite el acceso.
5. El rol en `Usuario` decide que pantallas y acciones estan permitidas.

Mientras no se conozcan todos los datos del proveedor real, la aplicacion deja preparado:

- un inicio de autorizacion externo con parametros OIDC estandar;
- una ruta callback reservada;
- la autorizacion local por email y usuario activo en `Usuario`;
- una simulacion opcional del callback externo solo para pruebas controladas.

## Seguridad acordada

- No habra registro publico abierto.
- No se confiara solo en el dominio `@edu.gva.es`.
- No se guardaran contrasenas en claro.
- La sesion se gestionara en servidor con cookie segura `httpOnly`.
- La pantalla de gestion de usuarios sera solo para administradores.
- El bootstrap del primer administrador no se expondra como funcionalidad publica web.

## Capas de seguridad implementadas

La autorizacion no debe depender solo de lo visible en pantalla.

### 1. Visibilidad en interfaz

La `Navbar` y otros componentes de interfaz ocultan o muestran enlaces segun rol.

Esto mejora la UX, pero no se considera una barrera de seguridad suficiente por si sola.

### 2. Guardias server-side en paginas y layouts

Las paginas privadas del panel interno usan guardias en servidor:

- `requireUserSession`
- `requireAdminSession`
- `requireAlumnoSession`

Objetivo:

- redirigir a `/login` si no hay sesion real valida;
- forzar cambio de contrasena en `AUTH_MODE=local` cuando corresponda;
- bloquear acceso por rol aunque el usuario conozca la URL.

El portal del alumno queda protegido de forma comun desde su `layout`, de modo que todas sus paginas heredan la exigencia de sesion valida y rol `ALUMNO`.

### 3. Proteccion de rutas API

Las rutas API privadas no deben confiar solo en el `middleware`.

Actualmente la capa API usa:

- `ensureApiUser`
- `ensureApiAdmin`
- `requireApiUserSession`
- `requireApiAdminSession`

Objetivo:

- devolver `401` o `403` cuando falte sesion o rol;
- evitar que una ruta privada quede accesible por llamada directa;
- mantener la misma politica de autorizacion que las paginas servidor.

### 4. Revalidacion en consultas server-side sensibles

Cuando un modulo nuevo introduce consultas server-side propias, no debe asumir que la proteccion del layout es suficiente si esas consultas pueden reutilizarse desde otros puntos.

Por eso las consultas actuales del portal del alumno revalidan tambien `requireAlumnoSession(...)` antes de leer datos.

### 5. Middleware como filtro previo, no como autorizacion completa

El `middleware` actual cumple un papel deliberadamente limitado:

- bloquea acceso anonimo obvio a rutas privadas;
- permite el acceso a `/login`;
- limpia cookies de sesion con firma invalida;
- devuelve `401` temprano en APIs cuando no hay una cookie utilizable.

No se apoya en Prisma ni valida por si mismo:

- existencia real de la sesion en BD;
- expiracion real de la sesion;
- estado activo del usuario;
- rol del usuario.

Esa validacion fuerte se deja a las guardias server-side y a la capa API.

## Visibilidad y acceso actual por rol

### `ADMIN`

Visibilidad principal:

- ve la navegacion completa del panel interno;
- ve el acceso a configuracion y a gestion de usuarios;
- no usa el portal del alumno como espacio funcional propio.

Acceso efectivo:

- puede entrar en todos los modulos internos;
- puede usar importacion y exportacion;
- puede gestionar usuarios, catalogos y configuracion academica.

### `PROFESOR`

Visibilidad principal:

- ve en la `Navbar` solo los modulos internos permitidos;
- no ve enlaces de administracion reservados a `ADMIN`;
- no debe ver el portal del alumno como sustituto del panel interno.

Acceso efectivo:

- puede entrar en los modulos funcionales internos ya existentes;
- puede exportar y descargar plantillas;
- no puede acceder a gestion de usuarios;
- no puede usar importacion masiva desde Excel;
- no puede modificar configuracion academica ni catalogos maestros;
- no puede acceder al portal del alumno, aunque conozca la URL.

### `ALUMNO`

Visibilidad principal:

- no debe usar la `Navbar` del panel interno como espacio de trabajo;
- accede a un layout propio del `portal-alumno`;
- dentro del portal ve su propia navegacion y el control de sesion/login.

Acceso efectivo:

- puede entrar solo en el `portal-alumno` si esta autorizado y activo;
- no puede entrar en el panel interno general;
- no puede acceder a administracion, configuracion ni mantenimiento global de datos;
- no puede reutilizar rutas server-side del portal sin pasar la guardia de rol `ALUMNO`.

## Decision de implementacion

Se acuerda avanzar ahora con:

- autenticacion local temporal;
- configuracion explicita por `AUTH_MODE`;
- autorizacion definitiva basada en `Usuario`;
- roles `ADMIN`, `PROFESOR` y preparacion para `ALUMNO`;
- pantalla de administracion de usuarios;
- posibilidad futura de sustituir la autenticacion local por la de `edu.gva.es` con el minimo impacto posible.

## Estado actual acordado

Actualmente queda establecido que:

- solo `ADMIN` puede anadir o eliminar usuarios;
- solo `ADMIN` puede usar la importacion masiva desde Excel en el modulo `Import / Export`;
- `PROFESOR` puede seguir usando las funcionalidades preexistentes de la aplicacion, salvo esas capacidades administrativas o de importacion restringidas;
- `ALUMNO` dispone de un portal separado con visibilidad y proteccion propias;
- la autorizacion relevante debe comprobarse en servidor, no solo en la interfaz.

Restricciones adicionales ya implementadas:

- un administrador no puede eliminar su propio usuario;
- no se puede eliminar el ultimo administrador activo;
- en `AUTH_MODE=external` no se muestran ni se usan flujos de contrasena local;
- en el modulo `Import / Export`, el profesorado puede exportar y descargar plantillas, pero no importar.
- el `portal-alumno` exige sesion valida y rol `ALUMNO` tanto en layout como en sus consultas server-side principales.
- el `middleware` limpia cookies con firma invalida y no bloquea `/login` solo por detectar una cookie firmada.

## Cobertura de pruebas de seguridad

Las medidas anteriores cuentan con cobertura automatizada especifica en:

- `middleware.test.ts`
- `src/modules/auth/permissions.test.ts`
- `src/modules/auth/session.test.ts`
- `src/modules/portal-alumno/actions/queries.test.ts`

Estas pruebas cubren al menos:

- visibilidad y decision de acceso por rol en helpers centrales;
- guardia `requireAlumnoSession`;
- comportamiento del `middleware` con cookies invalidas y acceso a `/login`;
- revalidacion del portal del alumno antes de consultar datos.
