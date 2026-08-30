import { useState } from "react";
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { adminDeleteEventType, adminListEventTypes } from "@/api/endpoints";
import type { EventType } from "@/api/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { Link } from "@/lib/router";
import { useApi } from "@/lib/useApi";
import { useMutation } from "@/lib/useMutation";
import { formatDuration } from "@/lib/utc";
import { cn } from "@/lib/utils";

export function AdminEventTypesPage() {
  const eventTypes = useApi((signal) => adminListEventTypes(signal), []);
  const [pendingDelete, setPendingDelete] = useState<EventType | null>(null);
  const [blockedReason, setBlockedReason] = useState<string | null>(null);
  const remove = useMutation(adminDeleteEventType);

  async function confirmDelete() {
    if (!pendingDelete) return;

    const outcome = await remove.mutate(pendingDelete.id);
    if (!outcome) return;

    if (outcome.ok) {
      toast.success(`Тип события «${pendingDelete.title}» удалён`);
      setPendingDelete(null);
      eventTypes.refetch();
      return;
    }

    setPendingDelete(null);

    if (outcome.error.code === "EVENT_TYPE_IN_USE") {
      setBlockedReason(outcome.error.message);
      return;
    }

    if (outcome.error.code === "NOT_FOUND") {
      toast.info("Тип события уже удалён");
      eventTypes.refetch();
      return;
    }

    toast.error(outcome.error.message);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Типы событий</h1>
        <Link to="/admin/event-types/new" className={cn(buttonVariants())}>
          <PlusIcon aria-hidden />
          Создать
        </Link>
      </div>

      {blockedReason ? (
        <div className="border-destructive/50 text-destructive space-y-2 rounded-lg border px-4 py-3 text-sm">
          <p className="font-medium">Тип события нельзя удалить</p>
          <p>{blockedReason}</p>
          <Link to="/admin/bookings" className="underline underline-offset-4">
            Посмотреть предстоящие встречи
          </Link>
        </div>
      ) : null}

      {eventTypes.loading ? (
        <LoadingState />
      ) : eventTypes.error ? (
        <ErrorState error={eventTypes.error} onRetry={eventTypes.refetch} />
      ) : eventTypes.data && eventTypes.data.length > 0 ? (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Название</TableHead>
                <TableHead>Длительность</TableHead>
                <TableHead className="w-0" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {eventTypes.data.map((eventType) => (
                <TableRow key={eventType.id}>
                  <TableCell>
                    <div className="font-medium">{eventType.title}</div>
                    {eventType.description ? (
                      <div className="text-muted-foreground line-clamp-2 text-sm">
                        {eventType.description}
                      </div>
                    ) : null}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {formatDuration(eventType.durationMinutes)}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Link
                        to={`/admin/event-types/${encodeURIComponent(eventType.id)}`}
                        className={cn(
                          buttonVariants({ variant: "ghost", size: "sm" }),
                        )}
                        aria-label={`Изменить ${eventType.title}`}
                      >
                        <PencilIcon aria-hidden />
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`Удалить ${eventType.title}`}
                        onClick={() => {
                          setBlockedReason(null);
                          setPendingDelete(eventType);
                        }}
                      >
                        <Trash2Icon aria-hidden />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <EmptyState
          title="Типов событий пока нет"
          description="Создайте первый тип события, чтобы гости могли записаться."
          action={
            <Link to="/admin/event-types/new" className={cn(buttonVariants())}>
              Создать тип события
            </Link>
          }
        />
      )}

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Удалить «{pendingDelete?.title}»?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Уже созданные встречи останутся в календаре. Записаться на этот
              тип события будет нельзя.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={remove.pending}>
              Отмена
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={remove.pending}
              onClick={(event) => {
                event.preventDefault();
                void confirmDelete();
              }}
            >
              {remove.pending ? "Удаляем…" : "Удалить"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
