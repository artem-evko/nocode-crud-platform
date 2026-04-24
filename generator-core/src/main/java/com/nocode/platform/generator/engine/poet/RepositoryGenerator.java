package com.nocode.platform.generator.engine.poet;

import com.nocode.platform.generator.spec.Spec;
import com.squareup.javapoet.ClassName;
import com.squareup.javapoet.JavaFile;
import com.squareup.javapoet.ParameterizedTypeName;
import com.squareup.javapoet.TypeSpec;

import javax.lang.model.element.Modifier;

/**
 * Генератор JPA-репозиториев через библиотеку JavaPoet.
 *
 * <p>Создаёт интерфейс, наследующий {@code JpaRepository},
 * для каждой сущности проекта.</p>
 */
public class RepositoryGenerator {

    /**
     * Генерация исходного кода интерфейса репозитория.
     *
     * @param entity      описание сущности
     * @param basePackage базовый Java-пакет
     * @return строка с исходным кодом Java-интерфейса
     */
    public String generate(Spec.Entity entity, String basePackage) {
        String repoPackage = basePackage + ".repository";
        String entityPackage = basePackage + ".domain";

        ClassName entityClass = ClassName.get(entityPackage, entity.name());
        ClassName jpaRepositoryClass = ClassName.get("org.springframework.data.jpa.repository", "JpaRepository");

        ParameterizedTypeName superInterface = ParameterizedTypeName.get(jpaRepositoryClass, entityClass, ClassName.get(Long.class));

        TypeSpec typeSpec = TypeSpec.interfaceBuilder(entity.name() + "Repository")
                .addModifiers(Modifier.PUBLIC)
                .addSuperinterface(superInterface)
                .addAnnotation(ClassName.get("org.springframework.stereotype", "Repository"))
                .build();

        JavaFile javaFile = JavaFile.builder(repoPackage, typeSpec)
                .indent("    ")
                .build();

        return javaFile.toString();
    }
}
