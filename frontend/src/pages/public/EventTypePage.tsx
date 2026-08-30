import { useMemo, useState } from "react";
import { AlertCircleIcon, ArrowLeftIcon, ClockIcon } from "lucide-react";
import { createBooking, getEventType, getSlots } from "@/api/endpoints";
import type { Booking, Guest, PlainDate, Slot } from "@/api/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState, LoadingState } from "@/components/states";
import { Link } from "@/lib/router";
import { useQueryParam, useRouter } from "@/lib/routing";
import { useApi } from "@/lib/useApi";
import { useMutation } from "@/lib/useMutation";
import { cn } from "@/lib/utils";
import {
  formatDate,
  formatDuration,
  formatTimeRange,
  dayKey,
  isPast,
} from "@/lib/utc";
import { BookingConfirmation } from "./BookingConfirmation";
import { BookingForm } from "./BookingForm";
import { SlotPicker } from "./SlotPicker";

/** Ошибки, после которых выбранный слот больше не актуален и календарь нужно перезапросить. */
const STALE_SLOT_CODES = [
  "SLOT_UNAVAILABLE",
  "SLOT_OUT_OF_WINDOW",
  "NOT_FOUND",
];

export function EventTypePage({ eventTypeId }: { eventTypeId: string }) {
  const { navigate } = useRouter();
  const selectedStartsAt = useQueryParam("startsAt");

  const eventType = useApi(
    (signal) => getEventType(eventTypeId, signal),
    [eventTypeId],
  );
  const slots = useApi(
    (signal) => getSlots(eventTypeId, {}, signal),
    [eventTypeId],
  );

  const [pickedDate, setPickedDate] = useState<PlainDate | null>(null);
  const [guest, setGuest] = useState<Guest>({ name: "", email: "" });
  const [booking, setBooking] = useState<Booking | null>(null);
  const [staleSlotNotice, setStaleSlotNotice] = useState<string | null>(null);

  const bookingMutation = useMutation(createBooking);

  const days = useMemo(() => slots.data?.days ?? [], [slots.data]);

  // Выбранный день выводится из данных, поэтому сам чинится после перезапроса календаря.
  const activeDate =
    (pickedDate && days.some((day) => day.date === pickedDate)
      ? pickedDate
      : null) ??
    days.find((day) => day.slots.some((slot) => !isPast(slot.startsAt)))
      ?.date ??
    days[0]?.date ??
    null;

  const selectedSlot = useMemo(
    () =>
      selectedStartsAt
        ? (days
            .flatMap((day) => day.slots)
            .find((slot) => slot.startsAt === selectedStartsAt) ?? null)
        : null,
    [days, selectedStartsAt],
  );

  const basePath = `/event-types/${encodeURIComponent(eventTypeId)}`;

  function selectSlot(slot: Slot) {
    setStaleSlotNotice(null);
    bookingMutation.reset();
    navigate(`${basePath}?startsAt=${encodeURIComponent(slot.startsAt)}`, {
      replace: true,
    });
  }

  function clearSlot() {
    navigate(basePath, { replace: true });
  }

  async function submitBooking() {
    if (!selectedSlot) return;

    const outcome = await bookingMutation.mutate({
      eventTypeId,
      startsAt: selectedSlot.startsAt,
      guest: { name: guest.name.trim(), email: guest.email.trim() },
    });
    if (!outcome) return;

    if (outcome.ok) {
      setBooking(outcome.data);
      return;
    }

    if (STALE_SLOT_CODES.includes(outcome.error.code)) {
      // Имя и email намеренно сохраняем: гость не виноват, что слот заняли.
      setStaleSlotNotice(outcome.error.message);
      clearSlot();
      slots.refetch();
    }
  }

  if (booking) return <BookingConfirmation booking={booking} />;

  if (eventType.loading) return <LoadingState rows={2} />;
  if (eventType.error) {
    return eventType.error.code === "NOT_FOUND" ? (
      <NotFoundNotice />
    ) : (
      <ErrorState error={eventType.error} onRetry={eventType.refetch} />
    );
  }
  if (!eventType.data) return null;

  const durationMinutes =
    slots.data?.durationMinutes ?? eventType.data.durationMinutes;

  // Ссылку с ?startsAt могли открыть позже, когда такого слота в окне записи уже нет.
  const selectionMissing =
    Boolean(selectedStartsAt) && !selectedSlot && Boolean(slots.data);

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ArrowLeftIcon className="size-4" aria-hidden />
          Все типы встреч
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          {eventType.data.title}
        </h1>
        {eventType.data.description ? (
          <p className="text-muted-foreground mt-2 max-w-2xl">
            {eventType.data.description}
          </p>
        ) : null}
        <Badge variant="secondary" className="mt-3">
          <ClockIcon aria-hidden />
          {formatDuration(durationMinutes)}
        </Badge>
      </div>

      {staleSlotNotice ? (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertTitle>Слот больше не доступен</AlertTitle>
          <AlertDescription>
            <p>{staleSlotNotice}</p>
            <p>Календарь обновлён — выберите другое время.</p>
          </AlertDescription>
        </Alert>
      ) : selectionMissing ? (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertTitle>Выбранное время недоступно</AlertTitle>
          <AlertDescription>Выберите слот из календаря ниже.</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>
            {selectedSlot
              ? `${formatDate(dayKey(selectedSlot.startsAt))}, ${formatTimeRange(selectedSlot.startsAt, selectedSlot.endsAt)}`
              : "Выберите время"}
          </CardTitle>
        </CardHeader>

        <CardContent>
          {selectedSlot ? (
            <BookingForm
              guest={guest}
              onGuestChange={setGuest}
              onSubmit={submitBooking}
              onCancel={clearSlot}
              pending={bookingMutation.pending}
              error={bookingMutation.error}
            />
          ) : slots.loading ? (
            <LoadingState rows={2} />
          ) : slots.error ? (
            <ErrorState error={slots.error} onRetry={slots.refetch} />
          ) : days.length === 0 ||
            days.every((day) => day.slots.length === 0) ? (
            <p className="text-muted-foreground rounded-lg border border-dashed px-4 py-10 text-center text-sm">
              Свободных слотов в окне записи нет. Загляните позже.
            </p>
          ) : (
            <SlotPicker
              days={days}
              activeDate={activeDate}
              onPickDate={setPickedDate}
              selectedStartsAt={selectedStartsAt}
              onPickSlot={selectSlot}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function NotFoundNotice() {
  return (
    <div className="space-y-4">
      <Alert variant="destructive">
        <AlertCircleIcon />
        <AlertTitle>Тип встречи не найден</AlertTitle>
        <AlertDescription>
          Возможно, владелец календаря его удалил.
        </AlertDescription>
      </Alert>
      <Link to="/" className={cn(buttonVariants({ variant: "outline" }))}>
        К списку типов встреч
      </Link>
    </div>
  );
}
