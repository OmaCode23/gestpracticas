# Sistema de login

## Enfoque actual y alternativa futura

Actualmente la aplicación usa y soporta de forma efectiva un sistema de autenticación propio ya operativo y documentado en este archivo.

Además, la implementación se ha diseñado para que en el futuro pueda migrarse o adaptarse con el menor impacto posible hacia una autenticación externa con cuentas institucionales `@edu.gva.es`, previsiblemente a través del sistema de identidad de la Generalitat, si el responsable TIC confirma que:

- existe un proveedor de identidad utilizable por aplicaciones del centro;
- puede registrarse una aplicación propia;
- pueden obtenerse los datos mínimos necesarios del usuario autenticado.

En ese escenario futuro:

- la autenticación se haría fuera de nuestra aplicación;
- la aplicación no almacenaría contraseñas locales de profesorado o administradores;
- la autorización se decidiría en nuestra propia base de datos.

## Criterio de acceso acordado

No se confiará solo en que el usuario tenga un correo del dominio `@edu.gva.es`.

El criterio de acceso será:

1. El usuario se autentica correctamente en el proveedor externo.
2. La aplicación busca su email en la tabla `Usuario`.
3. Solo se permite el acceso si existe un `Usuario` activo y autorizado.

Esto evita que pueda entrar cualquier persona con una cuenta `@edu.gva.es` de otro centro.

## Solución actual y posible migración

La solución actual del proyecto es un sistema de login propio, con sesiones en servidor y autorización decidida en nuestra base de datos.

Sobre esa base, se deja preparada una posible migración futura a `edu.gva.es` o a otro proveedor externo compatible, sin obligar a cambiar el modelo de autorización interno.

La idea arquitectónica es separar:

- identidad autorizada en la aplicación;
- credenciales del modo de acceso que se use en cada momento.

## Estado funcional del login

El flujo normal, implantado y soportado de verdad en la aplicación es el login local.

La preparación para un futuro modo `external` existe a nivel de arquitectura y de algunas piezas de código, pero no debe interpretarse como una integración terminada ni como parte de la puesta en marcha normal del proyecto.

Consecuencias del estado actual:

- el modo real de trabajo es `local`, con credenciales locales;
- la gestión cotidiana de usuarios, contraseñas y reseteos se hace en local;
- la vía `external` queda solo como preparación de futuro y no como funcionalidad operativa cerrada.

## Variables de entorno relevantes

Para la instalación y uso normal actuales:

- `AUTH_SECRET`: secreto para firma de sesión y estado de autenticación.
- `AUTH_COOKIE_SECURE`: ajuste necesario cuando la aplicación se sirve por `HTTP` y la cookie no puede marcarse como `Secure`.

Como preparación para una futura ampliación no implantada:

- `AUTH_MODE`: `local` o `external`.
- `EXTERNAL_AUTH_AUTHORIZE_URL`: endpoint de autorización del proveedor externo.
- `EXTERNAL_AUTH_CLIENT_ID`: identificador de cliente de la aplicación registrada.
- `EXTERNAL_AUTH_REDIRECT_URI`: callback registrado en el proveedor externo.
- `EXTERNAL_AUTH_SCOPE`: scopes solicitados, por defecto `openid profile email`.
- `EXTERNAL_AUTH_ALLOW_MOCK_CALLBACK`: solo para pruebas del flujo externo sin proveedor real.

## Estado técnico implementado

Actualmente ya existe una base funcional implementada con estas piezas:

- sesión en servidor con cookie `httpOnly`;
- tabla `Usuario` como fuente de verdad de autorización;
- soporte operativo del login local y base parcial preparada para una futura vía `external`;
- bootstrap del primer administrador;
- gestión de usuarios accesible solo para `ADMIN`;
- protección de páginas y rutas API relevantes en servidor;
- protección específica del portal del alumno por rol `ALUMNO`;
- capa central de permisos por rol en código;
- middleware de prefiltrado de acceso con limpieza de cookies inválidas;
- flujo externo reservado como alternativa abierta para una futura integración real con proveedor OIDC.

## Modelo funcional vigente

### Tabla `Usuario`

La tabla `Usuario` es la fuente de verdad de autorización dentro de la aplicación.

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

### Tabla de autenticación local

La aplicación usa una tabla separada para las credenciales locales, en lugar de guardar la contraseña directamente en `Usuario`.

Ejemplo conceptual:

- `Usuario`: autorización y datos del usuario dentro de la app
- `LocalAuthAccount`: hash de contraseña y configuración del acceso local, identificado por `email`

De este modo, si en el futuro se migra el login local por uno basado en `edu.gva.es`, la tabla `Usuario` seguirá siendo válida y la migración será pequeña.

`LocalAuthAccount` no debe tener clave ajena ni relación estructural con `Usuario`.

