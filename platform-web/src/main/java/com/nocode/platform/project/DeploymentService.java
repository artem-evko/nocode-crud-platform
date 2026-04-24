package com.nocode.platform.project;

import com.nocode.platform.generator.GeneratorFacade;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.io.*;
import java.net.ServerSocket;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Comparator;
import java.util.UUID;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

/**
 * Сервис развёртывания сгенерированных проектов через Docker Compose.
 *
 * <p>Выполняет полный цикл деплоя: генерация кода → распаковка →
 * создание Dockerfile и docker-compose.yml → сборка и запуск контейнеров →
 * проверка здоровья (healthcheck) → маршрутизация через Traefik.</p>
 */
@Service
public class DeploymentService {

    private static final Logger log = LoggerFactory.getLogger(DeploymentService.class);

    private final ProjectRepository projectRepository;
    private final GeneratorFacade generatorFacade;

    public DeploymentService(ProjectRepository projectRepository, GeneratorFacade generatorFacade) {
        this.projectRepository = projectRepository;
        this.generatorFacade = generatorFacade;
    }

    /**
     * Асинхронное развёртывание проекта.
     *
     * <p>Генерирует исходный код, собирает Docker-образы, запускает контейнеры
     * и дожидается готовности бэкенда через healthcheck. При успехе обновляет
     * статус проекта на {@code RUNNING} с URL вида {@code proj-<id>.localhost}.</p>
     *
     * @param projectId  идентификатор проекта
     * @param customPort пользовательский порт (может быть null)
     */
    @Async
    public void deployProject(UUID projectId, Integer customPort) {
        ProjectEntity project = projectRepository.findById(projectId).orElseThrow();
        try {
            updateStatus(project, "DEPLOYING", null);

            byte[] zipData = generatorFacade.generateReal(project);

            String artifactId = project.getArtifactId();
            Path deployDir = Paths.get(System.getProperty("java.io.tmpdir"), "deploy-" + projectId);
            if (Files.exists(deployDir)) {
                Files.walk(deployDir)
                        .sorted(Comparator.reverseOrder())
                        .map(Path::toFile)
                        .forEach(File::delete);
            }
            Files.createDirectories(deployDir);

            unzip(zipData, deployDir.toFile());

            Path projectRoot = deployDir.resolve(artifactId);

            generateDockerFiles(projectRoot, project);

            boolean hasFrontend = project.isGenerateFrontend()
                    && Files.exists(projectRoot.resolve("frontend/package.json"));

            int frontendPort = hasFrontend ? (customPort != null ? customPort : findFreePort()) : -1;
            int backendPort = findFreePort();
            int dbPort = findFreePort();

            generateDockerCompose(projectRoot, project, hasFrontend, frontendPort, backendPort, dbPort);

            String projectName = "proj-" + projectId;
            
            runCommand(projectRoot.toFile(), "docker", "compose", "-p", projectName, "down", "-v");
            
            int buildExitCode = -1;
            for (int i = 0; i < 3; i++) {
                buildExitCode = runCommand(projectRoot.toFile(), "docker", "compose", "-p", projectName, "build");
                if (buildExitCode == 0) break;
                log.warn("Docker build failed (network error/rate limit), attempt {}/3. Retrying in 5 seconds...", i + 1);
                Thread.sleep(5000);
            }
            if (buildExitCode != 0) {
                throw new RuntimeException("Docker build failed with exit code " + buildExitCode);
            }

            int upExitCode = runCommand(projectRoot.toFile(), "docker", "compose", "-p", projectName, "up", "-d");
            if (upExitCode != 0) {
                File logFile = projectRoot.resolve("deploy.log").toFile();
                if (logFile.exists()) {
                    String logText = Files.readString(logFile.toPath());
                    if (logText.contains("address already in use") || logText.contains("port is already allocated")) {
                        throw new RuntimeException("PORT_IN_USE");
                    }
                }
                throw new RuntimeException("Docker up failed with exit code " + upExitCode);
            }

            String backendContainer = projectName + "-backend-" + project.getArtifactId() + "-1";
            boolean healthy = false;
            for (int attempt = 0; attempt < 20; attempt++) {
                Thread.sleep(3000);
                try {
                    ProcessBuilder hcPb = new ProcessBuilder("docker", "inspect",
                            "--format", "{{.State.Status}}", backendContainer);
                    hcPb.redirectErrorStream(true);
                    Process hcProc = hcPb.start();
                    String status = new String(hcProc.getInputStream().readAllBytes()).trim();
                    hcProc.waitFor();
                    log.info("Healthcheck attempt {}/20 for {}: status={}", attempt + 1, backendContainer, status);
                    if ("running".equals(status)) {
                        ProcessBuilder rcPb = new ProcessBuilder("docker", "inspect",
                                "--format", "{{.RestartCount}}", backendContainer);
                        rcPb.redirectErrorStream(true);
                        Process rcProc = rcPb.start();
                        String restartCount = new String(rcProc.getInputStream().readAllBytes()).trim();
                        rcProc.waitFor();
                        int restarts = 0;
                        try { restarts = Integer.parseInt(restartCount); } catch (NumberFormatException ignored) {}
                        if (restarts == 0) {
                            healthy = true;
                            break;
                        } else {
                            log.warn("Container {} has {} restarts, still unhealthy", backendContainer, restarts);
                        }
                    }
                } catch (Exception e) {
                    log.warn("Healthcheck error: {}", e.getMessage());
                }
            }

            if (!healthy) {
                log.error("Backend container {} failed healthcheck after 60s", backendContainer);
                try {
                    ProcessBuilder logPb = new ProcessBuilder("docker", "logs", "--tail", "20", backendContainer);
                    logPb.redirectErrorStream(true);
                    Process logProc = logPb.start();
                    String containerLogs = new String(logProc.getInputStream().readAllBytes());
                    logProc.waitFor();
                    log.error("Container logs: {}", containerLogs);
                } catch (Exception ignored) {}
                throw new RuntimeException("Backend container failed to start (healthcheck timeout)");
            }

            String url = "http://proj-" + projectId + ".localhost";
            updateStatus(project, "RUNNING", url);

        } catch (Exception e) {
            log.error("Deployment failed for project {}", projectId, e);
            if ("PORT_IN_USE".equals(e.getMessage())) {
                updateStatus(project, "PORT_OCCUPIED", null);
            } else {
                updateStatus(project, "FAILED", null);
            }
        }
    }

