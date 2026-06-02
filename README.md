# TaskFlow SPA

Дипломный проект: одностраничное веб-приложение для управления задачами на основе архитектуры SPA.

## Структура

```text
backend/          Spring Boot REST API
frontend/         SPA-интерфейс без сборщика
scripts/          вспомогательные скрипты для демонстрации
demo-screenshots/ скриншоты работающего приложения
```

## Требования

- JDK 17.
- Maven 3.9.x или локальный Maven в папке `tools/apache-maven-3.9.16`.
- Node.js 18 или новее для локального frontend-сервера и демо-скрипта.

## Frontend

Запуск из папки проекта:

```powershell
node frontend/server.mjs
```

После запуска открыть:

```text
http://localhost:5173/
```

Если backend недоступен, frontend автоматически использует демо-хранилище в `localStorage`. Когда Spring Boot backend запущен на `http://localhost:8080`, запросы идут в REST API.

## Backend

Backend рассчитан на JDK 17 и Maven. Если Maven находится в `tools/apache-maven-3.9.16`, скрипт использует его автоматически. Если папки `tools` нет, будет использован установленный в системе `mvn`.

```powershell
.\run-backend.cmd
```

Запуск backend-тестов:

```powershell
.\run-backend-tests.cmd
```

REST API:

```text
GET    /api/tasks
GET    /api/tasks/{id}
POST   /api/tasks
PUT    /api/tasks/{id}
PATCH  /api/tasks/{id}/toggle
DELETE /api/tasks/{id}
```

Фильтрация и сортировка:

```text
GET /api/tasks?status=active
GET /api/tasks?status=completed
GET /api/tasks?search=диплом
GET /api/tasks?priority=HIGH
GET /api/tasks?sort=createdAt,desc
```

## Демо-данные для показа

Когда backend уже запущен, можно очистить текущий список задач и создать демонстрационный набор:

```powershell
node scripts/seed-demo-data.mjs
```

После этого интерфейс на `http://localhost:5173/` покажет подготовленные задачи для демонстрации.

## Публикация на GitHub

Если Git не установлен, проект можно загрузить через веб-интерфейс GitHub:

1. Создать новый публичный репозиторий.
2. Открыть созданный репозиторий и выбрать `uploading an existing file`.
3. Загрузить содержимое папки `todo-spa-diploma-github`, а не саму папку целиком.
4. Добавить commit message, например `Initial diploma project version`.
5. Нажать `Commit changes`.

После публикации в репозитории должны отображаться папки `backend`, `frontend`, `scripts`, `demo-screenshots` и файл `README.md`.
