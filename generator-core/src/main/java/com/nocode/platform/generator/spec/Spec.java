package com.nocode.platform.generator.spec;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;
import java.util.Map;

@JsonIgnoreProperties(ignoreUnknown = true)
public record Spec(
        int specVersion,
        Project project,
        List<Entity> entities,
        UiSpec uiSpec
) {
    public record UiSpec(List<Component> components) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Component(
            String id,
            String type,
            Map<String, Object> props,
            List<Component> children
    ) {}
    public record Project(
            String groupId,
            String artifactId,
            String name,
            String basePackage,
            String version,
            boolean authEnabled,
            boolean generateFrontend
    ) {}

    public record Entity(
            String name,
            String table,
            List<Field> fields,
            List<Relation> relations,
            String readRoles,
            String createRoles,
            String updateRoles,
            String deleteRoles
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