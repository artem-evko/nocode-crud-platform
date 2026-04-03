package com.nocode.platform.generator;

import com.nocode.platform.generator.engine.ProjectGenerator;
import com.nocode.platform.generator.spec.Spec;
import org.junit.jupiter.api.Test;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertTrue;

public class SecurityRBACGeneratorTest {

    @Test
    public void testSecurityConfigGeneration() throws Exception {
        Spec.Project project = new Spec.Project(
                "com.test.sec",
                "sec-app",
                "Secure App",
                "com.test.sec",
                "1.0.0",
                true, // authEnabled = true
                false // generateFrontend = false to speed up
        );

        Spec.Entity resource = new Spec.Entity(
                "FinanceRecord",
                "finance_record",
                List.of(new Spec.Field("amount", Spec.FieldType.INTEGER, true, null, null, null)),
                List.of(),
                "USER, ADMIN", // readRoles
                "MANAGER, ADMIN", // createRoles
                "ADMIN",          // updateRoles
                "ADMIN"           // deleteRoles
        );

        Spec spec = new Spec(
                1,
                project,
                List.of(resource),
                null,
                null
        );

        ProjectGenerator generator = new ProjectGenerator();
        Path outDir = Path.of("target", "sec-test-out");
        
        // Clean out dir
        if (Files.exists(outDir)) {
            Files.walk(outDir).sorted((a, b) -> b.compareTo(a)).map(Path::toFile).forEach(File::delete);
        }

        byte[] zipContent = generator.generate(spec);
        Files.write(Path.of("target", "sec-test.zip"), zipContent);
        
        System.out.println("ZIP generated at target/sec-test.zip");

        // Basic verification
        assertTrue(zipContent.length > 0, "ZIP should not be empty");
    }
}
