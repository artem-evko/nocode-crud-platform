package com.e2e.service;

import com.e2e.domain.Task;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityManager;
import java.lang.Object;
import java.lang.String;
import java.util.HashMap;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class ActionFlowService {
    @Autowired
    EntityManager entityManager;

    @Autowired
    ObjectMapper objectMapper;

    public Map<String, Object> execute_flow_1(Map<String, Object> payload) {
        Map<String, Object> result = new HashMap<>();

        // --- Flow execution for: Main Business Logic ---
        // Action: Create Entity
        try {
            String mappingTemplate = "{ \"title\": \"Dynamic Data\" }";
            String resolvedJson = mappingTemplate;
            if (payload != null) {
                for (Map.Entry<String, Object> entry : payload.entrySet()) {
                    if (entry.getValue() != null) {
                        resolvedJson = resolvedJson.replace("{{payload." + entry.getKey() + "}}", String.valueOf(entry.getValue()));
                    }
                }
            }
            Task entity = objectMapper.readValue(resolvedJson, Task.class);
            entityManager.persist(entity);
            System.out.println("Created entity: " + entity);
            result.put("action_" + "node_7e3c1113-9ae3-4880-8331-574a4aff13ce", "Success");
        } catch (Exception e) {
            e.printStackTrace();
            result.put("error_" + "node_7e3c1113-9ae3-4880-8331-574a4aff13ce", e.getMessage());
        }
        return result;
    }
}
