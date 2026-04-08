# Ключевые фрагменты кода платформы No-Code CRUD

> Этот файл содержит наиболее архитектурно значимые фрагменты кода платформы.
> Используй их для написания Глав 3 (Проектирование) и 4 (Реализация ПО) дипломной работы.
> Все фрагменты — реальный, работающий код проекта.

---

## 1. МЕТАМОДЕЛЬ — Spec.java (Ядро всей системы)

Это **центральная структура данных** всей платформы. Декларативная спецификация, из которой генерируются все артефакты. Реализована через Java Records — иммутабельные value-объекты.

**Путь:** `generator-core/src/main/java/com/nocode/platform/generator/spec/Spec.java`

```java
package com.nocode.platform.generator.spec;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;
import java.util.Map;

@JsonIgnoreProperties(ignoreUnknown = true)
public record Spec(
        int specVersion,
        Project project,
        List<Entity> entities,
        UiSpec uiSpec,
        List<ActionFlow> actionFlows
) {
    // Настройки проекта: координаты Maven, пакет, флаги генерации
    public record Project(
            String groupId,
            String artifactId,
            String name,
            String basePackage,
            String version,
            boolean authEnabled,
            boolean generateFrontend
    ) {}

    // Сущность предметной области: имя, таблица, поля, связи, роли доступа
    public record Entity(
            String name,
            String table,
            List<Field> fields,
            List<Relation> relations,
            String readRoles,
            String createRoles,
            String updateRoles,
            String deleteRoles
    ) {}

    // Типы данных, поддерживаемые генератором
    public enum FieldType {
        STRING, INTEGER, BOOLEAN, DATE, DECIMAL
    }

    // Поле сущности с валидационными ограничениями
    public record Field(
            String name,
            FieldType type,
            boolean required,
            Integer min,
            Integer max,
            String pattern
    ) {}

    // Типы связей между сущностями
    public enum RelationType {
        MANY_TO_ONE, ONE_TO_MANY, MANY_TO_MANY
    }

    // Связь между сущностями
    public record Relation(
            String name,
            String targetEntity,
            RelationType type,
            String mappedBy
    ) {}

    // Спецификация UI-компонентов (для визуального конструктора)
    public record UiSpec(List<Component> components) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Component(
            String id,
            String type,
            Map<String, Object> props,
            List<Component> children
    ) {}

    // Потоки бизнес-логики (ActionFlow)
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record ActionFlow(
            String id,
            String name,
            List<FlowNode> nodes,
            List<FlowEdge> edges
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record FlowNode(
            String id,
            String type,
            String action,
            Map<String, Object> config
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record FlowEdge(
            String id,
            String source,
            String target
    ) {}
}
```

**Почему важно для диплома:** Это «единый источник истины» (Single Source of Truth), из которого генерируются все артефакты: JPA-сущности, миграции БД, REST-контроллеры, фронтенд-формы. Соответствует принципам MDD (Model-Driven Development), описанным в Главе 1.

---

## 2. ВАЛИДАЦИЯ МЕТАМОДЕЛИ — SpecValidator.java

Серверная валидация спецификации перед генерацией. Проверяет корректность имён, типов, связей, предотвращает конфликты с зарезервированными именами Java/Spring.

**Путь:** `generator-core/src/main/java/com/nocode/platform/generator/spec/SpecValidator.java`

