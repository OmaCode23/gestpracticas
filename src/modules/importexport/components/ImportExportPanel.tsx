/**
 * modules/importexport/components/ImportExportPanel.tsx  —  Client Component
 *
 * Panel de importación y exportación de datos.
 *
 * EXPORTAR: llama a /api/exportar/:tipo → recibe JSON → genera .xlsx con SheetJS
 * IMPORTAR: lee el .xlsx subido con SheetJS → valida columnas → POST a la API
 *
 * Requiere instalar: npm install xlsx
 * (SheetJS — librería para leer y escribir archivos Excel)
 */

