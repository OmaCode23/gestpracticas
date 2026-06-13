# Sistema de login

## Enfoque actual y alternativa futura

Actualmente la aplicacion usa y soporta de forma efectiva un sistema de autenticacion propio ya operativo y documentado en este archivo.

Ademas, la implementacion se ha diseÃ±ado para que en el futuro pueda migrarse o adaptarse con el menor impacto posible hacia una autenticacion externa con cuentas institucionales `@edu.gva.es`, previsiblemente a traves del sistema de identidad de la Generalitat, si el responsable TIC confirma que:

- existe un proveedor de identidad utilizable por aplicaciones del centro;
- puede registrarse una aplicacion propia;
- pueden obtenerse los datos minimos necesarios del usuario autenticado.

En ese escenario futuro:

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

## Solucion actual y posible migracion

La solucion actual del proyecto es un sistema de login propio, con sesiones en servidor y autorizacion decidida en nuestra base de datos.

Sobre esa base, se deja preparada una posible migracion futura a `edu.gva.es` o a otro proveedor externo compatible, sin obligar a cambiar el modelo de autorizacion interno.

La idea arquitectonica es separar:

- identidad autorizada en la aplicacion;
- credenciales del modo de acceso que se use en cada momento.

## Estado funcional del login

El flujo normal, implantado y soportado de verdad en la aplicacion es el login local.

La preparacion para un futuro modo `external` existe a nivel de arquitectura y de algunas piezas de codigo, pero no debe interpretarse como una integracion terminada ni como parte de la puesta en marcha normal del proyecto.

Consecuencias del estado actual:

- el modo real de trabajo es `local`, con credenciales locales;
- la gestion cotidiana de usuarios, contrasenas y reseteos se hace en local;
- la via `external` queda solo como preparacion de futuro y no como funcionalidad operativa cerrada.

## Variables de entorno relevantes

Para la instalacion y uso normal actuales:

- `AUTH_SECRET`: secreto para firma de sesion y estado de autenticacion.
- `AUTH_COOKIE_SECURE`: ajuste necesario cuando la aplicacion se sirve por `HTTP` y la cookie no puede marcarse como `Secure`.

Como preparacion para una futura ampliacion no implantada:

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
- soporte operativo del login local y base parcial preparada para una futura via `external`;
- bootstrap del primer administrador;
- gestion de usuarios accesible solo para `ADMIN`;
- proteccion de paginas y rutas API relevantes en servidor;
- proteccion especifica del portal del alumno por rol `ALUMNO`;
- capa central de permisos por rol en codigo;
- middleware de prefiltrado de acceso con limpieza de cookies invalidas;
- flujo externo reservado como alternativa abierta para una futura integracion real con proveedor OIDC.

## Modelo funcional vigente

### Tabla `Usuario`

La tabla `Usuario` es la fuente de verdad de autorizacion dentro de la aplicacion.

Debe almacenar al menos:

- `email`
- `nombre`
- `iniciales`
- `rol`
- `activo`
- `lastLoginAt` o equivalente
- en el futuro, datos de identidad externa como `authProvider` y `authSubject`

Roles vigentes:

- `ADMIN`
- `PROFESOR`
- `ALUMNO`

### Tabla de autenticacion local

La aplicacion usa una tabla separada para las credenciales locales, en lugar de guardar la contrasena directamente en `Usuario`.

Ejemplo conceptual:

- `Usuario`: autorizacion y datos del usuario dentro de la app
- `LocalAuthAccount`: hash de contrasena y configuracion del acceso local, identificado por `email`

De este modo, si en el futuro se migra el login local por uno basado en `edu.gva.es`, la tabla `Usuario` seguira siendo valida y la migracion sera pequena.

`LocalAuthAccount` no debe tener clave ajena ni relacion estructural con `Usuario`.

La relacion entre ambas piezas debe resolverse solo en codigo por `email`, no por un id interno de `Usuario`, porque el identificador funcional compartido entre el acceso local actual y una posible autenticacion externa futura es el correo del usuario autorizado.

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

Mientras se use el login local:

- el administrador tambien tendra una credencial local en la tabla correspondiente.

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
3. si la aplicacion se sirve por `HTTP`, definir `AUTH_COOKIE_SECURE=0`.