```java
public class SpecValidator {

    public void validate(Spec spec) {
        List<String> errors = new ArrayList<>();

        if (spec.specVersion() <= 0) errors.add("specVersion must be > 0");
        if (spec.project() == null) errors.add("project section is required");
        else {
            if (blank(spec.project().groupId())) errors.add("project.groupId is required");
            if (blank(spec.project().artifactId())) errors.add("project.artifactId is required");
            if (blank(spec.project().name())) errors.add("project.name is required");
            if (blank(spec.project().basePackage())) errors.add("project.basePackage is required");
        }

        if (spec.entities() == null) {
            errors.add("entities must be present (can be empty list)");
        } else {
            // Проверка на дубликаты имён сущностей
            List<String> entityNames = spec.entities().stream().map(Spec.Entity::name).toList();
            Set<String> seenNames = new HashSet<>();
            for (String name : entityNames) {
                if (name != null && !seenNames.add(name)) {
                    errors.add("Duplicate entity name: '" + name + "'");
                }
            }

            // Зарезервированные имена, конфликтующие с Spring Boot / JPA
            Set<String> reservedNames = Set.of(
                "Application", "Controller", "Service", "Repository",
                "Config", "Configuration", "Entity", "Model",
                "Filter", "Interceptor", "Handler", "Advice"
            );

            // Java reserved keywords (для валидации имён полей)
            Set<String> javaKeywords = Set.of(
                "abstract", "assert", "boolean", "break", "byte", "case", "catch",
                "class", "const", "continue", "default", "do", "double", "else",
                "enum", "extends", "final", "finally", "float", "for", "goto",
                "if", "implements", "import", "instanceof", "int", "interface", ...
            );

            for (int i = 0; i < spec.entities().size(); i++) {
                Spec.Entity entity = spec.entities().get(i);
                // Проверка формата имени сущности (только английские буквы/цифры)
                if (!entity.name().matches("^[a-zA-Z][a-zA-Z0-9]*$")) {
                    errors.add("entities[" + i + "].name must start with letter: " + entity.name());
                } else if (reservedNames.contains(entity.name())) {
                    errors.add("entities[" + i + "].name '" + entity.name() + "' is reserved");
                }

                // Проверка полей и их типов
                if (entity.fields() != null) {
                    for (int j = 0; j < entity.fields().size(); j++) {
                        Spec.Field field = entity.fields().get(j);
                        if (javaKeywords.contains(field.name())) {
                            errors.add("field name '" + field.name() + "' is a Java reserved keyword");
                        }
                    }
                }

                // Проверка связей: целевая сущность должна существовать
                if (entity.relations() != null) {
                    for (Spec.Relation rel : entity.relations()) {
                        if (!entityNames.contains(rel.targetEntity())) {
                            errors.add("targetEntity '" + rel.targetEntity() + "' does not exist");
                        }
                    }
                }
            }
        }

        if (!errors.isEmpty()) {
            throw new IllegalArgumentException(
                "Spec validation failed:\n- " + String.join("\n- ", errors)
            );
        }
    }
}
```

**Почему важно для диплома:** Демонстрирует серверную валидацию — защиту от генерации некорректного кода. Проверяет дубликаты, зарезервированные слова Java, целостность связей между сущностями.

---

## 3. ОРКЕСТРАТОР ГЕНЕРАЦИИ — ProjectGenerator.java

Главный класс, который из метамодели создаёт полноценный ZIP-архив с готовым Spring Boot + React приложением. Вызывает все подгенераторы.

**Путь:** `generator-core/src/main/java/com/nocode/platform/generator/engine/ProjectGenerator.java`

```java
public class ProjectGenerator {

    private final TemplateRenderer renderer = new TemplateRenderer();
    private final EntityGenerator entityGenerator = new EntityGenerator();
    private final RepositoryGenerator repoGenerator = new RepositoryGenerator();
    private final ControllerGenerator controllerGenerator = new ControllerGenerator();
    private final LiquibaseGenerator liquibaseGenerator = new LiquibaseGenerator();
    private final FrontendGenerator frontendGenerator = new FrontendGenerator();
    private final ServiceGenerator actionFlowServiceGenerator = new ServiceGenerator();
    private final ActionFlowControllerGenerator actionFlowControllerGenerator = new ActionFlowControllerGenerator();

    public byte[] generate(Spec spec) {
        String artifactId = spec.project().artifactId();
        String basePackage = spec.project().basePackage();
        String root = artifactId + "/";
        String pkgPath = basePackage.replace('.', '/');

        // Подготовка модели для FreeMarker-шаблонов
        Map<String, Object> model = new HashMap<>();
        model.put("groupId", spec.project().groupId());
        model.put("artifactId", artifactId);
        model.put("basePackage", basePackage);
        model.put("authEnabled", spec.project().authEnabled());

        // 1. Рендер инфраструктурных файлов из FreeMarker-шаблонов
        String pomXml = renderer.render("pom.ftl", model);
        String appJava = renderer.render("Application.java.ftl", model);
        String applicationYml = renderer.render("application.yml.ftl", model);

        // 2. Генерация Liquibase-миграций из метамодели
        String changelogYaml = liquibaseGenerator.generateChangelog(
            spec.entities(), spec.project().authEnabled()
        );

        try (ByteArrayOutputStream baos = new ByteArrayOutputStream();
             ZipOutputStream zos = new ZipOutputStream(baos)) {

            // Инфраструктурные файлы
            putText(zos, root + "backend/pom.xml", pomXml);
            putText(zos, root + "backend/src/main/resources/application.yml", applicationYml);
            putText(zos, root + "backend/src/main/resources/db/changelog/db.changelog-master.yaml", changelogYaml);
            putText(zos, root + "backend/src/main/java/" + pkgPath + "/Application.java", appJava);

            // 3. Генерация Spring Security (если включена аутентификация)
            if (spec.project().authEnabled()) {
                new SecurityGenerator().generate(zos, root + "backend/", pkgPath, basePackage);
            }

            // 4. Для каждой сущности: Entity + Repository + Controller (через JavaPoet)
            if (spec.entities() != null) {
                for (Spec.Entity entity : spec.entities()) {
                    String entityCode = entityGenerator.generate(entity, basePackage);
                    String repoCode = repoGenerator.generate(entity, basePackage);
                    String controllerCode = controllerGenerator.generate(entity, basePackage, spec.project().authEnabled());

                    putText(zos, root + "backend/.../domain/" + entity.name() + ".java", entityCode);
                    putText(zos, root + "backend/.../repository/" + entity.name() + "Repository.java", repoCode);
                    putText(zos, root + "backend/.../controller/" + entity.name() + "Controller.java", controllerCode);
                }
            }

            // 5. Генерация ActionFlow-сервисов и контроллеров
            if (spec.actionFlows() != null && !spec.actionFlows().isEmpty()) {
                putText(zos, "...ActionFlowService.java", actionFlowServiceGenerator.generate(spec, basePackage));
                putText(zos, "...ActionFlowController.java", actionFlowControllerGenerator.generate(spec, basePackage));
            }

            // 6. Генерация React-фронтенда (если включена)
            if (spec.project().generateFrontend()) {
                frontendGenerator.generate(zos, root + "frontend/", spec);
            }

            zos.finish();
            return baos.toByteArray();
        }
    }
}
```

