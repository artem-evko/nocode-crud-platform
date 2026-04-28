package com.nocode.platform.generator;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nocode.platform.generator.engine.ProjectGenerator;
import com.nocode.platform.generator.spec.SpecValidator;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Конфигурация Spring-бинов для модуля генерации кода.
 *
 * <p>Классы {@link ProjectGenerator} и {@link SpecValidator} находятся
 * в модуле {@code generator-core}, который не зависит от Spring.
 * Данная конфигурация регистрирует их как Spring-бины для внедрения
 * зависимостей через DI.</p>
 */
@Configuration
public class GeneratorConfig {

    @Bean
    public ProjectGenerator projectGenerator() {
        return new ProjectGenerator();
    }

    @Bean
    public SpecValidator specValidator() {
        return new SpecValidator();
    }

    @Bean
    public ObjectMapper generatorObjectMapper() {
        return new ObjectMapper();
    }
}
