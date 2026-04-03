package com.nocode.platform.generator.engine.poet;

import com.nocode.platform.generator.spec.Spec;
import com.squareup.javapoet.*;

import javax.lang.model.element.Modifier;
import java.util.ArrayList;
import java.util.List;

public class EntityGenerator {

    public String generate(Spec.Entity entity, String basePackage) {
        String entityPackage = basePackage + ".domain";

        TypeSpec.Builder typeBuilder = TypeSpec.classBuilder(entity.name())
                .addModifiers(Modifier.PUBLIC)
                .addAnnotation(ClassName.get("jakarta.persistence", "Entity"))
                .addAnnotation(AnnotationSpec.builder(ClassName.get("jakarta.persistence", "Table"))
                        .addMember("name", "$S", entity.table())
                        .build());

        // Add ID field
        FieldSpec idField = FieldSpec.builder(Long.class, "id", Modifier.PRIVATE)
                .addAnnotation(ClassName.get("jakarta.persistence", "Id"))
                .addAnnotation(AnnotationSpec.builder(ClassName.get("jakarta.persistence", "GeneratedValue"))
                        .addMember("strategy", "$T.IDENTITY", ClassName.get("jakarta.persistence", "GenerationType"))
                        .build())
                .build();
        typeBuilder.addField(idField);
        
        // Add Getters/Setters for ID
        typeBuilder.addMethod(buildGetter(Long.class, "id"));
        typeBuilder.addMethod(buildSetter(Long.class, "id"));

        // Add standard fields
        if (entity.fields() != null) {
            for (Spec.Field field : entity.fields()) {
                if ("id".equalsIgnoreCase(field.name())) {
                    continue;
                }
                Class<?> fieldClass = getJavaType(field.type());
                FieldSpec.Builder fieldBuilder = FieldSpec.builder(fieldClass, field.name(), Modifier.PRIVATE);
                
                // Add @Column
                AnnotationSpec.Builder columnBuilder = AnnotationSpec.builder(ClassName.get("jakarta.persistence", "Column"))
                        .addMember("name", "$S", toSnakeCase(field.name()))
                        .addMember("nullable", "$L", !field.required());
                fieldBuilder.addAnnotation(columnBuilder.build());

                // Add Validation Annotations
                if (field.required()) {
                    fieldBuilder.addAnnotation(ClassName.get("jakarta.validation.constraints", "NotNull"));
                }
                if (fieldClass == String.class) {
                    if (field.min() != null || field.max() != null) {
                        AnnotationSpec.Builder sizeBuilder = AnnotationSpec.builder(ClassName.get("jakarta.validation.constraints", "Size"));
                        if (field.min() != null) sizeBuilder.addMember("min", "$L", field.min());
                        if (field.max() != null) sizeBuilder.addMember("max", "$L", field.max());
                        fieldBuilder.addAnnotation(sizeBuilder.build());
                    }
                    if (field.pattern() != null && !field.pattern().isBlank()) {
                        fieldBuilder.addAnnotation(AnnotationSpec.builder(ClassName.get("jakarta.validation.constraints", "Pattern"))
                                .addMember("regexp", "$S", field.pattern())
                                .build());
                    }
                }

                typeBuilder.addField(fieldBuilder.build());
                typeBuilder.addMethod(buildGetter(fieldClass, field.name()));
                typeBuilder.addMethod(buildSetter(fieldClass, field.name()));
            }
        }

        // Add Relations
        if (entity.relations() != null) {
            for (Spec.Relation relation : entity.relations()) {
                ClassName targetClass = ClassName.get(entityPackage, relation.targetEntity());
                
                if (relation.type() == Spec.RelationType.MANY_TO_ONE) {
                    FieldSpec relField = FieldSpec.builder(targetClass, relation.name(), Modifier.PRIVATE)
                            .addAnnotation(ClassName.get("jakarta.persistence", "ManyToOne"))
                            .addAnnotation(AnnotationSpec.builder(ClassName.get("jakarta.persistence", "JoinColumn"))
                                    .addMember("name", "$S", toSnakeCase(relation.name()) + "_id")
                                    .build())
                            .build();
                    typeBuilder.addField(relField);
                    typeBuilder.addMethod(buildGetter(targetClass, relation.name()));
                    typeBuilder.addMethod(buildSetter(targetClass, relation.name()));
                } else if (relation.type() == Spec.RelationType.ONE_TO_MANY) {
                    TypeName listType = ParameterizedTypeName.get(ClassName.get(List.class), targetClass);
                    String mappedByVal = (relation.mappedBy() != null && !relation.mappedBy().isBlank()) 
                                            ? relation.mappedBy() 
                                            : toCamelCase(entity.name());

                    FieldSpec relField = FieldSpec.builder(listType, relation.name(), Modifier.PRIVATE)
                            .initializer("new $T<>()", ArrayList.class)
                            .addAnnotation(AnnotationSpec.builder(ClassName.get("jakarta.persistence", "OneToMany"))
                                    .addMember("mappedBy", "$S", mappedByVal)
                                    .build())
                            .addAnnotation(ClassName.get("com.fasterxml.jackson.annotation", "JsonIgnore"))
                            .build();
                    typeBuilder.addField(relField);
                    typeBuilder.addMethod(buildGetter(listType, relation.name()));
                    typeBuilder.addMethod(buildSetter(listType, relation.name()));
                } else if (relation.type() == Spec.RelationType.MANY_TO_MANY) {
                    TypeName listType = ParameterizedTypeName.get(ClassName.get(List.class), targetClass);
                    AnnotationSpec.Builder m2m = AnnotationSpec.builder(ClassName.get("jakarta.persistence", "ManyToMany"));
                    FieldSpec.Builder relField = FieldSpec.builder(listType, relation.name(), Modifier.PRIVATE)
                            .initializer("new $T<>()", ArrayList.class);

                    if (relation.mappedBy() != null && !relation.mappedBy().isBlank()) {
                        m2m.addMember("mappedBy", "$S", relation.mappedBy());
                        relField.addAnnotation(m2m.build());
                        relField.addAnnotation(ClassName.get("com.fasterxml.jackson.annotation", "JsonIgnore"));
                    } else {
                        relField.addAnnotation(m2m.build());
                        String joinTableName = toSnakeCase(entity.name()) + "_" + toSnakeCase(relation.name());
                        AnnotationSpec joinTable = AnnotationSpec.builder(ClassName.get("jakarta.persistence", "JoinTable"))
                            .addMember("name", "$S", joinTableName)
                            .addMember("joinColumns", "@$T(name=$S)", ClassName.get("jakarta.persistence", "JoinColumn"), toSnakeCase(entity.name()) + "_id")
                            .addMember("inverseJoinColumns", "@$T(name=$S)", ClassName.get("jakarta.persistence", "JoinColumn"), toSnakeCase(relation.targetEntity()) + "_id")
                            .build();
                        relField.addAnnotation(joinTable);
                    }
                    
                    typeBuilder.addField(relField.build());
                    typeBuilder.addMethod(buildGetter(listType, relation.name()));
                    typeBuilder.addMethod(buildSetter(listType, relation.name()));
                }
            }
        }

        JavaFile javaFile = JavaFile.builder(entityPackage, typeBuilder.build())
                .indent("    ")
                .build();

        return javaFile.toString();
    }