**Почему важно для диплома:** Это сердце конвейера генерации. Показывает полный цикл: метамодель → доменные классы → репозитории → контроллеры → миграции → фронтенд → ZIP-архив.

---

## 4. ГЕНЕРАЦИЯ JPA-СУЩНОСТЕЙ — EntityGenerator.java (JavaPoet)

Генерирует Java-классы JPA Entity из метамодели с аннотациями Jakarta Persistence и Jakarta Validation. Использует библиотеку JavaPoet для программного создания Java-кода.

**Путь:** `generator-core/src/main/java/com/nocode/platform/generator/engine/poet/EntityGenerator.java`

```java
public class EntityGenerator {

    public String generate(Spec.Entity entity, String basePackage) {
        String entityPackage = basePackage + ".domain";

        TypeSpec.Builder typeBuilder = TypeSpec.classBuilder(entity.name())
                .addModifiers(Modifier.PUBLIC)
                .addAnnotation(ClassName.get("jakarta.persistence", "Entity"))
                .addAnnotation(AnnotationSpec.builder(ClassName.get("jakarta.persistence", "Table"))
                        .addMember("name", "$S", entity.table())
                        .build());

        // Первичный ключ: @Id + @GeneratedValue(strategy = IDENTITY)
        FieldSpec idField = FieldSpec.builder(Long.class, "id", Modifier.PRIVATE)
                .addAnnotation(ClassName.get("jakarta.persistence", "Id"))
                .addAnnotation(AnnotationSpec.builder(ClassName.get("jakarta.persistence", "GeneratedValue"))
                        .addMember("strategy", "$T.IDENTITY",
                            ClassName.get("jakarta.persistence", "GenerationType"))
                        .build())
                .build();
        typeBuilder.addField(idField);

        // Генерация полей из метамодели с валидационными аннотациями
        for (Spec.Field field : entity.fields()) {
            Class<?> fieldClass = getJavaType(field.type());
            FieldSpec.Builder fieldBuilder = FieldSpec.builder(fieldClass, field.name(), Modifier.PRIVATE);

            // @Column(name = "snake_case_name", nullable = ...)
            fieldBuilder.addAnnotation(AnnotationSpec.builder(ClassName.get("jakarta.persistence", "Column"))
                    .addMember("name", "$S", toSnakeCase(field.name()))
                    .addMember("nullable", "$L", !field.required())
                    .build());

            // Валидации Jakarta Validation
            if (field.required()) {
                fieldBuilder.addAnnotation(ClassName.get("jakarta.validation.constraints", "NotNull"));
            }
            if (fieldClass == String.class && (field.min() != null || field.max() != null)) {
                AnnotationSpec.Builder sizeBuilder = AnnotationSpec.builder(
                    ClassName.get("jakarta.validation.constraints", "Size"));
                if (field.min() != null) sizeBuilder.addMember("min", "$L", field.min());
                if (field.max() != null) sizeBuilder.addMember("max", "$L", field.max());
                fieldBuilder.addAnnotation(sizeBuilder.build());
            }
            if (field.pattern() != null && !field.pattern().isBlank()) {
                fieldBuilder.addAnnotation(AnnotationSpec.builder(
                    ClassName.get("jakarta.validation.constraints", "Pattern"))
                        .addMember("regexp", "$S", field.pattern())
                        .build());
            }

            typeBuilder.addField(fieldBuilder.build());
            typeBuilder.addMethod(buildGetter(fieldClass, field.name()));
            typeBuilder.addMethod(buildSetter(fieldClass, field.name()));
        }

        // Генерация связей (@ManyToOne, @OneToMany, @ManyToMany)
        for (Spec.Relation relation : entity.relations()) {
            ClassName targetClass = ClassName.get(entityPackage, relation.targetEntity());

            if (relation.type() == Spec.RelationType.MANY_TO_ONE) {
                // @ManyToOne + @JoinColumn(name = "relation_name_id")
                FieldSpec relField = FieldSpec.builder(targetClass, relation.name(), Modifier.PRIVATE)
                        .addAnnotation(ClassName.get("jakarta.persistence", "ManyToOne"))
                        .addAnnotation(AnnotationSpec.builder(ClassName.get("jakarta.persistence", "JoinColumn"))
                                .addMember("name", "$S", toSnakeCase(relation.name()) + "_id")
                                .build())
                        .build();
                typeBuilder.addField(relField);
            } else if (relation.type() == Spec.RelationType.ONE_TO_MANY) {
                // @OneToMany(mappedBy = "...") + @JsonIgnore
                TypeName listType = ParameterizedTypeName.get(ClassName.get(List.class), targetClass);
                // ...
            } else if (relation.type() == Spec.RelationType.MANY_TO_MANY) {
                // @ManyToMany + @JoinTable с промежуточной таблицей
                // ...
            }
        }

        return JavaFile.builder(entityPackage, typeBuilder.build()).indent("    ").build().toString();
    }

    // Маппинг типов метамодели → Java
    private Class<?> getJavaType(Spec.FieldType type) {
        return switch (type) {
            case STRING  -> String.class;
            case INTEGER -> Integer.class;
            case BOOLEAN -> Boolean.class;
            case DATE    -> java.time.LocalDate.class;
            case DECIMAL -> java.math.BigDecimal.class;
        };
    }
}
```

