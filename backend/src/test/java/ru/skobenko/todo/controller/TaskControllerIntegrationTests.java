package ru.skobenko.todo.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import ru.skobenko.todo.repository.TaskRepository;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class TaskControllerIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private TaskRepository taskRepository;

    @BeforeEach
    void setUp() {
        taskRepository.deleteAll();
    }

    @Test
    void createTaskReturnsCreatedTask() throws Exception {
        mockMvc.perform(post("/api/tasks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{"
                                + "\"title\":\"Write diploma section\","
                                + "\"description\":\"Describe SPA architecture\","
                                + "\"priority\":\"HIGH\","
                                + "\"category\":\"Diploma\","
                                + "\"dueDate\":\"2030-01-01\""
                                + "}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.title", is("Write diploma section")))
                .andExpect(jsonPath("$.description", is("Describe SPA architecture")))
                .andExpect(jsonPath("$.completed", is(false)))
                .andExpect(jsonPath("$.priority", is("HIGH")))
                .andExpect(jsonPath("$.category", is("Diploma")))
                .andExpect(jsonPath("$.dueDate", is("2030-01-01")))
                .andExpect(jsonPath("$.createdAt", notNullValue()))
                .andExpect(jsonPath("$.updatedAt", notNullValue()));
    }

    @Test
    void getTasksSupportsFilteringSearchAndSorting() throws Exception {
        long lowTaskId = createTask("Buy milk", "LOW");
        long highTaskId = createTask("Write report", "HIGH");
        createTask("Read book", "MEDIUM");

        mockMvc.perform(patch("/api/tasks/{id}/toggle", lowTaskId))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/tasks")
                        .param("status", "active")
                        .param("search", "write")
                        .param("priority", "HIGH")
                        .param("sort", "priority,desc"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id", is((int) highTaskId)))
                .andExpect(jsonPath("$[0].title", is("Write report")))
                .andExpect(jsonPath("$[0].completed", is(false)))
                .andExpect(jsonPath("$[0].priority", is("HIGH")));
    }

    @Test
    void getTaskByIdReturnsSingleTask() throws Exception {
        long taskId = createTask("Open project", "MEDIUM");

        mockMvc.perform(get("/api/tasks/{id}", taskId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is((int) taskId)))
                .andExpect(jsonPath("$.title", is("Open project")))
                .andExpect(jsonPath("$.priority", is("MEDIUM")));
    }

    @Test
    void updateTaskChangesFieldsWithoutResettingCompletedWhenFieldIsOmitted() throws Exception {
        long taskId = createTask("Initial title", "LOW");

        mockMvc.perform(patch("/api/tasks/{id}/toggle", taskId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.completed", is(true)));

        mockMvc.perform(put("/api/tasks/{id}", taskId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{"
                                + "\"title\":\"Updated title\","
                                + "\"description\":\"Updated description\","
                                + "\"priority\":\"HIGH\","
                                + "\"category\":\"Testing\""
                                + "}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is((int) taskId)))
                .andExpect(jsonPath("$.title", is("Updated title")))
                .andExpect(jsonPath("$.description", is("Updated description")))
                .andExpect(jsonPath("$.completed", is(true)))
                .andExpect(jsonPath("$.priority", is("HIGH")))
                .andExpect(jsonPath("$.category", is("Testing")));
    }

    @Test
    void toggleTaskStatusSwitchesCompletedFlag() throws Exception {
        long taskId = createTask("Toggle task", "MEDIUM");

        mockMvc.perform(patch("/api/tasks/{id}/toggle", taskId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.completed", is(true)));

        mockMvc.perform(patch("/api/tasks/{id}/toggle", taskId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.completed", is(false)));
    }

    @Test
    void deleteTaskRemovesTask() throws Exception {
        long taskId = createTask("Delete task", "LOW");

        mockMvc.perform(delete("/api/tasks/{id}", taskId))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/tasks/{id}", taskId))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message", is("Задача с id " + taskId + " не найдена")));
    }

    @Test
    void createTaskRejectsBlankTitle() throws Exception {
        mockMvc.perform(post("/api/tasks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"   \",\"priority\":\"MEDIUM\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", is("Название задачи не должно быть пустым")));
    }

    @Test
    void createTaskRejectsPastDueDate() throws Exception {
        mockMvc.perform(post("/api/tasks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Invalid date\",\"dueDate\":\"2000-01-01\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", is("Срок выполнения не должен быть в прошлом")));
    }

    private long createTask(String title, String priority) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/tasks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{"
                                + "\"title\":\"" + title + "\","
                                + "\"priority\":\"" + priority + "\""
                                + "}"))
                .andExpect(status().isCreated())
                .andReturn();

        JsonNode response = objectMapper.readTree(result.getResponse().getContentAsString());
        return response.get("id").asLong();
    }
}
