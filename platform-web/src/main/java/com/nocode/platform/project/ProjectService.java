package com.nocode.platform.project;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository repo;

    private String getCurrentUsername() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

    @Transactional(readOnly = true)
    public List<ProjectEntity> list() {
        return repo.findAllByOwnerUsername(getCurrentUsername());
    }

    @Transactional
    public ProjectEntity create(CreateProjectRequest req) {
        ProjectEntity p = new ProjectEntity();
        p.setId(UUID.randomUUID());
        p.setOwnerUsername(getCurrentUsername());
        p.setName(req.name().trim());
        p.setGroupId(req.groupId().trim());
        p.setArtifactId(req.artifactId().trim());
        p.setVersion(req.version().trim());
        p.setBasePackage(req.basePackage().trim());
        p.setSpecText(req.specText().trim());

        OffsetDateTime now = OffsetDateTime.now();
        p.setCreatedAt(now);
        p.setUpdatedAt(now);

        return repo.save(p);
    }

    @Transactional(readOnly = true)
    public ProjectEntity get(UUID id) {
        ProjectEntity p = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Project not found: " + id));
        if (!p.getOwnerUsername().equals(getCurrentUsername())) {
            throw new IllegalArgumentException("Access Denied to Project: " + id);
        }
        return p;
    }

    @Transactional
    public ProjectEntity updateSpec(UUID id, String specText) {
        ProjectEntity p = get(id);
        p.setSpecText(specText == null ? "" : specText);
        return repo.save(p);
    }
}