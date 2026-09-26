"use client";

import { Printer } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className={buttonVariants({ variant: "secondary" })}>
      <Printer className="h-4 w-4" />
      Imprimir
    </button>
  );
}