En el estado actual del proyecto, el administrador inicial se crea con email, nombre y contrasena:

```bash
npm run db:bootstrap-admin -- --email admin@edu.gva.es --password TuClaveInicial --name "Administrador"
```

Comportamiento adicional del script:

- si no se pasa `--email`, lo solicita por consola;
- si no se pasa `--password`, tambien lo solicita por consola en el flujo local actual;
- si se ejecuta de nuevo con el mismo email, actualiza ese usuario como `ADMIN` activo;
- si se ejecuta con otro email, no desactiva automaticamente al administrador anterior.

Nota de arquitectura futura:

- el script ya esta planteado para poder adaptarse a un posible modo `external`;
- esa via no forma parte de la puesta en marcha actual y no debe considerarse implantada.

## Gestion posterior de usuarios

Una vez exista un administrador autenticado, la aplicacion tendra una pantalla de gestion de usuarios accesible solo para `ADMIN`.

En su estado actual, esa pantalla se usa para:

- crear usuarios manualmente solo de tipo `ADMIN`;
- activar o desactivar acceso;
- eliminar usuarios con restricciones de seguridad;
- en el modo local, resetear credenciales locales;
- revisar el rol efectivo de cada identidad segun su origen.

Si en el futuro llegara a implantarse una autenticacion externa real, no se mostrarian acciones de cambio o reseteo de contrasena local.

## Matriz de permisos por rol

### `ADMIN`

Puede:

- iniciar sesion si esta autorizado y activo;
- acceder a todos los modulos existentes de la aplicacion;
- acceder tambien a las paginas generales `ofertas` y `cursos` del panel interno;
- crear usuarios;
- editar usuarios;
- eliminar usuarios, salvo:
  - su propio usuario administrador;
  - el ultimo administrador activo;
- activar o desactivar usuarios;
- en `AUTH_MODE=local`, asignar o resetear contrasenas locales;
- importar datos masivamente desde Excel;
- exportar datos;
- gestionar configuracion academica;
- gestionar catalogos maestros como sectores y ciclos formativos;
- restaurar valores base de catalogos.

### `PROFESOR`

Puede:

- iniciar sesion si esta autorizado y activo;
- acceder a los modulos funcionales ya existentes de la aplicacion;
- acceder tambien a las paginas generales `ofertas` y `cursos` del panel interno;
- acceder a la pagina y al CRUD funcional de `profesores`;
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

Actualmente `ALUMNO` ya dispone de un portal propio separado del panel interno.

Hoy puede:

- iniciar sesion solo si esta autorizado y activo;
- acceder al `portal-alumno`;
- ver las paginas propias del portal del alumno, incluidas sus vistas generales de `ofertas`, `empresas` y `cursos`, y sus vistas personalizadas como `formacion alumno`;
- ser redirigido a `portal-alumno` si pasa por `/login` teniendo ya sesion iniciada;
- ver el control de sesion/login tambien dentro del portal.

No puede:

- acceder al panel interno general;
- acceder a administracion, configuracion o importacion/exportacion interna;
- acceder al CRUD global de alumnos, empresas o formacion.

El portal del alumno ya queda protegido con un alcance propio distinto del profesorado y de administracion, aunque su contenido pueda seguir creciendo funcionalmente.

### Regla de identidad academica

La resolucion de identidad entre login y ficha academica debe ser inequívoca:

- la ficha de `Alumno` del portal se resuelve exclusivamente por `email`;
- no se admiten fallbacks por nombre ni coincidencias parciales;
- `Alumno.email` y `Profesor.email` deben tratarse como identificadores funcionales;
- el mismo email no debe poder quedar asignado a la vez a un alumno y a un profesor.

## Ambiguedad corregida

La documentacion anterior ya expresaba que `ALUMNO` no debia acceder al panel interno, pero no dejaba suficientemente explicito un matiz tecnico importante:

- `requireUserSession` valida autenticacion, no pertenencia al personal del centro;
- por tanto, una pagina del panel interno protegida solo con `requireUserSession` seguia siendo accesible para un alumno autenticado.

La regla correcta que queda fijada desde ahora es:

