package ru.skobenko.todo.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.skobenko.todo.model.Priority;
import ru.skobenko.todo.model.Task;

import java.util.List;

public interface TaskRepository extends JpaRepository<Task, Long> {

    List<Task> findByCompleted(Boolean completed);

    List<Task> findByPriority(Priority priority);

    List<Task> findByTitleContainingIgnoreCase(String title);
}
