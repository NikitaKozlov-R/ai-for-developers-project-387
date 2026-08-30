import type { ReactNode } from "react";
import { Calendar } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Link } from "@/lib/router";
import { useRouter } from "@/lib/routing";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Запись" },
  { to: "/admin/bookings", label: "Встречи" },
  { to: "/admin/event-types", label: "Типы событий" },
];

export function Layout({ children }: { children: ReactNode }) {
  const { path } = useRouter();

  return (
    <div className="bg-background text-foreground min-h-svh">
      <header className="bg-background/80 sticky top-0 z-10 border-b backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <Calendar className="size-5" aria-hidden />
            Simple Cal.com
          </Link>

          <nav
            className="flex items-center gap-1 text-sm"
            aria-label="Основная навигация"
          >
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "hover:bg-accent hover:text-accent-foreground rounded-md px-3 py-1.5 transition-colors",
                  isActive(path, item.to)
                    ? "bg-accent text-accent-foreground font-medium"
                    : "text-muted-foreground",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="ms-auto flex items-center gap-2">
            <span
              className="text-muted-foreground text-xs"
              title="Контракт хранит время только в UTC, часовой пояс не передаётся"
            >
              Все времена — UTC
            </span>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}

function isActive(path: string, target: string): boolean {
  if (target === "/") return path === "/" || path.startsWith("/event-types");
  return path.startsWith(target);
}
