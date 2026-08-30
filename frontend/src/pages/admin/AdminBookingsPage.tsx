import { useMemo, useState } from "react";
import { adminListBookings } from "@/api/endpoints";
import type { Booking, PlainDate } from "@/api/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { useApi } from "@/lib/useApi";
import {
  addDaysUtc,
  dayKey,
  formatDate,
  formatDuration,
  formatTimeRange,
  startOfDayIso,
} from "@/lib/utc";

export function AdminBookingsPage() {
  const [from, setFrom] = useState<PlainDate>("");
  const [to, setTo] = useState<PlainDate>("");
  const [applied, setApplied] = useState<{ from: PlainDate; to: PlainDate }>({
    from: "",
    to: "",
  });

  const range = useMemo(
    () => ({
      from: applied.from ? startOfDayIso(applied.from) : undefined,
      // Верхняя граница у API исключающая, поэтому берём начало следующих суток,
      // иначе выбранный последний день выпал бы из выборки.
      to: applied.to ? startOfDayIso(addDaysUtc(applied.to, 1)) : undefined,
    }),
    [applied],
  );

  const bookings = useApi(
    (signal) => adminListBookings(range, signal),
    [range.from, range.to],
  );

  const groups = useMemo(
    () => groupByDay(bookings.data ?? []),
    [bookings.data],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Предстоящие встречи
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Без фильтра показываются встречи начиная с текущего момента.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Период</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-wrap items-end gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              setApplied({ from, to });
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="range-from">С даты</Label>
              <Input
                id="range-from"
                type="date"
                value={from}
                max={to || undefined}
                onChange={(event) => setFrom(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="range-to">По дату включительно</Label>
              <Input
                id="range-to"
                type="date"
                value={to}
                min={from || undefined}
                onChange={(event) => setTo(event.target.value)}
              />
            </div>

            <Button type="submit">Применить</Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setFrom("");
                setTo("");
                setApplied({ from: "", to: "" });
              }}
            >
              Сбросить
            </Button>
          </form>
        </CardContent>
      </Card>

      {bookings.loading ? (
        <LoadingState />
      ) : bookings.error ? (
        <ErrorState error={bookings.error} onRetry={bookings.refetch} />
      ) : groups.length === 0 ? (
        <EmptyState
          title="Предстоящих встреч нет"
          description="Как только гость забронирует слот, встреча появится здесь."
        />
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <section key={group.date} className="space-y-3">
              <h2 className="text-muted-foreground text-sm font-medium">
                {formatDate(group.date)}
              </h2>
              <ul className="space-y-2">
                {group.items.map((booking) => (
                  <li
                    key={booking.id}
                    className="flex flex-wrap items-baseline gap-x-4 gap-y-1 rounded-lg border px-4 py-3"
                  >
                    <span className="font-mono text-sm font-medium">
                      {formatTimeRange(booking.startsAt, booking.endsAt)}
                    </span>
                    <span className="font-medium">
                      {booking.eventType.title}
                    </span>
                    <span className="text-muted-foreground text-sm">
                      {formatDuration(booking.eventType.durationMinutes)}
                    </span>
                    <span className="text-muted-foreground ms-auto text-sm">
                      {booking.guest.name} · {booking.guest.email}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function groupByDay(
  bookings: Booking[],
): { date: PlainDate; items: Booking[] }[] {
  const groups: { date: PlainDate; items: Booking[] }[] = [];

  for (const booking of bookings) {
    const date = dayKey(booking.startsAt);
    const last = groups.at(-1);

    if (last && last.date === date) last.items.push(booking);
    else groups.push({ date, items: [booking] });
  }

  return groups;
}
