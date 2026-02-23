package com.nocode.platform.generator;

import com.nocode.platform.generator.api.GeneratedProject;
import com.nocode.platform.generator.stub.StubZipGenerator;
import com.nocode.platform.project.ProjectEntity;
import org.springframework.stereotype.Service;

@Service
public class GeneratorFacade {

    private final StubZipGenerator stub = new StubZipGenerator();

    public byte[] generateStub(ProjectEntity p) {
        return stub.generate(new GeneratedProject(
                p.getGroupId(),
                p.getArtifactId(),
                p.getVersion(),
                p.getBasePackage(),
                p.getName(),
                p.getSpecText()
        ));
    }
}