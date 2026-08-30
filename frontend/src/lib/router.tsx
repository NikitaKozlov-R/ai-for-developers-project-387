import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type AnchorHTMLAttributes,
  type ReactNode,
} from "react";
import { RouterContext, useRouter, type RouterValue } from "./routing";

// В этом модуле живут только компоненты — остальное в routing.ts, иначе ломается Fast Refresh.

function readLocation() {
  return { path: window.location.pathname, search: window.location.search };
}

export function RouterProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState(readLocation);

  useEffect(() => {
    const sync = () => setLocation(readLocation());
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  const navigate = useCallback<RouterValue["navigate"]>((to, options) => {
    const previousPath = window.location.pathname;

    if (options?.replace) window.history.replaceState(null, "", to);
    else window.history.pushState(null, "", to);

    setLocation(readLocation());

    // Смена query — это выбор слота внутри страницы, прокрутку в таком случае не сбрасываем.
    if (window.location.pathname !== previousPath) window.scrollTo(0, 0);
  }, []);

  const value = useMemo<RouterValue>(
    () => ({ path: location.path, search: location.search, navigate }),
    [location.path, location.search, navigate],
  );

  return <RouterContext value={value}>{children}</RouterContext>;
}

type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  to: string;
  replace?: boolean;
};

export function Link({ to, replace, onClick, children, ...rest }: LinkProps) {
  const { navigate } = useRouter();

  return (
    <a
      href={to}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        if (event.button !== 0) return;
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
          return;

        event.preventDefault();
        navigate(to, { replace });
      }}
      {...rest}
    >
      {children}
    </a>
  );
}
