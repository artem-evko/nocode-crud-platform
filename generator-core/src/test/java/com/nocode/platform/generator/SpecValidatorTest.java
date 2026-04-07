package com.nocode.platform.generator;

import com.nocode.platform.generator.spec.*;
import org.junit.jupiter.api.Test;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;

public class SpecValidatorTest {
    private final SpecValidator validator = new SpecValidator();

    private Spec.Project proj() {
        return new Spec.Project("com.test", "test", "Test", "com.test", "1.0.0", false, false);
    }

    @Test
    void reservedNameBlocked() {
        Spec.Entity e = new Spec.Entity("Application", "apps",
                List.of(), List.of(), null, null, null, null);
        Spec spec = new Spec(1, proj(), List.of(e), null, null);
        Exception ex = assertThrows(IllegalArgumentException.class, () -> validator.validate(spec));
        System.out.println("Reserved name result: " + ex.getMessage());
        assertTrue(ex.getMessage().contains("reserved"));
    }

    @Test
    void duplicateNameBlocked() {
        Spec.Entity e1 = new Spec.Entity("Task", "t1", List.of(), List.of(), null, null, null, null);
        Spec.Entity e2 = new Spec.Entity("Task", "t2", List.of(), List.of(), null, null, null, null);
        Spec spec = new Spec(1, proj(), List.of(e1, e2), null, null);
        Exception ex = assertThrows(IllegalArgumentException.class, () -> validator.validate(spec));
        System.out.println("Duplicate name result: " + ex.getMessage());
        assertTrue(ex.getMessage().contains("Duplicate"));
    }
}
