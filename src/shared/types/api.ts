/**
 * shared/types/api.ts
 *
 * Tipos genéricos para las respuestas de la API.
 * Todas las rutas de /api devuelven este formato
 * para que el cliente sea consistente al manejarlos.
 */

export type ApiResponse<T> =
  | { ok: true;  data: T }
  | { ok: false; error: string };
