package com.nocode.platform.generator.engine;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class LiquibaseGeneratorTest {

    private final LiquibaseGenerator generator = new LiquibaseGenerator();

    @Test
    void testAuthEnabled_generatesAdminRoleWithoutPrefix() {
        String changelog = generator.generateChangelog(null, true);
        
        // Assert that the generated script contains 'value: ADMIN', ensuring no 'ROLE_' prefix
        assertTrue(changelog.contains("name: role\n                  value: ADMIN\n"), 
            "Сгенерированный changelog должен содержать роль 'ADMIN' без префикса 'ROLE_'");
            
        // Assert explicitly that it DOES NOT contain ROLE_ADMIN
        assertFalse(changelog.contains("value: ROLE_ADMIN\n"), 
            "Сгенерированный changelog НЕ должен содержать префикс 'ROLE_ADMIN'");
    }

    @Test
    void testAuthDisabled_doesNotGenerateAdmin() {
        String changelog = generator.generateChangelog(null, false);
        assertFalse(changelog.contains("tableName: users\n"));
    }
}
