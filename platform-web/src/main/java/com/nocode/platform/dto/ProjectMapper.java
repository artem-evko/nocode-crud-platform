package com.nocode.platform.dto;

import com.nocode.platform.project.ProjectEntity;
import org.springframework.stereotype.Component;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Маппер для преобразования между {@link ProjectDto} и {@link ProjectEntity}.
 *
 * <p>Инкапсулирует логику конвертации, убирая её из контроллеров
 * в соответствии с принципом единственной ответственности (SRP).</p>
 */
@Component
public class ProjectMapper {

    /**
     * Преобразование сущности проекта в DTO.
     *
     * @param entity сущность проекта
     * @return DTO проекта
     */
    public ProjectDto toDto(ProjectEntity entity) {
        ProjectDto dto = new ProjectDto();
        dto.setId(entity.getId());
        dto.setName(entity.getName());
        dto.setGroupId(entity.getGroupId());
        dto.setArtifactId(entity.getArtifactId());
        dto.setVersion(entity.getVersion());
        dto.setBasePackage(entity.getBasePackage());
        dto.setSpecText(entity.getSpecText());
        dto.setAuthEnabled(entity.isAuthEnabled());
        dto.setGenerateFrontend(entity.isGenerateFrontend());
        dto.setDeploymentStatus(entity.getDeploymentStatus());
        dto.setDeploymentUrl(entity.getDeploymentUrl());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());
        dto.setEntityVersion(entity.getEntityVersion() != null ? entity.getEntityVersion() : 0L);
        return dto;
    }

    /**
     * Создание новой сущности проекта из DTO с установкой значений по умолчанию.
     *
     * @param dto      DTO проекта из запроса
     * @param username имя владельца проекта
     * @return новая сущность проекта
     */
    public ProjectEntity toNewEntity(ProjectDto dto, String username) {
        ProjectEntity entity = new ProjectEntity();
        entity.setId(UUID.randomUUID());
        entity.setOwnerUsername(username);
        entity.setName(dto.getName());
        entity.setGroupId(dto.getGroupId() != null ? dto.getGroupId() : "com.example");
        entity.setArtifactId(dto.getArtifactId() != null ? dto.getArtifactId() : "demo");
        entity.setVersion(dto.getVersion() != null ? dto.getVersion() : "1.0.0");
        entity.setBasePackage(dto.getBasePackage() != null ? dto.getBasePackage() : "com.example.demo");
        entity.setSpecText(dto.getSpecText() != null ? dto.getSpecText() : "{}");
        entity.setAuthEnabled(dto.isAuthEnabled());
        entity.setGenerateFrontend(dto.isGenerateFrontend());

        OffsetDateTime now = OffsetDateTime.now();
        entity.setCreatedAt(now);
        entity.setUpdatedAt(now);
        return entity;
    }

    /**
     * Обновление полей существующей сущности из DTO.
     *
     * @param entity существующая сущность проекта
     * @param dto    DTO с новыми данными
     */
    public void updateEntity(ProjectEntity entity, ProjectDto dto) {
        entity.setName(dto.getName());
        entity.setGroupId(dto.getGroupId());
        entity.setArtifactId(dto.getArtifactId());
        entity.setVersion(dto.getVersion());
        entity.setBasePackage(dto.getBasePackage());
        entity.setAuthEnabled(dto.isAuthEnabled());
        entity.setGenerateFrontend(dto.isGenerateFrontend());
        if (dto.getSpecText() != null) {
            entity.setSpecText(dto.getSpecText());
        }
        entity.setUpdatedAt(OffsetDateTime.now());
    }
}