**Почему важно для диплома:** Демонстрирует ключевой алгоритм — трансформацию декларативного описания сущности в исполняемый Java-код. Используется JavaPoet — библиотека для программной генерации синтаксически корректного Java.

---

## 5. ГЕНЕРАЦИЯ LIQUIBASE-МИГРАЦИЙ — LiquibaseGenerator.java

Генерирует YAML changesets для создания таблиц, столбцов, внешних ключей и промежуточных таблиц (ManyToMany) из метамодели.

**Путь:** `generator-core/src/main/java/com/nocode/platform/generator/engine/LiquibaseGenerator.java`

```java
public class LiquibaseGenerator {

    public String generateChangelog(List<Spec.Entity> entities, boolean authEnabled) {
        StringBuilder sb = new StringBuilder();
        sb.append("databaseChangeLog:\n");
        int authorId = 1;

        // Если включена аутентификация — создать таблицу users с admin-записью
        if (authEnabled) {
            sb.append("  - changeSet:\n");
            sb.append("      id: ").append(authorId++).append("\n");
            sb.append("      author: nocode-generator\n");
            sb.append("      changes:\n");
            sb.append("        - createTable:\n");
            sb.append("            tableName: users\n");
            sb.append("            columns:\n");
            // ... id, username, password (BCrypt hash), role
        }

        // Для каждой сущности — changeSet с createTable
        for (Spec.Entity entity : entities) {
            sb.append("  - changeSet:\n");
            sb.append("      id: ").append(authorId++).append("\n");
            sb.append("      author: nocode-generator\n");
            sb.append("      changes:\n");
            sb.append("        - createTable:\n");
            sb.append("            tableName: ").append(entity.table()).append("\n");
            sb.append("            columns:\n");

            // Первичный ключ (BIGINT AUTOINCREMENT)
            sb.append("              - column:\n");
            sb.append("                  name: id\n");
            sb.append("                  type: BIGINT\n");
            sb.append("                  autoIncrement: true\n");
            sb.append("                  constraints:\n");
            sb.append("                    primaryKey: true\n");

            // Остальные поля из метамодели
            for (Spec.Field field : entity.fields()) {
                sb.append("              - column:\n");
                sb.append("                  name: ").append(toSnakeCase(field.name())).append("\n");
                sb.append("                  type: ").append(getDbDataType(field.type())).append("\n");
                if (field.required()) {
                    sb.append("                  constraints:\n");
                    sb.append("                    nullable: false\n");
                }
            }

            // ManyToOne: добавить столбец foreign key
            for (Spec.Relation rel : entity.relations()) {
                if (rel.type() == Spec.RelationType.MANY_TO_ONE) {
                    sb.append("              - column:\n");
                    sb.append("                  name: ").append(toSnakeCase(rel.name())).append("_id\n");
                    sb.append("                  type: BIGINT\n");
                }
            }
        }

        // Отдельные changeSets для Foreign Key Constraints
        // Отдельные changeSets для ManyToMany Join Tables

        return sb.toString();
    }

    // Маппинг типов метамодели → SQL
    private String getDbDataType(Spec.FieldType type) {
        return switch (type) {
            case STRING  -> "VARCHAR(255)";
            case INTEGER -> "INT";
            case BOOLEAN -> "BOOLEAN";
            case DATE    -> "DATE";
            case DECIMAL -> "DECIMAL(19, 4)";
        };
    }
}
```