    /**
     * Остановка развёрнутого проекта и удаление его Docker-контейнеров.
     *
     * @param projectId идентификатор проекта
     */
    public void stopDeployment(UUID projectId) {
        ProjectEntity project = projectRepository.findById(projectId).orElseThrow();
        try {
            updateStatus(project, "STOPPING", null);
            
            Path deployDir = Paths.get(System.getProperty("java.io.tmpdir"), "deploy-" + projectId);
            Path projectRoot = deployDir.resolve(project.getArtifactId());
            String projectName = "proj-" + projectId;
            
            if (Files.exists(projectRoot)) {
                runCommand(projectRoot.toFile(), "docker", "compose", "-p", projectName, "down", "-v");
            } else {
                runCommand(new File("."), "docker", "compose", "-p", projectName, "down", "-v");
            }
            updateStatus(project, "NONE", null);
        } catch (Exception e) {
            log.error("Failed to stop deployment for project {}", projectId, e);
            updateStatus(project, "FAILED", null);
        }
    }

    private void generateDockerFiles(Path root, ProjectEntity project) throws IOException {
        Path backendDir = root.resolve("backend");
        if (Files.exists(backendDir)) {
            String backendDockerfile = """
                    FROM maven:3.9.6-eclipse-temurin-21-alpine AS BUILD
                    WORKDIR /app
                    COPY pom.xml .
                    # Download dependencies with BuildKit Cache
                    RUN --mount=type=cache,target=/root/.m2 mvn dependency:go-offline
                    COPY src ./src
                    RUN --mount=type=cache,target=/root/.m2 mvn clean package -DskipTests
                    
                    FROM eclipse-temurin:21-jre-alpine
                    WORKDIR /app
                    COPY --from=BUILD /app/target/*.jar app.jar
                    ENTRYPOINT ["java", "-jar", "app.jar"]
                    """;
            Files.writeString(backendDir.resolve("Dockerfile"), backendDockerfile);
        }

        Path frontendDir = root.resolve("frontend");
        if (project.isGenerateFrontend()) {
            Files.createDirectories(frontendDir);
            String frontendDockerfile = """
                    FROM node:20-alpine AS build
                    WORKDIR /app
                    COPY package*.json ./
                    RUN --mount=type=cache,target=/root/.npm npm install
                    COPY . .
                    RUN --mount=type=cache,target=/root/.npm npm run build
                    
                    FROM nginx:alpine
                    COPY --from=build /app/dist /usr/share/nginx/html
                    COPY nginx.conf /etc/nginx/conf.d/default.conf
                    EXPOSE 80
                    CMD ["nginx", "-g", "daemon off;"]
                    """;
            Files.writeString(frontendDir.resolve("Dockerfile"), frontendDockerfile);
        }
    }

