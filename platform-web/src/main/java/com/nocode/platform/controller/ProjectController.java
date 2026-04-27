package com.nocode.platform.controller;

import com.nocode.platform.dto.ProjectDto;
import com.nocode.platform.project.ProjectService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * REST-контроллер управления проектами пользователя.
 *
 * <p>Предоставляет CRUD-операции над проектами: создание, получение,
 * обновление и удаление. Каждый проект привязан к владельцу
 * (текущему аутентифицированному пользователю).</p>
 *
 * <p>Контроллер является тонким слоем, делегирующим бизнес-логику
 * в {@link ProjectService}.</p>
 */
@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    /** Получение всех проектов текущего пользователя. */
    @GetMapping
    public List<ProjectDto> getAllProjects() {
        return projectService.list();
    }

    /** Получение проекта по идентификатору. */
    @GetMapping("/{id}")
    public ResponseEntity<ProjectDto> getProjectById(@PathVariable UUID id) {
        return projectService.getById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Создание нового проекта.
     *
     * @param dto данные проекта (название, groupId, artifactId и т.д.)
     * @return созданный проект или ошибка валидации
     */
    @PostMapping
    public ResponseEntity<?> createProject(@RequestBody ProjectDto dto) {
        List<String> errors = projectService.validate(dto);
        if (!errors.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", String.join("; ", errors)));
        }
        return ResponseEntity.ok(projectService.create(dto));
    }

    /**
     * Обновление существующего проекта.
     *
     * <p>Поддерживает оптимистичную блокировку: при конфликте версий
     * возвращается статус 409 (Conflict).</p>
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateProject(@PathVariable UUID id, @RequestBody ProjectDto dto) {
        try {
            return projectService.update(id, dto)
                    .map(updated -> ResponseEntity.ok((Object) updated))
                    .orElse(ResponseEntity.notFound().build());
        } catch (ObjectOptimisticLockingFailureException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message",
                            "The project was modified in another window. Please reload and try again."));
        }
    }

    /**
     * Удаление проекта по идентификатору.
     *
     * <p>Перед удалением из БД останавливает активное развёртывание,
     * если оно существует.</p>
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProject(@PathVariable UUID id) {
        if (projectService.delete(id)) {
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}