La relación entre ambas piezas debe resolverse solo en código por `email`, no por un id interno de `Usuario`, porque el identificador funcional compartido entre el acceso local actual y una posible autenticación externa futura es el correo del usuario autorizado.

Esto busca que la tabla local temporal se comporte lo mas parecido posible a un proveedor externo sustituible:

- `Usuario` representa autorización interna;
- `LocalAuthAccount` representa una fuente de credenciales separada;
- la aplicación cruza ambas por email en el momento del login o de la gestión de credenciales;
- si en el futuro la autenticación externa llega por OIDC, API o servicio independiente, el cambio quede concentrado en la capa de autenticación y no en el modelo de autorización.

## Administrador inicial

Se necesita al menos un usuario administrador para romper el círculo inicial.

Ese primer administrador:

- no se creará desde una pantalla pública;
- se dará de alta por semilla, script o accion equivalente desde despliegue o consola;
- tendrá rol `ADMIN`.

Si la autenticación final es externa:

- en nuestra base de datos solo se registrara su email y sus datos de autorización;
- la contraseña no se almacenará en la aplicación.

Mientras se use el login local:

- el administrador también tendrá una credencial local en la tabla correspondiente.

El script de bootstrap del administrador:

- no debe llevar un email hardcodeado en código;
- debe aceptar el email por argumento o variable de entorno;
- puede solicitarlo por consola si falta en una ejecución manual;
- solo debe pedir contraseña en `AUTH_MODE=local`;
- en `AUTH_MODE=external` solo debe insertar o actualizar el usuario administrador autorizado.

### Puesta en marcha del administrador inicial

Una vez desplegada la aplicación y preparada la base de datos, el alta del primer administrador se realiza con el script de bootstrap.

Pasos previos:

1. aplicar las migraciones de Prisma;
2. definir `AUTH_SECRET`;
3. si la aplicación se sirve por `HTTP`, definir `AUTH_COOKIE_SECURE=0`.

En el estado actual del proyecto, el administrador inicial se crea con email, nombre y contraseña:

```bash
npm run db:bootstrap-admin -- --email admin@edu.gva.es --password TuClaveInicial --name "Administrador"
```

Comportamiento adicional del script:

- si no se pasa `--email`, lo solicita por consola;
- si no se pasa `--password`, también lo solicita por consola en el flujo local actual;
- si se ejecuta de nuevo con el mismo email, actualiza ese usuario como `ADMIN` activo;
- si se ejecuta con otro email, no desactiva automaticamente al administrador anterior.

Nota de arquitectura futura:

- el script ya está planteado para poder adaptarse a un posible modo `external`;
- esa vía no forma parte de la puesta en marcha actual y no debe considerarse implantada.

## Gestión posterior de usuarios

Una vez exista un administrador autenticado, la aplicación tendrá una pantalla de gestión de usuarios accesible solo para `ADMIN`.

En su estado actual, esa pantalla se usa para:

- crear usuarios manualmente solo de tipo `ADMIN`;
- activar o desactivar acceso;
- eliminar usuarios con restricciones de seguridad;
- en el modo local, resetear credenciales locales;
- revisar el rol efectivo de cada identidad según su origen.

Si en el futuro llegara a implantarse una autenticación externa real, no se mostrarían acciones de cambio o reseteo de contraseña local.

## Criterios acordados explícitamente sobre restricciones `PROFESOR` frente a `ADMIN`

Este apartado recoge solo criterios fijados de forma explícita, para distinguirlos de restricciones que han resultado en la implementación de forma implícita.

### 1. Gestión de usuarios

Solo administradores tienen la responsabilidad de gestionar usuarios, y por tanto solo los administradores pueden ver y acceder a la página de administración de usuarios (su enlace no será visible para los profesores).
Por tanto los profesores no podrán realizar ninguna de las operaciones derivadas de esta página, como crear, editar, activar, desactivar, eliminar usuarios o resetear contraseñas.

### 2. Importación masiva desde Excel

Los profesores no pueden ejecutar importación masiva desde ficheros Excel en la página de ImportExport.
Los profesores podrán ver la opción, pero en color gris, indicando que está deshabilitada para ellos.
Esta restricción incluye la importación masiva de `alumnos`, `empresas`, `formacion` y `profesores`.

### 3. Dominios de email permitidos en `Configuración`

Tanto profesores como administradores, pueden cambiar la configuración de dominios permitidos, en la página de Configuración.

### 4. Ajustes académicos permitidos en `Configuración`

Tanto profesores como administradores, pueden cambiar la configuración de `Cursos académicos`, y de `Otros ajustes`, en la página de `Configuración`.

En concreto, dentro de la página de `Configuración`, los profesores pueden modificar igual que los administradores:

