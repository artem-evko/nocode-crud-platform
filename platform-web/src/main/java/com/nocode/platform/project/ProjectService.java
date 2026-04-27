package com.nocode.platform.project;

import com.nocode.platform.dto.ProjectDto;
import com.nocode.platform.dto.ProjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Сервис бизнес-логики управления проектами.
 *
 * <p>Обеспечивает создание, получение, обновление и удаление проектов
 * с привязкой к текущему аутентифицированному пользователю.
 * Содержит валидацию полей проекта и обработку оптимистичной блокировки.</p>
 */
@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository repo;
    private final ProjectMapper projectMapper;
    private final DeploymentService deploymentService;

    /**
     * Получение имени текущего аутентифицированного пользователя.
     *
     * @return имя пользователя или "admin" если не аутентифицирован
     */
    private String getCurrentUsername() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getName())) {
            return auth.getName();
        }
        return "admin";
    }

    /** Получение списка всех проектов текущего пользователя. */
    @Transactional(readOnly = true)
    public List<ProjectDto> list() {
        return repo.findAllByOwnerUsername(getCurrentUsername()).stream()
                .map(projectMapper::toDto)
                .toList();
    }

    /**
     * Получение проекта по идентификатору с проверкой владельца.
     *
     * @param id идентификатор проекта
     * @return DTO проекта или пустой Optional если не найден / чужой
     */
    @Transactional(readOnly = true)
    public Optional<ProjectDto> getById(UUID id) {
        return repo.findById(id)
                .filter(p -> p.getOwnerUsername().equals(getCurrentUsername()))
                .map(projectMapper::toDto);
    }

    /**
     * Получение сущности проекта по идентификатору с проверкой владельца.
     *
     * @param id идентификатор проекта
     * @return сущность проекта
     * @throws IllegalArgumentException если проект не найден или доступ запрещён
     */
    @Transactional(readOnly = true)
    public ProjectEntity get(UUID id) {
        ProjectEntity p = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Project not found: " + id));
        if (!p.getOwnerUsername().equals(getCurrentUsername())) {
            throw new IllegalArgumentException("Access Denied to Project: " + id);
        }
        return p;
    }

    /**
     * Валидация полей проекта перед созданием/обновлением.
     *
     * @param dto данные проекта
     * @return список ошибок валидации (пустой, если ошибок нет)
     */
    public List<String> validate(ProjectDto dto) {
        List<String> errors = new ArrayList<>();
        if (dto.getName() == null || dto.getName().trim().isEmpty()) {
            errors.add("Project name is required");
        }
        if (dto.getGroupId() != null && !dto.getGroupId().matches("^[a-z][a-z0-9]*(\\.[a-z][a-z0-9]*)*$")) {
            errors.add("Group ID must be a valid Java package (e.g. com.example). Only lowercase letters, digits, and dots.");
        }
        if (dto.getArtifactId() != null && !dto.getArtifactId().matches("^[a-z][a-z0-9-]*$")) {
            errors.add("Artifact ID must contain only lowercase letters, digits, and hyphens.");
        }
        if (dto.getBasePackage() != null && !dto.getBasePackage().matches("^[a-z][a-z0-9]*(\\.[a-z][a-z0-9]*)*$")) {
            errors.add("Base package must be a valid Java package (e.g. com.example.demo).");
        }
        return errors;
    }

    /**
     * Создание нового проекта.
     *
     * @param dto данные проекта (название, groupId, artifactId и т.д.)
     * @return DTO созданного проекта
     */
    @Transactional
    public ProjectDto create(ProjectDto dto) {
        ProjectEntity entity = projectMapper.toNewEntity(dto, getCurrentUsername());
        return projectMapper.toDto(repo.save(entity));
    }

    /**
     * Обновление существующего проекта.
     *
     * <p>Поддерживает оптимистичную блокировку: при конфликте версий
     * выбрасывает {@link ObjectOptimisticLockingFailureException}.</p>
     *
     * @param id  идентификатор проекта
     * @param dto DTO с новыми данными
     * @return DTO обновлённого проекта или пустой Optional если не найден / чужой
     */
    @Transactional
    public Optional<ProjectDto> update(UUID id, ProjectDto dto) {
        return repo.findById(id)
                .filter(p -> p.getOwnerUsername().equals(getCurrentUsername()))
                .map(project -> {
                    projectMapper.updateEntity(project, dto);
                    return projectMapper.toDto(repo.save(project));
                });
    }

    /**
     * Удаление проекта по идентификатору.
     *
     * <p>Перед удалением из БД останавливает активное развёртывание,
     * если оно существует.</p>
     *
     * @param id идентификатор проекта
     * @return true если проект удалён, false если не найден / чужой
     */
    @Transactional
    public boolean delete(UUID id) {
        return repo.findById(id)
                .filter(p -> p.getOwnerUsername().equals(getCurrentUsername()))
                .map(project -> {
                    try {
                        deploymentService.stopDeployment(id);
                    } catch (Exception e) {
                        // развёртывание могло быть неактивным — игнорируем
                    }
                    repo.deleteById(id);
                    return true;
                })
                .orElse(false);
    }

    /**
     * Обновление спецификации проекта.
     *
     * @param id       идентификатор проекта
     * @param specText новый текст спецификации (JSON)
     * @return обновлённая сущность проекта
     */
    @Transactional
    public ProjectEntity updateSpec(UUID id, String specText) {
        ProjectEntity p = get(id);
        p.setSpecText(specText == null ? "" : specText);
        return repo.save(p);
    }
}