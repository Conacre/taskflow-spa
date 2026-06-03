import {
    createTask,
    deleteTask,
    getTasks,
    onApiModeChange,
    toggleTask,
    updateTask
} from "./api.js";

const elements = {
    apiStatus: document.getElementById("apiStatus"),
    taskForm: document.getElementById("taskForm"),
    taskId: document.getElementById("taskId"),
    title: document.getElementById("title"),
    description: document.getElementById("description"),
    priority: document.getElementById("priority"),
    category: document.getElementById("category"),
    dueDate: document.getElementById("dueDate"),
    submitButton: document.getElementById("submitButton"),
    cancelEditButton: document.getElementById("cancelEditButton"),
    formTitle: document.getElementById("formTitle"),
    formError: document.getElementById("formError"),
    taskList: document.getElementById("taskList"),
    stats: document.getElementById("stats"),
    search: document.getElementById("search"),
    priorityFilter: document.getElementById("priorityFilter"),
    sort: document.getElementById("sort"),
    reloadButton: document.getElementById("reloadButton"),
    toast: document.getElementById("toast")
};

const state = {
    tasks: [],
    allTasks: [],
    loading: false,
    error: "",
    status: "all",
    search: "",
    priority: "",
    sort: "createdAt,desc",
    pendingDeleteId: null
};

let toastTimer = null;

document.addEventListener("DOMContentLoaded", init);

function init() {
    bindEvents();
    onApiModeChange(renderApiStatus);
    loadTasks();
}

function bindEvents() {
    elements.taskForm.addEventListener("submit", handleSubmit);
    elements.cancelEditButton.addEventListener("click", resetForm);
    elements.reloadButton.addEventListener("click", loadTasks);

    document.querySelectorAll("[data-status]").forEach(button => {
        button.addEventListener("click", () => {
            state.status = button.dataset.status;
            document.querySelectorAll("[data-status]").forEach(item => {
                item.classList.toggle("active", item === button);
            });
            loadTasks();
        });
    });

    elements.search.addEventListener("input", debounce(() => {
        state.search = elements.search.value.trim();
        loadTasks();
    }, 250));

    elements.priorityFilter.addEventListener("change", () => {
        state.priority = elements.priorityFilter.value;
        loadTasks();
    });

    elements.sort.addEventListener("change", () => {
        state.sort = elements.sort.value;
        loadTasks();
    });

    elements.taskList.addEventListener("click", handleTaskAction);
    elements.taskList.addEventListener("change", handleTaskToggle);
}

async function loadTasks() {
    state.loading = true;
    state.error = "";
    render();

    try {
        const params = {
            status: state.status,
            search: state.search,
            priority: state.priority,
            sort: state.sort
        };
        const [tasks, allTasks] = await Promise.all([
            getTasks(params),
            getTasks({ sort: "createdAt,desc" })
        ]);
        state.tasks = tasks;
        state.allTasks = allTasks;
        if (state.pendingDeleteId && !allTasks.some(task => Number(task.id) === Number(state.pendingDeleteId))) {
            state.pendingDeleteId = null;
        }
    } catch (error) {
        state.error = error.message || "Не удалось загрузить задачи";
    } finally {
        state.loading = false;
        render();
    }
}

async function handleSubmit(event) {
    event.preventDefault();
    elements.formError.textContent = "";

    const payload = getFormPayload();
    const validationError = validateTask(payload);
    if (validationError) {
        elements.formError.textContent = validationError;
        return;
    }

    try {
        if (elements.taskId.value) {
            await updateTask(elements.taskId.value, {
                ...payload,
                completed: findTask(Number(elements.taskId.value))?.completed || false
            });
            showToast("Задача обновлена");
        } else {
            await createTask(payload);
            showToast("Задача создана");
        }
        resetForm();
        await loadTasks();
    } catch (error) {
        elements.formError.textContent = error.message || "Не удалось сохранить задачу";
    }
}

async function handleTaskAction(event) {
    const editButton = event.target.closest("[data-action='edit']");
    const deleteButton = event.target.closest("[data-action='delete']");
    const confirmDeleteButton = event.target.closest("[data-action='confirm-delete']");
    const cancelDeleteButton = event.target.closest("[data-action='cancel-delete']");

    if (editButton) {
        const task = findTask(Number(editButton.dataset.id));
        if (task) {
            state.pendingDeleteId = null;
            fillForm(task);
            renderTasks();
        }
    }

    if (deleteButton) {
        state.pendingDeleteId = Number(deleteButton.dataset.id);
        renderTasks();
    }

    if (cancelDeleteButton) {
        state.pendingDeleteId = null;
        renderTasks();
    }

    if (confirmDeleteButton) {
        await deleteTask(confirmDeleteButton.dataset.id);
        state.pendingDeleteId = null;
        showToast("Задача удалена");
        await loadTasks();
    }
}

async function handleTaskToggle(event) {
    const checkbox = event.target.closest("[data-action='toggle']");
    if (!checkbox) {
        return;
    }
    state.pendingDeleteId = null;
    await toggleTask(checkbox.dataset.id);
    showToast("Статус задачи изменен");
    await loadTasks();
}

