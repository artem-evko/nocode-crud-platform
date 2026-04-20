package com.nocode.platform.generator;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nocode.platform.generator.engine.ProjectGenerator;
import com.nocode.platform.generator.spec.Spec;
import org.junit.jupiter.api.Test;

public class GenerationBenchmarkTest {

    private static final ObjectMapper mapper = new ObjectMapper();

    private static final String SPEC_BACKEND_ONLY = """
    {
      "specVersion": 1,
      "project": {
        "groupId": "com.bench", "artifactId": "bench-backend",
        "name": "BenchBackend", "basePackage": "com.bench.app",
        "version": "1.0.0", "authEnabled": false, "generateFrontend": false
      },
      "entities": [
        { "name": "Product", "table": "product", "fields": [
          { "name": "title", "type": "STRING", "required": true },
          { "name": "price", "type": "DECIMAL", "required": true }
        ], "relations": [] },
        { "name": "Category", "table": "category", "fields": [
          { "name": "name", "type": "STRING", "required": true }
        ], "relations": [] }
      ]
    }
    """;

    private static final String SPEC_BACKEND_AUTH = """
    {
      "specVersion": 1,
      "project": {
        "groupId": "com.bench", "artifactId": "bench-auth",
        "name": "BenchAuth", "basePackage": "com.bench.auth",
        "version": "1.0.0", "authEnabled": true, "generateFrontend": false
      },
      "entities": [
        { "name": "Task", "table": "task", "fields": [
          { "name": "title", "type": "STRING", "required": true },
          { "name": "done", "type": "BOOLEAN", "required": false }
        ], "relations": [] }
      ]
    }
    """;

    private static final String SPEC_FULL_STACK = """
    {
      "specVersion": 1,
      "project": {
        "groupId": "com.bench", "artifactId": "bench-full",
        "name": "BenchFull", "basePackage": "com.bench.full",
        "version": "1.0.0", "authEnabled": true, "generateFrontend": true
      },
      "uiSpec": { "components": [] },
      "actionFlows": [],
      "entities": [
        { "name": "Product", "table": "product", "fields": [
          { "name": "title", "type": "STRING", "required": true },
          { "name": "price", "type": "DECIMAL", "required": true },
          { "name": "active", "type": "BOOLEAN", "required": false }
        ], "relations": [
          { "name": "category", "targetEntity": "Category", "type": "MANY_TO_ONE", "mappedBy": null }
        ]},
        { "name": "Category", "table": "category", "fields": [
          { "name": "name", "type": "STRING", "required": true }
        ], "relations": [
          { "name": "products", "targetEntity": "Product", "type": "ONE_TO_MANY", "mappedBy": "category" }
        ]},
        { "name": "Order", "table": "orders", "fields": [
          { "name": "total", "type": "DECIMAL", "required": true },
          { "name": "orderDate", "type": "DATE", "required": true },
          { "name": "status", "type": "STRING", "required": true }
        ], "relations": [] }
      ]
    }
    """;

    @Test
    public void benchmarkGenerationTime() throws Exception {
        int warmupRuns = 3;
        int measuredRuns = 10;

        Spec specBackend = mapper.readValue(SPEC_BACKEND_ONLY, Spec.class);
        Spec specAuth = mapper.readValue(SPEC_BACKEND_AUTH, Spec.class);
        Spec specFull = mapper.readValue(SPEC_FULL_STACK, Spec.class);

        ProjectGenerator gen = new ProjectGenerator();

        // Warmup
        System.out.println("=== WARMUP (" + warmupRuns + " runs) ===");
        for (int i = 0; i < warmupRuns; i++) {
            gen.generate(specBackend);
            gen.generate(specAuth);
            gen.generate(specFull);
        }

        // Benchmark: Backend Only
        System.out.println("\n=== Backend Only (2 entities, no auth, no frontend) ===");
        long[] timesBackend = new long[measuredRuns];
        for (int i = 0; i < measuredRuns; i++) {
            long start = System.nanoTime();
            byte[] zip = gen.generate(specBackend);
            long elapsed = (System.nanoTime() - start) / 1_000_000;
            timesBackend[i] = elapsed;
            System.out.println("  Run " + (i + 1) + ": " + elapsed + " ms (" + zip.length + " bytes)");
        }
        printStats("Backend Only", timesBackend);

        // Benchmark: Backend + Auth
        System.out.println("\n=== Backend + JWT Auth (1 entity + security) ===");
        long[] timesAuth = new long[measuredRuns];
        for (int i = 0; i < measuredRuns; i++) {
            long start = System.nanoTime();
            byte[] zip = gen.generate(specAuth);
            long elapsed = (System.nanoTime() - start) / 1_000_000;
            timesAuth[i] = elapsed;
            System.out.println("  Run " + (i + 1) + ": " + elapsed + " ms (" + zip.length + " bytes)");
        }
        printStats("Backend + Auth", timesAuth);

        // Benchmark: Full Stack
        System.out.println("\n=== Full Stack (3 entities + auth + frontend) ===");
        long[] timesFull = new long[measuredRuns];
        for (int i = 0; i < measuredRuns; i++) {
            long start = System.nanoTime();
            byte[] zip = gen.generate(specFull);
            long elapsed = (System.nanoTime() - start) / 1_000_000;
            timesFull[i] = elapsed;
            System.out.println("  Run " + (i + 1) + ": " + elapsed + " ms (" + zip.length + " bytes)");
        }
        printStats("Full Stack", timesFull);

        System.out.println("\n=== SUMMARY TABLE ===");
        System.out.println("Config              | Avg (ms) | Min (ms) | Max (ms)");
        System.out.println("Backend Only        | " + avg(timesBackend) + "       | " + min(timesBackend) + "       | " + max(timesBackend));
        System.out.println("Backend + Auth      | " + avg(timesAuth) + "       | " + min(timesAuth) + "       | " + max(timesAuth));
        System.out.println("Full Stack          | " + avg(timesFull) + "       | " + min(timesFull) + "       | " + max(timesFull));
    }

    private void printStats(String name, long[] times) {
        System.out.println("  --- " + name + " ---");
        System.out.println("  Average: " + avg(times) + " ms");
        System.out.println("  Min:     " + min(times) + " ms");
        System.out.println("  Max:     " + max(times) + " ms");
    }

    private long avg(long[] times) {
        long sum = 0;
        for (long t : times) sum += t;
        return sum / times.length;
    }

    private long min(long[] times) {
        long m = Long.MAX_VALUE;
        for (long t : times) if (t < m) m = t;
        return m;
    }

    private long max(long[] times) {
        long m = Long.MIN_VALUE;
        for (long t : times) if (t > m) m = t;
        return m;
    }
}
