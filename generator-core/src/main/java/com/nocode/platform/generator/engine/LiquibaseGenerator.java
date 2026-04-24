package com.nocode.platform.generator.engine;

import com.nocode.platform.generator.spec.Spec;

import java.util.List;

/**
 * Генератор Liquibase changelog (YAML) для миграции схемы БД.
 *
 * <p>Создаёт changeSet-ы для каждой сущности: таблицы с колонками,
 * внешние ключи для ManyToOne-связей и join-таблицы для ManyToMany.
 * При включённой аутентификации добавляет таблицу users
 * с предзаполненным администратором.</p>
 */
public class LiquibaseGenerator {

    /**
     * Генерация YAML-содержимого Liquibase changelog.
     *
     * @param entities    список сущностей проекта
     * @param authEnabled включена ли аутентификация
     * @return строка с YAML-содержимым changelog
     */
    public String generateChangelog(List<Spec.Entity> entities, boolean authEnabled) {
        StringBuilder sb = new StringBuilder();
        sb.append("databaseChangeLog:\n");
        int authorId = 1;

        if (authEnabled) {
            sb.append("  - changeSet:\n");
            sb.append("      id: ").append(authorId++).append("\n");
            sb.append("      author: nocode-generator\n");
            sb.append("      changes:\n");
            sb.append("        - createTable:\n");
            sb.append("            tableName: users\n");
            sb.append("            columns:\n");
            sb.append("              - column:\n");
            sb.append("                  name: id\n");
            sb.append("                  type: BIGINT\n");
            sb.append("                  autoIncrement: true\n");
            sb.append("                  constraints:\n");
            sb.append("                    primaryKey: true\n");
            sb.append("                    nullable: false\n");
            sb.append("              - column:\n");
            sb.append("                  name: username\n");
            sb.append("                  type: VARCHAR(255)\n");
            sb.append("                  constraints:\n");
            sb.append("                    nullable: false\n");
            sb.append("                    unique: true\n");
            sb.append("              - column:\n");
            sb.append("                  name: password\n");
            sb.append("                  type: VARCHAR(255)\n");
            sb.append("                  constraints:\n");
            sb.append("                    nullable: false\n");
            sb.append("              - column:\n");
            sb.append("                  name: role\n");
            sb.append("                  type: VARCHAR(255)\n");
            sb.append("                  constraints:\n");
            sb.append("                    nullable: false\n");
            sb.append("        - insert:\n");
            sb.append("            tableName: users\n");
            sb.append("            columns:\n");
            sb.append("              - column:\n");
            sb.append("                  name: username\n");
            sb.append("                  value: admin\n");
            sb.append("              - column:\n");
            sb.append("                  name: password\n");
            sb.append("                  value: $2a$10$wT0l0jL/qF1pT3.a6h/7XOH6.p/B8qA15sV.0p/o9aP/W3YdG/P6.\n");
            sb.append("              - column:\n");
            sb.append("                  name: role\n");
            sb.append("                  value: ADMIN\n");
        }

        if (entities != null) {
            for (Spec.Entity entity : entities) {
            sb.append("  - changeSet:\n");
            sb.append("      id: ").append(authorId++).append("\n");
            sb.append("      author: nocode-generator\n");
            sb.append("      changes:\n");
            sb.append("        - createTable:\n");
            sb.append("            tableName: ").append(entity.table()).append("\n");
            sb.append("            columns:\n");

            sb.append("              - column:\n");
            sb.append("                  name: id\n");
            sb.append("                  type: BIGINT\n");
            sb.append("                  autoIncrement: true\n");
            sb.append("                  constraints:\n");
            sb.append("                    primaryKey: true\n");
            sb.append("                    nullable: false\n");

            if (entity.fields() != null) {
                for (Spec.Field field : entity.fields()) {
                    if ("id".equalsIgnoreCase(field.name())) {
                        continue;
                    }
                    sb.append("              - column:\n");
                    sb.append("                  name: ").append(toSnakeCase(field.name())).append("\n");
                    sb.append("                  type: ").append(getDbDataType(field.type())).append("\n");
                    
                    if (field.required()) {
                        sb.append("                  constraints:\n");
                        sb.append("                    nullable: false\n");
                    }
                }
            }

            if (entity.relations() != null) {
                for (Spec.Relation rel : entity.relations()) {
                    if (rel.type() == Spec.RelationType.MANY_TO_ONE) {
                        sb.append("              - column:\n");
                        sb.append("                  name: ").append(toSnakeCase(rel.name())).append("_id\n");
                        sb.append("                  type: BIGINT\n");
                    }
                }
            }
        }
        }

        if (entities != null) {
            for (Spec.Entity entity : entities) {
                if (entity.relations() != null) {
                for (Spec.Relation rel : entity.relations()) {
                    if (rel.type() == Spec.RelationType.MANY_TO_ONE) {
                        String targetTable = getTargetTable(entities, rel.targetEntity());
                        sb.append("  - changeSet:\n");
                        sb.append("      id: ").append(authorId++).append("\n");
                        sb.append("      author: nocode-generator\n");
                        sb.append("      changes:\n");
                        sb.append("        - addForeignKeyConstraint:\n");
                        sb.append("            baseTableName: ").append(entity.table()).append("\n");
                        sb.append("            baseColumnNames: ").append(toSnakeCase(rel.name())).append("_id\n");
                        sb.append("            constraintName: fk_").append(entity.table()).append("_").append(toSnakeCase(rel.name())).append("\n");
                        sb.append("            referencedTableName: ").append(targetTable).append("\n");
                        sb.append("            referencedColumnNames: id\n");
                    }
                }
            }

            for (Spec.Entity m2mEntity : entities) {
                if (m2mEntity.relations() != null) {
                    for (Spec.Relation rel : m2mEntity.relations()) {
                        if (rel.type() == Spec.RelationType.MANY_TO_MANY) {
                            if (rel.mappedBy() == null || rel.mappedBy().isBlank()) {
                                String joinTableName = toSnakeCase(m2mEntity.name()) + "_" + toSnakeCase(rel.name());
                                String targetTable = getTargetTable(entities, rel.targetEntity());
                                String col1 = toSnakeCase(m2mEntity.name()) + "_id";
                                String col2 = toSnakeCase(rel.targetEntity()) + "_id";
                                
                                sb.append("  - changeSet:\n");
                                sb.append("      id: ").append(authorId++).append("\n");
                                sb.append("      author: nocode-generator\n");
                                sb.append("      changes:\n");
                                sb.append("        - createTable:\n");
                                sb.append("            tableName: ").append(joinTableName).append("\n");
                                sb.append("            columns:\n");
                                sb.append("              - column:\n");
                                sb.append("                  name: ").append(col1).append("\n");
                                sb.append("                  type: BIGINT\n");
                                sb.append("                  constraints:\n");
                                sb.append("                    nullable: false\n");
                                sb.append("              - column:\n");
                                sb.append("                  name: ").append(col2).append("\n");
                                sb.append("                  type: BIGINT\n");
                                sb.append("                  constraints:\n");
                                sb.append("                    nullable: false\n");
                                
                                sb.append("        - addForeignKeyConstraint:\n");
                                sb.append("            baseTableName: ").append(joinTableName).append("\n");
                                sb.append("            baseColumnNames: ").append(col1).append("\n");
                                sb.append("            constraintName: fk_jm_").append(joinTableName).append("_1\n");
                                sb.append("            referencedTableName: ").append(m2mEntity.table()).append("\n");
                                sb.append("            referencedColumnNames: id\n");
                                
                                sb.append("        - addForeignKeyConstraint:\n");
                                sb.append("            baseTableName: ").append(joinTableName).append("\n");
                                sb.append("            baseColumnNames: ").append(col2).append("\n");
                                sb.append("            constraintName: fk_jm_").append(joinTableName).append("_2\n");
                                sb.append("            referencedTableName: ").append(targetTable).append("\n");
                                sb.append("            referencedColumnNames: id\n");
                            }
                        }
                    }
                }
            }
        }
    }

    return sb.toString();
    }

    private String getDbDataType(Spec.FieldType type) {
        return switch (type) {
            case STRING -> "VARCHAR(255)";
            case INTEGER -> "INT";
            case BOOLEAN -> "BOOLEAN";
            case DATE -> "DATE";
            case DECIMAL -> "DECIMAL(19, 4)";
        };
    }

    private String getTargetTable(List<Spec.Entity> entities, String targetEntityName) {
        return entities.stream()
                .filter(e -> e.name().equals(targetEntityName))
                .findFirst()
                .map(Spec.Entity::table)
                .orElse(targetEntityName.toLowerCase() + "s");
    }

    private String toSnakeCase(String str) {
        return str.replaceAll("([a-z])([A-Z]+)", "$1_$2").toLowerCase();
    }
}
