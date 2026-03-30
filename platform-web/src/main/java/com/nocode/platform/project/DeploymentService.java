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

@Service
public class DeploymentService {

    private static final Logger log = LoggerFactory.getLogger(DeploymentService.class);

    private final ProjectRepository projectRepository;
    private final GeneratorFacade generatorFacade;

    public DeploymentService(ProjectRepository projectRepository, GeneratorFacade generatorFacade) {
        this.projectRepository = projectRepository;
        this.generatorFacade = generatorFacade;
    }

    @Async
    public void deployProject(UUID projectId, Integer customPort) {
        ProjectEntity project = projectRepository.findById(projectId).orElseThrow();
        try {
            updateStatus(project, "DEPLOYING", null);

            // 1. Generate project code
            byte[] zipData = generatorFacade.generateReal(project);

            // 2. Prepare temp directory
            String artifactId = project.getArtifactId();
            Path deployDir = Paths.get(System.getProperty("java.io.tmpdir"), "deploy-" + projectId);
            if (Files.exists(deployDir)) {
                Files.walk(deployDir)
                        .sorted(Comparator.reverseOrder())
                        .map(Path::toFile)
                        .forEach(File::delete);
            }
            Files.createDirectories(deployDir);

            // 3. Unzip project code
            unzip(zipData, deployDir.toFile());

            // The root folder inside the zip is named 'artifactId/'
            Path projectRoot = deployDir.resolve(artifactId);

            // 4. Generate Dockerfiles and docker-compose.yml
            generateDockerFiles(projectRoot, project);

            // 5. Check if the generator produced actual frontend code
            boolean hasFrontend = project.isGenerateFrontend()
                    && Files.exists(projectRoot.resolve("frontend/package.json"));

            // 6. Find free port for frontend or backend
            int frontendPort = hasFrontend ? (customPort != null ? customPort : findFreePort()) : -1;
            int backendPort = findFreePort();
            int dbPort = findFreePort();

            generateDockerCompose(projectRoot, project, hasFrontend, frontendPort, backendPort, dbPort);

            // 7. Execute docker-compose
            String projectName = "proj-" + projectId;
            
            runCommand(projectRoot.toFile(), "docker", "compose", "-p", projectName, "down", "-v");
            
            int buildExitCode = runCommand(projectRoot.toFile(), "docker", "compose", "-p", projectName, "build");
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

            String url = hasFrontend ? "http://localhost:" + frontendPort
                                     : "http://localhost:" + backendPort + "/swagger-ui/index.html";
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
                // If dir doesn't exist, try globally
                runCommand(new File("."), "docker", "compose", "-p", projectName, "down", "-v");
            }
            updateStatus(project, "NONE", null);
        } catch (Exception e) {
            log.error("Failed to stop deployment for project {}", projectId, e);
            updateStatus(project, "FAILED", null);
        }
    }

    private void generateDockerFiles(Path root, ProjectEntity project) throws IOException {
        // Backend Dockerfile
        Path backendDir = root.resolve("backend");
        if (Files.exists(backendDir)) {
            String backendDockerfile = """
                    FROM maven:3.9.6-eclipse-temurin-21-alpine AS BUILD
                    WORKDIR /app
                    COPY pom.xml .
                    # Download dependencies
                    RUN mvn dependency:go-offline
                    COPY src ./src
                    RUN mvn clean package -DskipTests
                    
                    FROM eclipse-temurin:21-jre-alpine
                    WORKDIR /app
                    COPY --from=BUILD /app/target/*.jar app.jar
                    ENTRYPOINT ["java", "-jar", "app.jar"]
                    """;
            Files.writeString(backendDir.resolve("Dockerfile"), backendDockerfile);
        }

        // Frontend Dockerfile
        Path frontendDir = root.resolve("frontend");
        if (project.isGenerateFrontend()) {
            Files.createDirectories(frontendDir);
            String frontendDockerfile = """
                    FROM node:20-alpine AS build
                    WORKDIR /app
                    COPY package*.json ./
                    RUN npm install
                    COPY . .
                    RUN npm run build
                    
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
        String dbName = "app";
        
        // If hasFrontend, configure nginx to proxy /api to the backend
        if (hasFrontend) {
            Path frontendDir = root.resolve("frontend");
            Files.createDirectories(frontendDir);

            Path nginxConfPath = frontendDir.resolve("nginx.conf");
            String nginxConf = """
                    server {
                        listen 80;
                        location / {
                            root /usr/share/nginx/html;
                            index index.html index.htm;
                            try_files $uri $uri/ /index.html;
                        }
                        location /api/ {
                            proxy_pass http://backend:8080/api/;
                            proxy_set_header Host $host;
                            proxy_set_header X-Real-IP $remote_addr;
                        }
                    }
                    """;
            Files.writeString(nginxConfPath, nginxConf);
            
            // Overwrite API BASE URL in api.ts to be relative /api
            Path apiTsPath = frontendDir.resolve("src/lib/api.ts");
            if (Files.exists(apiTsPath)) {
                String apiTs = Files.readString(apiTsPath);
                apiTs = apiTs.replace("http://localhost:8080/api", "/api");
                Files.writeString(apiTsPath, apiTs);
            }
        }
        
        // Overwrite application.yml to use docker network db:
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
        
        // DB
        compose.append("  db:\n");
        compose.append("    image: postgres:15-alpine\n");
        compose.append("    environment:\n");
        compose.append("      POSTGRES_USER: ").append(dbUser).append("\n");
        compose.append("      POSTGRES_PASSWORD: ").append(dbPass).append("\n");
        compose.append("      POSTGRES_DB: ").append(dbName).append("\n");
        compose.append("    ports:\n");
        compose.append("      - \"").append(dbPort).append(":5432\"\n");
        
        // Backend
        compose.append("  backend:\n");
        compose.append("    build: ./backend\n");
        compose.append("    ports:\n");
        compose.append("      - \"").append(backendPort).append(":8080\"\n");
        compose.append("    depends_on:\n");
        compose.append("      - db\n");
        
        if (hasFrontend) {
            compose.append("  frontend:\n");
            compose.append("    build: ./frontend\n");
            compose.append("    ports:\n");
            compose.append("      - \"").append(frontendPort).append(":80\"\n");
            compose.append("    depends_on:\n");
            compose.append("      - backend\n");
        }

        Files.writeString(root.resolve("docker-compose.yml"), compose.toString());
    }

    private void updateStatus(ProjectEntity project, String status, String url) {
        project.setDeploymentStatus(status);
        if (url != null) {
            project.setDeploymentUrl(url);
        }
        projectRepository.save(project);
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
