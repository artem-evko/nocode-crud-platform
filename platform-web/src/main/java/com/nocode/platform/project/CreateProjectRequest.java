package com.nocode.platform.project;

public record CreateProjectRequest(
        String name,
        String groupId,
        String artifactId,
        String version,
        String basePackage,
        String specText
) {
}