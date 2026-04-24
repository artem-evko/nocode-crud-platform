package com.nocode.platform.generator.engine.poet;

import com.nocode.platform.generator.spec.Spec;
import com.squareup.javapoet.*;

import javax.lang.model.element.Modifier;
import java.util.Map;

/**
 * Генератор ActionFlow-сервисов через библиотеку JavaPoet.
 *
 * <p>Создаёт Spring-сервис {@code ActionFlowService} с методами
 * для каждого потока бизнес-логики. Поддерживает действия:
 * создание/обновление/удаление записей в БД и отображение уведомлений.</p>
 */
public class ServiceGenerator {

    /**
     * Генерация исходного кода ActionFlowService.
     *
     * @param spec        полная спецификация проекта
     * @param basePackage базовый Java-пакет
     * @return строка с исходным кодом Java-класса
     */
    public String generate(Spec spec, String basePackage) {
        String servicePackage = basePackage + ".service";

        TypeSpec.Builder serviceBuilder = TypeSpec.classBuilder("ActionFlowService")
                .addModifiers(Modifier.PUBLIC)
                .addAnnotation(ClassName.get("org.springframework.stereotype", "Service"))
                .addAnnotation(ClassName.get("org.springframework.transaction.annotation", "Transactional"));

        serviceBuilder.addField(FieldSpec.builder(ClassName.get("jakarta.persistence", "EntityManager"), "entityManager")
                .addAnnotation(ClassName.get("org.springframework.beans.factory.annotation", "Autowired"))
                .build());

        serviceBuilder.addField(FieldSpec.builder(ClassName.get("com.fasterxml.jackson.databind", "ObjectMapper"), "objectMapper")
                .addAnnotation(ClassName.get("org.springframework.beans.factory.annotation", "Autowired"))
                .build());

        if (spec.actionFlows() != null) {
            for (Spec.ActionFlow flow : spec.actionFlows()) {
                String methodName = "execute_" + flow.id().replace("-", "_");
                MethodSpec.Builder mb = MethodSpec.methodBuilder(methodName)
                        .addModifiers(Modifier.PUBLIC)
                        .returns(ParameterizedTypeName.get(Map.class, String.class, Object.class))
                        .addParameter(ParameterizedTypeName.get(Map.class, String.class, Object.class), "payload");

                mb.addStatement("$T<$T, $T> result = new $T<>()", Map.class, String.class, Object.class, java.util.HashMap.class);
                mb.addCode("\n// --- Flow execution for: $L ---\n", flow.name());

                if (flow.nodes() != null) {
                    for (Spec.FlowNode node : flow.nodes()) {
                        if ("trigger".equals(node.type())) continue;

                        String action = node.action();
                        Map<String, Object> config = node.config();
                        
                        if ("DB_CREATE_RECORD".equals(action)) {
                            String entityName = config != null && config.containsKey("entityName") ? (String) config.get("entityName") : "Unknown";
                            String mappingJson = config != null && config.containsKey("mapping") ? (String) config.get("mapping") : "{}";
                            
                            ClassName entityClass = ClassName.get(basePackage + ".domain", entityName);
                            
                            mb.beginControlFlow("try");
                            mb.addStatement("String mappingTemplate = $S", mappingJson);
                            mb.addStatement("String resolvedJson = mappingTemplate");
                            mb.beginControlFlow("if (payload != null)");
                            mb.beginControlFlow("for ($T.Entry<String, Object> entry : payload.entrySet())", Map.class);
                            mb.beginControlFlow("if (entry.getValue() != null)");
                            mb.addStatement("resolvedJson = resolvedJson.replace(\"{{payload.\" + entry.getKey() + \"}}\", String.valueOf(entry.getValue()))");
                            mb.endControlFlow();
                            mb.endControlFlow();
                            mb.endControlFlow();
                            
                            mb.addStatement("$T entity = objectMapper.readValue(resolvedJson, $T.class)", entityClass, entityClass);
                            mb.addStatement("entityManager.persist(entity)");
                            mb.addStatement("System.out.println(\"Created entity: \" + entity)");
                            mb.addStatement("result.put(\"action_\" + $S, \"Success\")", node.id());
                            
                            mb.nextControlFlow("catch (Exception e)");
                            mb.addStatement("e.printStackTrace()");
                            mb.addStatement("result.put(\"error_\" + $S, e.getMessage())", node.id());
                            mb.endControlFlow();

                        } else if ("DB_UPDATE_RECORD".equals(action)) {
                            String entityName = config != null && config.containsKey("entityName") ? (String) config.get("entityName") : "Unknown";
                            String mappingJson = config != null && config.containsKey("mapping") ? (String) config.get("mapping") : "{}";
                            ClassName entityClass = ClassName.get(basePackage + ".domain", entityName);
                            
                            mb.beginControlFlow("try");
                            mb.addStatement("Object idObj = payload != null ? payload.get(\"id\") : null");
                            mb.beginControlFlow("if (idObj != null)");
                            mb.addStatement("Long entityId = Long.valueOf(idObj.toString())");
                            mb.addStatement("$T existing = entityManager.find($T.class, entityId)", entityClass, entityClass);
                            mb.beginControlFlow("if (existing != null)");
                            
                            mb.addStatement("String mappingTemplate = $S", mappingJson);
                            mb.addStatement("String resolvedJson = mappingTemplate");
                            mb.beginControlFlow("if (payload != null)");
                            mb.beginControlFlow("for ($T.Entry<String, Object> entry : payload.entrySet())", Map.class);
                            mb.beginControlFlow("if (entry.getValue() != null)");
                            mb.addStatement("resolvedJson = resolvedJson.replace(\"{{payload.\" + entry.getKey() + \"}}\", String.valueOf(entry.getValue()))");
                            mb.endControlFlow();
                            mb.endControlFlow();
                            mb.endControlFlow();
                            
                            mb.addStatement("objectMapper.readerForUpdating(existing).readValue(resolvedJson)");
                            mb.addStatement("entityManager.merge(existing)");
                            mb.addStatement("System.out.println(\"Updated entity: \" + existing)");
                            mb.addStatement("result.put(\"action_\" + $S, \"Success\")", node.id());
                            
                            mb.endControlFlow();
                            mb.endControlFlow();
                            
                            mb.nextControlFlow("catch (Exception e)");
                            mb.addStatement("e.printStackTrace()");
                            mb.addStatement("result.put(\"error_\" + $S, e.getMessage())", node.id());
                            mb.endControlFlow();

                        } else if ("DB_DELETE_RECORD".equals(action)) {
                            String entityName = config != null && config.containsKey("entityName") ? (String) config.get("entityName") : "Unknown";
                            ClassName entityClass = ClassName.get(basePackage + ".domain", entityName);
                            
                            mb.beginControlFlow("try");
                            mb.addStatement("Object idObj = payload != null ? payload.get(\"id\") : null");
                            mb.beginControlFlow("if (idObj != null)");
                            mb.addStatement("Long entityId = Long.valueOf(idObj.toString())");
                            mb.addStatement("$T existing = entityManager.find($T.class, entityId)", entityClass, entityClass);
                            mb.beginControlFlow("if (existing != null)");
                            mb.addStatement("entityManager.remove(existing)");
                            mb.addStatement("System.out.println(\"Deleted entity: \" + existing)");
                            mb.addStatement("result.put(\"action_\" + $S, \"Deleted\")", node.id());
                            mb.endControlFlow();
                            mb.endControlFlow();
                            
                            mb.nextControlFlow("catch (Exception e)");
                            mb.addStatement("e.printStackTrace()");
                            mb.addStatement("result.put(\"error_\" + $S, e.getMessage())", node.id());
                            mb.endControlFlow();
                            
                        } else if ("UI_SHOW_TOAST".equals(action)) {
                            String toastMsgTemplate = config != null && config.containsKey("message") ? (String) config.get("message") : "Success! Action Flow executed.";
                            mb.addStatement("String toastMessage = $S", toastMsgTemplate);
                            mb.beginControlFlow("if (payload != null)");
                            mb.beginControlFlow("for ($T.Entry<String, Object> entry : payload.entrySet())", Map.class);
                            mb.beginControlFlow("if (entry.getValue() != null)");
                            mb.addStatement("toastMessage = toastMessage.replace(\"{{payload.\" + entry.getKey() + \"}}\", String.valueOf(entry.getValue()))");
                            mb.endControlFlow();
                            mb.endControlFlow();
                            mb.endControlFlow();
                            mb.addStatement("result.put(\"toast\", toastMessage)");
                        }
                    }
                }

                mb.addStatement("return result");
                serviceBuilder.addMethod(mb.build());
            }
        }

        JavaFile javaFile = JavaFile.builder(servicePackage, serviceBuilder.build())
                .indent("    ")
                .build();

        return javaFile.toString();
    }
}
