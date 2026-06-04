"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import type { ApiResponse } from "@/shared/types/api";

type PortalAlumnoActionButtonProps = {
  endpoint: string;
  label: string;
  doneLabel: string;
};

export default function PortalAlumnoActionButton({
  endpoint,
  label,
  doneLabel,
}: PortalAlumnoActionButtonProps) {
  const [status, setStatus] = useState<"idle" | "saving" | "done">("idle");

  async function handleClick() {
    if (status !== "idle") return;

    try {
      setStatus("saving");
      const response = await fetch(endpoint, { method: "POST" });
      const json: ApiResponse<unknown> = await response.json();

      if (!json.ok) {
        alert(json.error);
        setStatus("idle");
        return;
      }

      setStatus("done");
    } catch (error) {
      console.error(error);
      alert("No se pudo registrar la solicitud.");
      setStatus("idle");
    }
  }

  return (
    <Button
      variant={status === "done" ? "success" : "primary"}
      size="sm"
      onClick={handleClick}
      disabled={status !== "idle"}
      className="mt-4 w-full justify-center"
    >
      {status === "saving" ? "Registrando..." : status === "done" ? doneLabel : label}
    </Button>
  );
}
