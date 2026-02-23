package com.nocode.platform.generator.spec;

import java.util.List;

public record Spec(
        int specVersion,
        Project project,
        List<Entity> entities
) {
    public record Project(
            String groupId,
            String artifactId,
            String name,
            String basePackage,
            String version
    ) {}

    public record Entity(
            String name,
            String table,
            List<Field> fields
    ) {}

    public record Field(
            String name,
            String type,
            boolean required
    ) {}
}