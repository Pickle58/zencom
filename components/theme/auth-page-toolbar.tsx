"use client";

import { ModeToggle } from "@/components/theme/mode-toggle";

export function AuthPageToolbar() {
  return (
    <div className="fixed right-4 top-4 z-50">
      <ModeToggle />
    </div>
  );
}
