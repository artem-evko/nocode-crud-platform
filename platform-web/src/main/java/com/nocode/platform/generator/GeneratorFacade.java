package com.nocode.platform.generator;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nocode.platform.generator.engine.ProjectGenerator;
import com.nocode.platform.generator.spec.Spec;
import com.nocode.platform.generator.spec.SpecValidator;
import com.nocode.platform.project.ProjectEntity;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;

/**
 * Фасад для генерации исходного кода проекта.
 *
 * <p>Принимает {@link ProjectEntity}, парсит JSON-спецификацию,
 * переопределяет метаданные проекта из авторитетных полей сущности,
 * валидирует спецификацию и запускает кодогенерацию.
 * Возвращает ZIP-архив с готовым проектом.</p>
 */
@Service
@RequiredArgsConstructor
public class GeneratorFacade {

    private final ProjectGenerator projectGenerator;
    private final SpecValidator specValidator;
    private final ObjectMapper generatorObjectMapper;

    /**
     * Генерация проекта на основе данных из {@link ProjectEntity}.
     *
     * @param p сущность проекта с метаданными и спецификацией
     * @return ZIP-архив сгенерированного проекта в виде массива байтов
     * @throws IllegalArgumentException при ошибках валидации спецификации
     * @throws RuntimeException         при других ошибках генерации
     */
    public byte[] generateReal(ProjectEntity p) {
        try {
            Spec spec;
            if (p.getSpecText() != null && !p.getSpecText().isBlank()) {
               spec = generatorObjectMapper.readValue(p.getSpecText(), Spec.class);
               Spec.Project overridden = new Spec.Project(
                   p.getGroupId(),
                   p.getArtifactId(),
                   p.getName(),
                   p.getBasePackage(),
                   p.getVersion(),
                   p.isAuthEnabled(),
                   p.isGenerateFrontend()
               );
               spec = new Spec(spec.specVersion(), overridden, spec.entities(), spec.uiSpec(), spec.actionFlows());
            } else {
               Spec.Project sp = new Spec.Project(
                   p.getGroupId(),
                   p.getArtifactId(),
                   p.getName(),
                   p.getBasePackage(),
                   p.getVersion(),
                   p.isAuthEnabled(),
                   p.isGenerateFrontend()
               );
               spec = new Spec(1, sp, new ArrayList<>(), null, new ArrayList<>());
            }
            specValidator.validate(spec);
            return projectGenerator.generate(spec);
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate project", e);
        }
    }
}