- la opción `Ver solo el curso actual` / `Modo histórico`;
- el `Mes de cambio de curso`;
- el `Número de cursos visibles`;
- el botón `Restaurar valores por defecto` del bloque de cursos académicos;
- el botón `Guardar configuración` del bloque de cursos académicos;

- los `Resultados por página` del bloque de otros ajustes;
- el botón `Restaurar valores por defecto` del bloque de otros ajustes;
- el botón `Guardar configuración` del bloque de otros ajustes.



### 5. Catálogos permitidos en `Configuración`

Tanto profesores como administradores, pueden modificar los catálogos visibles en la página de `Configuración`.

En concreto, dentro de la página de `Configuración`, los profesores pueden modificar igual que los administradores:

- en `Sectores`, crear sectores, renombrarlos, activarlos, desactivarlos, eliminarlos cuando no estén en uso, y usar `Restaurar sectores iniciales`;
- en `Ciclos formativos`, crear ciclos, editar su nombre o su código dentro de las validaciones existentes, activarlos, desactivarlos, eliminarlos cuando proceda, y usar `Restaurar ciclos iniciales`;
- en `Proveedores de cursos`, crear proveedores, renombrarlos, activarlos, desactivarlos y eliminarlos cuando no estén en uso;
- en `Áreas de cursos`, crear áreas, renombrarlas, activarlas, desactivarlas y eliminarlas cuando no estén en uso.

## Matriz de permisos por rol

### `ADMIN`

Puede:

- iniciar sesión si está autorizado y activo;
- acceder a todos los módulos existentes de la aplicación;
- acceder también a las páginas generales `ofertas` y `cursos` del panel interno;
- crear usuarios;
- editar usuarios;
- eliminar usuarios, salvo:
  - su propio usuario administrador;
  - el ultimo administrador activo;
- activar o desactivar usuarios;
- en `AUTH_MODE=local`, asignar o resetear contraseñas locales;
- importar datos masívamente desde Excel;
- exportar datos;
- gestionar configuración académica;
- gestionar los catálogos visibles en `Configuración`;
- restaurar valores base de catálogos cuando exista esa opción.

### `PROFESOR`

Puede:

- iniciar sesión si está autorizado y activo;
- acceder a los módulos funcionales ya existentes de la aplicación;
- acceder también a las páginas generales `ofertas` y `cursos` del panel interno;
- acceder a la página y al CRUD funcional de `profesores`;
- consultar, crear, editar o eliminar datos funcionales según las capacidades ya presentes en cada módulo de negocio;
- exportar datos;
- descargar plantillas de importación;
- gestionar la configuración académica visible en `Configuración`;
- gestionar los catálogos visibles en `Configuración`;
- restaurar valores base de catálogos cuando exista esa opción visible en `Configuración`.

No puede:

- acceder a la gestión de usuarios;
- crear usuarios;
- editar usuarios;
- eliminar usuarios;
- importar datos masívamente desde Excel;
- ejecutar importación masiva de `alumnos`, `empresas`, `formacion` o `profesores`.

### `ALUMNO`

Actualmente `ALUMNO` ya dispone de un portal propio separado del panel interno.

Hoy puede:

- iniciar sesión solo si está autorizado y activo;
- acceder al `portal-alumno`;
- ver las páginas propias del portal del alumno, incluidas sus vistas generales de `ofertas`, `empresas` y `cursos`, y sus vistas personalizadas como `formación alumno`;
- ser redirigido a `portal-alumno` si pasa por `/login` teniendo ya sesión iniciada;
- ver el control de sesión/login también dentro del portal.

No puede:

- acceder al panel interno general;
- acceder a administración, configuración o importación/exportación interna;
- acceder al CRUD global de alumnos, empresas o formacion.

El portal del alumno ya queda protegido con un alcance propio distinto del profesorado y de administración, aunque su contenido pueda seguir creciendo funcionalmente.

### Regla de identidad académica

La resolución de identidad entre login y ficha académica debe ser inequívoca:

- la ficha de `Alumno` del portal se resuelve exclusivamente por `email`;
- no se admiten fallbacks por nombre ni coincidencias parciales;
- `Alumno.email` y `Profesor.email` deben tratarse como identificadores funcionales;
- el mismo email no debe poder quedar asígnado a la vez a un alumno y a un profesor.

## Ambiguedad corregida

La documentacion anterior ya expresaba que `ALUMNO` no debia acceder al panel interno, pero no dejaba suficientemente explícito un matiz técnico importante:

- `requireUserSession` valida autenticación, no pertenencia al personal del centro;
- por tanto, una página del panel interno protegida solo con `requireUserSession` seguía siendo accesible para un alumno autenticado.

La regla correcta que queda fijada desde ahora es:

- `requireUserSession`: sesión válida, sin decidir aún entre `PROFESOR`, `ADMIN` o `ALUMNO`;
- `requireStaffSession`: acceso al panel interno (`ADMIN` o `PROFESOR`);
- `requireAlumnoSession`: acceso al portal del alumno;
- `requireAdminSession`: acceso exclusivo de administración.