- `requireUserSession`: sesion valida, sin decidir aun entre `PROFESOR`, `ADMIN` o `ALUMNO`;
- `requireStaffSession`: acceso al panel interno (`ADMIN` o `PROFESOR`);
- `requireAlumnoSession`: acceso al portal del alumno;
- `requireAdminSession`: acceso exclusivo de administracion.

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
- `isStaffRole`
- `canManageUsers`
- `canImportExcel`
- `canManageCatalogs`
- `canManageAcademicSettings`

Uso actual:

- paginas servidor;
- rutas API;
- navegacion e interfaz, solo como reflejo visual de permisos ya comprobados en servidor.

Regla de mantenimiento:

- cuando cambie la matriz de permisos, debe actualizarse primero esta capa central;
- despues deben ajustarse las rutas o pantallas que la consumen;
- y por ultimo deben revisarse los tests asociados.

## Flujo actual de la aplicacion

### Modo local actual

1. El despliegue crea al menos un `ADMIN` inicial en `Usuario`.
2. Las altas y ediciones de `Alumno` y `Profesor` crean o sincronizan automaticamente su `Usuario` asociado por email.
3. Si el login es local, el usuario inicia sesion con email y contrasena local.
4. La aplicacion crea una sesion segura.
5. La autorizacion se decide por `Usuario.activo` y `Usuario.rol`.

### Via externa futura prevista

Si algun dia se completa una integracion externa real, el flujo previsto seria este:

1. El usuario inicia sesion en `edu.gva.es` o en el proveedor equivalente.
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
- `requireStaffSession`
- `requireAdminSession`
- `requireAlumnoSession`

Objetivo:

- redirigir a `/login` si no hay sesion real valida;
- forzar cambio de contrasena en `AUTH_MODE=local` cuando corresponda;
- bloquear acceso por rol aunque el usuario conozca la URL.

Importante:

- `requireUserSession` solo garantiza que existe una sesion valida;
- no debe usarse como unica barrera para pantallas exclusivas del panel interno si el rol `ALUMNO` tambien puede iniciar sesion;
- para el panel interno la guardia correcta es `requireStaffSession`;
- para el portal del alumno la guardia correcta es `requireAlumnoSession`.

El portal del alumno queda protegido de forma comun desde su `layout`, de modo que todas sus paginas heredan la exigencia de sesion valida y rol `ALUMNO`.

### 3. Proteccion de rutas API

Las rutas API privadas no deben confiar solo en el `middleware`.

Actualmente la capa API usa:

- `ensureApiUser`
- `ensureApiAdmin`
- `requireApiUserSession`
- `requireApiStaffSession`
- `requireApiAdminSession`

Objetivo:

- devolver `401` o `403` cuando falte sesion o rol;
- evitar que una ruta privada quede accesible por llamada directa;
- mantener la misma politica de autorizacion que las paginas servidor.

Convencion actual:

- `ensureApiUser` se usa para las APIs del panel interno y exige en realidad rol de personal del centro (`ADMIN` o `PROFESOR`);
- `ensureApiAdmin` se reserva para operaciones exclusivas de administracion;
- las APIs especificas del portal del alumno deben apoyarse en `requireAlumnoSession` o un helper equivalente de ese rol.

Aplicacion actual de esa convencion:

- la gestion del CV del alumno desde su portal usa una ruta propia separada bajo `/api/portal-alumno/cv`;
- la ruta interna `/api/alumnos/[id]/cv` queda reservada al panel interno y al personal del centro, igual que el resto de APIs de ese espacio.

Criterio de diseño acordado para `portal-alumno`:

- no es necesario crear una API HTTP propia del portal del alumno para todas las lecturas;
- si una pagina del portal puede resolverse enteramente en servidor, se prefiere usar consultas server-side protegidas por `requireAlumnoSession`, o helpers equivalentes que revaliden ese rol;
- esto aplica por ejemplo a vistas como resumen del alumno, empresas compatibles, empresas generales, ofertas o cursos informativos del portal;
- en cambio, cuando el portal del alumno necesita operaciones interactivas desde cliente contra servidor, como subida, borrado o descarga controlada de archivos, formularios con `fetch` o acciones similares, se prefiere una API propia bajo un espacio separado tipo `/api/portal-alumno/*`;
- esas APIs del portal no deben reutilizar por defecto rutas del panel interno tipo `/api/alumnos/*`, `/api/empresas/*` o similares, salvo que exista una justificacion expresa y una restriccion de acceso equivalente o mas estricta;
- con este criterio, el panel interno y el portal del alumno quedan separados no solo en interfaz, sino tambien en sus puntos de entrada HTTP cuando hay mutaciones o acciones cliente-servidor.

