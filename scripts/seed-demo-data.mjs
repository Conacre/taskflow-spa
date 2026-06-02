const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:8080/api/tasks";

async function request(url, options = {}) {
    const response = await fetch(url, options);

    if (!response.ok && response.status !== 204) {
        const text = await response.text();
        throw new Error(`${options.method || "GET"} ${url} -> ${response.status}: ${text}`);
    }

    if (response.status === 204) {
        return null;
    }

    return response.json();
}

async function resetTasks() {
    const existingTasks = await request(API_BASE_URL);

    for (const task of existingTasks) {
        await request(`${API_BASE_URL}/${task.id}`, { method: "DELETE" });
    }
}

async function createTask(task) {
    return request(API_BASE_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json; charset=utf-8"
        },
        body: JSON.stringify(task)
    });
}

const demoTasks = [
    {
        title: "Подготовить доклад к защите",
        description: "Собрать короткое выступление на 5-7 минут по цели, архитектуре и результатам работы.",
        priority: "HIGH",
        category: "Защита",
        dueDate: "2026-05-28"
    },
    {
        title: "Проверить REST API через MockMvc",
        description: "Показать, что backend обрабатывает создание, обновление, поиск, фильтрацию и ошибки.",
        priority: "HIGH",
        category: "Backend",
        dueDate: "2026-05-29"
    },
    {
        title: "Сделать скриншоты интерфейса",
        description: "Подготовить изображения для презентации и демонстрации работы SPA.",
        priority: "MEDIUM",
        category: "Frontend",
        dueDate: "2026-05-30"
    },
    {
        title: "Описать дальнейшее развитие проекта",
        description: "Добавить идеи: авторизация, проекты, уведомления, PostgreSQL и развертывание.",
        priority: "LOW",
        category: "Диплом",
        dueDate: "2026-06-01"
    }
];

await resetTasks();

const createdTasks = [];
for (const task of demoTasks) {
    createdTasks.push(await createTask(task));
}

await request(`${API_BASE_URL}/${createdTasks[2].id}/toggle`, { method: "PATCH" });

const finalTasks = await request(`${API_BASE_URL}?sort=createdAt,desc`);
console.log(JSON.stringify(finalTasks, null, 2));
