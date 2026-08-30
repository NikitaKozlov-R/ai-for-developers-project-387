import { ArrowRightIcon, ClockIcon } from "lucide-react";
import { getOwner, listEventTypes } from "@/api/endpoints";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { Link } from "@/lib/router";
import { useApi } from "@/lib/useApi";
import { formatDuration } from "@/lib/utc";

export function HomePage() {
  // Два независимых запроса: упавший профиль владельца не должен прятать список типов встреч.
  const owner = useApi((signal) => getOwner(signal), []);
  const eventTypes = useApi((signal) => listEventTypes(signal), []);

  return (
    <div className="space-y-8">
      <section>
        {owner.loading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-5 w-96 max-w-full" />
          </div>
        ) : owner.error ? (
          <ErrorState error={owner.error} onRetry={owner.refetch} />
        ) : owner.data ? (
          <>
            <h1 className="text-3xl font-semibold tracking-tight">
              {owner.data.name}
            </h1>
            {owner.data.bio ? (
              <p className="text-muted-foreground mt-2 max-w-2xl">
                {owner.data.bio}
              </p>
            ) : null}
          </>
        ) : null}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium">Выберите тип встречи</h2>

        {eventTypes.loading ? (
          <LoadingState />
        ) : eventTypes.error ? (
          <ErrorState error={eventTypes.error} onRetry={eventTypes.refetch} />
        ) : eventTypes.data && eventTypes.data.length > 0 ? (
          <ul className="grid gap-4 sm:grid-cols-2">
            {eventTypes.data.map((eventType) => (
              <li key={eventType.id}>
                <Link
                  to={`/event-types/${encodeURIComponent(eventType.id)}`}
                  className="block h-full focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
                >
                  <Card className="hover:bg-muted h-full transition-colors">
                    <CardHeader>
                      <CardTitle className="flex items-start justify-between gap-3">
                        <span>{eventType.title}</span>
                        <ArrowRightIcon
                          className="text-muted-foreground mt-1 size-4 shrink-0"
                          aria-hidden
                        />
                      </CardTitle>
                      {eventType.description ? (
                        <CardDescription className="line-clamp-3">
                          {eventType.description}
                        </CardDescription>
                      ) : null}
                    </CardHeader>
                    <CardContent>
                      <Badge variant="secondary">
                        <ClockIcon aria-hidden />
                        {formatDuration(eventType.durationMinutes)}
                      </Badge>
                    </CardContent>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title="Пока нет доступных типов встреч"
            description="Владелец календаря ещё не завёл ни одного типа события."
          />
        )}
      </section>
    </div>
  );
}