### 4. Revalidacion en consultas server-side sensibles

Cuando un modulo nuevo introduce consultas server-side propias, no debe asumir que la proteccion del layout es suficiente si esas consultas pueden reutilizarse desde otros puntos.

Por eso las consultas actuales del portal del alumno revalidan tambien `requireAlumnoSession(...)` antes de leer datos.

Ademas, la resolucion de la ficha del alumno autenticado no debe continuar si el email devuelve cero coincidencias o mas de una coincidencia. En ambos casos la sesion no se considera asociada de forma valida a una ficha academica.

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
- puede entrar tambien en `ofertas` y `cursos` cuando esas paginas se publican como contenido general del centro dentro del panel interno;
- puede usar importacion y exportacion;
- puede gestionar usuarios, catalogos y configuracion academica.

### `PROFESOR`

Visibilidad principal:

- ve en la `Navbar` solo los modulos internos permitidos;
- ve el acceso a `profesores` dentro del panel interno;
- no ve enlaces de administracion reservados a `ADMIN`;
- no debe ver el portal del alumno como sustituto del panel interno.

Acceso efectivo:

- puede entrar en los modulos funcionales internos ya existentes;
- puede entrar tambien en `ofertas` y `cursos` cuando esas paginas se publican como contenido general del centro dentro del panel interno;
- puede entrar en `profesores`;
- puede exportar y descargar plantillas;
- no puede acceder a gestion de usuarios;
- no puede usar importacion masiva desde Excel;
- no puede modificar configuracion academica ni catalogos maestros;
- si intenta entrar manualmente en `/portal-alumno`, se le redirige fuera de ese espacio porque no es su area funcional.

### `ALUMNO`

Visibilidad principal:

- no debe usar la `Navbar` del panel interno como espacio de trabajo;
- si ya tiene sesion y pasa por `/login`, se le redirige a `/portal-alumno`;
- accede a un layout propio del `portal-alumno`;
- dentro del portal ve su propia navegacion y el control de sesion/login.

Acceso efectivo:

- puede entrar solo en el `portal-alumno` si esta autorizado y activo;
- dentro del `portal-alumno` puede ver tanto contenido general del portal como su informacion personalizada autorizada;
- no puede entrar en el panel interno general;
- no puede acceder a administracion, configuracion ni mantenimiento global de datos;
- no puede reutilizar rutas server-side del portal sin pasar la guardia de rol `ALUMNO`;
- no puede usar las APIs internas del panel como sustituto de las rutas propias del `portal-alumno`.

## Decision de implementacion

Se acuerda mantener como solucion base:

- autenticacion local operativa;
- autorizacion definitiva basada en `Usuario`;
- roles `ADMIN`, `PROFESOR` y preparacion para `ALUMNO`;
- pantalla de administracion de usuarios;
- posibilidad futura de migrar la autenticacion hacia `edu.gva.es` u otro proveedor externo con el minimo impacto posible.

## Estado actual acordado

Actualmente queda establecido que:

- solo `ADMIN` puede anadir o eliminar usuarios;
- solo `ADMIN` puede usar la importacion masiva desde Excel en el modulo `Import / Export`;
- `PROFESOR` puede seguir usando las funcionalidades preexistentes de la aplicacion, incluida la gestion funcional de `profesores`, salvo esas capacidades administrativas o de importacion restringidas;
- `ALUMNO` dispone de un portal separado con visibilidad y proteccion propias;
- la autorizacion relevante debe comprobarse en servidor, no solo en la interfaz.

Restricciones adicionales ya implementadas:

- un administrador no puede eliminar su propio usuario;
- no se puede eliminar el ultimo administrador activo;
- si algun dia se implanta una via `external` real, no se mostraran ni se usaran flujos de contrasena local;
- en el modulo `Import / Export`, el profesorado puede exportar y descargar plantillas, pero no importar.
- el `portal-alumno` exige sesion valida y rol `ALUMNO` tanto en layout como en sus consultas server-side principales.
- el CV del alumno en su portal usa una API propia separada de las APIs internas del panel.
- el `middleware` limpia cookies con firma invalida y no bloquea `/login` solo por detectar una cookie firmada.

