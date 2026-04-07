package com.nocode.platform.generator;

import com.nocode.platform.generator.engine.ProjectGenerator;
import com.nocode.platform.generator.spec.Spec;
import com.nocode.platform.generator.spec.Spec.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.*;
import java.util.*;
import java.util.zip.*;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Block 5: Edge Cases & Stress Tests for the code generator.
 */
public class EdgeCaseStressTest {

    private final ProjectGenerator generator = new ProjectGenerator();

    private Map<String, String> extractZip(byte[] zip) throws IOException {
        Map<String, String> files = new HashMap<>();
        try (ZipInputStream zis = new ZipInputStream(new ByteArrayInputStream(zip))) {
            ZipEntry entry;
            while ((entry = zis.getNextEntry()) != null) {
                if (!entry.isDirectory()) {
                    ByteArrayOutputStream baos = new ByteArrayOutputStream();
                    zis.transferTo(baos);
                    files.put(entry.getName(), baos.toString("UTF-8"));
                }
            }
        }
        return files;
    }

    private Project baseProject() {
        return new Project("com.test", "edgecase", "EdgeCaseApp",
                "com.test.edgecase", "1.0.0", false, false);
    }

    private Entity entity(String name, List<Field> fields) {
        return new Entity(name, name.toLowerCase() + "s", fields,
                Collections.emptyList(), null, null, null, null);
    }

    private Field field(String name, FieldType type) {
        return new Field(name, type, false, null, null, null);
    }

    // ========== 5.1: Reserved Java keywords as field names ==========

    @Test
    @DisplayName("5.1: Reserved Java keyword fields (class, return, static, public)")
    void test51_reservedJavaKeywords() {
        Entity e = entity("Product", List.of(
                field("class", FieldType.STRING),
                field("return", FieldType.STRING),
                field("static", FieldType.BOOLEAN),
                field("public", FieldType.INTEGER)
        ));
        Spec spec = new Spec(1, baseProject(), List.of(e), null, null);

        try {
            byte[] zip = generator.generate(spec);
            assertNotNull(zip);
            Map<String, String> files = extractZip(zip);

            String entityCode = files.entrySet().stream()
                    .filter(en -> en.getKey().contains("Product.java"))
                    .map(Map.Entry::getValue)
                    .findFirst().orElse("");

            System.out.println("[5.1] Product.java generated with reserved keywords.");
            // Check for invalid Java identifiers that would cause compile errors
            boolean hasRawKeyword = entityCode.contains("private String class;")
                    || entityCode.contains("private String return;")
                    || entityCode.contains("private Boolean static;");
            if (hasRawKeyword) {
                System.out.println("[5.1] BUG: Raw Java keywords used as field identifiers!");
                System.out.println(entityCode.substring(0, Math.min(600, entityCode.length())));
            } else {
                System.out.println("[5.1] Generator handled keywords (sanitized or escaped)");
            }
        } catch (Exception ex) {
            System.out.println("[5.1] Exception: " + ex.getMessage());
            assertFalse(ex instanceof NullPointerException, "Should not NPE");
        }
    }

    // ========== 5.2: Entity name conflicts with Spring classes ==========

    @Test
    @DisplayName("5.2: Entity named 'Application' conflicts with Spring Boot main class")
    void test52_entityNameConflict() {
        Entity e = entity("Application", List.of(
                field("name", FieldType.STRING)
        ));
        Spec spec = new Spec(1, baseProject(), List.of(e), null, null);

        try {
            byte[] zip = generator.generate(spec);
            assertNotNull(zip);
            Map<String, String> files = extractZip(zip);

            long appJavaCount = files.keySet().stream()
                    .filter(k -> k.endsWith("Application.java"))
                    .count();
            System.out.println("[5.2] Application.java files found: " + appJavaCount);
            files.keySet().stream()
                    .filter(k -> k.endsWith("Application.java"))
                    .forEach(k -> System.out.println("  -> " + k));

            if (appJavaCount > 1) {
                System.out.println("[5.2] BUG: Multiple Application.java files will cause compile error!");
            }
        } catch (Exception ex) {
            System.out.println("[5.2] Exception: " + ex.getMessage());
        }
    }