**Почему важно для диплома:** Показывает автогенерацию миграций БД из декларативной модели. Миграции — артефакт, который версионируется, экспортируется и воспроизводится в различных средах (ключевое требование из Главы 1).

---

## 6. ГЕНЕРАЦИЯ REST-КОНТРОЛЛЕРОВ — ControllerGenerator.java

Генерирует Spring MVC контроллеры с полным CRUD (GET, POST, PUT, DELETE) и условной RBAC-авторизацией (@PreAuthorize).

**Путь:** `generator-core/src/main/java/com/nocode/platform/generator/engine/poet/ControllerGenerator.java`

```java
public class ControllerGenerator {

    public String generate(Spec.Entity entity, String basePackage, boolean authEnabled) {
        ClassName entityClass = ClassName.get(basePackage + ".domain", entity.name());
        ClassName repoClass = ClassName.get(basePackage + ".repository", entity.name() + "Repository");

        // GET /api/{table} — получить все записи
        MethodSpec.Builder getAllMethodBuilder = MethodSpec.methodBuilder("getAll")
                .addAnnotation(ClassName.get("org.springframework.web.bind.annotation", "GetMapping"))
                .returns(ParameterizedTypeName.get(ClassName.get(List.class), entityClass))
                .addStatement("return repository.findAll()");
        if (authEnabled) addPreAuthorize(getAllMethodBuilder, entity.readRoles());

        // POST /api/{table} — создать запись с @Valid валидацией
        MethodSpec.Builder createMethodBuilder = MethodSpec.methodBuilder("create")
                .addAnnotation(ClassName.get("org.springframework.web.bind.annotation", "PostMapping"))
                .addParameter(ParameterSpec.builder(entityClass, "entity")
                        .addAnnotation(ClassName.get("org.springframework.web.bind.annotation", "RequestBody"))
                        .addAnnotation(ClassName.get("jakarta.validation", "Valid"))
                        .build())
                .returns(entityClass)
                .addStatement("return repository.save(entity)");
        if (authEnabled) addPreAuthorize(createMethodBuilder, entity.createRoles());

        // PUT /api/{table}/{id} — обновить с проверкой существования
        // DELETE /api/{table}/{id} — удалить запись

        // Сборка класса контроллера:
        // @RestController + @RequestMapping("/api/" + entity.table())
        TypeSpec typeSpec = TypeSpec.classBuilder(entity.name() + "Controller")
                .addAnnotation(ClassName.get("...", "RestController"))
                .addAnnotation(AnnotationSpec.builder(ClassName.get("...", "RequestMapping"))
                        .addMember("value", "$S", "/api/" + entity.table())
                        .build())
                .addField(repoField)
                .addMethod(constructor)
                .addMethod(getAllMethod)
                .addMethod(getByIdMethod)
                .addMethod(createMethod)
                .addMethod(updateMethod)
                .addMethod(deleteMethod)
                .build();

        return JavaFile.builder(basePackage + ".controller", typeSpec).build().toString();
    }

    // Условное добавление @PreAuthorize для RBAC
    private void addPreAuthorize(MethodSpec.Builder builder, String rolesStr) {
        if (rolesStr == null || rolesStr.trim().isEmpty()) return;
        String[] roles = rolesStr.split(",");
        StringBuilder expr = new StringBuilder("hasAnyAuthority(");
        for (int i = 0; i < roles.length; i++) {
            expr.append("'").append(roles[i].trim()).append("'");
            if (i < roles.length - 1) expr.append(", ");
        }
        expr.append(")");
        builder.addAnnotation(AnnotationSpec.builder(ClassName.get("...prepost", "PreAuthorize"))
                .addMember("value", "$S", expr.toString())
                .build());
    }
}
```

**Почему важно для диплома:** Показывает, как из метамодели автоматически создаётся REST API с ролевой моделью доступа (RBAC), что отвечает требованиям безопасности из Главы 1.

---

## 7. ФАСАД ГЕНЕРАЦИИ — GeneratorFacade.java (точка интеграции)

Объединяет парсинг JSON из БД, валидацию спецификации и запуск генерации. Является Spring-сервисом, который вызывается из контроллера.

**Путь:** `platform-web/src/main/java/com/nocode/platform/generator/GeneratorFacade.java`

