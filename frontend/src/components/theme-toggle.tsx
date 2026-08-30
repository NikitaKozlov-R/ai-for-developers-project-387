import { MoonIcon, SunIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/theme";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={toggleTheme}
      aria-label={
        isDark ? "Переключить на светлую тему" : "Переключить на тёмную тему"
      }
    >
      {isDark ? <MoonIcon aria-hidden /> : <SunIcon aria-hidden />}
    </Button>
  );
}
