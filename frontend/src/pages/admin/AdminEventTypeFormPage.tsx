import { useState } from "react";
import { AlertCircleIcon, ArrowLeftIcon } from "lucide-react";
import { toast } from "sonner";
import {
  adminCreateEventType,
  adminGetEventType,
  adminUpdateEventType,
} from "@/api/endpoints";
import {
  DESCRIPTION_MAX_LENGTH,
  DURATION_OPTIONS,
  TITLE_MAX_LENGTH,
  type EventType,
  type EventTypeUpdate,
} from "@/api/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ErrorState, LoadingState } from "@/components/states";
import { Link } from "@/lib/router";
import { useRouter } from "@/lib/routing";
import { useApi } from "@/lib/useApi";
import { fieldError, unmappedDetails, useMutation } from "@/lib/useMutation";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/utc";

export function AdminEventTypeFormPage({
  eventTypeId,
}: {
  eventTypeId?: string;
}) {
  if (!eventTypeId) return <CreateForm />;
  return <EditForm eventTypeId={eventTypeId} />;
}

function CreateForm() {
  const { navigate } = useRouter();
  const create = useMutation(adminCreateEventType);

  return (
    <EventTypeForm
      heading="Новый тип события"
      submitLabel="Создать"
      pending={create.pending}
      error={create.error}
      initial={{ title: "", description: "", durationMinutes: 30 }}
      onSubmit={async (values) => {
        const outcome = await create.mutate({
          title: values.title,
          description:
            values.description === "" ? undefined : values.description,
          durationMinutes: values.durationMinutes,
        });
        if (outcome?.ok) {
          toast.success(`Тип события «${outcome.data.title}» создан`);
          navigate("/admin/event-types");
        }
      }}
    />
  );
}

function EditForm({ eventTypeId }: { eventTypeId: string }) {
  const { navigate } = useRouter();
  const eventType = useApi(
    (signal) => adminGetEventType(eventTypeId, signal),
    [eventTypeId],
  );
  const update = useMutation((input: EventTypeUpdate) =>
    adminUpdateEventType(eventTypeId, input),
  );

  if (eventType.loading) return <LoadingState rows={2} />;
  if (eventType.error) {
    return eventType.error.code === "NOT_FOUND" ? (
      <NotFoundNotice />
    ) : (
      <ErrorState error={eventType.error} onRetry={eventType.refetch} />
    );
  }
  if (!eventType.data) return null;

  const loaded = eventType.data;

  return (
    <EventTypeForm
      heading={loaded.title}
      submitLabel="Сохранить"
      pending={update.pending}
      error={update.error}
      initial={{
        title: loaded.title,
        description: loaded.description ?? "",
        durationMinutes: loaded.durationMinutes,
      }}
      onSubmit={async (values) => {
        const patch = buildPatch(loaded, values);

        if (Object.keys(patch).length === 0) {
          toast.info("Изменений нет");
          return;
        }

        const outcome = await update.mutate(patch);
        if (outcome?.ok) {
          toast.success("Изменения сохранены");
          navigate("/admin/event-types");
        }
      }}
    />
  );
}

interface FormValues {
  title: string;
  description: string;
  durationMinutes: number;
}

interface EventTypeFormProps {
  heading: string;
  submitLabel: string;
  initial: FormValues;
  pending: boolean;
  error: import("@/api/client").ApiError | null;
  onSubmit: (values: FormValues) => void;
}

