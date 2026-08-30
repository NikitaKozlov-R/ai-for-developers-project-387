// Единый формат ошибки из openapi/openapi.yaml: { code, message, details? }.

export type ErrorCode =
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "SLOT_UNAVAILABLE"
  | "SLOT_OUT_OF_WINDOW"
  | "EVENT_TYPE_IN_USE";

const STATUS_BY_CODE: Record<ErrorCode, number> = {
  NOT_FOUND: 404,
  VALIDATION_ERROR: 422,
  SLOT_UNAVAILABLE: 409,
  SLOT_OUT_OF_WINDOW: 422,
  EVENT_TYPE_IN_USE: 409,
};

export class ApiError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly details: Record<string, string> | undefined;

  constructor(
    code: ErrorCode,
    message: string,
    details?: Record<string, string>,
  ) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = STATUS_BY_CODE[code];
    this.details = details;
  }

  toBody(): {
    code: ErrorCode;
    message: string;
    details?: Record<string, string>;
  } {
    return this.details === undefined
      ? { code: this.code, message: this.message }
      : { code: this.code, message: this.message, details: this.details };
  }
}

export function notFound(message: string): ApiError {
  return new ApiError("NOT_FOUND", message);
}

export function validationFailed(details: Record<string, string>): ApiError {
  return new ApiError(
    "VALIDATION_ERROR",
    "Запрос не прошёл валидацию.",
    details,
  );
}

export function outOfWindow(message: string): ApiError {
  return new ApiError("SLOT_OUT_OF_WINDOW", message);
}
