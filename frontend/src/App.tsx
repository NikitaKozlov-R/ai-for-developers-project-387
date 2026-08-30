import { useEffect, type ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";
import { Layout } from "@/components/layout";
import { RouterProvider } from "@/lib/router";
import { matchPath, useRouter } from "@/lib/routing";
import { HomePage } from "@/pages/public/HomePage";
import { EventTypePage } from "@/pages/public/EventTypePage";
import { AdminBookingsPage } from "@/pages/admin/AdminBookingsPage";
import { AdminEventTypesPage } from "@/pages/admin/AdminEventTypesPage";
import { AdminEventTypeFormPage } from "@/pages/admin/AdminEventTypeFormPage";
import { NotFoundPage } from "@/pages/NotFoundPage";

const ROUTES: {
  pattern: string;
  render: (params: Record<string, string>) => ReactNode;
}[] = [
  { pattern: "/", render: () => <HomePage /> },
  {
    pattern: "/event-types/:eventTypeId",
    render: (params) => (
      <EventTypePage
        key={params.eventTypeId}
        eventTypeId={params.eventTypeId}
      />
    ),
  },
  { pattern: "/admin/bookings", render: () => <AdminBookingsPage /> },
  { pattern: "/admin/event-types", render: () => <AdminEventTypesPage /> },
  {
    pattern: "/admin/event-types/new",
    render: () => <AdminEventTypeFormPage />,
  },
  {
    pattern: "/admin/event-types/:eventTypeId",
    render: (params) => (
      <AdminEventTypeFormPage
        key={params.eventTypeId}
        eventTypeId={params.eventTypeId}
      />
    ),
  },
];

function Routes() {
  const { path, navigate } = useRouter();

  const redirectToBookings = path === "/admin" || path === "/admin/";
  useEffect(() => {
    if (redirectToBookings) navigate("/admin/bookings", { replace: true });
  }, [redirectToBookings, navigate]);
  if (redirectToBookings) return null;

  for (const route of ROUTES) {
    const params = matchPath(route.pattern, path);
    if (params) return route.render(params);
  }

  return <NotFoundPage />;
}

export default function App() {
  return (
    <RouterProvider>
      <Layout>
        <Routes />
      </Layout>
      <Toaster position="top-center" />
    </RouterProvider>
  );
}
