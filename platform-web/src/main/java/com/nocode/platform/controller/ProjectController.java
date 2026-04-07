package com.nocode.platform.controller;

import com.nocode.platform.project.ProjectEntity;
import com.nocode.platform.dto.ProjectDto;
import com.nocode.platform.project.ProjectRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/projects")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class ProjectController {

    private final ProjectRepository projectRepository;
    private final com.nocode.platform.project.DeploymentService deploymentService;

    public ProjectController(ProjectRepository projectRepository, com.nocode.platform.project.DeploymentService deploymentService) {
        this.projectRepository = projectRepository;
        this.deploymentService = deploymentService;
    }

    private String getUsername() {
        return SecurityContextHolder.getContext().getAuthentication() != null 
                && SecurityContextHolder.getContext().getAuthentication().isAuthenticated()
                && !SecurityContextHolder.getContext().getAuthentication().getName().equals("anonymousUser")
                ? SecurityContextHolder.getContext().getAuthentication().getName()
                : "admin"; // Default fallback
    }

    @GetMapping
    public List<ProjectDto> getAllProjects() {
        return projectRepository.findAllByOwnerUsername(getUsername()).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProjectDto> getProjectById(@PathVariable UUID id) {
        return projectRepository.findById(id)
                .filter(p -> p.getOwnerUsername().equals(getUsername()))
                .map(this::convertToDto)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> createProject(@RequestBody ProjectDto dto) {
        // Validate project fields
        List<String> errors = validateProjectFields(dto);
        if (!errors.isEmpty()) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", String.join("; ", errors)));
        }

        ProjectEntity project = new ProjectEntity();
        project.setId(UUID.randomUUID());
        
        project.setOwnerUsername(getUsername());
        project.setName(dto.getName());
        project.setGroupId(dto.getGroupId() != null ? dto.getGroupId() : "com.example");
        project.setArtifactId(dto.getArtifactId() != null ? dto.getArtifactId() : "demo");
        project.setVersion(dto.getVersion() != null ? dto.getVersion() : "1.0.0");
        project.setBasePackage(dto.getBasePackage() != null ? dto.getBasePackage() : "com.example.demo");
        project.setSpecText(dto.getSpecText() != null ? dto.getSpecText() : "{}");
        project.setAuthEnabled(dto.isAuthEnabled());
        project.setGenerateFrontend(dto.isGenerateFrontend());
        project.setCreatedAt(OffsetDateTime.now());
        project.setUpdatedAt(OffsetDateTime.now());
        return ResponseEntity.ok(convertToDto(projectRepository.save(project)));
    }

    private List<String> validateProjectFields(ProjectDto dto) {
        List<String> errors = new java.util.ArrayList<>();
        if (dto.getName() == null || dto.getName().trim().isEmpty()) {
            errors.add("Project name is required");
        }
        if (dto.getGroupId() != null && !dto.getGroupId().matches("^[a-z][a-z0-9]*(\\.[a-z][a-z0-9]*)*$")) {
            errors.add("Group ID must be a valid Java package (e.g. com.example). Only lowercase letters, digits, and dots.");
        }
        if (dto.getArtifactId() != null && !dto.getArtifactId().matches("^[a-z][a-z0-9-]*$")) {
            errors.add("Artifact ID must contain only lowercase letters, digits, and hyphens.");
        }
        if (dto.getBasePackage() != null && !dto.getBasePackage().matches("^[a-z][a-z0-9]*(\\.[a-z][a-z0-9]*)*$")) {
            errors.add("Base package must be a valid Java package (e.g. com.example.demo).");
        }
        return errors;
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateProject(@PathVariable UUID id, @RequestBody ProjectDto dto) {
        return projectRepository.findById(id)
                .filter(p -> p.getOwnerUsername().equals(getUsername()))
                .map(project -> {
                    project.setName(dto.getName());
                    project.setGroupId(dto.getGroupId());
                    project.setArtifactId(dto.getArtifactId());
                    project.setVersion(dto.getVersion());
                    project.setBasePackage(dto.getBasePackage());
                    project.setAuthEnabled(dto.isAuthEnabled());
                    project.setGenerateFrontend(dto.isGenerateFrontend());
                    if (dto.getSpecText() != null) {
                        project.setSpecText(dto.getSpecText());
                    }
                    project.setUpdatedAt(OffsetDateTime.now());
                    try {
                        return ResponseEntity.ok(convertToDto(projectRepository.save(project)));
                    } catch (ObjectOptimisticLockingFailureException e) {
                        return ResponseEntity.status(HttpStatus.CONFLICT)
                                .body(java.util.Map.of("message",
                                        "The project was modified in another window. Please reload and try again."));
                    }
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProject(@PathVariable UUID id) {
        return projectRepository.findById(id)
                .filter(p -> p.getOwnerUsername().equals(getUsername()))
                .map(project -> {
                    try {
                        deploymentService.stopDeployment(id);
                    } catch (Exception e) {
                        // Ignore if deployment wasn't actively running
                    }
                    projectRepository.deleteById(id);
                    return ResponseEntity.ok().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }

    private ProjectDto convertToDto(ProjectEntity project) {
        ProjectDto dto = new ProjectDto();
        dto.setId(project.getId());
        dto.setName(project.getName());
        dto.setGroupId(project.getGroupId());
        dto.setArtifactId(project.getArtifactId());
        dto.setVersion(project.getVersion());
        dto.setBasePackage(project.getBasePackage());
        dto.setSpecText(project.getSpecText());
        dto.setAuthEnabled(project.isAuthEnabled());
        dto.setGenerateFrontend(project.isGenerateFrontend());
        dto.setDeploymentStatus(project.getDeploymentStatus());
        dto.setDeploymentUrl(project.getDeploymentUrl());
        dto.setCreatedAt(project.getCreatedAt());
        dto.setUpdatedAt(project.getUpdatedAt());
        dto.setEntityVersion(project.getEntityVersion() != null ? project.getEntityVersion() : 0L);
        return dto;
    }
}
