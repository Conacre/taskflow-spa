package ru.skobenko.todo.service;

import ru.skobenko.todo.dto.TaskCreateRequest;
import ru.skobenko.todo.dto.TaskResponse;
import ru.skobenko.todo.dto.TaskUpdateRequest;
import ru.skobenko.todo.model.Priority;

import java.util.List;

public interface TaskService {

    List<TaskResponse> getAllTasks(String status, String search, Priority priority, String sort);

    TaskResponse getTaskById(Long id);

    TaskResponse createTask(TaskCreateRequest request);

    TaskResponse updateTask(Long id, TaskUpdateRequest request);

    TaskResponse toggleTaskStatus(Long id);

    void deleteTask(Long id);
}
