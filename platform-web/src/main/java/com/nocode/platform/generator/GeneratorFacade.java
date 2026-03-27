package com.nocode.platform.generator;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.dataformat.yaml.YAMLFactory;
import com.nocode.platform.generator.engine.ProjectGenerator;
import com.nocode.platform.generator.spec.Spec;
import com.nocode.platform.project.ProjectEntity;
import org.springframework.stereotype.Service;

import java.util.ArrayList;

@Service
public class GeneratorFacade {

    private final ProjectGenerator projectGenerator = new ProjectGenerator();
    private final ObjectMapper mapper = new ObjectMapper();

    public byte[] generateReal(ProjectEntity p) {
        try {
            Spec spec;
            if (p.getSpecText() != null && !p.getSpecText().isBlank()) {
               spec = mapper.readValue(p.getSpecText(), Spec.class);
            } else {
               Spec.Project sp = new Spec.Project(
                   p.getGroupId(),
                   p.getArtifactId(),
                   p.getName(),
                   p.getBasePackage(),
                   p.getVersion(),
                   false, // authEnabled defaults to false if specText missing
                   p.isGenerateFrontend()
               );
               spec = new Spec(1, sp, new ArrayList<>(), null, new ArrayList<>());
            }
            return projectGenerator.generate(spec);
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate project", e);
        }
    }
}
