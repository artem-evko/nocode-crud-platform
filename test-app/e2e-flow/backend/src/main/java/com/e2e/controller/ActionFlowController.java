package com.e2e.controller;

import com.e2e.service.ActionFlowService;
import java.lang.Object;
import java.lang.String;
import java.util.Map;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/actions")
@CrossOrigin(
        origins = "*"
)
public class ActionFlowController {
    private final ActionFlowService actionFlowService;

    public ActionFlowController(ActionFlowService actionFlowService) {
        this.actionFlowService = actionFlowService;
    }

    @PostMapping("/flow_1")
    public Map<String, Object> execute_flow_1(@RequestBody Map<String, Object> payload) {
        return actionFlowService.execute_flow_1(payload);
    }
}
