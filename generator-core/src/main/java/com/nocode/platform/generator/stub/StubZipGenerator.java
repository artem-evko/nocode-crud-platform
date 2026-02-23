package com.nocode.platform.generator.stub;

import com.nocode.platform.generator.api.GeneratedProject;

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

public class StubZipGenerator {

    public byte[] generate(GeneratedProject p) {
        String groupId = safe(p.groupId(), "com.example");
        String artifactId = safe(p.artifactId(), "demo-app");
        String version = safe(p.version(), "0.1.0-SNAPSHOT");
        String basePackage = safe(p.basePackage(), "com.example.app");
        String name = safe(p.name(), "Generated App");

        String packagePath = basePackage.replace('.', '/');
        String root = artifactId + "/";

        try (ByteArrayOutputStream baos = new ByteArrayOutputStream();
             ZipOutputStream zip = new ZipOutputStream(baos, StandardCharsets.UTF_8)) {

            put(zip, root + "README.md", readme(artifactId));
            put(zip, root + "pom.xml", pomXml(groupId, artifactId, version));
            put(zip, root + "src/main/java/" + packagePath + "/Application.java", applicationJava(basePackage));
            put(zip, root + "src/main/java/" + packagePath + "/ui/MainView.java", mainViewJava(basePackage, name));
            put(zip, root + "src/main/resources/application.yml", applicationYml(artifactId));
            put(zip, root + "src/main/resources/db/changelog/db.changelog-master.yaml", liquibaseYaml());
            put(zip, root + "spec.yaml", safe(p.specText(), ""));

            zip.finish();
            return baos.toByteArray();
        } catch (Exception ex) {
            throw new RuntimeException("Failed to generate zip", ex);
        }
    }

    private static void put(ZipOutputStream zip, String path, String content) throws Exception {
        zip.putNextEntry(new ZipEntry(path));
        zip.write(content.getBytes(StandardCharsets.UTF_8));
        zip.closeEntry();
    }

    private static String safe(String v, String def) {
        return (v == null || v.isBlank()) ? def : v.trim();
    }

    private static String readme(String dbName) {
        return """
                # Generated CRUD App (stub)

                Это каркас, сгенерированный платформой (этап 3).
                Пока без генерации сущностей CRUD — только шаблон приложения.

                ## Запуск
                1) Подними PostgreSQL:
                   docker compose up -d
                2) Запусти приложение:
                   mvn spring-boot:run
                3) Открой:
                   http://localhost:8080

                ## docker-compose.yml (пример)
                services:
                  postgres:
                    image: postgres:16
                    environment:
                      POSTGRES_DB: %s
                      POSTGRES_USER: app
                      POSTGRES_PASSWORD: app
                    ports:
                      - "5432:5432"
                """.formatted(dbName);
    }

    private static String pomXml(String groupId, String artifactId, String version) {
        return """
                <?xml version="1.0" encoding="UTF-8"?>
                <project xmlns="http://maven.apache.org/POM/4.0.0"
                         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
                  <modelVersion>4.0.0</modelVersion>

                  <groupId>%s</groupId>
                  <artifactId>%s</artifactId>
                  <version>%s</version>
                  <packaging>jar</packaging>

                  <properties>
                    <java.version>21</java.version>
                    <vaadin.version>25.0.5</vaadin.version>
                  </properties>

                  <parent>
                    <groupId>org.springframework.boot</groupId>
                    <artifactId>spring-boot-starter-parent</artifactId>
                    <version>4.0.3</version>
                    <relativePath/>
                  </parent>

                  <dependencyManagement>
                    <dependencies>
                      <dependency>
                        <groupId>com.vaadin</groupId>
                        <artifactId>vaadin-bom</artifactId>
                        <version>${vaadin.version}</version>
                        <type>pom</type>
                        <scope>import</scope>
                      </dependency>
                    </dependencies>
                  </dependencyManagement>

                  <dependencies>
                    <dependency>
                      <groupId>com.vaadin</groupId>
                      <artifactId>vaadin-spring-boot-starter</artifactId>
                    </dependency>
                    <dependency>
                      <groupId>com.vaadin</groupId>
                      <artifactId>vaadin-core</artifactId>
                    </dependency>

                    <dependency>
                      <groupId>org.springframework.boot</groupId>
                      <artifactId>spring-boot-starter-data-jpa</artifactId>
                    </dependency>

                    <dependency>
                      <groupId>org.postgresql</groupId>
                      <artifactId>postgresql</artifactId>
                      <scope>runtime</scope>
                    </dependency>

                    <dependency>
                      <groupId>org.liquibase</groupId>
                      <artifactId>liquibase-core</artifactId>
                    </dependency>
                  </dependencies>

                  <build>
                    <plugins>
                      <plugin>
                        <groupId>org.springframework.boot</groupId>
                        <artifactId>spring-boot-maven-plugin</artifactId>
                        <version>4.0.3</version>
                      </plugin>
                    </plugins>
                  </build>
                </project>
                """.formatted(groupId, artifactId, version);
    }

    private static String applicationJava(String basePackage) {
        return """
                package %s;

                import org.springframework.boot.SpringApplication;
                import org.springframework.boot.autoconfigure.SpringBootApplication;

                @SpringBootApplication
                public class Application {
                    public static void main(String[] args) {
                        SpringApplication.run(Application.class, args);
                    }
                }
                """.formatted(basePackage);
    }

    private static String mainViewJava(String basePackage, String name) {
        return """
                package %s.ui;

                import com.vaadin.flow.component.html.H2;
                import com.vaadin.flow.component.orderedlayout.VerticalLayout;
                import com.vaadin.flow.router.PageTitle;
                import com.vaadin.flow.router.Route;

                @Route("")
                @PageTitle("%s")
                public class MainView extends VerticalLayout {

                    public MainView() {
                        add(new H2("%s"));
                        add("Generated stub at: %s");
                    }
                }
                """.formatted(basePackage, name, name, OffsetDateTime.now());
    }

    private static String applicationYml(String dbName) {
        return """
                server:
                  port: 8080

                spring:
                  datasource:
                    url: jdbc:postgresql://localhost:5432/%s
                    username: app
                    password: app
                    driver-class-name: org.postgresql.Driver

                  jpa:
                    hibernate:
                      ddl-auto: none
                    open-in-view: false

                  liquibase:
                    enabled: true
                    change-log: classpath:db/changelog/db.changelog-master.yaml
                """.formatted(dbName);
    }

    private static String liquibaseYaml() {
        return """
                databaseChangeLog:
                  - changeSet:
                      id: 1
                      author: nocode
                      changes:
                        - createTable:
                            tableName: example_table
                            columns:
                              - column:
                                  name: id
                                  type: uuid
                                  constraints:
                                    primaryKey: true
                                    nullable: false
                              - column:
                                  name: name
                                  type: varchar(200)
                                  constraints:
                                    nullable: false
                """;
    }
}