package com.nocode.platform.generator.engine.poet;

import com.nocode.platform.generator.SnapshotTestUtils;
import com.nocode.platform.generator.spec.Spec;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.util.List;
import java.util.Map;

public class ServiceGeneratorTest {

    @Test
    void testGenerateService() throws IOException {
        ServiceGenerator generator = new ServiceGenerator();
        
        Spec.ActionFlow flow = new Spec.ActionFlow(
                "flow-123",
                "CreateCustomerFlow",
                List.of(
                        new Spec.FlowNode("node1", "DB", "DB_UPDATE_RECORD", Map.of("entityName", "Customer", "mapping", "{\"firstName\": \"{{payload.name}}\"}")),
                        new Spec.FlowNode("node2", "DB", "DB_DELETE_RECORD", Map.of("entityName", "Customer")),
                        new Spec.FlowNode("node3", "UI", "UI_SHOW_TOAST", Map.of("message", "Success! ID={{payload.id}}"))
                ),
                List.of(
                        new Spec.FlowEdge("edge1", "node1", "node2"),
                        new Spec.FlowEdge("edge2", "node2", "node3")
                )
        );

        Spec spec = new Spec(1, null, List.of(), null, List.of(flow));

        String generatedCode = generator.generate(spec, "com.example.testapp");
        
        SnapshotTestUtils.assertSnapshotMatch("ActionFlowService", generatedCode);
    }
}
