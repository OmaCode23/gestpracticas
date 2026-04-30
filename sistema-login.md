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
- capa central de permisos por rol en codigo;
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
- `LocalAuthAccount`: hash de contrasena y configuracion temporal del acceso local

De este modo, cuando se sustituya el login local por el login con `edu.gva.es`, la tabla `Usuario` seguira siendo valida y la migracion sera pequena.

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

No esta implantado todavia como rol operativo completo, pero queda reservado para una futura ampliacion.

La intencion funcional es que:

- pueda iniciar sesion solo si esta autorizado y activo;
- tenga visibilidad muy reducida;
- no pueda acceder a administracion, configuracion, importacion ni gestion global de datos.

Hasta que se defina expresamente su alcance, no debe asumirse que un usuario con rol `ALUMNO` tenga permisos equivalentes a `PROFESOR`.

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
- la autorizacion relevante debe comprobarse en servidor, no solo en la interfaz.

Restricciones adicionales ya implementadas:

- un administrador no puede eliminar su propio usuario;
- no se puede eliminar el ultimo administrador activo;
- en `AUTH_MODE=external` no se muestran ni se usan flujos de contrasena local;
- en el modulo `Import / Export`, el profesorado puede exportar y descargar plantillas, pero no importar.
