package com.nocode.platform.generator.spec;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

import java.util.List;

public class SpecValidatorTest {

    private final SpecValidator validator = new SpecValidator();
    
    // Вспомогательный класс для создания Spec
    private Spec buildSpec(String entityName, String fieldName) {
        Spec.Field field = new Spec.Field(fieldName, Spec.FieldType.STRING, false, null, null, null);
        Spec.Entity entity = new Spec.Entity(entityName, "table_name", List.of(field), null, null, null, null, null);
        Spec.Project project = new Spec.Project("com.test", "test", "TestApp", "com.test", "1.0", false, false);
        return new Spec(1, project, List.of(entity), null, null);
    }

    @Test
    void testValidNames_success() {
        Spec spec = buildSpec("Customer", "firstName");
        assertDoesNotThrow(() -> validator.validate(spec), "Ожидалось, что валидация пройдет успешно для имен: Customer, firstName");
    }

    @Test
    void testInvalidEntityName_withSpaces_throwsException() {
        Spec spec = buildSpec("My Customer", "firstName");
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> validator.validate(spec));
        assertTrue(ex.getMessage().contains("must contain only English letters/numbers and start with a letter: My Customer"));
    }

    @Test
    void testInvalidEntityName_withCyrillic_throwsException() {
        Spec spec = buildSpec("Клиент", "firstName");
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> validator.validate(spec));
        assertTrue(ex.getMessage().contains("must contain only English letters/numbers and start with a letter: Клиент"));
    }

    @Test
    void testInvalidFieldName_withHyphen_throwsException() {
        Spec spec = buildSpec("Customer", "first-name");
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> validator.validate(spec));
        assertTrue(ex.getMessage().contains("must contain only English letters/numbers and start with a letter: first-name"));
    }
}