function getFormPayload() {
    return {
        title: elements.title.value.trim(),
        description: elements.description.value.trim(),
        priority: elements.priority.value,
        category: elements.category.value.trim(),
        dueDate: elements.dueDate.value || null
    };
}

function validateTask(task) {
    if (!task.title) {
        return "Введите название задачи";
    }
    if (task.title.length > 150) {
        return "Название задачи не должно превышать 150 символов";
    }
    if (task.description.length > 1000) {
        return "Описание не должно превышать 1000 символов";
    }
    return "";
}

function fillForm(task) {
    elements.taskId.value = task.id;
    elements.title.value = task.title || "";
    elements.description.value = task.description || "";
    elements.priority.value = task.priority || "MEDIUM";
    elements.category.value = task.category || "";
    elements.dueDate.value = task.dueDate || "";
    elements.formTitle.textContent = "Редактирование";
    elements.submitButton.textContent = "Сохранить";
    elements.cancelEditButton.hidden = false;
    elements.title.focus();
}

function resetForm() {
    elements.taskForm.reset();
    elements.taskId.value = "";
    elements.priority.value = "MEDIUM";
    elements.formTitle.textContent = "Новая задача";
    elements.submitButton.textContent = "Добавить";
    elements.cancelEditButton.hidden = true;
    elements.formError.textContent = "";
}

function findTask(id) {
    return state.allTasks.find(task => Number(task.id) === Number(id));
}

function render() {
    renderStats();
    renderTasks();
}

function renderStats() {
    const total = state.allTasks.length;
    const completed = state.allTasks.filter(task => task.completed).length;
    const active = total - completed;

    elements.stats.innerHTML = [
        renderStat("Всего", total),
        renderStat("Активные", active),
        renderStat("Завершенные", completed)
    ].join("");
}

function renderStat(label, value) {
    return `
        <div class="stat">
            <strong>${value}</strong>
            <span>${label}</span>
        </div>
    `;
}

function renderTasks() {
    if (state.loading) {
        elements.taskList.innerHTML = `<div class="loading-state">Загрузка задач</div>`;
        return;
    }

    if (state.error) {
        elements.taskList.innerHTML = `<div class="error-state">${escapeHtml(state.error)}</div>`;
        return;
    }

    if (state.tasks.length === 0) {
        elements.taskList.innerHTML = `<div class="empty-state">Нет задач по выбранным условиям</div>`;
        return;
    }

    elements.taskList.innerHTML = state.tasks.map(renderTaskCard).join("");
}

function renderTaskCard(task) {
    const priority = priorityText(task.priority);
    const dueDate = task.dueDate ? formatDate(task.dueDate) : "Без срока";
    const category = task.category ? escapeHtml(task.category) : "Без категории";
    const isDeletePending = Number(state.pendingDeleteId) === Number(task.id);

    return `
        <article class="task-card ${task.completed ? "completed" : ""}">
            <input class="task-check" type="checkbox" data-action="toggle" data-id="${task.id}" ${task.completed ? "checked" : ""}>
            <div>
                <div class="task-title-row">
                    <h3>${escapeHtml(task.title)}</h3>
                    <span class="badge ${String(task.priority).toLowerCase()}">${priority}</span>
                </div>
                ${task.description ? `<p class="task-description">${escapeHtml(task.description)}</p>` : ""}
                <div class="task-meta">
                    <span class="badge">${category}</span>
                    <span class="badge">${dueDate}</span>
                    <span class="badge">${task.completed ? "Завершена" : "Активна"}</span>
                </div>
            </div>
            <div class="task-actions">
                ${isDeletePending ? `
                    <button type="button" class="button danger compact" data-action="confirm-delete" data-id="${task.id}">Да</button>
                    <button type="button" class="button secondary compact" data-action="cancel-delete" data-id="${task.id}">Отмена</button>
                ` : `
                    <button type="button" class="button secondary icon" data-action="edit" data-id="${task.id}" title="Редактировать" aria-label="Редактировать">&#9998;</button>
                    <button type="button" class="button danger icon" data-action="delete" data-id="${task.id}" title="Удалить" aria-label="Удалить">&times;</button>
                `}
            </div>
        </article>
    `;
}

function renderApiStatus(mode) {
    elements.apiStatus.classList.toggle("server", mode === "server");
    elements.apiStatus.classList.toggle("demo", mode === "demo");
    elements.apiStatus.textContent = mode === "server" ? "REST API" : "Демо-режим";
}

function priorityText(priority) {
    const labels = {
        LOW: "Низкий",
        MEDIUM: "Средний",
        HIGH: "Высокий"
    };
    return labels[priority] || "Средний";
}

function formatDate(value) {
    return new Intl.DateTimeFormat("ru-RU").format(new Date(value));
}

function showToast(message) {
    elements.toast.textContent = message;
    elements.toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        elements.toast.classList.remove("show");
    }, 2200);
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function debounce(callback, delay) {
    let timer = null;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => callback(...args), delay);
    };
}
