import "@typespec/http";
import "../models/common.tsp";
import "../models/event-type.tsp";
import "../models/booking.tsp";

using Http;

namespace SimpleCalCom;

@doc("Тип события создан.")
model EventTypeCreatedResponse {
  @statusCode statusCode: 201;
  @body eventType: EventType;
}

@doc("Админская часть API. Сценарий владельца описан в метаданных тега `Owner` в main.tsp.")
@tag("Owner")
@route("/admin")
namespace Admin {
  @summary("Создать тип события")
  @route("/event-types")
  @post
  op createEventType(@body eventType: EventTypeCreate):
    | EventTypeCreatedResponse
    | ValidationFailedError;

  @summary("Список типов событий")
  @route("/event-types")
  @get
  op listEventTypes(): EventType[];

  @summary("Тип события по идентификатору")
  @route("/event-types/{eventTypeId}")
  @get
  op getEventType(@path eventTypeId: Uuid): EventType | NotFoundError;

  @summary("Изменить тип события")
  @doc("Частичное обновление: применяются только переданные поля.")
  @route("/event-types/{eventTypeId}")
  @patch(#{ implicitOptionality: false })
  op updateEventType(
    @path eventTypeId: Uuid,
    @body eventType: EventTypeUpdate,
  ): EventType | NotFoundError | ValidationFailedError;

  @summary("Удалить тип события")
  @doc("""
    Удаляет тип события. Если у него есть предстоящие бронирования, возвращается `EVENT_TYPE_IN_USE`:
    уже созданные встречи остаются валидными и не удаляются каскадно.
    """)
  @route("/event-types/{eventTypeId}")
  @delete
  op deleteEventType(@path eventTypeId: Uuid):
    | NoContentResponse
    | NotFoundError
    | ConflictError;

  @summary("Предстоящие встречи")
  @doc("""
    Единый список бронирований по всем типам событий, отсортированный по `startsAt` по возрастанию.
    По умолчанию возвращаются встречи, начиная с текущего момента.
    """)
  @route("/bookings")
  @get
  op listBookings(
    @doc("Нижняя граница по `startsAt` включительно. По умолчанию — текущий момент.")
    @query
    from?: utcDateTime,

    @doc("Верхняя граница по `startsAt` исключительно. По умолчанию не ограничена.")
    @query
    to?: utcDateTime,
  ): Booking[];
}
