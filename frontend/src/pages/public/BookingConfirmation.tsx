import { CheckCircle2Icon } from "lucide-react";
import type { Booking } from "@/api/types";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Link } from "@/lib/router";
import { formatDateTime, formatDuration, formatTime } from "@/lib/utc";
import { cn } from "@/lib/utils";

export function BookingConfirmation({ booking }: { booking: Booking }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2Icon className="size-5" aria-hidden />
          Встреча забронирована
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <dl className="grid gap-3 text-sm sm:grid-cols-[10rem_1fr]">
          <dt className="text-muted-foreground">Тип встречи</dt>
          <dd className="font-medium">{booking.eventType.title}</dd>

          <dt className="text-muted-foreground">Когда</dt>
          <dd className="font-medium">
            {formatDateTime(booking.startsAt)} – {formatTime(booking.endsAt)}
          </dd>

          <dt className="text-muted-foreground">Длительность</dt>
          <dd>{formatDuration(booking.eventType.durationMinutes)}</dd>

          <dt className="text-muted-foreground">Гость</dt>
          <dd>
            {booking.guest.name}, {booking.guest.email}
          </dd>
        </dl>

        <Separator />

        <p className="text-muted-foreground text-xs">
          Время указано в UTC. Номер брони: {booking.id}. Сохраните его —
          страница подтверждения не открывается повторно.
        </p>

        <Link to="/" className={cn(buttonVariants({ variant: "outline" }))}>
          К списку типов встреч
        </Link>
      </CardContent>
    </Card>
  );
}
