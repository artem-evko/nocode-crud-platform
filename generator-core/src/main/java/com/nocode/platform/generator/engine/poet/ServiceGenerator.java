package com.nocode.platform.generator.engine.poet;

import com.nocode.platform.generator.spec.Spec;
import com.squareup.javapoet.*;

import javax.lang.model.element.Modifier;
import java.util.Map;

public class ServiceGenerator {

    public String generate(Spec spec, String basePackage) {
        String servicePackage = basePackage + ".service";

        TypeSpec.Builder serviceBuilder = TypeSpec.classBuilder("ActionFlowService")
                .addModifiers(Modifier.PUBLIC)
                .addAnnotation(ClassName.get("org.springframework.stereotype", "Service"))
                .addAnnotation(ClassName.get("org.springframework.transaction.annotation", "Transactional"));

        // Inject application context or entity manager for dynamic queries
        serviceBuilder.addField(FieldSpec.builder(ClassName.get("jakarta.persistence", "EntityManager"), "entityManager")
                .addAnnotation(ClassName.get("org.springframework.beans.factory.annotation", "Autowired"))
                .build());

        if (spec.actionFlows() != null) {
            for (Spec.ActionFlow flow : spec.actionFlows()) {
                String methodName = "execute_" + flow.id().replace("-", "_");
                MethodSpec.Builder mb = MethodSpec.methodBuilder(methodName)
                        .addModifiers(Modifier.PUBLIC)
                        .returns(ParameterizedTypeName.get(Map.class, String.class, Object.class))
                        .addParameter(ParameterizedTypeName.get(Map.class, String.class, Object.class), "payload");

                mb.addStatement("$T<$T, $T> result = new $T<>()", Map.class, String.class, Object.class, java.util.HashMap.class);
                mb.addCode("\n// --- Flow execution for: $L ---\n", flow.name());

                if (flow.nodes() != null) {
                    for (Spec.FlowNode node : flow.nodes()) {
                        if ("trigger".equals(node.type())) continue;

                        String action = node.action();
                        if ("DB_CREATE_RECORD".equals(action)) {
                            mb.addCode("// Action: Create Entity\n");
                            mb.addStatement("System.out.println(\"Executing DB Action: \" + $S)", action);
                        } else if ("DB_UPDATE_RECORD".equals(action)) {
                            mb.addCode("// Action: Update Entity\n");
                            mb.addStatement("System.out.println(\"Executing DB Action: \" + $S)", action);
                        } else if ("UI_SHOW_TOAST".equals(action)) {
                            mb.addStatement("result.put(\"toast\", $S)", "Success! Action Flow " + flow.name() + " executed.");
                        }
                    }
                }

                mb.addStatement("return result");
                serviceBuilder.addMethod(mb.build());
            }
        }

        JavaFile javaFile = JavaFile.builder(servicePackage, serviceBuilder.build())
                .indent("    ")
                .build();

        return javaFile.toString();
    }
}
