"use client";

import { useTheme } from "next-themes";
import { LuMoon, LuSun } from "react-icons/lu";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle dark mode"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <LuSun className="dark:hidden" />
      <LuMoon className="hidden dark:block" />
    </Button>
  );
}
