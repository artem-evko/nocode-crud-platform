package com.nocode.platform.generator.api;

public record GeneratedProject(
        String groupId,
        String artifactId,
        String version,
        String basePackage,
        String name,
        String specText
) {}