## Cobertura de pruebas de seguridad

Las medidas anteriores cuentan con cobertura automatizada especifica en:

- `middleware.test.ts`
- `src/app/access-contract.test.ts`
- `src/modules/auth/api.test.ts`
- `src/modules/auth/permissions.test.ts`
- `src/modules/auth/session.test.ts`
- `src/modules/portal-alumno/actions/queries.test.ts`

Estas pruebas cubren al menos:

- visibilidad y decision de acceso por rol en helpers centrales;
- guardias `requireAlumnoSession` y `requireStaffSession`;
- redireccion por rol desde `/login`;
- comportamiento del `middleware` con cookies invalidas y acceso a `/login`;
- revalidacion del portal del alumno antes de consultar datos;
- decision `401` frente a `403` en la capa API;
- paginas servidor representativas del panel interno que deben exigir personal del centro.

## Estado de la via de autenticacion externa

Aunque la decision de trabajo del proyecto es claramente el login local, la alternativa de autenticacion externa no desaparecio del todo del diseno. Quedo documentada en varias partes de este archivo y conviene dejar aqui un resumen unico del estado real en que se encuentra.

### Idea original

La idea original era que la aplicacion pudiera delegar la autenticacion en un proveedor institucional externo, previsiblemente vinculado a cuentas `@edu.gva.es`, manteniendo en nuestra base de datos solo la autorizacion interna.

Eso implicaba separar dos responsabilidades:

- el proveedor externo autentica la identidad del usuario;
- nuestra base de datos decide si ese usuario esta autorizado, si esta activo y con que rol entra.

El criterio acordado desde el principio fue que no bastaba con tener una cuenta `@edu.gva.es`: el email autenticado debia existir previamente en la tabla `Usuario` y estar marcado como activo.

### Que se dejo preparado tecnicamente

Aunque no se ha completado una integracion real contra un proveedor institucional, si quedaron preparadas varias piezas para no cerrar esa puerta:

- el modo `AUTH_MODE=external`;
- variables de entorno especificas para autorizacion externa;
- una capa de configuracion para ese modo;
- una ruta de inicio de autorizacion externa;
- una ruta callback reservada;
- generacion y validacion de `state` firmado para proteger el flujo;
- soporte de `authProvider` y `authSubject` en `Usuario`;
- actualizacion de `lastLoginAt` y creacion de sesion local tras una autenticacion externa valida;
- posibilidad de simular el callback externo solo para pruebas controladas.

En otras palabras: no hay integracion final cerrada con un servidor externo real, pero si existe un esqueleto tecnico pensado para un futuro flujo tipo OIDC o similar.

### Que parte no se llego a cerrar

La parte que quedo abierta y no debe considerarse terminada es la integracion real con el proveedor institucional. En particular, no queda resuelto en el estado actual del proyecto:

- el intercambio real de `code` por tokens con el proveedor;
- la verificacion formal de `id_token` o equivalente;
- la definicion final de scopes y claims disponibles;
- el procedimiento administrativo o tecnico para registrar la aplicacion en el proveedor real;
- la confirmacion de que el centro puede usar ese proveedor para una aplicacion propia;
- la definicion exacta del identificador externo estable que llegaria desde ese sistema.

Por eso, aunque el modo `external` existe como posibilidad de arquitectura y hay codigo de soporte, no debe interpretarse como una funcionalidad desplegada y validada de punta a punta.

### Decision practica adoptada

La decision practica que ha guiado el desarrollo posterior ha sido esta:

- el sistema operativo y soportado de verdad es el login local;
- la gestion cotidiana de altas, cambios de contrasena y reseteos se hace en local;
- la via externa se conserva solo como alternativa futura preparada a nivel de arquitectura;
- si algun dia se retoma, la autorizacion seguira dependiendo de `Usuario`, no del proveedor externo.

### Consecuencia documental

Cuando se lea este documento debe entenderse que:

- `local` describe el sistema actualmente implantado y en uso;
- `external` describe una via prevista, parcialmente preparada en codigo, pero pospuesta y no completada.

## Modelo de identidades academicas