function EventTypeForm({
  heading,
  submitLabel,
  initial,
  pending,
  error,
  onSubmit,
}: EventTypeFormProps) {
  const [values, setValues] = useState<FormValues>(initial);
  const [submitted, setSubmitted] = useState(false);

  const local = validate(values);
  const serverDetails =
    error?.code === "VALIDATION_ERROR" ? error.details : undefined;
  const titleError =
    (submitted ? local.title : undefined) ?? fieldError(serverDetails, "title");
  const descriptionError =
    (submitted ? local.description : undefined) ??
    fieldError(serverDetails, "description");
  const durationError = fieldError(serverDetails, "durationMinutes");
  const otherMessages = unmappedDetails(serverDetails, [
    "title",
    "description",
    "durationMinutes",
  ]);

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <Link
          to="/admin/event-types"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ArrowLeftIcon className="size-4" aria-hidden />
          Все типы событий
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          {heading}
        </h1>
      </div>

      {error && error.code !== "VALIDATION_ERROR" ? (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertTitle>Не удалось сохранить</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      ) : null}

      {otherMessages.length > 0 ? (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertTitle>Проверьте данные</AlertTitle>
          <AlertDescription>
            {otherMessages.map((message) => (
              <p key={message}>{message}</p>
            ))}
          </AlertDescription>
        </Alert>
      ) : null}

      <form
        noValidate
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          setSubmitted(true);
          if (local.title || local.description) return;
          onSubmit({
            ...values,
            title: values.title.trim(),
            description: values.description.trim(),
          });
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="event-title">Название</Label>
          <Input
            id="event-title"
            value={values.title}
            maxLength={TITLE_MAX_LENGTH}
            aria-invalid={Boolean(titleError)}
            aria-describedby={titleError ? "event-title-error" : undefined}
            onChange={(event) =>
              setValues({ ...values, title: event.target.value })
            }
          />
          {titleError ? (
            <p id="event-title-error" className="text-destructive text-sm">
              {titleError}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="event-description">Описание</Label>
          <Textarea
            id="event-description"
            rows={4}
            value={values.description}
            maxLength={DESCRIPTION_MAX_LENGTH}
            aria-invalid={Boolean(descriptionError)}
            aria-describedby={
              descriptionError ? "event-description-error" : undefined
            }
            onChange={(event) =>
              setValues({ ...values, description: event.target.value })
            }
          />
          <p className="text-muted-foreground text-xs">
            {values.description.length} / {DESCRIPTION_MAX_LENGTH}
          </p>
          {descriptionError ? (
            <p
              id="event-description-error"
              className="text-destructive text-sm"
            >
              {descriptionError}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="event-duration">Длительность</Label>
          <Select
            value={String(values.durationMinutes)}
            onValueChange={(next) =>
              setValues({ ...values, durationMinutes: Number(next) })
            }
          >
            <SelectTrigger id="event-duration" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DURATION_OPTIONS.map((minutes) => (
                <SelectItem key={minutes} value={String(minutes)}>
                  {formatDuration(minutes)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-muted-foreground text-xs">
            Слоты идут по сетке 30 минут, поэтому длительность кратна 30.
          </p>
          {durationError ? (
            <p className="text-destructive text-sm">{durationError}</p>
          ) : null}
        </div>

        <div className="flex gap-2">
          <Button type="submit" disabled={pending}>
            {pending ? "Сохраняем…" : submitLabel}
          </Button>
          <Link
            to="/admin/event-types"
            className={cn(buttonVariants({ variant: "ghost" }))}
          >
            Отмена
          </Link>
        </div>
      </form>
    </div>
  );
}

/** PATCH частичный по контракту, поэтому отправляем только реально изменённые поля. */
function buildPatch(loaded: EventType, values: FormValues): EventTypeUpdate {
  const patch: EventTypeUpdate = {};

  if (values.title !== loaded.title) patch.title = values.title;
  if (values.description !== (loaded.description ?? ""))
    patch.description = values.description;
  if (values.durationMinutes !== loaded.durationMinutes) {
    patch.durationMinutes = values.durationMinutes;
  }

  return patch;
}

function validate(values: FormValues): {
  title?: string;
  description?: string;
} {
  const errors: { title?: string; description?: string } = {};

  const title = values.title.trim();
  if (title.length === 0) errors.title = "Укажите название";
  else if (title.length > TITLE_MAX_LENGTH)
    errors.title = `Не длиннее ${TITLE_MAX_LENGTH} символов`;

  if (values.description.trim().length > DESCRIPTION_MAX_LENGTH) {
    errors.description = `Не длиннее ${DESCRIPTION_MAX_LENGTH} символов`;
  }

  return errors;
}

function NotFoundNotice() {
  return (
    <div className="space-y-4">
      <Alert variant="destructive">
        <AlertCircleIcon />
        <AlertTitle>Тип события не найден</AlertTitle>
        <AlertDescription>Возможно, он уже удалён.</AlertDescription>
      </Alert>
      <Link
        to="/admin/event-types"
        className={cn(buttonVariants({ variant: "outline" }))}
      >
        Все типы событий
      </Link>
    </div>
  );
}