    private void generateDockerCompose(Path root, ProjectEntity project, boolean hasFrontend, int frontendPort, int backendPort, int dbPort) throws IOException {
        String dbUser = "user";
        String dbPass = "password";
        String dbName = project.getArtifactId();
        
        if (hasFrontend) {
            Path frontendDir = root.resolve("frontend");
            Files.createDirectories(frontendDir);

            Path nginxConfPath = frontendDir.resolve("nginx.conf");
            String nginxConf = "server {\n" +
                    "    listen 80;\n" +
                    "    location / {\n" +
                    "        root /usr/share/nginx/html;\n" +
                    "        index index.html index.htm;\n" +
                    "        try_files $uri $uri/ /index.html;\n" +
                    "    }\n" +
                    "    location /api/ {\n" +
                    "        proxy_pass http://backend-" + project.getArtifactId() + ":8080/api/;\n" +
                    "        proxy_set_header Host $host;\n" +
                    "        proxy_set_header X-Real-IP $remote_addr;\n" +
                    "    }\n" +
                    "}\n";
            Files.writeString(nginxConfPath, nginxConf);
        }
        
        Path appYmlPath = root.resolve("backend/src/main/resources/application.yml");
        if (Files.exists(appYmlPath)) {
            String appYml = Files.readString(appYmlPath);
            appYml = appYml.replace("url: jdbc:postgresql://localhost:5432/", "url: jdbc:postgresql://db:5432/");
            appYml = appYml.replace("username: postgres", "username: " + dbUser);
            appYml = appYml.replace("password: root", "password: " + dbPass);
            Files.writeString(appYmlPath, appYml);
        }

        StringBuilder compose = new StringBuilder();
        compose.append("version: '3.8'\n");
        compose.append("services:\n");
        
        compose.append("  db:\n");
        compose.append("    image: postgres:15-alpine\n");
        compose.append("    environment:\n");
        compose.append("      POSTGRES_USER: ").append(dbUser).append("\n");
        compose.append("      POSTGRES_PASSWORD: ").append(dbPass).append("\n");
        compose.append("      POSTGRES_DB: ").append(dbName).append("\n");
        compose.append("    healthcheck:\n");
        compose.append("      test: [\"CMD-SHELL\", \"pg_isready -U ").append(dbUser).append(" -d ").append(dbName).append(" && PGPASSWORD=").append(dbPass).append(" psql -U ").append(dbUser).append(" -d ").append(dbName).append(" -c 'SELECT 1'\"]\n");
        compose.append("      interval: 5s\n");
        compose.append("      timeout: 5s\n");
        compose.append("      retries: 10\n");
        compose.append("    restart: always\n");
        compose.append("    networks:\n");
        compose.append("      - internal\n");
        
        compose.append("  backend-").append(project.getArtifactId()).append(":\n");
        compose.append("    build: ./backend\n");
        compose.append("    restart: always\n");
        compose.append("    depends_on:\n");
        compose.append("      db:\n");
        compose.append("        condition: service_healthy\n");
        if (!hasFrontend) {
            compose.append("    labels:\n");
            compose.append("      - \"traefik.enable=true\"\n");
            compose.append("      - \"traefik.http.routers.proj-").append(project.getId()).append(".rule=Host(`proj-").append(project.getId()).append(".localhost`)\"\n");
            compose.append("      - \"traefik.http.routers.proj-").append(project.getId()).append(".entrypoints=web\"\n");
            compose.append("      - \"traefik.http.services.proj-").append(project.getId()).append(".loadbalancer.server.port=8080\"\n");
        }
        compose.append("    networks:\n");
        compose.append("      - internal\n");
        compose.append("      - nocode-network\n");
        
        if (hasFrontend) {
            compose.append("  frontend:\n");
            compose.append("    build: ./frontend\n");
            compose.append("    restart: always\n");
            compose.append("    depends_on:\n");
            compose.append("      - backend-").append(project.getArtifactId()).append("\n");
            compose.append("    labels:\n");
            compose.append("      - \"traefik.enable=true\"\n");
            compose.append("      - \"traefik.http.routers.proj-").append(project.getId()).append(".rule=Host(`proj-").append(project.getId()).append(".localhost`)\"\n");
            compose.append("      - \"traefik.http.routers.proj-").append(project.getId()).append(".entrypoints=web\"\n");
            compose.append("      - \"traefik.http.services.proj-").append(project.getId()).append(".loadbalancer.server.port=80\"\n");
            compose.append("    networks:\n");
            compose.append("      - nocode-network\n");
        }

        compose.append("\nnetworks:\n");
        compose.append("  internal:\n");
        compose.append("    driver: bridge\n");
        compose.append("  nocode-network:\n");
        compose.append("    external: true\n");
        compose.append("    name: nocode-crud-platform_nocode-network\n");

        Files.writeString(root.resolve("docker-compose.yml"), compose.toString());
    }

