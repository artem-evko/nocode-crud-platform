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

        if (spec.entities() == null) {
            errors.add("entities must be present (can be empty list)");
        } else {
            List<String> entityNames = spec.entities().stream().map(Spec.Entity::name).toList();
            for (int i = 0; i < spec.entities().size(); i++) {
                Spec.Entity entity = spec.entities().get(i);
                if (blank(entity.name())) {
                    errors.add("entities[" + i + "].name is required");
                } else if (!entity.name().matches("^[a-zA-Z][a-zA-Z0-9]*$")) {
                    errors.add("entities[" + i + "].name must contain only English letters/numbers and start with a letter: " + entity.name());
                }
                
                if (entity.fields() != null) {
                    for (int j = 0; j < entity.fields().size(); j++) {
                        Spec.Field field = entity.fields().get(j);
                        if (blank(field.name())) {
                            errors.add("entities[" + i + "].fields[" + j + "].name is required");
                        } else if (!field.name().matches("^[a-zA-Z][a-zA-Z0-9]*$")) {
                            errors.add("entities[" + i + "].fields[" + j + "].name must contain only English letters/numbers and start with a letter: " + field.name());
                        }
                        
                        if (field.type() == null) errors.add("entities[" + i + "].fields[" + j + "].type is required");
                    }
                }
                
                if (entity.relations() != null) {
                    for (int j = 0; j < entity.relations().size(); j++) {
                        Spec.Relation rel = entity.relations().get(j);
                        if (blank(rel.name())) errors.add("entities[" + i + "].relations[" + j + "].name is required");
                        if (rel.type() == null) errors.add("entities[" + i + "].relations[" + j + "].type is required");
                        if (blank(rel.targetEntity())) {
                            errors.add("entities[" + i + "].relations[" + j + "].targetEntity is required");
                        } else if (!entityNames.contains(rel.targetEntity())) {
                            errors.add("entities[" + i + "].relations[" + j + "].targetEntity '" + rel.targetEntity() + "' does not exist");
                        }
                    }
                }
            }
        }

        if (!errors.isEmpty()) {
            throw new IllegalArgumentException("Spec validation failed:\n- " + String.join("\n- ", errors));
        }
    }

    private boolean blank(String s) { return s == null || s.trim().isEmpty(); }
}