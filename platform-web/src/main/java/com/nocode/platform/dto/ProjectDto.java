package com.nocode.platform.dto;

import lombok.Data;
import lombok.Data;
import java.time.OffsetDateTime;
import java.util.UUID;

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
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
