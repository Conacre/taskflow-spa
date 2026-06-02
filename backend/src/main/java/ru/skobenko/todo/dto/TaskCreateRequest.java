package ru.skobenko.todo.dto;

import ru.skobenko.todo.model.Priority;

import javax.validation.constraints.FutureOrPresent;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;
import java.time.LocalDate;

public class TaskCreateRequest {

    @NotBlank(message = "Название задачи не должно быть пустым")
    @Size(max = 150, message = "Название задачи не должно превышать 150 символов")
    private String title;

    @Size(max = 1000, message = "Описание не должно превышать 1000 символов")
    private String description;

    private Priority priority;

    @Size(max = 80, message = "Категория не должна превышать 80 символов")
    private String category;

    @FutureOrPresent(message = "Срок выполнения не должен быть в прошлом")
    private LocalDate dueDate;

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Priority getPriority() {
        return priority;
    }

    public void setPriority(Priority priority) {
        this.priority = priority;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public LocalDate getDueDate() {
        return dueDate;
    }

    public void setDueDate(LocalDate dueDate) {
        this.dueDate = dueDate;
    }
}
