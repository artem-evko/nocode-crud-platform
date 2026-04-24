package com.nocode.platform.generator.spec;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.dataformat.yaml.YAMLFactory;

/**
 * Парсер YAML-спецификации проекта в объектную модель {@link Spec}.
 */
public class SpecParser {
    private final ObjectMapper mapper = new ObjectMapper(new YAMLFactory());

    /**
     * Разбирает YAML-строку в объект {@link Spec}.
     *
     * @param yaml строка с YAML-спецификацией
     * @return десериализованная спецификация
     * @throws IllegalArgumentException при ошибке парсинга
     */
    public Spec parse(String yaml) {
        try {
            return mapper.readValue(yaml, Spec.class);
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid YAML spec: " + e.getMessage(), e);
        }
    }
}
