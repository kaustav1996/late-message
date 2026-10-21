"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button type="button" className="btn btn-quiet" onClick={() => window.print()}>
      <Printer aria-hidden="true" /> Print or save as PDF
    </button>
  );
}
