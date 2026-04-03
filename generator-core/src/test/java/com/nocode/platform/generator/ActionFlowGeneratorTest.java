package com.nocode.platform.generator;

import com.nocode.platform.generator.engine.ProjectGenerator;
import com.nocode.platform.generator.spec.Spec;
import org.junit.jupiter.api.Test;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertTrue;

public class ActionFlowGeneratorTest {

    @Test
    public void testActionFlowGeneration() throws Exception {
        Spec.Project project = new Spec.Project(
                "com.test.actions",
                "action-app",
                "Action App",
                "com.test.actions",
                "1.0.0",
                false,
                true
        );

        Spec.FlowNode node1 = new Spec.FlowNode("node1", "action", "DB_CREATE_RECORD", Map.of("entityName", "Product"));
        Spec.FlowNode node2 = new Spec.FlowNode("node2", "action", "UI_SHOW_TOAST", Map.of("message", "Product Created!"));
        Spec.FlowEdge edge = new Spec.FlowEdge("edge1", "node1", "node2");

        Spec.ActionFlow flow = new Spec.ActionFlow("flow1", "Create Product Flow", List.of(node1, node2), List.of(edge));

        Spec spec = new Spec(
                1,
                project,
                List.of(new Spec.Entity("Product", "product", List.of(new Spec.Field("name", Spec.FieldType.STRING, true, null, null, null)), List.of(), null, null, null, null)),
                null,
                List.of(flow)
        );

        ProjectGenerator generator = new ProjectGenerator();
        Path outDir = Path.of("target", "action-flow-test-out");
        
        // Clean out dir
        if (Files.exists(outDir)) {
            Files.walk(outDir).sorted((a, b) -> b.compareTo(a)).map(Path::toFile).forEach(File::delete);
        }

        byte[] zipContent = generator.generate(spec);
        Files.write(Path.of("target", "action-flow-test.zip"), zipContent);
        
        System.out.println("ZIP generated at target/action-flow-test.zip");

        // Basic verification
        assertTrue(zipContent.length > 0, "ZIP should not be empty");
    }
}
