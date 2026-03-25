/**
 * shared/types/api.ts
 *
 * Tipos genericos para las respuestas de la API.
 * Todas las rutas de /api devuelven este formato
 * para que el cliente sea consistente al manejarlas.
 */

export type ApiResponse<T, E = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string; details?: E };
