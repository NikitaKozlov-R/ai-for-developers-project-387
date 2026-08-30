# Соглашение о коммитах

Этот проект следует [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) — стандартизированному формату сообщений коммитов. Это облегчает автоматизацию генерации changelog-а, определения версий (semver) и улучшает читаемость истории проекта.

## Автоматическая проверка

При каждом коммите запускается `commitlint` (через `husky`), который проверяет формат сообщения. Невалидный коммит будет отклонён.

```bash
git commit -m "feat(api): add new endpoint"  # ✅ пройдёт проверку
git commit -m "invalid"                      # ❌ будет отклонён
git commit --no-verify -m "..."              # ⚠️ обходит проверку (для экстренных случаев)
```

## Структура сообщения

```
<type>[optional scope]: <subject>
<blank line>
[optional body]
<blank line>
[optional footer(s)]
```

### Формат заголовка

```
type(scope): subject
```

- **type**: один из допустимых типов (см. таблицу ниже)
- **scope** (опциональный): область изменения — пакет (backend, frontend, specs, e2e) или компонент (store, api, ui)
- **subject**: описание в повелительном наклонении
  - Начинается со строчной буквы (если не имя собственное)
  - Без точки в конце
  - Максимум **50 символов**
  - Отвечает на вопрос: "если применить этот коммит, что произойдёт?"

### Тело коммита (body)

- Опциональное, но желательно для больших изменений
- Объясняет **почему** произошло изменение, а не **что** изменилось
- Каждая строка максимум **72 символа**
- Отделяется от заголовка пустой строкой

### Нижний колонтитул (footer)

Используется для ссылок на задачи и breaking changes:

```
Closes #123
Refs #456

BREAKING CHANGE: параметр `foo` удалён
```

## Типы коммитов

| Тип | Применять | Примеры |
|-----|-----------|---------|
| **feat** | Новая функция | Новый эндпоинт API, компонент UI, поле модели |
| **fix** | Исправление ошибки | Багфикс, исправление логики или некорректного поведения |
| **spec** | Изменение TypeSpec (custom) | Правка `specs/*.tsp`, перегенерация `openapi/openapi.yaml` (всегда вместе!) |
| **docs** | Документация | README, комментарии в коде, гайды (исключая spec) |
| **test** | Тесты | e2e, unit, интеграционные тесты |
| **refactor** | Переструктурирование | Переименование, смена архитектуры (без изменения функционала) |
| **perf** | Производительность | Оптимизация, кэширование, улучшение скорости |
| **ci** | CI/CD, workflows | `.github/workflows`, commitlint, husky, конфиги GitHub Actions |
| **chore** | Техническое обслуживание | Обновление зависимостей, чистка, tooling (не связанное с продуктом) |
| **build** | Система сборки | TypeScript конфиг, bundler конфиги, тулинг сборки |

## Примеры

### Backend (Node.js, business logic)

```bash
# Новая функция
git commit -m "feat(backend): add booking conflict validation"

# Исправление
git commit -m "fix(backend): prevent double-booking of slots"

# С описанием причины
git commit -m "feat(backend): add exponential backoff for retries

Retries were causing thundering herd when database temporarily unavailable.
Exponential backoff distributes load and reduces peak queries."
```

### Frontend (React components)

```bash
# Новый компонент
git commit -m "feat(frontend): add event type selector widget"

# Улучшение UI
git commit -m "refactor(frontend): simplify booking form layout"

# Стиль/CSS
git commit -m "fix(frontend): correct calendar grid spacing on mobile"
```

### API Spec (TypeSpec)

```bash
# Новая операция
git commit -m "spec(routes): add admin endpoint to fetch available slots"

# Изменение модели
git commit -m "spec(models): add workingHoursStart field to owner profile"

# Обновление контракта с перегенерацией
git commit -m "spec: restructure booking error responses

BREAKING CHANGE: error code changed from SLOT_RESERVED to BOOKING_CONFLICT"
```

### E2E тесты

```bash
git commit -m "test(e2e): add scenario for concurrent booking attempts"

git commit -m "test(e2e): fix flaky slot picker selector"
```

### Зависимости и конфиги

```bash
git commit -m "chore: update typescript to 5.3.0"

git commit -m "ci: add commitlint and husky for commit validation"

git commit -m "build: update tsconfig for strict mode"
```

## Breaking Changes

Если коммит вносит **несовместимое изменение API**, добавьте `BREAKING CHANGE:` в конец сообщения:

```bash
git commit -m "spec: remove deprecated eventTypeId parameter

BREAKING CHANGE: eventTypeId parameter removed from POST /bookings.
Use eventType field in request body instead."
```

Коммит с `BREAKING CHANGE:` часто означает major версию при семантическом версионировании.

## Best Practices

1. **Коммить часто, но логически связано**  
   Один коммит — один идентичный блок работы. Не смешивай несвязанные изменения.

2. **Заголовок должен быть понятен без контекста**  
   Кто-то читает лог 6 месяцев спустя и должен сразу понять, что случилось.

3. **Body объясняет "почему", а не "что"**  
   "Что" видно в `git diff`, "почему" — нет.

4. **Scope — опциональный и гибкий**  
   Используй его, если помогает понять область: `feat(backend)`, `fix(ui)`, `spec(models)`.  
   Если не уверен — можно опустить.

5. **Используй повелительное наклонение**  
   ✅ "add validation" (добавить проверку)  
   ❌ "adds validation" (добавляет проверку)  
   ❌ "added validation" (добавил проверку)

6. **Реvertability**  
   Коммит должен быть обратимым командой `git revert`. Тестируй это перед push, если это критичное изменение.

## Установка

При первом клоне репозитория после установки зависимостей инициализируй husky:

```bash
npm install  # в корне проекта
npx husky install
```

Это установит git hooks, которые будут проверять ваши коммиты.

## Пропуск проверки (только в исключительных случаях)

```bash
git commit --no-verify -m "..."  # CTRL+C из-за срочности
```

**Используй только в экстренных ситуациях!** После исправь и переделай коммит.

---

Дополнительные ресурсы:
- [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/)
- [Semantic Versioning](https://semver.org/) — для понимания, как conventional commits влияют на версии
- [commitlint docs](https://commitlint.js.org/) — детали конфигурации