## Capa central de permisos

La matriz de permisos no debe aplicarse mediante comparaciones dispersas del tipo `rol === "ADMIN"` repartidas por toda la aplicación.

Actualmente ya existe una capa central reutilizable en código para expresar estas decisiones de autorización.

Objetivos de esta capa:

- centralizar la política de permisos por rol;
- hacer mas legibles las comprobaciones de autorización;
- reducir incoherencias al cambiar reglas de negocio;
- facilitar pruebas unitarias específicas sobre permisos.

Permisos actualmente centralizados:

- `isAdminRole`
- `isAlumnoRole`
- `isStaffRole`
- `canManageUsers`
- `canImportExcel`
- `canManageCatalogs`
- `canManageAcademicSettings`

Uso actual:

- páginas servidor;
- rutas API;
- navegacion e interfaz, solo como reflejo visual de permisos ya comprobados en servidor.

Regla de mantenimiento:

- cuando cambie la matriz de permisos, debe actualizarse primero esta capa central;
- después deben ajustarse las rutas o pantallas que la consumen;
- y por ultimo deben revisarse los tests asociados.

## Flujo actual de la aplicación

### Modo local actual

1. El despliegue crea al menos un `ADMIN` inicial en `Usuario`.
2. Las altas y ediciones de `Alumno` y `Profesor` crean o sincronizan automaticamente su `Usuario` asociado por email.
3. Si el login es local, el usuario inicia sesión con email y contraseña local.
4. La aplicación crea una sesión segura.
5. La autorización se decide por `Usuario.activo` y `Usuario.rol`.

### Via externa futura prevista

Si algun dia se completa una integración externa real, el flujo previsto sería este:

1. El usuario inicia sesión en `edu.gva.es` o en el proveedor equivalente.
2. La aplicación recibe la identidad autenticada.
3. Se busca el email en `Usuario`.
4. Si el usuario existe y está activo, se permite el acceso.
5. El rol en `Usuario` decide que pantallas y acciones estan permitidas.

Mientras no se conozcan todos los datos del proveedor real, la aplicación deja preparado:

- un inicio de autorización externo con parametros OIDC estandar;
- una ruta callback reservada;
- la autorización local por email y usuario activo en `Usuario`;
- una simulacion opciónal del callback externo solo para pruebas controladas.

## Seguridad acordada

- No habrá registro público abierto.
- No se confiará solo en el dominio `@edu.gva.es`.
- No se guardarán contraseñas en claro.
- La sesión se gestionara en servidor con cookie segura `httpOnly`.
- La pantalla de gestión de usuarios será solo para administradores.
- El bootstrap del primer administrador no se expondrá como funcionalidad pública web.

## Capas de seguridad implementadas

La autorización no debe depender solo de lo visible en pantalla.

### 1. Visibilidad en interfaz

La `Navbar` y otros componentes de interfaz ocultan o muestran enlaces según rol.

Esto mejora la UX, pero no se considera una barrera de seguridad suficiente por si sola.

### 2. Guardias server-side en páginas y layouts

Las páginas privadas del panel interno usan guardias en servidor:

- `requireUserSession`
- `requireStaffSession`
- `requireAdminSession`
- `requireAlumnoSession`

Objetivo:

- redirigir a `/login` si no hay sesión real válida;
- forzar cambio de contraseña en `AUTH_MODE=local` cuando corresponda;
- bloquear acceso por rol aunque el usuario conozca la URL.

Importante:

- `requireUserSession` solo garantiza que existe una sesión válida;
- no debe usarse como única barrera para pantallas exclusivas del panel interno si el rol `ALUMNO` también puede iniciar sesión;
- para el panel interno la guardia correcta es `requireStaffSession`;
- para el portal del alumno la guardia correcta es `requireAlumnoSession`.

El portal del alumno queda protegido de forma comun desde su `layout`, de modo que todas sus páginas heredan la exigencia de sesión válida y rol `ALUMNO`.

### 3. Protección de rutas API

Las rutas API privadas no deben confiar solo en el `middleware`.

Actualmente la capa API usa:

- `ensureApiUser`
- `ensureApiAdmin`
- `requireApiUserSession`
- `requireApiStaffSession`
- `requireApiAdminSession`

Objetivo:

- devolver `401` o `403` cuando falte sesión o rol;
- evitar que una ruta privada quede accesible por llamada directa;
- mantener la misma política de autorización que las páginas servidor.

Convencion actual:

- `ensureApiUser` se usa para las APIs del panel interno y exige en realidad rol de personal del centro (`ADMIN` o `PROFESOR`);
- `ensureApiAdmin` se reserva para operaciones exclusivas de administración;
- las APIs específicas del portal del alumno deben apoyarse en `requireAlumnoSession` o un helper equivalente de ese rol.