    private void updateStatus(ProjectEntity project, String status, String url) {
        ProjectEntity freshProject = projectRepository.findById(project.getId()).orElse(project);
        freshProject.setDeploymentStatus(status);
        if (url != null) {
            freshProject.setDeploymentUrl(url);
        }
        projectRepository.save(freshProject);
    }

    private void unzip(byte[] zipData, File destDir) throws IOException {
        try (ZipInputStream zis = new ZipInputStream(new ByteArrayInputStream(zipData))) {
            ZipEntry entry;
            while ((entry = zis.getNextEntry()) != null) {
                File file = new File(destDir, entry.getName());
                if (entry.isDirectory()) {
                    file.mkdirs();
                } else {
                    file.getParentFile().mkdirs();
                    try (FileOutputStream fos = new FileOutputStream(file)) {
                        zis.transferTo(fos);
                    }
                }
            }
        }
    }

    private int findFreePort() throws IOException {
        try (ServerSocket socket = new ServerSocket(0)) {
            return socket.getLocalPort();
        }
    }

    private int runCommand(File directory, String... command) throws IOException, InterruptedException {
        ProcessBuilder pb = new ProcessBuilder(command);
        pb.directory(directory);
        File logFile = new File(directory, "deploy.log");
        pb.redirectOutput(ProcessBuilder.Redirect.appendTo(logFile));
        pb.redirectError(ProcessBuilder.Redirect.appendTo(logFile));
        Process process = pb.start();
        return process.waitFor();
    }
}