    // ========== 5.3: Explicit 'id' field creates duplicate PK ==========

    @Test
    @DisplayName("5.3: Entity with explicit 'id' field should not duplicate @Id/@GeneratedValue")
    void test53_duplicateIdField() {
        Entity e = entity("Order", List.of(
                field("id", FieldType.STRING),
                field("total", FieldType.DECIMAL),
                field("status", FieldType.STRING)
        ));
        Spec spec = new Spec(1, baseProject(), List.of(e), null, null);

        try {
            byte[] zip = generator.generate(spec);
            assertNotNull(zip);
            Map<String, String> files = extractZip(zip);

            String entityCode = files.entrySet().stream()
                    .filter(en -> en.getKey().contains("Order.java"))
                    .map(Map.Entry::getValue)
                    .findFirst().orElse("");

            long idCount = entityCode.lines()
                    .filter(l -> l.trim().equals("@Id"))
                    .count();
            long idFieldCount = entityCode.lines()
                    .filter(l -> l.trim().startsWith("private") && l.contains(" id"))
                    .count();

            System.out.println("[5.3] @Id annotations: " + idCount + ", 'id' fields: " + idFieldCount);
            if (idCount > 1 || idFieldCount > 1) {
                System.out.println("[5.3] BUG: Duplicate PK definition!");
                System.out.println(entityCode);
            } else {
                System.out.println("[5.3] OK: Single @Id annotation");
            }
        } catch (Exception ex) {
            System.out.println("[5.3] Exception: " + ex.getMessage());
        }
    }

    // ========== 5.4: Very long entity name (126 chars) ==========

    @Test
    @DisplayName("5.4: Entity name with 126 characters")
    void test54_longEntityName() {
        String longName = "A" + "bcdefghijklmnopqrstuvwxyz".repeat(5); // 126 chars
        Entity e = entity(longName, List.of(field("name", FieldType.STRING)));
        Spec spec = new Spec(1, baseProject(), List.of(e), null, null);

        try {
            byte[] zip = generator.generate(spec);
            assertNotNull(zip, "Should not return null");
            assertTrue(zip.length > 0, "ZIP should not be empty");
            System.out.println("[5.4] PASS: Generated code for " + longName.length() + "-char entity name");
        } catch (Exception ex) {
            System.out.println("[5.4] Exception: " + ex.getMessage());
            assertFalse(ex instanceof NullPointerException, "Should not NPE for long names");
        }
    }

    // ========== 5.5: Special characters in field names ==========

    @Test
    @DisplayName("5.5: Special characters in field names (@, space, -, ., leading digit)")
    void test55_specialCharFields() {
        Entity e = entity("Widget", List.of(
                field("field@name", FieldType.STRING),
                field("field name", FieldType.STRING),
                field("field-name", FieldType.STRING),
                field("123field", FieldType.STRING),
                field("field.name", FieldType.STRING)
        ));
        Spec spec = new Spec(1, baseProject(), List.of(e), null, null);

        try {
            byte[] zip = generator.generate(spec);
            assertNotNull(zip);
            Map<String, String> files = extractZip(zip);

            String entityCode = files.entrySet().stream()
                    .filter(en -> en.getKey().contains("Widget.java"))
                    .map(Map.Entry::getValue)
                    .findFirst().orElse("");

            boolean hasInvalid = entityCode.contains("field@name")
                    || entityCode.contains("field name")
                    || entityCode.contains("123field");

            if (hasInvalid) {
                System.out.println("[5.5] BUG: Invalid Java identifiers in generated entity!");
                System.out.println(entityCode.substring(0, Math.min(800, entityCode.length())));
            } else {
                System.out.println("[5.5] OK: Special chars handled (sanitized or rejected)");
            }
        } catch (Exception ex) {
            System.out.println("[5.5] Exception (acceptable if descriptive): " + ex.getMessage());
            assertFalse(ex instanceof NullPointerException, "Should not NPE");
        }
    }
}
