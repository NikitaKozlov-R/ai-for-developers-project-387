import "./common.tsp";

namespace SimpleCalCom;

// alias, а не model: иначе emitter добавляет неиспользуемую схему в OpenAPI.
alias EventTypeProperties = {
  @doc("Название встречи, которое видит гость в списке видов брони.")
  @minLength(1)
  @maxLength(100)
  title: string;

  @doc("Описание встречи: о чём она и как проходит.")
  @maxLength(500)
  description?: string;

  @doc("""
    Длительность встречи в минутах. Должна быть кратна шагу сетки в 30 минут,
    поэтому допустимые значения: 30, 60, 90, ... , 240.
    """)
  @minValue(30)
  @maxValue(240)
  durationMinutes: int32;
};

@doc("""
  Тип события — шаблон встречи, который владелец заводит заранее.
  Гость не создаёт встречи произвольной длины: он выбирает готовый тип события,
  и его `durationMinutes` определяет, сколько 30-минутных ячеек сетки займёт бронирование.
  """)
model EventType {
  @doc("Идентификатор типа события, назначается сервером при создании.")
  id: Uuid;

  ...EventTypeProperties;

  @doc("Момент создания типа события.")
  createdAt: utcDateTime;

  @doc("Момент последнего изменения типа события.")
  updatedAt: utcDateTime;
}

@doc("Краткое представление типа события, встроенное в бронирование.")
model EventTypeSummary {
  id: Uuid;

  @doc("Название типа события на момент чтения бронирования.")
  title: string;

  @doc("Длительность встречи в минутах.")
  durationMinutes: int32;
}

@doc("Тело запроса на создание типа события. Идентификатор и временные метки проставляет сервер.")
model EventTypeCreate {
  ...EventTypeProperties;
}

@doc("""
  Тело запроса на частичное изменение типа события. Все поля необязательны,
  применяются только переданные. Изменение `durationMinutes` не пересчитывает уже созданные бронирования.
  """)
model EventTypeUpdate {
  ...OptionalProperties<EventTypeProperties>;
}
