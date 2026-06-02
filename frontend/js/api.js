const API_BASE = "http://localhost:8080/api";
const STORAGE_KEY = "taskflow-demo-tasks";

let apiMode = "server";
let statusCallback = () => {};

export function onApiModeChange(callback) {
    statusCallback = callback;
    statusCallback(apiMode);
}

export async function getTasks(params = {}) {
    return request(`/tasks${toQuery(params)}`, { method: "GET" }, () => demoGetTasks(params));
}

export async function createTask(payload) {
    return request("/tasks", {
        method: "POST",
        body: JSON.stringify(payload)
    }, () => demoCreateTask(payload));
}

export async function updateTask(id, payload) {
    return request(`/tasks/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload)
    }, () => demoUpdateTask(Number(id), payload));
}

export async function toggleTask(id) {
    return request(`/tasks/${id}/toggle`, { method: "PATCH" }, () => demoToggleTask(Number(id)));
}

export async function deleteTask(id) {
    return request(`/tasks/${id}`, { method: "DELETE" }, () => demoDeleteTask(Number(id)));
}

async function request(path, options, fallback) {
    const requestOptions = {
        headers: {
            "Content-Type": "application/json"
        },
        ...options
    };

    if (apiMode === "demo") {
        return fallback();
    }

    try {
        const response = await fetch(`${API_BASE}${path}`, requestOptions);
        if (!response.ok) {
            const error = await parseError(response);
            throw new Error(error);
        }
        setApiMode("server");
        if (response.status === 204) {
            return null;
        }
        return response.json();
    } catch (error) {
        if (error.name !== "TypeError") {
            throw error;
        }
        setApiMode("demo");
        return fallback();
    }
}

async function parseError(response) {
    try {
        const body = await response.json();
        return body.message || "Ошибка выполнения запроса";
    } catch (error) {
        return "Ошибка выполнения запроса";
    }
}

function setApiMode(mode) {
    if (apiMode !== mode) {
        apiMode = mode;
        statusCallback(apiMode);
    }
}

function toQuery(params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value && value !== "all") {
            searchParams.set(key, value);
        }
    });
    const query = searchParams.toString();
    return query ? `?${query}` : "";
}

function loadDemoTasks() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
        return JSON.parse(raw);
    }

    const now = new Date().toISOString();
    const starterTasks = [
        {
            id: Date.now() - 2,
            title: "Сформулировать требования к SPA",
            description: "Описать функции приложения и ограничения первой версии.",
            completed: true,
            priority: "HIGH",
            category: "Диплом",
            dueDate: "",
            createdAt: now,
            updatedAt: now
        },
        {
            id: Date.now() - 1,
            title: "Реализовать REST API на Spring Boot",
            description: "Создать модель, сервис, репозиторий и контроллер задач.",
            completed: false,
            priority: "MEDIUM",
            category: "Backend",
            dueDate: "",
            createdAt: now,
            updatedAt: now
        }
    ];
    saveDemoTasks(starterTasks);
    return starterTasks;
}

function saveDemoTasks(tasks) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function demoGetTasks(params) {
    let tasks = loadDemoTasks();

    if (params.status === "active") {
        tasks = tasks.filter(task => !task.completed);
    }
    if (params.status === "completed") {
        tasks = tasks.filter(task => task.completed);
    }
    if (params.search) {
        const search = params.search.toLowerCase();
        tasks = tasks.filter(task => task.title.toLowerCase().includes(search));
    }
    if (params.priority) {
        tasks = tasks.filter(task => task.priority === params.priority);
    }

    return sortTasks(tasks, params.sort || "createdAt,desc");
}

function demoCreateTask(payload) {
    const now = new Date().toISOString();
    const tasks = loadDemoTasks();
    const task = {
        id: Date.now(),
        title: payload.title,
        description: payload.description || "",
        completed: false,
        priority: payload.priority || "MEDIUM",
        category: payload.category || "",
        dueDate: payload.dueDate || "",
        createdAt: now,
        updatedAt: now
    };
    saveDemoTasks([task, ...tasks]);
    return task;
}

function demoUpdateTask(id, payload) {
    const tasks = loadDemoTasks();
    const index = tasks.findIndex(task => task.id === id);
    if (index === -1) {
        throw new Error("Задача не найдена");
    }
    tasks[index] = {
        ...tasks[index],
        ...payload,
        updatedAt: new Date().toISOString()
    };
    saveDemoTasks(tasks);
    return tasks[index];
}

function demoToggleTask(id) {
    const tasks = loadDemoTasks();
    const index = tasks.findIndex(task => task.id === id);
    if (index === -1) {
        throw new Error("Задача не найдена");
    }
    tasks[index] = {
        ...tasks[index],
        completed: !tasks[index].completed,
        updatedAt: new Date().toISOString()
    };
    saveDemoTasks(tasks);
    return tasks[index];
}

function demoDeleteTask(id) {
    saveDemoTasks(loadDemoTasks().filter(task => task.id !== id));
    return null;
}

function sortTasks(tasks, sort) {
    const [field, direction] = sort.split(",");
    const multiplier = direction === "desc" ? -1 : 1;
    const priorityRank = { LOW: 1, MEDIUM: 2, HIGH: 3 };

    return [...tasks].sort((a, b) => {
        let left = a[field] || "";
        let right = b[field] || "";
        if (field === "priority") {
            left = priorityRank[a.priority] || 0;
            right = priorityRank[b.priority] || 0;
        }
        return String(left).localeCompare(String(right), "ru", { numeric: true }) * multiplier;
    });
}
