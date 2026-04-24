package com.nocode.platform.dto;

import lombok.Data;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * DTO (Data Transfer Object) проекта для обмена данными
 * между REST API и клиентом.
 */
@Data
public class ProjectDto {
    private UUID id;
    private String name;
    private String groupId;
    private String artifactId;
    private String version;
    private String basePackage;
    private String specText;
    private boolean authEnabled;
    private boolean generateFrontend;
    private String deploymentStatus;
    private String deploymentUrl;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
    private Long entityVersion;
}
