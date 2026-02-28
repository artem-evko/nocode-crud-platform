package com.nocode.platform.generator.engine.poet;

import com.nocode.platform.generator.spec.Spec;
import com.squareup.javapoet.*;

import javax.lang.model.element.Modifier;
import java.util.List;

public class ControllerGenerator {

    public String generate(Spec.Entity entity, String basePackage) {
        String controllerPackage = basePackage + ".controller";
        String repoPackage = basePackage + ".repository";
        String entityPackage = basePackage + ".domain";

        ClassName entityClass = ClassName.get(entityPackage, entity.name());
        ClassName repoClass = ClassName.get(repoPackage, entity.name() + "Repository");

        // Dependencies
        FieldSpec repoField = FieldSpec.builder(repoClass, "repository", Modifier.PRIVATE, Modifier.FINAL).build();

        // Constructor for DI
        MethodSpec constructor = MethodSpec.constructorBuilder()
                .addModifiers(Modifier.PUBLIC)
                .addParameter(repoClass, "repository")
                .addStatement("this.repository = repository")
                .build();

        // GET all
        MethodSpec getAllMethod = MethodSpec.methodBuilder("getAll")
                .addModifiers(Modifier.PUBLIC)
                .addAnnotation(ClassName.get("org.springframework.web.bind.annotation", "GetMapping"))
                .returns(ParameterizedTypeName.get(ClassName.get(List.class), entityClass))
                .addStatement("return repository.findAll()")
                .build();

        // GET by ID
        MethodSpec getByIdMethod = MethodSpec.methodBuilder("getById")
                .addModifiers(Modifier.PUBLIC)
                .addAnnotation(AnnotationSpec.builder(ClassName.get("org.springframework.web.bind.annotation", "GetMapping"))
                        .addMember("value", "$S", "/{id}")
                        .build())
                .addParameter(ParameterSpec.builder(Long.class, "id")
                        .addAnnotation(ClassName.get("org.springframework.web.bind.annotation", "PathVariable"))
                        .build())
                .returns(entityClass)
                .addStatement("return repository.findById(id).orElseThrow(() -> new $T($S))",
                        ClassName.get("org.springframework.web.server", "ResponseStatusException"),
                        "org.springframework.http.HttpStatus.NOT_FOUND")
                .build();

        // POST (Create)
        MethodSpec createMethod = MethodSpec.methodBuilder("create")
                .addModifiers(Modifier.PUBLIC)
                .addAnnotation(ClassName.get("org.springframework.web.bind.annotation", "PostMapping"))
                .addParameter(ParameterSpec.builder(entityClass, "entity")
                        .addAnnotation(ClassName.get("org.springframework.web.bind.annotation", "RequestBody"))
                        .addAnnotation(ClassName.get("jakarta.validation", "Valid"))
                        .build())
                .returns(entityClass)
                .addStatement("return repository.save(entity)")
                .build();

        // PUT (Update)
        MethodSpec updateMethod = MethodSpec.methodBuilder("update")
                .addModifiers(Modifier.PUBLIC)
                .addAnnotation(AnnotationSpec.builder(ClassName.get("org.springframework.web.bind.annotation", "PutMapping"))
                        .addMember("value", "$S", "/{id}")
                        .build())
                .addParameter(ParameterSpec.builder(Long.class, "id")
                        .addAnnotation(ClassName.get("org.springframework.web.bind.annotation", "PathVariable"))
                        .build())
                .addParameter(ParameterSpec.builder(entityClass, "entity")
                        .addAnnotation(ClassName.get("org.springframework.web.bind.annotation", "RequestBody"))
                        .addAnnotation(ClassName.get("jakarta.validation", "Valid"))
                        .build())
                .returns(entityClass)
                .beginControlFlow("if (!repository.existsById(id))")
                .addStatement("throw new $T($T.NOT_FOUND)",
                        ClassName.get("org.springframework.web.server", "ResponseStatusException"),
                        ClassName.get("org.springframework.http", "HttpStatus"))
                .endControlFlow()
                .addStatement("entity.setId(id)")
                .addStatement("return repository.save(entity)")
                .build();

        // DELETE
        MethodSpec deleteMethod = MethodSpec.methodBuilder("delete")
                .addModifiers(Modifier.PUBLIC)
                .addAnnotation(AnnotationSpec.builder(ClassName.get("org.springframework.web.bind.annotation", "DeleteMapping"))
                        .addMember("value", "$S", "/{id}")
                        .build())
                .addParameter(ParameterSpec.builder(Long.class, "id")
                        .addAnnotation(ClassName.get("org.springframework.web.bind.annotation", "PathVariable"))
                        .build())
                .returns(void.class)
                .addStatement("repository.deleteById(id)")
                .build();

        TypeSpec typeSpec = TypeSpec.classBuilder(entity.name() + "Controller")
                .addModifiers(Modifier.PUBLIC)
                .addAnnotation(ClassName.get("org.springframework.web.bind.annotation", "RestController"))
                .addAnnotation(AnnotationSpec.builder(ClassName.get("org.springframework.web.bind.annotation", "RequestMapping"))
                        .addMember("value", "$S", "/api/" + toSnakeCase(entity.name()) + "s")
                        .build())
                .addField(repoField)
                .addMethod(constructor)
                .addMethod(getAllMethod)
                .addMethod(getByIdMethod)
                .addMethod(createMethod)
                .addMethod(updateMethod)
                .addMethod(deleteMethod)
                .build();

        JavaFile javaFile = JavaFile.builder(controllerPackage, typeSpec)
                .indent("    ")
                .build();

        return javaFile.toString();
    }

    private String toSnakeCase(String str) {
        return str.replaceAll("([a-z])([A-Z]+)", "$1-$2").toLowerCase();
    }
}
