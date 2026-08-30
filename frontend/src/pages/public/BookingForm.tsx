import { useState } from "react";
import { AlertCircleIcon } from "lucide-react";
import type { ApiError } from "@/api/client";
import { GUEST_NAME_MAX_LENGTH, type Guest } from "@/api/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fieldError, unmappedDetails } from "@/lib/useMutation";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface BookingFormProps {
  guest: Guest;
  onGuestChange: (guest: Guest) => void;
  onSubmit: () => void;
  onCancel: () => void;
  pending: boolean;
  error: ApiError | null;
}

export function BookingForm({
  guest,
  onGuestChange,
  onSubmit,
  onCancel,
  pending,
  error,
}: BookingFormProps) {
  const [touched, setTouched] = useState({ name: false, email: false });
  const [submitted, setSubmitted] = useState(false);

  const local = validate(guest);
  const showFor = (field: "name" | "email") => submitted || touched[field];

  const serverDetails =
    error?.code === "VALIDATION_ERROR" ? error.details : undefined;
  const nameError =
    (showFor("name") ? local.name : undefined) ??
    fieldError(serverDetails, "name");
  const emailError =
    (showFor("email") ? local.email : undefined) ??
    fieldError(serverDetails, "email");
  const otherMessages = unmappedDetails(serverDetails, ["name", "email"]);

  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted(true);
        if (local.name || local.email) return;
        onSubmit();
      }}
    >
      {error ? (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertTitle>Не удалось записаться</AlertTitle>
          <AlertDescription>
            <p>{error.message}</p>
            {otherMessages.map((message) => (
              <p key={message}>{message}</p>
            ))}
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="guest-name">Ваше имя</Label>
        <Input
          id="guest-name"
          value={guest.name}
          maxLength={GUEST_NAME_MAX_LENGTH}
          autoComplete="name"
          aria-invalid={Boolean(nameError)}
          aria-describedby={nameError ? "guest-name-error" : undefined}
          onChange={(event) =>
            onGuestChange({ ...guest, name: event.target.value })
          }
          onBlur={() => setTouched((state) => ({ ...state, name: true }))}
        />
        {nameError ? (
          <p id="guest-name-error" className="text-destructive text-sm">
            {nameError}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="guest-email">Email</Label>
        <Input
          id="guest-email"
          type="email"
          value={guest.email}
          autoComplete="email"
          aria-invalid={Boolean(emailError)}
          aria-describedby={emailError ? "guest-email-error" : undefined}
          onChange={(event) =>
            onGuestChange({ ...guest, email: event.target.value })
          }
          onBlur={() => setTouched((state) => ({ ...state, email: true }))}
        />
        {emailError ? (
          <p id="guest-email-error" className="text-destructive text-sm">
            {emailError}
          </p>
        ) : null}
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Отправляем…" : "Записаться"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={pending}
        >
          Выбрать другое время
        </Button>
      </div>
    </form>
  );
}

function validate(guest: Guest): { name?: string; email?: string } {
  const errors: { name?: string; email?: string } = {};

  const name = guest.name.trim();
  if (name.length === 0) errors.name = "Укажите имя";
  else if (name.length > GUEST_NAME_MAX_LENGTH)
    errors.name = `Не длиннее ${GUEST_NAME_MAX_LENGTH} символов`;

  const email = guest.email.trim();
  if (email.length === 0) errors.email = "Укажите email";
  else if (!EMAIL_PATTERN.test(email)) errors.email = "Проверьте формат адреса";

  return errors;
}