```java
@Service
public class GeneratorFacade {

    private final ProjectGenerator projectGenerator = new ProjectGenerator();
    private final SpecValidator specValidator = new SpecValidator();
    private final ObjectMapper mapper = new ObjectMapper();

    public byte[] generateReal(ProjectEntity p) {
        try {
            Spec spec;
            if (p.getSpecText() != null && !p.getSpecText().isBlank()) {
               // Десериализация JSON-метамодели из базы данных
               spec = mapper.readValue(p.getSpecText(), Spec.class);
            } else {
               // Создание минимальной спецификации по параметрам проекта
               Spec.Project sp = new Spec.Project(
                   p.getGroupId(), p.getArtifactId(), p.getName(),
                   p.getBasePackage(), p.getVersion(), false, p.isGenerateFrontend()
               );
               spec = new Spec(1, sp, new ArrayList<>(), null, new ArrayList<>());
            }
            // Валидация → Генерация → ZIP-архив
            specValidator.validate(spec);
            return projectGenerator.generate(spec);
        } catch (IllegalArgumentException e) {
            throw e; // Ошибки валидации
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate project", e);
        }
    }
}
```

**Почему важно:** Показывает паттерн Фасад — единая точка входа, объединяющая парсинг, валидацию и генерацию.

---

## 8. КОМПИЛЯТОР ВИЗУАЛЬНОЙ МОДЕЛИ → СПЕЦИФИКАЦИЯ — compiler.ts (Frontend)

Преобразует визуальный граф React Flow (узлы и рёбра) в JSON-спецификацию для backend-генератора. Ключевое звено в конвейере No-Code.

**Путь:** `platform-frontend/src/lib/compiler.ts`

```typescript
import type { AppNode, EntityFieldType } from '../components/EntityNode';
import type { Edge } from '@xyflow/react';
import type { ProjectFormData } from '../components/ProjectModal';

// Маппинг типов UI → типы генератора
const mapType = (type: EntityFieldType): string => {
    switch (type) {
        case 'String':  case 'UUID':           return 'STRING';
        case 'Integer': case 'Long':           return 'INTEGER';
        case 'Boolean':                        return 'BOOLEAN';
        case 'LocalDate': case 'OffsetDateTime': return 'DATE';
        case 'Double':  case 'BigDecimal':     return 'DECIMAL';
        default:                               return 'STRING';
    }
};

export const compileToSpec = (
    project: ProjectFormData, nodes: AppNode[], edges: Edge[]
): string => {

    const spec: BackendSpec = {
        specVersion: 1,
        project: {
            groupId: project.groupId || 'com.example',
            artifactId: project.artifactId || 'demo',
            name: project.name || 'Demo',
            basePackage: project.basePackage || 'com.example.demo',
            version: project.version || '0.0.1-SNAPSHOT',
            authEnabled: project.authEnabled || false,
            generateFrontend: project.generateFrontend || false
        },
        // Каждый узел React Flow → сущность в спецификации
        entities: nodes.map(node => {
            // Рёбра (визуальные связи) → relations в спецификации
            const relations = edges
                .filter(edge => edge.source === node.id)
                .map(edge => {
                    const targetNode = nodes.find(n => n.id === edge.target);
                    if (!targetNode) return null;
                    return {
                        name: targetNode.data.name.toLowerCase() + 's',
                        targetEntity: targetNode.data.name,
                        type: 'ONE_TO_MANY',
                        mappedBy: node.data.name.toLowerCase()
                    };
                }).filter(Boolean);

            return {
                name: node.data.name,
                table: node.data.name.toLowerCase() + 's',
                fields: node.data.fields.map(f => ({
                    name: f.name,
                    type: mapType(f.type),
                    required: f.required
                })),
                relations,
                readRoles: node.data.readRoles,
                createRoles: node.data.createRoles,
                updateRoles: node.data.updateRoles,
                deleteRoles: node.data.deleteRoles
            };
        })
    };

    return JSON.stringify(spec, null, 2);
};
```

**Почему важно для диплома:** Это «мост» между визуальным No-Code интерфейсом и backend-генератором. Пользователь рисует граф → compiler.ts преобразует его в формализованную спецификацию → backend генерирует рабочий код.

---

## 9. СУЩНОСТЬ ПРОЕКТА — ProjectEntity.java (JPA + Optimistic Locking)

Хранит проект платформы в PostgreSQL. Метамодель хранится в поле `specText` (тип TEXT/JSONB). Использует @Version для оптимистичной блокировки.

**Путь:** `platform-web/src/main/java/com/nocode/platform/project/ProjectEntity.java`

