package com.nocode.platform.project;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.Getter;
import lombok.Setter;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * JPA-сущность проекта, создаваемого пользователем на платформе.
 *
 * <p>Хранит метаданные проекта (название, groupId, artifactId),
 * JSON-спецификацию моделей данных и UI, настройки генерации
 * (аутентификация, фронтенд), а также статус развёртывания.</p>
 */
@Entity
@Table(name = "projects")
@Getter
@Setter
public class ProjectEntity {

    @Id
    private UUID id;

    @Column(name = "owner_username", nullable = false, length = 100)
    private String ownerUsername;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(name = "group_id", nullable = false, length = 200)
    private String groupId;

    @Column(name = "artifact_id", nullable = false, length = 200)
    private String artifactId;

    @Column(nullable = false, length = 50)
    private String version;

    @Column(name = "base_package", nullable = false, length = 300)
    private String basePackage;

    @Column(name = "spec_text", nullable = false, columnDefinition = "text")
    private String specText;

    @Column(name = "auth_enabled", nullable = false)
    private boolean authEnabled;

    @Column(name = "generate_frontend", nullable = false)
    private boolean generateFrontend;

    @Column(name = "deployment_status", length = 50)
    private String deploymentStatus;

    @Column(name = "deployment_url", length = 300)
    private String deploymentUrl;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @Version
    @Column(name = "entity_version")
    private Long entityVersion;
}