Aplicacion actual de esa convencion:

- la gestión del CV del alumno desde su portal usa una ruta propia separada bajo `/api/portal-alumno/cv`;
- la ruta interna `/api/alumnos/[id]/cv` queda reservada al panel interno y al personal del centro, igual que el resto de APIs de ese espacio.

Criterio de diseño acordado para `portal-alumno`:

- no es necesario crear una API HTTP propia del portal del alumno para todas las lecturas;
- si una página del portal puede resolverse enteramente en servidor, se prefiere usar consultas server-side protegidas por `requireAlumnoSession`, o helpers equivalentes que revaliden ese rol;
- esto aplica por ejemplo a vistas como resumen del alumno, empresas compatibles, empresas generales, ofertas o cursos informativos del portal;
- en cambio, cuando el portal del alumno necesita operaciones interactivas desde cliente contra servidor, como subida, borrado o descarga controlada de archivos, formularios con `fetch` o acciones similares, se prefiere una API propia bajo un espacio separado tipo `/api/portal-alumno/*`;
- esas APIs del portal no deben reutilizar por defecto rutas del panel interno tipo `/api/alumnos/*`, `/api/empresas/*` o similares, salvo que exista una justificacion expresa y una restriccion de acceso equivalente o mas estricta;
- con este criterio, el panel interno y el portal del alumno quedan separados no solo en interfaz, sino también en sus puntos de entrada HTTP cuando hay mutaciones o acciones cliente-servidor.

### 4. Reválidacion en consultas server-side sensibles

Cuando un módulo nuevo introduce consultas server-side propias, no debe asumir que la protección del layout es suficiente si esas consultas pueden reutilizarse desde otros puntos.

Por eso las consultas actuales del portal del alumno reválidan también `requireAlumnoSession(...)` antes de leer datos.

Además, la resolución de la ficha del alumno autenticado no debe continuar si el email devuelve cero coincidencias o mas de una coincidencia. En ambos casos la sesión no se considera asociada de forma válida a una ficha académica.

### 5. Middleware como filtro previo, no como autorización completa

El `middleware` actual cumple un papel deliberadamente limitado:

- bloquea acceso anonimo obvio a rutas privadas;
- permite el acceso a `/login`;
- limpia cookies de sesión con firma inválida;
- devuelve `401` temprano en APIs cuando no hay una cookie utilizable.

No se apoya en Prisma ni válida por si mismo:

- existencia real de la sesión en BD;
- expiracion real de la sesión;
- estado activo del usuario;
- rol del usuario.

Esa válidacion fuerte se deja a las guardias server-side y a la capa API.

## Visibilidad y acceso actual por rol

### `ADMIN`

Visibilidad principal:

- ve la navegacion completa del panel interno;
- ve el acceso a configuración y a gestión de usuarios;
- no usa el portal del alumno como espacio funcional propio.

Acceso efectivo:

- puede entrar en todos los módulos internos;
- puede entrar también en `ofertas` y `cursos` cuando esas páginas se públican como contenido general del centro dentro del panel interno;
- puede usar importación y exportación;
- puede gestionar usuarios y todas las opciones visibles de configuración.

### `PROFESOR`

Visibilidad principal:

- ve en la `Navbar` solo los módulos internos permitidos;
- ve el acceso a `profesores` dentro del panel interno;
- no ve enlaces de administración reservados a `ADMIN`;
- no debe ver el portal del alumno como sustituto del panel interno.

Acceso efectivo:

- puede entrar en los módulos funcionales internos ya existentes;
- puede entrar también en `ofertas` y `cursos` cuando esas páginas se públican como contenido general del centro dentro del panel interno;
- puede entrar en `profesores`;
- puede exportar y descargar plantillas;
- puede modificar la configuración académica visible en `Configuración`;
- puede modificar los catálogos visibles en `Configuración`;
- no puede acceder a gestión de usuarios;
- no puede usar importación masíva desde Excel;
- si intenta entrar manualmente en `/portal-alumno`, se le redirige fuera de ese espacio porque no es su area funcional.

### `ALUMNO`

Visibilidad principal:

- no debe usar la `Navbar` del panel interno como espacio de trabajo;
- si ya tiene sesión y pasa por `/login`, se le redirige a `/portal-alumno`;
- accede a un layout propio del `portal-alumno`;
- dentro del portal ve su propia navegacion y el control de sesión/login.

Acceso efectivo:

- puede entrar solo en el `portal-alumno` si está autorizado y activo;
- dentro del `portal-alumno` puede ver tanto contenido general del portal como su información personalizada autorizada;
- no puede entrar en el panel interno general;
- no puede acceder a administración, configuración ni mantenimiento global de datos;
- no puede reutilizar rutas server-side del portal sin pasar la guardia de rol `ALUMNO`;
- no puede usar las APIs internas del panel como sustituto de las rutas propias del `portal-alumno`.

