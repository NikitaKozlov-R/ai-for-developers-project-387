# AGENTS.md

## Проект

`simple-cal-com` — упрощённый cal.com. Владелец календаря заводит типы событий и смотрит список
предстоящих встреч. Гость без регистрации выбирает тип события и бронирует свободный слот.

Авторизации нет по дизайну: роль определяется только префиксом пути `/admin`.
Инвариант домена: бронирования не пересекаются по времени, даже если это разные типы событий.

## Принципы

- **Исправляй причину, а не следствие.** Дошёл до симптома — ищи источник. Заглушка, обход
  или подгонка под ожидаемый результат прячут дефект и делают его дороже.
- **Изменения, которые ты не делал, — не твои.** Чужие правки в рабочей директории не трогай,
  не откатывай и не «чини». Это может быть незавершённая работа. Мешает — скажи об этом.

## Spec-first

`specs/*.tsp` — источник правды для API. `openapi/openapi.yaml` из них генерируется.

Любое изменение API идёт строго в этом порядке:

1. Правка `specs/*.tsp`
2. Сборка и линт без ошибок и предупреждений
3. Коммит `.tsp` вместе с перегенерированным `openapi/openapi.yaml`
4. Только после этого — backend или frontend

Полная процедура: [.github/skills/update-api-spec/SKILL.md](.github/skills/update-api-spec/SKILL.md).

## Бэкенд

`backend/` — HTTP-сервер на `node:http` без фреймворков. Node исполняет `.ts` напрямую,
стирая типы: сборки и артефактов нет, `typescript` нужен только для `npm run typecheck`.

Хранилище — в памяти процесса (`src/domain/store.ts`), базы данных нет. Рестарт возвращает
стартовые данные. Рабочие часы и шаг сетки задаются в `src/config.ts`: контракт их не описывает.

Бизнес-правила живут в `src/domain/`, обработчики в `src/routes/` только собирают ответ.

## Команды

```bash
npm install                           # установка commitlint + husky в корне
npx husky install                     # инициализация git hooks для проверки коммитов

cd specs && npm run build             # .tsp → openapi/openapi.yaml
cd specs && npm run format            # форматирование .tsp
npx @redocly/cli lint simple-cal-com  # линт OpenAPI, из корня репозитория

cd backend && npm run dev             # API на :3000 с перезапуском по правкам
cd backend && npm run verify          # типы — перед коммитом

cd frontend && npm run verify         # линт, типы и сборка — перед коммитом
cd frontend && npm run dev            # dev-сервер на :5173
cd frontend && npm run mock           # Prism-мок по контракту на :4010

docker build -t simple-cal-com .                          # образ: фронтенд + бэкенд одним процессом
docker run -d -e PORT=8080 -p 8080:8080 --name simple-cal-com simple-cal-com
docker stop simple-cal-com                                # остановить контейнер
```

Корневой `package.json` хранит зависимости для git-хуков (`commitlint`, `husky`) и их конфигурацию.
Остальные пакеты имеют собственные манифесты.

Фронтенд ходит в относительный `/api`, прокси Vite разворачивает префикс в
`VITE_API_PROXY_TARGET` — по умолчанию в бэкенд, для работы по моку укажите Prism.

## Соглашения

### Коммиты

Все коммиты следуют [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/), проверяются автоматически при коммите.

**Типы коммитов**: `feat`, `fix`, `spec` (TypeSpec), `docs`, `test`, `refactor`, `perf`, `ci`, `build`, `chore`.

**Примеры**:

```bash
git commit -m "feat(backend): add booking conflict validation"
git commit -m "spec(models): add archived field to EventType"
git commit -m "fix(frontend): correct calendar grid overflow"
```

Полная инструкция: [CONTRIBUTING.md](CONTRIBUTING.md), skill: [.github/skills/commit-conventions/SKILL.md](.github/skills/commit-conventions/SKILL.md).

### Данные и форматы

- Время — UTC (`utcDateTime`), календарные дни — `plainDate`. Часовой пояс не хранится.
- Идентификаторы — uuid, генерирует сервер.
- Поля — `camelCase`, пути — `kebab-case`.
- Документация домена живёт в `@doc` внутри `.tsp`. Отдельных markdown-файлов с описанием
  сущностей не заводим — они расходятся со спецификацией.

## Никогда

- Не редактируй `openapi/openapi.yaml` — следующая сборка сотрёт правки.
- Не меняй код раньше спецификации — контракт перестанет быть источником правды.
- Не коммить `.tsp` без пересобранного `openapi.yaml` — потребители контракта сломаются.
- Не трогай `.github/workflows/hexlet-check.yml` — файл генерируется Hexlet.
- Не добавляй аутентификацию и авторизацию — их нет по дизайну, а не по недосмотру.
