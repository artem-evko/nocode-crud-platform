package com.nocode.platform.project;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "projects")
@Getter
@Setter
public class ProjectEntity {

    @Id
    private UUID id;

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

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;
}