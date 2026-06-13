export const ALUMNO_CV_MAX_BYTES = 500 * 1024;
export const ALUMNO_CV_ACCEPTED_TYPES = ["application/pdf"] as const;

export function formatFileSize(size?: number | null) {
  if (!size) return "-";
  if (size < 1024) return `${size} B`;
  return `${(size / 1024).toFixed(size >= 10 * 1024 ? 0 : 1)} KB`;
}

export function isAcceptedCvType(file: File) {
  return ALUMNO_CV_ACCEPTED_TYPES.includes(
    file.type as (typeof ALUMNO_CV_ACCEPTED_TYPES)[number]
  );
}

export async function prepareAlumnoCvFile(file: File) {
  if (!isAcceptedCvType(file)) {
    throw new Error("Solo se admiten archivos PDF.");
  }

  if (file.size > ALUMNO_CV_MAX_BYTES) {
    throw new Error(
      "El PDF supera 500 KB. Sube una versión optimizada que se vea bien dentro de ese límite."
    );
  }

  return file;
}
