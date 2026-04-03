package com.nocode.platform.generator;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nocode.platform.generator.engine.ProjectGenerator;
import com.nocode.platform.generator.spec.Spec;
import org.junit.jupiter.api.Test;

import java.io.File;
import java.nio.file.Files;

import static org.junit.jupiter.api.Assertions.assertNotNull;

public class EdgeCaseGeneratorTest {

    @Test
    public void testOneToManyGeneration() throws Exception {
        String json = """
        {
          "specVersion": 1,
          "project": {
            "groupId": "com.test",
            "artifactId": "test-app",
            "name": "TestApp",
            "basePackage": "com.test.app",
            "version": "1.0.0",
            "authEnabled": true,
            "generateFrontend": true
          },
          "uiSpec": {
            "components": []
          },
          "actionFlows": [],
          "entities": [
            {
              "name": "Department",
              "table": "department",
              "fields": [
                { "name": "name", "type": "STRING", "required": true }
              ],
              "relations": [
                {
                  "name": "employees",
                  "targetEntity": "Employee",
                  "type": "ONE_TO_MANY",
                  "mappedBy": "department"
                }
              ]
            },
            {
              "name": "Employee",
              "table": "employee",
              "fields": [
                { "name": "firstName", "type": "STRING", "required": true }
              ],
              "relations": [
                {
                  "name": "department",
                  "targetEntity": "Department",
                  "type": "MANY_TO_ONE",
                  "mappedBy": null
                }
              ]
            }
          ]
        }
        """;

        ObjectMapper mapper = new ObjectMapper();
        Spec spec = mapper.readValue(json, Spec.class);
        ProjectGenerator generator = new ProjectGenerator();
        
        byte[] zip = generator.generate(spec);
        assertNotNull(zip, "Generated zip byte array should not be null");
        
        File debugZip = new File("target/debug-test.zip");
        debugZip.getParentFile().mkdirs();
        Files.write(debugZip.toPath(), zip);
        System.out.println("Generated: " + debugZip.getAbsolutePath());
    }
}
