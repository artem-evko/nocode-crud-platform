package com.nocode.platform.controller;

import com.nocode.platform.project.DeploymentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/projects/{id}/deploy")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class DeploymentController {

    private final DeploymentService deploymentService;

    public DeploymentController(DeploymentService deploymentService) {
        this.deploymentService = deploymentService;
    }

    @PostMapping
    public ResponseEntity<Void> deployProject(@PathVariable UUID id, @RequestParam(required = false) Integer port) {
        // Run deployment asynchronously
        deploymentService.deployProject(id, port);
        return ResponseEntity.accepted().build();
    }

    @DeleteMapping
    public ResponseEntity<Void> stopDeployment(@PathVariable UUID id) {
        deploymentService.stopDeployment(id);
        return ResponseEntity.ok().build();
    }
}