Con la incorporacion del `portal-alumno`, el modelo de identidades queda fijado asi:

- `Alumno` y `Profesor` son las entidades funcionales de negocio;
- `Usuario` es la identidad tecnica de acceso a la aplicacion;
- `LocalAuthAccount` sigue siendo solo la capa de credenciales locales;
- el identificador funcional comun entre estas piezas es el `email`.

### Regla general

Para identidades academicas:

- cada `Alumno` con email valido tiene su `Usuario` correspondiente;
- cada `Profesor` con email valido tiene su `Usuario` correspondiente;
- esas cuentas nacen desactivadas por defecto;
- la activacion del acceso sigue siendo una decision administrativa explicita.

Para identidades administrativas:

- un `ADMIN` puede existir sin ficha en `Alumno` ni en `Profesor`;
- puede crearse desde bootstrap o desde la administracion de usuarios.

### Correspondencia por rol

La regla funcional vigente es:

- un `Usuario` con rol `ALUMNO` corresponde obligatoriamente a una ficha valida de `Alumno`;
- un `Usuario` con rol `PROFESOR` corresponde obligatoriamente a una ficha valida de `Profesor`;
- un `Usuario` con rol `ADMIN` puede ser un administrador puro o un profesor promovido.

### Fuente de verdad por dato

La fuente de verdad queda separada por responsabilidad:

- `Alumno` y `Profesor` son la fuente de verdad de nombre y email para identidades academicas;
- `Usuario` es la fuente de verdad de acceso, estado activo, rol efectivo y sesion;
- `LocalAuthAccount` es la fuente de verdad de la credencial local, vinculada por email.

Consecuencia:

- nombre y email de alumnos y profesores se editan desde su ficha funcional;
- al cambiarse ahi, se sincronizan automaticamente `Usuario` y, en modo local, `LocalAuthAccount`;
- nombre y email no deben editarse libremente desde administracion de usuarios para cuentas academicas.

### Reglas de creacion y sincronizacion

#### Alta de alumno

Cuando se crea un `Alumno`:

- su `email` es obligatorio y unico;
- no puede coincidir con el email de otro alumno ni de un profesor;
- se crea o sincroniza automaticamente un `Usuario` con ese email;
- ese `Usuario` queda con rol `ALUMNO` y `activo = false`.

#### Alta de profesor

Cuando se crea un `Profesor`:

- su `email` es obligatorio y unico;
- no puede coincidir con el email de otro profesor ni de un alumno;
- se crea o sincroniza automaticamente un `Usuario` con ese email;
- ese `Usuario` queda con rol `PROFESOR` y `activo = false`, salvo que ya fuese un profesor promovido a `ADMIN`, en cuyo caso conserva `ADMIN`.

#### Alta de administrador

Cuando se necesita un `ADMIN` puro:

- puede crearse directamente por bootstrap o desde administracion de usuarios;
- no necesita ficha en `Alumno` ni en `Profesor`.

### Regla de acceso efectivo

Crear una ficha funcional no equivale a conceder acceso.

Por tanto:

- crear un `Alumno` o un `Profesor` crea o sincroniza su identidad tecnica;
- esa identidad nace desactivada por defecto;
- el acceso efectivo se concede activando el `Usuario`;
- en `AUTH_MODE=local`, el acceso local puede requerir ademas crear o resetear contrasena;
- en `AUTH_MODE=external`, basta con que exista un `Usuario` activo y autorizado.

### Regla de email e identidad

La identidad academica queda resuelta de forma inequívoca por email:

- `Alumno.email` es obligatorio y unico;
- `Profesor.email` es obligatorio y unico;
- el mismo email no puede estar asignado a la vez a un alumno y a un profesor;
- el `portal-alumno` resuelve la ficha exclusivamente por email;
- no existen fallbacks por nombre ni coincidencias parciales.

### Regla de dominios permitidos para email

Ademas de ser unico y coherente con la identidad funcional, el email academico debe pertenecer a un dominio permitido para su entidad:

- para `Alumno`, el dominio base permitido es `@alu.edu.gva.es`;
- para `Profesor`, el dominio base permitido es `@edu.gva.es`;
- pueden admitirse dominios adicionales para alumnos o profesores desde la pagina de `Configuracion`;
- esas ampliaciones se aplican como configuracion funcional del sistema y se validan en altas, ediciones e importaciones.

