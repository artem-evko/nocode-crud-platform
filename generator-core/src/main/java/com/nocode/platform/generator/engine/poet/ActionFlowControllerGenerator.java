package com.nocode.platform.generator.engine.poet;

import com.nocode.platform.generator.spec.Spec;
import com.squareup.javapoet.*;

import javax.lang.model.element.Modifier;
import java.util.Map;

public class ActionFlowControllerGenerator {

    public String generate(Spec spec, String basePackage) {
        String controllerPackage = basePackage + ".controller";
        String servicePackage = basePackage + ".service";

        ClassName restController = ClassName.get("org.springframework.web.bind.annotation", "RestController");
        ClassName requestMapping = ClassName.get("org.springframework.web.bind.annotation", "RequestMapping");
        ClassName crossOrigin = ClassName.get("org.springframework.web.bind.annotation", "CrossOrigin");
        ClassName postMapping = ClassName.get("org.springframework.web.bind.annotation", "PostMapping");
        ClassName requestBody = ClassName.get("org.springframework.web.bind.annotation", "RequestBody");

        TypeSpec.Builder controllerBuilder = TypeSpec.classBuilder("ActionFlowController")
                .addModifiers(Modifier.PUBLIC)
                .addAnnotation(restController)
                .addAnnotation(AnnotationSpec.builder(requestMapping)
                        .addMember("value", "$S", "/api/actions")
                        .build())
                .addAnnotation(AnnotationSpec.builder(crossOrigin)
                        .addMember("origins", "$S", "*")
                        .build());

        // Inject ActionFlowService
        ClassName serviceClass = ClassName.get(servicePackage, "ActionFlowService");
        controllerBuilder.addField(FieldSpec.builder(serviceClass, "actionFlowService")
                .addModifiers(Modifier.PRIVATE, Modifier.FINAL)
                .build());

        // Constructor injection
        MethodSpec constructor = MethodSpec.constructorBuilder()
                .addModifiers(Modifier.PUBLIC)
                .addParameter(serviceClass, "actionFlowService")
                .addStatement("this.actionFlowService = actionFlowService")
                .build();
        controllerBuilder.addMethod(constructor);

        if (spec.actionFlows() != null) {
            for (Spec.ActionFlow flow : spec.actionFlows()) {
                String methodName = "execute_" + flow.id().replace("-", "_");
                
                MethodSpec.Builder mb = MethodSpec.methodBuilder(methodName)
                        .addModifiers(Modifier.PUBLIC)
                        .addAnnotation(AnnotationSpec.builder(postMapping)
                                .addMember("value", "$S", "/" + flow.id())
                                .build())
                        .returns(ParameterizedTypeName.get(Map.class, String.class, Object.class))
                        .addParameter(ParameterSpec.builder(ParameterizedTypeName.get(Map.class, String.class, Object.class), "payload")
                                .addAnnotation(requestBody)
                                .build());

                mb.addStatement("return actionFlowService.$L(payload)", methodName);
                
                controllerBuilder.addMethod(mb.build());
            }
        }

        JavaFile javaFile = JavaFile.builder(controllerPackage, controllerBuilder.build())
                .indent("    ")
                .build();

        return javaFile.toString();
    }
}