```java
@Entity
@Table(name = "projects")
@Getter @Setter
public class ProjectEntity {

    @Id
    private UUID id;

    @Column(name = "owner_username", nullable = false, length = 100)
    private String ownerUsername;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(name = "group_id", nullable = false, length = 200)
    private String groupId;

    @Column(name = "artifact_id", nullable = false, length = 200)
    private String artifactId;

    @Column(name = "base_package", nullable = false, length = 300)
    private String basePackage;

    // Метамодель хранится как JSON-текст
    @Column(name = "spec_text", nullable = false, columnDefinition = "text")
    private String specText;

    @Column(name = "auth_enabled", nullable = false)
    private boolean authEnabled;

    @Column(name = "generate_frontend", nullable = false)
    private boolean generateFrontend;

    @Column(name = "deployment_status", length = 50)
    private String deploymentStatus;

    @Column(name = "deployment_url", length = 300)
    private String deploymentUrl;

    // Оптимистичная блокировка (защита от race condition при параллельном редактировании)
    @Version
    @Column(name = "entity_version")
    private Long entityVersion;
}
```

---

## 10. LIQUIBASE-МИГРАЦИИ САМОЙ ПЛАТФОРМЫ — db.changelog-master.yaml

Реальный changelog платформы — 6 changeSets, демонстрирующих эволюцию схемы (от первой таблицы projects до оптимистичной блокировки).

**Путь:** `platform-web/src/main/resources/db/changelog/db.changelog-master.yaml`

```yaml
databaseChangeLog:
  # ChangeSet 1: Базовая таблица проектов
  - changeSet:
      id: 1
      author: nocode
      changes:
        - createTable:
            tableName: projects
            columns:
              - column: { name: id, type: uuid, constraints: { primaryKey: true } }
              - column: { name: name, type: varchar(200), constraints: { nullable: false } }
              - column: { name: group_id, type: varchar(200) }
              - column: { name: artifact_id, type: varchar(200) }
              - column: { name: spec_text, type: text }       # ← Метамодель (JSON)
              - column: { name: created_at, type: timestamptz, defaultValueComputed: now() }
              - column: { name: updated_at, type: timestamptz, defaultValueComputed: now() }
        - createIndex:
            tableName: projects
            indexName: idx_projects_artifact
            columns: [{ column: { name: artifact_id } }]

  # ChangeSet 2: Флаги генерации
  - changeSet:
      id: 2
      changes:
        - addColumn:
            tableName: projects
            columns:
              - column: { name: auth_enabled, type: boolean, defaultValueBoolean: false }
              - column: { name: generate_frontend, type: boolean, defaultValueBoolean: false }

  # ChangeSet 3: Статус деплоя
  - changeSet:
      id: 3
      changes:
        - addColumn:
            tableName: projects
            columns:
              - column: { name: deployment_status, type: varchar(50) }
              - column: { name: deployment_url, type: varchar(300) }

  # ChangeSet 4: Таблица пользователей платформы (аутентификация)
  - changeSet:
      id: 4
      changes:
        - createTable:
            tableName: platform_users
            columns:
              - column: { name: id, type: uuid, constraints: { primaryKey: true } }
              - column: { name: username, type: varchar(100), constraints: { unique: true } }
              - column: { name: password, type: varchar(255) }
              - column: { name: role, type: varchar(50), defaultValue: 'USER' }

  # ChangeSet 5: Привязка проектов к пользователю
  - changeSet:
      id: 5
      changes:
        - addColumn:
            tableName: projects
            columns:
              - column: { name: owner_username, type: varchar(100), defaultValue: 'admin' }
        - createIndex:
            tableName: projects
            indexName: idx_projects_owner
            columns: [{ column: { name: owner_username } }]

  # ChangeSet 6: Оптимистичная блокировка (JPA @Version)
  - changeSet:
      id: 6
      comment: "Add version column for JPA optimistic locking (Bug #7 fix)"
      changes:
        - addColumn:
            tableName: projects
            columns:
              - column: { name: entity_version, type: bigint, defaultValueNumeric: 0 }
```

**Почему важно для диплома:** Реальный пример последовательных миграций. Показывает, как схема БД эволюционирует вместе с проектом: от базовой таблицы до аутентификации и оптимистичной блокировки. Каждый changeSet — версионируемый артефакт.

---

## 11. ВИЗУАЛЬНЫЙ РЕДАКТОР — ModelerPage.tsx (Ключевая страница)

Основная страница платформы — визуальный граф-редактор на React Flow. Пользователь добавляет сущности (узлы), поля и связи (рёбра), затем сохраняет и генерирует код.

**Ключевые фрагменты из** `platform-frontend/src/pages/ModelerPage.tsx`:

