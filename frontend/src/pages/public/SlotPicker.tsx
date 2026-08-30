import type { DaySlots, PlainDate, Slot } from "@/api/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDayShort, formatTime, isPast } from "@/lib/utc";

interface SlotPickerProps {
  days: DaySlots[];
  activeDate: PlainDate | null;
  onPickDate: (date: PlainDate) => void;
  selectedStartsAt: string | null;
  onPickSlot: (slot: Slot) => void;
}

export function SlotPicker({
  days,
  activeDate,
  onPickDate,
  selectedStartsAt,
  onPickSlot,
}: SlotPickerProps) {
  const activeDay = days.find((day) => day.date === activeDate);
  const slots = activeDay
    ? activeDay.slots.filter((slot) => !isPast(slot.startsAt))
    : [];

  return (
    <div className="space-y-4">
      <div
        className="flex gap-2 overflow-x-auto pb-2"
        role="group"
        aria-label="Выбор дня"
      >
        {days.map((day) => {
          const { weekday, day: dayNumber, month } = formatDayShort(day.date);
          const isFree = day.slots.some((slot) => !isPast(slot.startsAt));
          const isActive = day.date === activeDate;

          return (
            <button
              key={day.date}
              type="button"
              onClick={() => onPickDate(day.date)}
              aria-pressed={isActive}
              className={cn(
                "focus-visible:ring-ring/50 flex min-w-16 shrink-0 flex-col items-center rounded-lg border px-3 py-2 text-sm transition-colors focus-visible:ring-[3px] focus-visible:outline-none",
                isActive
                  ? "border-foreground bg-foreground text-background"
                  : "hover:bg-accent hover:text-accent-foreground",
                !isActive && !isFree && "text-muted-foreground opacity-60",
              )}
            >
              <span className="text-xs uppercase">{weekday}</span>
              <span className="text-lg leading-tight font-semibold">
                {dayNumber}
              </span>
              <span className="text-xs">{month}</span>
            </button>
          );
        })}
      </div>

      {slots.length > 0 ? (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(6.5rem,1fr))] gap-2">
          {slots.map((slot) => (
            <li key={slot.startsAt}>
              <Button
                type="button"
                variant={
                  slot.startsAt === selectedStartsAt ? "default" : "outline"
                }
                className="w-full"
                onClick={() => onPickSlot(slot)}
                aria-pressed={slot.startsAt === selectedStartsAt}
              >
                {formatTime(slot.startsAt)}
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground rounded-lg border border-dashed px-4 py-8 text-center text-sm">
          Нет свободных слотов в этот день
        </p>
      )}
    </div>
  );
}
