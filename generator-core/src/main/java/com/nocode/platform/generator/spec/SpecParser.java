package com.nocode.platform.generator.spec;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.dataformat.yaml.YAMLFactory;

public class SpecParser {
    private final ObjectMapper mapper = new ObjectMapper(new YAMLFactory());

    public Spec parse(String yaml) {
        try {
            return mapper.readValue(yaml, Spec.class);
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid YAML spec: " + e.getMessage(), e);
        }
    }
}
