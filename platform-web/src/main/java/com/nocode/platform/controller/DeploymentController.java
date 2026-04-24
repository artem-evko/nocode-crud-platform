package com.nocode.platform.controller;

import com.nocode.platform.project.DeploymentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * REST-контроллер для управления развёртыванием проектов.
 *
 * <p>Позволяет запускать и останавливать Docker-контейнеры
 * сгенерированного проекта.</p>
 */
@RestController
@RequestMapping("/api/projects/{id}/deploy")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class DeploymentController {

    private final DeploymentService deploymentService;

    public DeploymentController(DeploymentService deploymentService) {
        this.deploymentService = deploymentService;
    }

    /**
     * Запуск развёртывания проекта (асинхронно).
     *
     * @param id   идентификатор проекта
     * @param port пользовательский порт (необязательно)
     */
    @PostMapping
    public ResponseEntity<Void> deployProject(@PathVariable UUID id, @RequestParam(required = false) Integer port) {
        deploymentService.deployProject(id, port);
        return ResponseEntity.accepted().build();
    }

    /**
     * Остановка развёрнутого проекта и удаление контейнеров.
     *
     * @param id идентификатор проекта
     */
    @DeleteMapping
    public ResponseEntity<Void> stopDeployment(@PathVariable UUID id) {
        deploymentService.stopDeployment(id);
        return ResponseEntity.ok().build();
    }
}
