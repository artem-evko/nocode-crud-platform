package com.nocode.platform.generator.api;

/**
 * DTO для передачи параметров сгенерированного проекта.
 */
public record GeneratedProject(
        String groupId,
        String artifactId,
        String version,
        String basePackage,
        String name,
        String specText
) {}