## Decision de implementación

Se acuerda mantener como solución base:

- autenticación local operativa;
- autorización definitiva basada en `Usuario`;
- roles `ADMIN`, `PROFESOR` y preparación para `ALUMNO`;
- pantalla de administración de usuarios;
- posibilidad futura de migrar la autenticación hacia `edu.gva.es` u otro proveedor externo con el mínimo impacto posible.

## Estado actual acordado

Actualmente queda establecido que:

- solo `ADMIN` puede anadir o eliminar usuarios;
- solo `ADMIN` puede usar la importación masíva desde Excel en el módulo `Import / Export`;
- esa restricción de importación masiva afecta a `alumnos`, `empresas`, `formacion` y `profesores`;
- `PROFESOR` puede seguir usando las funcionalidades preexistentes de la aplicación, incluida la gestión funcional de `profesores`, salvo esas capacidades administrativas o de importación restringidas;
- `ALUMNO` dispone de un portal separado con visibilidad y protección propias;
- la autorización relevante debe comprobarse en servidor, no solo en la interfaz.

Restricciones adicionales ya implementadas:

- un administrador no puede eliminar su propio usuario;
- no se puede eliminar el ultimo administrador activo;
- si algun dia se implanta una vía `external` real, no se mostraran ni se usaran flujos de contraseña local;
- en el módulo `Import / Export`, el profesorado puede exportar y descargar plantillas, pero no importar.
- el `portal-alumno` exige sesión válida y rol `ALUMNO` tanto en layout como en sus consultas server-side principales.
- el CV del alumno en su portal usa una API propia separada de las APIs internas del panel.
- el `middleware` limpia cookies con firma inválida y no bloquea `/login` solo por detectar una cookie firmada.

## Cobertura de pruebas de seguridad

Las medidas anteriores cuentan con cobertura automatizada específica en:

- `middleware.test.ts`
- `src/app/access-contract.test.ts`
- `src/modules/auth/api.test.ts`
- `src/modules/auth/permissions.test.ts`
- `src/modules/auth/session.test.ts`
- `src/modules/portal-alumno/actions/queries.test.ts`
- `src/app/api/settings/email-domains/route.test.ts`
- `src/app/api/settings/academico/route.test.ts`
- `src/app/api/catalogos/sectores/route.test.ts`
- `src/app/api/catalogos/sectores/[id]/route.test.ts`
- `src/app/api/catalogos/sectores/restaurar/route.test.ts`
- `src/app/api/catalogos/ciclos-formativos/route.test.ts`
- `src/app/api/catalogos/ciclos-formativos/[id]/route.test.ts`
- `src/app/api/catalogos/ciclos-formativos/restaurar/route.test.ts`
- `src/app/api/catalogos/curso-proveedores/route.test.ts`
- `src/app/api/catalogos/curso-proveedores/[id]/route.test.ts`
- `src/app/api/catalogos/curso-areas/route.test.ts`
- `src/app/api/catalogos/curso-areas/[id]/route.test.ts`
- `src/app/api/importar/empresas/route.test.ts`
- `src/app/api/importar/profesores/route.test.ts`

Estas pruebas cubren al menos:

- visibilidad y decision de acceso por rol en helpers centrales;
- guardias `requireAlumnoSession` y `requireStaffSession`;
- redireccion por rol desde `/login`;
- comportamiento del `middleware` con cookies inválidas y acceso a `/login`;
- reválidacion del portal del alumno antes de consultar datos;
- decision `401` frente a `403` en la capa API;
- páginas servidor representativas del panel interno que deben exigir personal del centro.

## Estado de la vía de autenticación externa

Aunque la decision de trabajo del proyecto es claramente el login local, la alternativa de autenticación externa no desaparecio del todo del diseno. Quedo documentada en varias partes de este archivo y conviene dejar aqui un resumen único del estado real en que se encuentra.

### Idea original

La idea original era que la aplicación pudiera delegar la autenticación en un proveedor institucional externo, previsiblemente vinculado a cuentas `@edu.gva.es`, manteniendo en nuestra base de datos solo la autorización interna.

Eso implicaba separar dos responsabilidades:

- el proveedor externo autentica la identidad del usuario;
- nuestra base de datos decide si ese usuario está autorizado, si está activo y con que rol entra.

El criterio acordado desde el principio fue que no bastaba con tener una cuenta `@edu.gva.es`: el email autenticado debia existir prevíamente en la tabla `Usuario` y estar marcado como activo.

### Que se dejo preparado técnicamente

Aunque no se ha completado una integración real contra un proveedor institucional, si quedaron preparadas varias piezas para no cerrar esa puerta:

