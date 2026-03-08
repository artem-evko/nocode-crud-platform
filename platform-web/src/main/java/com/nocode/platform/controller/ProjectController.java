package com.nocode.platform.controller;

import com.nocode.platform.project.ProjectEntity;
import com.nocode.platform.dto.ProjectDto;
import com.nocode.platform.project.ProjectRepository;
import org.springframework.http.ResponseEntity;
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

    public ProjectController(ProjectRepository projectRepository) {
        this.projectRepository = projectRepository;
    }

    @GetMapping
    public List<ProjectDto> getAllProjects() {
        return projectRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @PostMapping
    public ProjectDto createProject(@RequestBody ProjectDto dto) {
        ProjectEntity project = new ProjectEntity();
        project.setId(UUID.randomUUID());
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
        return convertToDto(projectRepository.save(project));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProjectDto> updateProject(@PathVariable UUID id, @RequestBody ProjectDto dto) {
        return projectRepository.findById(id)
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
                    return ResponseEntity.ok(convertToDto(projectRepository.save(project)));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProject(@PathVariable UUID id) {
        projectRepository.deleteById(id);
        return ResponseEntity.ok().build();
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
        dto.setCreatedAt(project.getCreatedAt());
        dto.setUpdatedAt(project.getUpdatedAt());
        return dto;
    }
}
