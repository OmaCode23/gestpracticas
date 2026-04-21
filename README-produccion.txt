GestPracticas - paquete de produccion

Contenido:
- Aplicacion Next.js compilada en modo standalone.
- Archivos estaticos necesarios para ejecucion.

Requisitos:
- Node.js >= 18.17.0 (recomendado Node.js 20 LTS o superior)
- PostgreSQL


Uso:
1. Restaura manualmente en PostgreSQL la base de datos que quieras usar en produccion:
     crea manualmente la bbdd, por ejemplo "gestpracticas_prod";
     restaura si se incluye en el paquete, un backup de datos de la bbdd;
2. Configura la variable DATABASE_URL en el archivo .env si hace falta. Debe tener el 
     nombre correcto de la bbdd, por ejemplo "gestpracticas_prod";
3. Ejecuta: node server.js
4. La aplicación estará disponible en: localhost:3000