- el modo `AUTH_MODE=external`;
- variables de entorno específicas para autorización externa;
- una capa de configuración para ese modo;
- una ruta de inicio de autorización externa;
- una ruta callback reservada;
- generacion y válidacion de `state` firmado para proteger el flujo;
- soporte de `authProvider` y `authSubject` en `Usuario`;
- actualizacion de `lastLoginAt` y creacion de sesión local tras una autenticación externa válida;
- posibilidad de simular el callback externo solo para pruebas controladas.

En otras palabras: no hay integración final cerrada con un servidor externo real, pero si existe un esqueleto técnico pensado para un futuro flujo tipo OIDC o similar.

### Que parte no se llego a cerrar

La parte que quedo abierta y no debe considerarse terminada es la integración real con el proveedor institucional. En particular, no queda resuelto en el estado actual del proyecto:

- el intercambio real de `code` por tokens con el proveedor;
- la verificacion formal de `id_token` o equivalente;
- la definicion final de scopes y claims disponibles;
- el procedimiento administrativo o técnico para registrar la aplicación en el proveedor real;
- la confirmacion de que el centro puede usar ese proveedor para una aplicación propia;
- la definicion exacta del identificador externo estable que llegaria desde ese sistema.

Por eso, aunque el modo `external` existe como posibilidad de arquitectura y hay código de soporte, no debe interpretarse como una funcionalidad desplegada y validada de punta a punta.

### Decision practica adoptada

La decision practica que ha guiado el desarrollo posterior ha sido esta:

- el sistema operativo y soportado de verdad es el login local;
- la gestión cotidiana de altas, cambios de contraseña y reseteos se hace en local;
- la vía externa se conserva solo como alternativa futura preparada a nivel de arquitectura;
- si algun dia se retoma, la autorización seguirá dependiendo de `Usuario`, no del proveedor externo.

### Consecuencia documental

Cuando se lea este documento debe entenderse que:

- `local` describe el sistema actualmente implantado y en uso;
- `external` describe una vía prevista, parcialmente preparada en código, pero pospuesta y no completada.

## Modelo de identidades académicas

Con la incorporacion del `portal-alumno`, el modelo de identidades queda fijado así:

- `Alumno` y `Profesor` son las entidades funcionales de negocio;
- `Usuario` es la identidad técnica de acceso a la aplicación;
- `LocalAuthAccount` sigue siendo solo la capa de credenciales locales;
- el identificador funcional comun entre estas piezas es el `email`.

### Regla general

Para identidades académicas:

- cada `Alumno` con email valido tiene su `Usuario` correspondiente;
- cada `Profesor` con email valido tiene su `Usuario` correspondiente;
- esas cuentas nacen desactivadas por defecto;
- la activacion del acceso sigue siendo una decision administrativa explícita.

Para identidades administrativas:

- un `ADMIN` puede existir sin ficha en `Alumno` ni en `Profesor`;
- puede crearse desde bootstrap o desde la administración de usuarios.

### Correspondencia por rol

La regla funcional vigente es:

- un `Usuario` con rol `ALUMNO` corresponde obligatoriamente a una ficha válida de `Alumno`;
- un `Usuario` con rol `PROFESOR` corresponde obligatoriamente a una ficha válida de `Profesor`;
- un `Usuario` con rol `ADMIN` puede ser un administrador puro o un profesor promovido.

### Fuente de verdad por dato

La fuente de verdad queda separada por responsabilidad:

- `Alumno` y `Profesor` son la fuente de verdad de nombre y email para identidades académicas;
- `Usuario` es la fuente de verdad de acceso, estado activo, rol efectivo y sesión;
- `LocalAuthAccount` es la fuente de verdad de la credencial local, vinculada por email.

Consecuencia:

- nombre y email de alumnos y profesores se editan desde su ficha funcional;
- al cambiarse ahi, se sincronizan automaticamente `Usuario` y, en modo local, `LocalAuthAccount`;
- nombre y email no deben editarse libremente desde administración de usuarios para cuentas académicas.

### Reglas de creacion y sincronizacion

#### Alta de alumno

Cuando se crea un `Alumno`:

- su `email` es obligatorio y único;
- no puede coincidir con el email de otro alumno ni de un profesor;
- se crea o sincroniza automaticamente un `Usuario` con ese email;
- ese `Usuario` queda con rol `ALUMNO` y `activo = false`.

#### Alta de profesor

Cuando se crea un `Profesor`:

- su `email` es obligatorio y único;
- no puede coincidir con el email de otro profesor ni de un alumno;
- se crea o sincroniza automaticamente un `Usuario` con ese email;
- ese `Usuario` queda con rol `PROFESOR` y `activo = false`, salvo que ya fuese un profesor promovido a `ADMIN`, en cuyo caso conserva `ADMIN`.

#### Alta de administrador

Cuando se necesita un `ADMIN` puro:

