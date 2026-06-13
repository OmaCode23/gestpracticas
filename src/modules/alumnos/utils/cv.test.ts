import { describe, expect, it } from "vitest";
import {
  ALUMNO_CV_MAX_BYTES,
  formatFileSize,
  isAcceptedCvType,
  prepareAlumnoCvFile,
} from "./cv";

describe("alumnos cv utils", () => {
  it("formatea tamanos en bytes y KB", () => {
    expect(formatFileSize(null)).toBe("-");
    expect(formatFileSize(500)).toBe("500 B");
    expect(formatFileSize(1536)).toBe("1.5 KB");
    expect(formatFileSize(12 * 1024)).toBe("12 KB");
  });

  it("detecta tipos aceptados", () => {
    expect(isAcceptedCvType(new File(["x"], "cv.pdf", { type: "application/pdf" }))).toBe(
      true
    );
    expect(isAcceptedCvType(new File(["x"], "cv.txt", { type: "text/plain" }))).toBe(false);
  });

  it("acepta PDFs dentro del limite", async () => {
    const file = new File([new Uint8Array(100)], "cv.pdf", {
      type: "application/pdf",
    });

    await expect(prepareAlumnoCvFile(file)).resolves.toBe(file);
  });

  it("rechaza tipos no validos y ficheros demasiado grandes", async () => {
    const invalidFile = new File(["x"], "cv.txt", { type: "text/plain" });
    const largeFile = new File([new Uint8Array(ALUMNO_CV_MAX_BYTES + 1)], "cv.pdf", {
      type: "application/pdf",
    });

    await expect(prepareAlumnoCvFile(invalidFile)).rejects.toThrow(
      "Solo se admiten archivos PDF."
    );
    await expect(prepareAlumnoCvFile(largeFile)).rejects.toThrow(
      "El PDF supera 500 KB."
    );
  });
});
