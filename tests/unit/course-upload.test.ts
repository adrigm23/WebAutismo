import {
  formatUploadFileSize,
  validateCourseUploadSelection,
} from "@/lib/course-upload";

describe("course upload helpers", () => {
  test("formats the app upload limit in megabytes", () => {
    expect(formatUploadFileSize(10 * 1024 * 1024)).toBe("10 MB");
  });

  test("rejects files above the 10 MB app limit", () => {
    const result = validateCourseUploadSelection(
      new File([new Uint8Array(10 * 1024 * 1024 + 1)], "guia.pdf", {
        type: "application/pdf",
      }),
    );

    expect(result).toBe("El archivo supera el tamano maximo permitido de 10 MB.");
  });

  test("rejects files with unsupported mime types", () => {
    const result = validateCourseUploadSelection(
      new File(["contenido"], "guia.exe", {
        type: "application/x-msdownload",
      }),
    );

    expect(result).toBe(
      "El archivo tiene un tipo MIME no permitido (application/x-msdownload).",
    );
  });
});
