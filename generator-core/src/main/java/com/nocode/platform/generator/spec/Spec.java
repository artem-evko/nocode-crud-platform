package com.nocode.platform.generator.spec;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;
import java.util.Map;

/**
 * Корневая модель спецификации проекта (immutable record).
 *
 * <p>Описывает полную структуру проекта: метаданные ({@link Project}),
 * сущности ({@link Entity}) с полями и связями, UI-спецификацию
 * ({@link UiSpec}) и потоки бизнес-логики ({@link ActionFlow}).</p>
 *
 * <p>Спецификация создаётся визуальным редактором на фронтенде
 * и передаётся в движок генерации кода.</p>
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record Spec(
        int specVersion,
        Project project,
        List<Entity> entities,
        UiSpec uiSpec,
        List<ActionFlow> actionFlows
) {
    /** Поток бизнес-логики — граф из узлов и рёбер. */
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record ActionFlow(
            String id,
            String name,
            List<FlowNode> nodes,
            List<FlowEdge> edges
    ) {}

    /** Узел графа бизнес-логики (триггер, действие с БД, уведомление и т.д.). */
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record FlowNode(
            String id,
            String type,
            String action,
            Map<String, Object> config
    ) {}

    /** Ребро графа — связь между двумя узлами. */
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record FlowEdge(
            String id,
            String source,
            String target
    ) {}

    /** Спецификация пользовательского интерфейса. */
    public record UiSpec(List<Component> components) {}

    /** UI-компонент (кнопка, таблица, форма и т.д.). */
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Component(
            String id,
            String type,
            Map<String, Object> props,
            List<Component> children
    ) {}

    /** Метаданные проекта (Maven-координаты, настройки генерации). */
    public record Project(
            String groupId,
            String artifactId,
            String name,
            String basePackage,
            String version,
            boolean authEnabled,
            boolean generateFrontend
    ) {}

    /** Сущность (модель данных) с полями и связями. */
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

    /** Поддерживаемые типы полей сущности. */
    public enum FieldType {
        STRING, INTEGER, BOOLEAN, DATE, DECIMAL
    }

    /** Поле сущности с типом, валидацией и ограничениями. */
    public record Field(
            String name,
            FieldType type,
            boolean required,
            Integer min,
            Integer max,
            String pattern
    ) {}

    /** Поддерживаемые типы связей между сущностями. */
    public enum RelationType {
        MANY_TO_ONE, ONE_TO_MANY, MANY_TO_MANY
    }

    /** Связь между двумя сущностями. */
    public record Relation(
            String name,
            String targetEntity,
            RelationType type,
            String mappedBy
    ) {}
}