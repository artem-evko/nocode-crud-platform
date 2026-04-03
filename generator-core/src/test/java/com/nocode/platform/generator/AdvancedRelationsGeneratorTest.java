package com.nocode.platform.generator;

import com.nocode.platform.generator.engine.ProjectGenerator;
import com.nocode.platform.generator.spec.Spec;
import org.junit.jupiter.api.Test;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertTrue;

public class AdvancedRelationsGeneratorTest {

    @Test
    public void testManyToManyGeneration() throws Exception {
        Spec.Project project = new Spec.Project(
                "com.test.db",
                "db-app",
                "DB App",
                "com.test.db",
                "1.0.0",
                false,
                false
        );

        Spec.Relation toCourse = new Spec.Relation("courses", "Course", Spec.RelationType.MANY_TO_MANY, null);
        Spec.Entity student = new Spec.Entity(
                "Student",
                "student",
                List.of(new Spec.Field("name", Spec.FieldType.STRING, true, null, null, null)),
                List.of(toCourse),
                null, null, null, null
        );

        Spec.Relation toStudent = new Spec.Relation("students", "Student", Spec.RelationType.MANY_TO_MANY, "courses");
        Spec.Entity course = new Spec.Entity(
                "Course",
                "course",
                List.of(new Spec.Field("title", Spec.FieldType.STRING, true, null, null, null)),
                List.of(toStudent),
                null, null, null, null
        );

        Spec spec = new Spec(
                1,
                project,
                List.of(student, course),
                null,
                null
        );

        ProjectGenerator generator = new ProjectGenerator();
        Path outDir = Path.of("target", "many-to-many-test-out");
        
        if (Files.exists(outDir)) {
            Files.walk(outDir).sorted((a, b) -> b.compareTo(a)).map(Path::toFile).forEach(File::delete);
        }

        byte[] zipContent = generator.generate(spec);
        Files.write(Path.of("target", "many-to-many-test.zip"), zipContent);
        
        System.out.println("ZIP generated at target/many-to-many-test.zip");

        assertTrue(zipContent.length > 0, "ZIP should not be empty");
    }
}
