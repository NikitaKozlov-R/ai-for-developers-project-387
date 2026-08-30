import "@typespec/http";
import "../models/common.tsp";
import "../models/owner.tsp";
import "../models/event-type.tsp";
import "../models/slot.tsp";
import "../models/booking.tsp";

using Http;

namespace SimpleCalCom;

@doc("Бронирование создано.")
model BookingCreatedResponse {
  @statusCode statusCode: 201;
  @body booking: Booking;
}

@doc("Публичная часть API. Сценарий гостя описан в метаданных тега `Guest` в main.tsp.")
@tag("Guest")
namespace Public {
  @summary("Профиль владельца календаря")
  @doc("Возвращает единственный преднастроенный профиль владельца для публичной страницы записи.")
  @route("/owner")
  @get
  op getOwner(): Owner;

  @summary("Список видов брони")
  @doc("Возвращает все типы событий, доступные гостю для записи.")
  @route("/event-types")
  @get
  op listEventTypes(): EventType[];

  @summary("Тип события по идентификатору")
  @route("/event-types/{eventTypeId}")
  @get
  op getEventType(@path eventTypeId: Uuid): EventType | NotFoundError;

  @summary("Свободные слоты типа события")
  @doc("""
    Возвращает свободные слоты в окне записи. По умолчанию окно — 14 дней начиная с текущей даты.
    
    Слот считается свободным, если он не пересекается ни с одним бронированием любого типа события
    и полностью укладывается в рабочие часы владельца. Слоты, начинающиеся раньше текущего момента,
    в ответ не попадают.
    
    Параметры `from` и `to` позволяют сузить диапазон. Выход за пределы окна в 14 дней от текущей даты
    или `from` позже `to` приводит к ошибке `SLOT_OUT_OF_WINDOW`.
    """)
  @route("/event-types/{eventTypeId}/slots")
  @get
  @opExample(
    #{
      parameters: #{
        eventTypeId: "9a1c1b7e-6c1f-4a5a-9f0e-2b6d8e0a5c31",
        from: plainDate.fromISO("2026-09-01"),
        to: plainDate.fromISO("2026-09-02"),
      },
      returnType: #{
        eventTypeId: "9a1c1b7e-6c1f-4a5a-9f0e-2b6d8e0a5c31",
        durationMinutes: 60,
        rangeStart: plainDate.fromISO("2026-09-01"),
        rangeEnd: plainDate.fromISO("2026-09-02"),
        days: #[
          #{
            date: plainDate.fromISO("2026-09-01"),
            slots: #[
              #{
                startsAt: utcDateTime.fromISO("2026-09-01T09:00:00Z"),
                endsAt: utcDateTime.fromISO("2026-09-01T10:00:00Z"),
              },
              #{
                startsAt: utcDateTime.fromISO("2026-09-01T11:00:00Z"),
                endsAt: utcDateTime.fromISO("2026-09-01T12:00:00Z"),
              }
            ],
          },
          #{ date: plainDate.fromISO("2026-09-02"), slots: #[] }
        ],
      },
    },
    #{
      title: "10:00 занято встречей другого типа события",
      description: "Второй день выходной, поэтому список слотов пуст.",
    }
  )
  op listSlots(
    @path eventTypeId: Uuid,

    @doc("Первый день диапазона включительно. По умолчанию — текущая дата.")
    @query
    from?: plainDate,

    @doc("Последний день диапазона включительно. По умолчанию — текущая дата плюс 13 дней.")
    @query
    to?: plainDate,
  ): SlotsResponse | NotFoundError | ValidationFailedError;

  @summary("Создать бронирование")
  @doc("""
    Занимает выбранный слот. Сервер повторно проверяет доступность, поэтому между получением
    календаря и отправкой запроса слот может стать занятым.
    
    Коды ошибок:
    - `NOT_FOUND` — типа события с таким `eventTypeId` не существует;
    - `SLOT_UNAVAILABLE` — интервал пересекается с существующим бронированием, в том числе другого типа события;
    - `SLOT_OUT_OF_WINDOW` — `startsAt` вне окна в 14 дней, вне рабочих часов или не совпадает с началом слота;
    - `VALIDATION_ERROR` — некорректные имя или email гостя.
    """)
  @route("/bookings")
  @post
  @opExample(
    #{
      parameters: #{
        booking: #{
          eventTypeId: "9a1c1b7e-6c1f-4a5a-9f0e-2b6d8e0a5c31",
          startsAt: utcDateTime.fromISO("2026-09-01T09:00:00Z"),
          guest: #{ name: "Иван Петров", email: "ivan@example.com" },
        },
      },
      returnType: #{
        statusCode: 201,
        booking: #{
          id: "3f2a9d10-8b4c-4f77-9c2e-1d5a7e0b4c88",
          eventType: #{
            id: "9a1c1b7e-6c1f-4a5a-9f0e-2b6d8e0a5c31",
            title: "Знакомство",
            durationMinutes: 60,
          },
          startsAt: utcDateTime.fromISO("2026-09-01T09:00:00Z"),
          endsAt: utcDateTime.fromISO("2026-09-01T10:00:00Z"),
          guest: #{ name: "Иван Петров", email: "ivan@example.com" },
          createdAt: utcDateTime.fromISO("2026-08-30T12:34:56Z"),
        },
      },
    },
    #{ title: "Слот успешно забронирован" }
  )
  @opExample(
    #{
      parameters: #{
        booking: #{
          eventTypeId: "9a1c1b7e-6c1f-4a5a-9f0e-2b6d8e0a5c31",
          startsAt: utcDateTime.fromISO("2026-09-01T10:00:00Z"),
          guest: #{ name: "Иван Петров", email: "ivan@example.com" },
        },
      },
      returnType: #{
        statusCode: 409,
        body: #{
          code: ErrorCode.SlotUnavailable,
          message: "На 2026-09-01 10:00 UTC уже есть встреча.",
        },
      },
    },
    #{
      title: "Слот заняли, пока гость выбирал",
      description: "Пересечение считается по всему календарю, включая другие типы событий.",
    }
  )
  op createBooking(@body booking: BookingCreate):
    | BookingCreatedResponse
    | NotFoundError
    | ConflictError
    | ValidationFailedError;
}