```tsx
// Инициализация React Flow с кастомным типом узлов
const nodeTypes = { entity: EntityNode };

const [nodes, setNodes, onNodesChange] = useNodesState<AppNode>([]);
const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

// Добавление новой сущности на холст
const addNewEntity = () => {
    const newNode: AppNode = {
        id: generateId(),
        type: 'entity',
        position: { x: Math.random() * 200 + 100, y: Math.random() * 200 + 100 },
        data: {
            name: 'NewEntity',
            fields: [{ id: generateId(), name: 'id', type: 'UUID', required: true }]
        }
    };
    setNodes((nds) => nds.concat(newNode));
};

// Сохранение модели: компиляция графа → JSON-спецификация → PUT на сервер
const handleSave = async () => {
    // Удаляем функции-колбэки из узлов (они не сериализуемы)
    const serializableNodes = nodes.map(n => {
        const { onNameChange, onAddField, onRemoveField, onFieldChange, onRolesChange, ...safeData } = n.data;
        return { ...n, data: safeData };
    });

    // Компиляция визуальной модели в backend-спецификацию
    const rawSpecText = compileToSpec(project, nodes, edges);
    const newBackendSpec = JSON.parse(rawSpecText);

    // Формируем обёртку: спецификация + данные графа для восстановления визуализации
    const wrapper = {
        ...oldSpecObj,
        ...newBackendSpec,
        _flow: { nodes: serializableNodes, edges }  // ← визуальное состояние для будущей загрузки
    };

    await apiClient.put(`/projects/${project.id}`, { ...project, specText: JSON.stringify(wrapper) });
};

// Рендер React Flow
<ReactFlow
    nodes={nodesWithCallbacks}
    edges={edges}
    onNodesChange={onNodesChange}
    onEdgesChange={onEdgesChange}
    onConnect={onConnect}
    nodeTypes={nodeTypes}
    colorMode="dark"
    fitView
>
    <Background color="#52525b" gap={16} size={1} />
    <Controls />
</ReactFlow>
```

**Почему важно:** Демонстрирует полный цикл No-Code взаимодействия: визуальное моделирование → компиляция → сохранение → генерация рабочего кода.

---

## 12. УЗЕЛ СУЩНОСТИ — EntityNode.tsx (Кастомный компонент React Flow)

Визуальное представление одной сущности в графовом редакторе. Поддерживает inline-редактирование имени, добавление/удаление полей, выбор типов данных и настройку RBAC-ролей.

**Ключевые фрагменты из** `platform-frontend/src/components/EntityNode.tsx`:

```tsx
// Типы данных, поддерживаемые визуальным редактором
export type EntityFieldType = 'String' | 'Integer' | 'Long' | 'Boolean' |
    'LocalDate' | 'OffsetDateTime' | 'UUID' | 'Double' | 'BigDecimal';

// Структура данных узла сущности
export type EntityNodeData = {
    name: string;
    fields: EntityField[];
    readRoles?: string;     // RBAC-настройки
    createRoles?: string;
    updateRoles?: string;
    deleteRoles?: string;
    // Колбэки для редактирования
    onNameChange?: (id: string, newName: string) => void;
    onAddField?: (id: string) => void;
    onRemoveField?: (nodeId: string, fieldId: string) => void;
    onFieldChange?: (nodeId: string, fieldId: string, updates: Partial<EntityField>) => void;
};

export default function EntityNode({ id, data }: NodeProps<AppNode>) {
    return (
        <div className="bg-zinc-950/80 backdrop-blur-md border rounded-xl shadow-xl w-72">
            {/* Handle-коннекторы для связей между сущностями */}
            <Handle type="target" position={Position.Left} />
            <Handle type="source" position={Position.Right} />

            {/* Заголовок: имя сущности (inline-редактирование) */}
            <div className="p-3 rounded-t-xl border-b">
                <h3 onClick={() => setIsEditingName(true)}>{data.name}</h3>
            </div>

            {/* Список полей: имя + тип (селектор) + кнопка удаления */}
            {data.fields.map((field) => (
                <div key={field.id} className="flex items-center">
                    <input value={field.name}
                           onChange={(e) => data.onFieldChange?.(id, field.id, { name: e.target.value })} />
                    <select value={field.type}
                            onChange={(e) => data.onFieldChange?.(id, field.id, { type: e.target.value })}>
                        <option value="String">String</option>
                        <option value="Integer">Integer</option>
                        {/* ... другие типы */}
                    </select>
                </div>
            ))}
            <button onClick={() => data.onAddField?.(id)}>Добавить поле</button>

            {/* Раздел RBAC: настройка ролей для CRUD-операций */}
            <div className="p-2 border-t">
                <label>Чтение (Роли)</label>
                <input value={data.readRoles || ''}
                       onChange={e => data.onRolesChange?.(id, { readRoles: e.target.value })}
                       placeholder="ROLE_USER, ROLE_ADMIN" />
                {/* ... createRoles, updateRoles, deleteRoles */}
            </div>
        </div>
    );
}
```

**Почему важно:** Узел сущности — основной элемент взаимодействия пользователя с платформой. Показывает архитектуру No-Code: вместо написания кода пользователь визуально задаёт имена, типы полей и права доступа.
