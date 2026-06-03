# TaskFlow SPA

Дипломный проект: одностраничное веб-приложение для управления задачами на основе архитектуры SPA.

Приложение состоит из Spring Boot backend, REST API, базы данных H2 и SPA-интерфейса на HTML, CSS и JavaScript. Основной запуск выполняется через Spring Boot: пользовательский интерфейс и REST API доступны на одном локальном адресе.

## Что нужно установить

Для обычного запуска нужны:

- VS Code;
- JDK 17;
- интернет при первом запуске, чтобы Maven Wrapper скачал зависимости.

Maven отдельно устанавливать не нужно. В проект добавлен Maven Wrapper.

Node.js для основного запуска не нужен. Он используется только для дополнительного скрипта с демо-данными.

Проверить Java можно командой:

```powershell
java -version
```

## Как скачать проект

Вариант через Git:

```powershell
git clone https://github.com/Conacre/taskflow-spa.git
cd taskflow-spa
```

Вариант без Git:

1. Открыть репозиторий на GitHub.
2. Нажать `Code`.
3. Нажать `Download ZIP`.
4. Распаковать архив.
5. Открыть распакованную папку в VS Code.

## Запуск в VS Code

1. Открыть папку проекта в VS Code.
2. Нажать `Ctrl+Shift+B`.
3. Если VS Code спросит, выбрать задачу `Start app`.
4. Дождаться запуска Spring Boot.
5. Открыть в браузере:

```text
http://localhost:8080/
```

REST API доступен по адресу:

```text
http://localhost:8080/api/tasks
```

При первом запуске Maven Wrapper может несколько минут скачивать зависимости. Это нормально.

## Запуск из терминала

Если запускать без VS Code-задачи, из корня проекта выполнить:

```powershell
.\run-backend.cmd
```

После запуска открыть:

```text
http://localhost:8080/
```

## Проверка работы

Проверка интерфейса:

```text
http://localhost:8080/
```

Проверка API:

```text
http://localhost:8080/api/tasks
```

Если API работает, браузер покажет JSON-массив задач. Например:

```json
[]
```

## Демо-данные

Если установлен Node.js, можно заполнить приложение демонстрационными задачами:

```powershell
node scripts/seed-demo-data.mjs
```

После этого нужно обновить страницу:

```text
http://localhost:8080/
```

## Остановка приложения

В терминале, где запущено приложение, нажать:

```text
Ctrl+C
```

## Структура проекта

```text
backend/          Spring Boot backend, REST API и static-ресурсы frontend
frontend/         исходные файлы SPA-интерфейса
scripts/          вспомогательные скрипты для демонстрации
demo-screenshots/ скриншоты работающего приложения
.vscode/          задачи VS Code для быстрого запуска
```

## Основные REST endpoints

```text
GET    /api/tasks
GET    /api/tasks/{id}
POST   /api/tasks
PUT    /api/tasks/{id}
PATCH  /api/tasks/{id}/toggle
DELETE /api/tasks/{id}
```

Фильтрация, поиск и сортировка:

```text
GET /api/tasks?status=active
GET /api/tasks?status=completed
GET /api/tasks?search=диплом
GET /api/tasks?priority=HIGH
GET /api/tasks?sort=createdAt,desc
```

## Тесты

Запуск backend-тестов:

```powershell
.\run-backend-tests.cmd
```

## Если не запускается

Проверить, что установлена Java 17:

```powershell
java -version
```

Проверить, что порт `8080` свободен:

```powershell
Get-NetTCPConnection -LocalPort 8080 -State Listen
```

Если порт занят, остановить другой процесс, который использует `8080`, и запустить приложение снова.