- puede crearse directamente por bootstrap o desde administración de usuarios;
- no necesita ficha en `Alumno` ni en `Profesor`.

### Regla de acceso efectivo

Crear una ficha funcional no equivale a conceder acceso.

Por tanto:

- crear un `Alumno` o un `Profesor` crea o sincroniza su identidad técnica;
- esa identidad nace desactivada por defecto;
- el acceso efectivo se concede activando el `Usuario`;
- en `AUTH_MODE=local`, el acceso local puede requerir además crear o resetear contraseña;
- en `AUTH_MODE=external`, basta con que exista un `Usuario` activo y autorizado.

### Regla de email e identidad

La identidad académica queda resuelta de forma inequívoca por email:

- `Alumno.email` es obligatorio y único;
- `Profesor.email` es obligatorio y único;
- el mismo email no puede estar asígnado a la vez a un alumno y a un profesor;
- el `portal-alumno` resuelve la ficha exclusivamente por email;
- no existen fallbacks por nombre ni coincidencias parciales.

### Regla de dominios permitidos para email

Además de ser único y coherente con la identidad funcional, el email académico debe pertenecer a un dominio permitido para su entidad:

- para `Alumno`, el dominio base permitido es `@alu.edu.gva.es`;
- para `Profesor`, el dominio base permitido es `@edu.gva.es`;
- pueden admitirse dominios adicionales para alumnos o profesores desde la página de `Configuración`;
- esas ampliaciónes se aplican como configuración funcional del sistema y se válidan en altas, ediciones e importaciónes.

### Regla de actualizacion de email

Si cambia el email de una ficha académica:

- cambia automaticamente el email del `Usuario` asociado;
- si existe `LocalAuthAccount`, también se actualiza a ese nuevo email;
- toda la operacion reválida la unicidad y compatibilidad del nuevo email.

### Regla de cambio de rol

#### Alumno

- una identidad procedente de `Alumno` no puede cambiar de rol;
- su rol efectivo permanece en `ALUMNO`;
- la administración de usuarios no debe ofrecer ni aceptar ese cambio.

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

### Regla de administración de usuarios

La pantalla de administración de usuarios ya no es alta universal de identidades.

Su funcion actual es:

- crear usuarios manualmente solo para `ADMIN`;
- activar o desactivar accesos existentes;
- resetear contraseñas en modo local;
- permitir el cambio `PROFESOR <-> ADMIN` cuando la identidad procede de un profesor;
- impedir cambio de rol en usuarios de alumno;
- impedir edicion manual de nombre y email en cuentas ligadas a `Alumno` o `Profesor`.

Consecuencia visible en UI:

- el bloque de alta manual queda orientado solo a administradores;
- `ALUMNO` y `PROFESOR` no se crean manualmente desde esa pantalla;
- la tabla de usuarios puede clasíficar el origen de la identidad como `ALUMNO`, `PROFESOR` o `ADMIN` puro.
- el boton de borrado solo aparece para `ADMIN` puros, es decir, cuentas no ligadas a `Profesor` ni a `Alumno`;
- el administrador logueado no puede borrarse ni desactivarse a si mismo.

### Implementación técnica vigente

La implementación actual sigue estas reglas:

- las altas, ediciones e importaciónes de `Alumno` y `Profesor` sincronizan automaticamente `Usuario`;
- esa sincronizacion se ejecuta dentro de la misma transaccion lógica;
- las bajas funcionales ajustan también el estado del `Usuario` asociado;
- la relación entre identidad funcional y cuenta de acceso se resuelve por `email`, no por `id`;
- la tabla `usuarios` se completó y saneó mediante una migración de datos específica, no mediante reconciliación en cada ejecución de la app.
- en modo local, si se activa una cuenta sin contraseña prevía, antes de activarla se fuerza el dialogo de reseteo de contraseña;
- si ese dialogo se cancela, la cuenta permanece desactivada;
- si se reactiva una cuenta que ya tenia contraseña local, conserva esa misma contraseña.

### Decision operativa vigente

El estado definitivo del modelo queda así:

- `Alumno` crea o sincroniza automaticamente `Usuario(ALUMNO, activo=false)`;
- `Profesor` crea o sincroniza automaticamente `Usuario(PROFESOR, activo=false)`;
- `ALUMNO` no puede cambiar de rol;
- una identidad procedente de `Profesor` puede alternar entre `PROFESOR` y `ADMIN`;
- `ADMIN` puro puede seguir creandose manualmente;
- al crear un `ADMIN` puro en modo local, la cuenta nace desactivada y se abre inmediatamente el flujo de reseteo/definicion de contraseña; solo después de completarlo queda activada;
- al activar por primera vez una cuenta académica sin contraseña local prevía, se usa ese mismo flujo inmediato de reseteo/definicion de contraseña;
- la administración de usuarios es gestión de acceso, no alta universal de cualquier rol.
