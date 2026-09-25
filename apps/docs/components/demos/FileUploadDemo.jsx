"use client";

import { FileUpload } from "semec-ds/react";

export default function FileUploadDemo() {
  return (
    <FileUpload
      accept=".pdf,image/*"
      maxSize={5 * 1024 * 1024}
      hint="PDF ou imagem, até 5 MB"
    />
  );
}
