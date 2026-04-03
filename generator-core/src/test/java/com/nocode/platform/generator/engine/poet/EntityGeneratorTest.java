package com.nocode.platform.generator.engine.poet;

import com.nocode.platform.generator.SnapshotTestUtils;
import com.nocode.platform.generator.spec.Spec;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.util.List;

public class EntityGeneratorTest {

    @Test
    void testGenerateEntity() throws IOException {
        EntityGenerator generator = new EntityGenerator();
        
        Spec.Entity entity = new Spec.Entity(
                "Customer",
                "customers",
                List.of(
                        new Spec.Field("firstName", Spec.FieldType.STRING, true, null, 100, null),
                        new Spec.Field("age", Spec.FieldType.INTEGER, false, 18, 120, null)
                ),
                List.of(), // no relations for simplicity
                "USER, ADMIN", // readRoles
                "ADMIN",       // createRoles
                "ADMIN",       // updateRoles
                "ADMIN"        // deleteRoles
        );

        String generatedCode = generator.generate(entity, "com.example.testapp");
        
        SnapshotTestUtils.assertSnapshotMatch("CustomerEntity", generatedCode);
    }
}
