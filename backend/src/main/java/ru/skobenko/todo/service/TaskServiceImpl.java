package ru.skobenko.todo.service;

import org.springframework.stereotype.Service;
import ru.skobenko.todo.dto.TaskCreateRequest;
import ru.skobenko.todo.dto.TaskResponse;
import ru.skobenko.todo.dto.TaskUpdateRequest;
import ru.skobenko.todo.exception.TaskNotFoundException;
import ru.skobenko.todo.model.Priority;
import ru.skobenko.todo.model.Task;
import ru.skobenko.todo.repository.TaskRepository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
public class TaskServiceImpl implements TaskService {

    private final TaskRepository taskRepository;

    public TaskServiceImpl(TaskRepository taskRepository) {
        this.taskRepository = taskRepository;
    }

    @Override
    public List<TaskResponse> getAllTasks(String status, String search, Priority priority, String sort) {
        Stream<Task> stream = taskRepository.findAll().stream();

        if ("active".equalsIgnoreCase(status)) {
            stream = stream.filter(task -> !Boolean.TRUE.equals(task.getCompleted()));
        } else if ("completed".equalsIgnoreCase(status)) {
            stream = stream.filter(task -> Boolean.TRUE.equals(task.getCompleted()));
        }

        if (search != null && !search.trim().isEmpty()) {
            String normalizedSearch = search.trim().toLowerCase(Locale.ROOT);
            stream = stream.filter(task -> task.getTitle() != null
                    && task.getTitle().toLowerCase(Locale.ROOT).contains(normalizedSearch));
        }

        if (priority != null) {
            stream = stream.filter(task -> priority == task.getPriority());
        }

        Comparator<Task> comparator = buildComparator(sort);

        return stream
                .sorted(comparator)
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public TaskResponse getTaskById(Long id) {
        Task task = findTaskOrThrow(id);
        return mapToResponse(task);
    }

    @Override
    public TaskResponse createTask(TaskCreateRequest request) {
        Task task = new Task();
        task.setTitle(normalizeRequired(request.getTitle()));
        task.setDescription(normalizeOptional(request.getDescription()));
        task.setPriority(request.getPriority() != null ? request.getPriority() : Priority.MEDIUM);
        task.setCategory(normalizeOptional(request.getCategory()));
        task.setDueDate(request.getDueDate());
        task.setCompleted(false);

        Task savedTask = taskRepository.save(task);
        return mapToResponse(savedTask);
    }

    @Override
    public TaskResponse updateTask(Long id, TaskUpdateRequest request) {
        Task task = findTaskOrThrow(id);
        task.setTitle(normalizeRequired(request.getTitle()));
        task.setDescription(normalizeOptional(request.getDescription()));
        if (request.getCompleted() != null) {
            task.setCompleted(request.getCompleted());
        }
        task.setPriority(request.getPriority() != null ? request.getPriority() : Priority.MEDIUM);
        task.setCategory(normalizeOptional(request.getCategory()));
        task.setDueDate(request.getDueDate());

        Task savedTask = taskRepository.save(task);
        return mapToResponse(savedTask);
    }

    @Override
    public TaskResponse toggleTaskStatus(Long id) {
        Task task = findTaskOrThrow(id);
        task.setCompleted(!Boolean.TRUE.equals(task.getCompleted()));
        Task savedTask = taskRepository.save(task);
        return mapToResponse(savedTask);
    }

    @Override
    public void deleteTask(Long id) {
        Task task = findTaskOrThrow(id);
        taskRepository.delete(task);
    }

    private Task findTaskOrThrow(Long id) {
        return taskRepository.findById(id)
                .orElseThrow(() -> new TaskNotFoundException(id));
    }

    private Comparator<Task> buildComparator(String sort) {
        String sortValue = sort == null || sort.trim().isEmpty() ? "createdAt,desc" : sort.trim();
        String[] parts = sortValue.split(",");
        String field = parts[0];
        boolean descending = parts.length > 1 && "desc".equalsIgnoreCase(parts[1]);

        Comparator<Task> comparator;
        if ("title".equalsIgnoreCase(field)) {
            comparator = Comparator.comparing(Task::getTitle, Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER));
        } else if ("dueDate".equalsIgnoreCase(field)) {
            comparator = Comparator.comparing(Task::getDueDate, Comparator.nullsLast(LocalDate::compareTo));
        } else if ("priority".equalsIgnoreCase(field)) {
            comparator = Comparator.comparing(Task::getPriority, Comparator.nullsLast(Priority::compareTo));
        } else if ("updatedAt".equalsIgnoreCase(field)) {
            comparator = Comparator.comparing(Task::getUpdatedAt, Comparator.nullsLast(LocalDateTime::compareTo));
        } else {
            comparator = Comparator.comparing(Task::getCreatedAt, Comparator.nullsLast(LocalDateTime::compareTo));
        }

        return descending ? comparator.reversed() : comparator;
    }

    private TaskResponse mapToResponse(Task task) {
        return new TaskResponse(
                task.getId(),
                task.getTitle(),
                task.getDescription(),
                task.getCompleted(),
                task.getPriority(),
                task.getCategory(),
                task.getDueDate(),
                task.getCreatedAt(),
                task.getUpdatedAt()
        );
    }

    private String normalizeRequired(String value) {
        return value == null ? null : value.trim();
    }

    private String normalizeOptional(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        return value.trim();
    }
}
