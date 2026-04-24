package com.nocode.platform.generator;

import com.nocode.platform.project.ProjectEntity;
import com.nocode.platform.project.ProjectService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.util.UUID;

/**
 * REST-контроллер для скачивания сгенерированного проекта в виде ZIP-архива.
 */
@RestController
@RequestMapping("/api/projects")
public class ProjectDownloadController {

    private final ProjectService projectService;
    private final GeneratorFacade generatorFacade;

    public ProjectDownloadController(ProjectService projectService, GeneratorFacade generatorFacade) {
        this.projectService = projectService;
        this.generatorFacade = generatorFacade;
    }

    /**
     * Скачивание ZIP-архива сгенерированного проекта.
     *
     * @param id идентификатор проекта
     * @return ZIP-архив или сообщение об ошибке валидации
     */
    @GetMapping("/{id}/download")
    public ResponseEntity<?> download(@PathVariable("id") UUID id) {
        ProjectEntity p = projectService.get(id);
        try {
            byte[] zip = generatorFacade.generateReal(p);

            String fileName = p.getArtifactId() + "-" + p.getVersion() + ".zip";

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType("application/zip"))
                    .header(HttpHeaders.CONTENT_DISPOSITION, contentDisposition(fileName))
                    .body(zip);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(java.util.Map.of("message", e.getMessage()));
        }
    }

    private String contentDisposition(String fileName) {
        String encoded = java.net.URLEncoder.encode(fileName, StandardCharsets.UTF_8).replace("+", "%20");
        return "attachment; filename*=UTF-8''" + encoded;
    }
}