### Regla de actualizacion de email

Si cambia el email de una ficha academica:

- cambia automaticamente el email del `Usuario` asociado;
- si existe `LocalAuthAccount`, tambien se actualiza a ese nuevo email;
- toda la operacion revalida la unicidad y compatibilidad del nuevo email.

### Regla de cambio de rol

#### Alumno

- una identidad procedente de `Alumno` no puede cambiar de rol;
- su rol efectivo permanece en `ALUMNO`;
- la administracion de usuarios no debe ofrecer ni aceptar ese cambio.

#### Profesor

- una identidad procedente de `Profesor` puede alternar entre `PROFESOR` y `ADMIN`;
- ese cambio representa promocion o retirada de privilegios administrativos sobre el mismo profesor.

#### Administrador puro

- un `ADMIN` puro puede seguir existiendo sin ficha funcional;
- no puede degradarse a `PROFESOR` salvo que exista una ficha de `Profesor` con su mismo email.

### Regla de baja funcional

#### Si se elimina un `Alumno`

- el `Usuario` asociado no queda operativo;
- se desactiva automaticamente;
- no se borra automaticamente por defecto.

#### Si se elimina un `Profesor`

- si su cuenta estaba en rol `PROFESOR`, se desactiva;
- si estaba en rol `ADMIN`, puede mantenerse como administrador puro.

### Regla de administracion de usuarios

La pantalla de administracion de usuarios ya no es alta universal de identidades.

Su funcion actual es:

- crear usuarios manualmente solo para `ADMIN`;
- activar o desactivar accesos existentes;
- resetear contrasenas en modo local;
- permitir el cambio `PROFESOR <-> ADMIN` cuando la identidad procede de un profesor;
- impedir cambio de rol en usuarios de alumno;
- impedir edicion manual de nombre y email en cuentas ligadas a `Alumno` o `Profesor`.

Consecuencia visible en UI:

- el bloque de alta manual queda orientado solo a administradores;
- `ALUMNO` y `PROFESOR` no se crean manualmente desde esa pantalla;
- la tabla de usuarios puede clasificar el origen de la identidad como `ALUMNO`, `PROFESOR` o `ADMIN` puro.
- el boton de borrado solo aparece para `ADMIN` puros, es decir, cuentas no ligadas a `Profesor` ni a `Alumno`;
- el administrador logueado no puede borrarse ni desactivarse a si mismo.

### Implementacion tecnica vigente

La implementacion actual sigue estas reglas:

- las altas, ediciones e importaciones de `Alumno` y `Profesor` sincronizan automaticamente `Usuario`;
- esa sincronizacion se ejecuta dentro de la misma transaccion logica;
- las bajas funcionales ajustan tambien el estado del `Usuario` asociado;
- la relacion entre identidad funcional y cuenta de acceso se resuelve por `email`, no por `id`;
- la tabla `usuarios` se completo y saneo mediante una migracion de datos especifica, no mediante reconciliacion en cada ejecucion de la app.
- en modo local, si se activa una cuenta sin contrasena previa, antes de activarla se fuerza el dialogo de reseteo de contrasena;
- si ese dialogo se cancela, la cuenta permanece desactivada;
- si se reactiva una cuenta que ya tenia contrasena local, conserva esa misma contrasena.

### Decision operativa vigente

El estado definitivo del modelo queda asi:

- `Alumno` crea o sincroniza automaticamente `Usuario(ALUMNO, activo=false)`;
- `Profesor` crea o sincroniza automaticamente `Usuario(PROFESOR, activo=false)`;
- `ALUMNO` no puede cambiar de rol;
- una identidad procedente de `Profesor` puede alternar entre `PROFESOR` y `ADMIN`;
- `ADMIN` puro puede seguir creandose manualmente;
- al crear un `ADMIN` puro en modo local, la cuenta nace desactivada y se abre inmediatamente el flujo de reseteo/definicion de contrasena; solo despues de completarlo queda activada;
- al activar por primera vez una cuenta academica sin contrasena local previa, se usa ese mismo flujo inmediato de reseteo/definicion de contrasena;
- la administracion de usuarios es gestion de acceso, no alta universal de cualquier rol.
