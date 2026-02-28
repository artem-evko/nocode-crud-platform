package com.nocode.platform.generator.engine;

import com.nocode.platform.generator.spec.Spec;

import java.util.List;

public class LiquibaseGenerator {

    public String generateChangelog(List<Spec.Entity> entities) {
        StringBuilder sb = new StringBuilder();
        sb.append("databaseChangeLog:\n");
        int authorId = 1;

        for (Spec.Entity entity : entities) {
            sb.append("  - changeSet:\n");
            sb.append("      id: ").append(authorId++).append("\n");
            sb.append("      author: nocode-generator\n");
            sb.append("      changes:\n");
            sb.append("        - createTable:\n");
            sb.append("            tableName: ").append(entity.table()).append("\n");
            sb.append("            columns:\n");

            // ID Column
            sb.append("              - column:\n");
            sb.append("                  name: id\n");
            sb.append("                  type: BIGINT\n");
            sb.append("                  autoIncrement: true\n");
            sb.append("                  constraints:\n");
            sb.append("                    primaryKey: true\n");
            sb.append("                    nullable: false\n");

            // Other fields
            if (entity.fields() != null) {
                for (Spec.Field field : entity.fields()) {
                    sb.append("              - column:\n");
                    sb.append("                  name: ").append(toSnakeCase(field.name())).append("\n");
                    sb.append("                  type: ").append(getDbDataType(field.type())).append("\n");
                    
                    if (field.required()) {
                        sb.append("                  constraints:\n");
                        sb.append("                    nullable: false\n");
                    }
                }
            }

            // ManyToOne fields (Foreign Keys)
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

        // Add Foreign Key Constraints
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
                .orElse(targetEntityName.toLowerCase() + "s"); // Fallback
    }

    private String toSnakeCase(String str) {
        return str.replaceAll("([a-z])([A-Z]+)", "$1_$2").toLowerCase();
    }
}