    private Class<?> getJavaType(Spec.FieldType type) {
        return switch (type) {
            case STRING -> String.class;
            case INTEGER -> Integer.class;
            case BOOLEAN -> Boolean.class;
            case DATE -> java.time.LocalDate.class;
            case DECIMAL -> java.math.BigDecimal.class;
        };
    }

    private MethodSpec buildGetter(java.lang.reflect.Type type, String name) {
        return MethodSpec.methodBuilder("get" + capitalize(name))
                .addModifiers(Modifier.PUBLIC)
                .returns(type)
                .addStatement("return this.$L", name)
                .build();
    }
    
    private MethodSpec buildGetter(TypeName type, String name) {
        return MethodSpec.methodBuilder("get" + capitalize(name))
                .addModifiers(Modifier.PUBLIC)
                .returns(type)
                .addStatement("return this.$L", name)
                .build();
    }

    private MethodSpec buildSetter(java.lang.reflect.Type type, String name) {
        return MethodSpec.methodBuilder("set" + capitalize(name))
                .addModifiers(Modifier.PUBLIC)
                .returns(void.class)
                .addParameter(type, name)
                .addStatement("this.$L = $L", name, name)
                .build();
    }
    
    private MethodSpec buildSetter(TypeName type, String name) {
        return MethodSpec.methodBuilder("set" + capitalize(name))
                .addModifiers(Modifier.PUBLIC)
                .returns(void.class)
                .addParameter(type, name)
                .addStatement("this.$L = $L", name, name)
                .build();
    }

    private String capitalize(String str) {
        return str.substring(0, 1).toUpperCase() + str.substring(1);
    }
    
    private String toSnakeCase(String str) {
        return str.replaceAll("([a-z])([A-Z]+)", "$1_$2").toLowerCase();
    }
    
    private String toCamelCase(String str) {
        return str.substring(0, 1).toLowerCase() + str.substring(1);
    }
}
