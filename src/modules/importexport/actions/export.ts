/**
 * modules/importexport/actions/export.ts
 *
 * Funciones del servidor para preparar los datos de exportación.
 * La generación del archivo Excel se hace en el cliente con SheetJS
 * (no en el servidor, para no bloquear el hilo de Node).
 *
 * Estas funciones devuelven los datos en crudo para que el cliente
 * los convierta al formato Excel.
 */

