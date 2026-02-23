package com.nocode.platform.generator.spec;

import java.util.ArrayList;
import java.util.List;

public class SpecValidator {

    public void validate(Spec spec) {
        List<String> errors = new ArrayList<>();

        if (spec.specVersion() <= 0) errors.add("specVersion must be > 0");
        if (spec.project() == null) errors.add("project section is required");
        else {
            if (blank(spec.project().groupId())) errors.add("project.groupId is required");
            if (blank(spec.project().artifactId())) errors.add("project.artifactId is required");
            if (blank(spec.project().name())) errors.add("project.name is required");
            if (blank(spec.project().basePackage())) errors.add("project.basePackage is required");
        }

        if (spec.entities() == null) errors.add("entities must be present (can be empty list)");

        if (!errors.isEmpty()) {
            throw new IllegalArgumentException("Spec validation failed:\n- " + String.join("\n- ", errors));
        }
    }

    private boolean blank(String s) { return s == null || s.trim().isEmpty(); }
}