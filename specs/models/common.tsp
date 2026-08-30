import "@typespec/http";

using Http;

namespace SimpleCalCom;

@doc("Идентификатор ресурса в формате UUID.")
@format("uuid")
scalar Uuid extends string;

@doc("Адрес электронной почты.")
@format("email")
scalar Email extends string;

@doc("""
  Машиночитаемый код ошибки. Клиент должен ветвить логику по этому полю, а не по тексту сообщения.
  """)
enum ErrorCode {
  @doc("Запрошенный ресурс не существует.")
  NotFound: "NOT_FOUND",

  @doc("Тело запроса или query-параметры не прошли валидацию.")
  ValidationError: "VALIDATION_ERROR",

  @doc("Выбранный интервал пересекается с уже существующим бронированием.")
  SlotUnavailable: "SLOT_UNAVAILABLE",

  @doc("Время начала лежит вне окна записи в 14 дней или вне рабочих часов владельца.")
  SlotOutOfWindow: "SLOT_OUT_OF_WINDOW",

  @doc("У типа события есть предстоящие бронирования, поэтому его нельзя удалить.")
  EventTypeInUse: "EVENT_TYPE_IN_USE",
}

@doc("Единый формат тела ответа для всех ошибок API.")
model ApiError {
  code: ErrorCode;

  @doc("Человекочитаемое объяснение, которое можно показать пользователю.")
  message: string;

  @doc("Детализация по конкретным полям запроса: имя поля -> описание проблемы.")
  details?: Record<string>;
}

@doc("Ресурс не найден. Код ошибки: `NOT_FOUND`.")
@error
model NotFoundError {
  @statusCode statusCode: 404;
  @body body: ApiError;
}

@doc("Запрос не прошёл валидацию. Код ошибки: `VALIDATION_ERROR` или `SLOT_OUT_OF_WINDOW`.")
@error
model ValidationFailedError {
  @statusCode statusCode: 422;
  @body body: ApiError;
}

@doc("Конфликт с текущим состоянием данных. Код ошибки: `SLOT_UNAVAILABLE` или `EVENT_TYPE_IN_USE`.")
@error
model ConflictError {
  @statusCode statusCode: 409;
  @body body: ApiError;
}
