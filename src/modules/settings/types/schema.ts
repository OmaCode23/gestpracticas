import { z } from "zod";

export const configuracionAcademicaSchema = z.object({
  mesCambioCurso: z.coerce
    .number({
      required_error: "El mes de cambio de curso es obligatorio.",
      invalid_type_error: "El mes de cambio de curso debe ser numerico.",
    })
    .int("El mes de cambio de curso debe ser un numero entero.")
    .min(1, "El mes de cambio de curso debe estar entre 1 y 12.")
    .max(12, "El mes de cambio de curso debe estar entre 1 y 12."),
  numeroCursosVisibles: z.coerce
    .number({
      required_error: "El numero de cursos visibles es obligatorio.",
      invalid_type_error: "El numero de cursos visibles debe ser numerico.",
    })
    .int("El numero de cursos visibles debe ser un numero entero.")
    .min(1, "El numero de cursos visibles debe estar entre 1 y 10.")
    .max(10, "El numero de cursos visibles debe estar entre 1 y 10."),
  resultadosPorPagina: z.coerce
    .number({
      required_error: "El numero de resultados por pagina es obligatorio.",
      invalid_type_error: "El numero de resultados por pagina debe ser numerico.",
    })
    .int("El numero de resultados por pagina debe ser un numero entero.")
    .min(1, "El numero de resultados por pagina debe estar entre 1 y 100.")
    .max(100, "El numero de resultados por pagina debe estar entre 1 y 100."),
});

export type ConfiguracionAcademicaInput = z.infer<
  typeof configuracionAcademicaSchema
>;
