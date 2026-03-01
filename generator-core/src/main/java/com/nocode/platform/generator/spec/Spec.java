package com.nocode.platform.generator.spec;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
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
            List<Field> fields,
            List<Relation> relations
    ) {}

    public enum FieldType {
        STRING, INTEGER, BOOLEAN, DATE, DECIMAL
    }

    public record Field(
            String name,
            FieldType type,
            boolean required,
            Integer min,
            Integer max,
            String pattern
    ) {}

    public enum RelationType {
        MANY_TO_ONE, ONE_TO_MANY
    }

    public record Relation(
            String name,
            String targetEntity,
            RelationType type
    ) {}
}