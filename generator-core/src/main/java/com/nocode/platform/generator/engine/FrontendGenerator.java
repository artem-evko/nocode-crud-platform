package com.nocode.platform.generator.engine;

import com.nocode.platform.generator.spec.Spec;
import com.nocode.platform.generator.template.TemplateRenderer;

import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

public class FrontendGenerator {

    private final TemplateRenderer renderer = new TemplateRenderer();

    public void generate(ZipOutputStream zos, String root, Spec spec) throws Exception {
        Map<String, Object> model = new HashMap<>();
        model.put("appName", spec.project().name() != null ? spec.project().name() : "admin-ui");
        model.put("authEnabled", spec.project().authEnabled());
        model.put("entities", spec.entities());
        
        if (spec.uiSpec() != null) {
            model.put("uiSpec", spec.uiSpec());
        }

        // Basic Scaffolding
        putText(zos, root + "package.json", renderer.render("frontend/package.json.ftl", model));
        putText(zos, root + "vite.config.ts", renderer.render("frontend/vite.config.ts.ftl", model));
        putText(zos, root + "index.html", renderer.render("frontend/index.html.ftl", model));
        putText(zos, root + "tsconfig.json", renderer.render("frontend/tsconfig.json.ftl", model));
        putText(zos, root + "tsconfig.node.json", renderer.render("frontend/tsconfig.node.json.ftl", model));
        putText(zos, root + "tailwind.config.js", renderer.render("frontend/tailwind.config.js.ftl", model));
        putText(zos, root + "postcss.config.js", renderer.render("frontend/postcss.config.js.ftl", model));

        // Source Files
        putText(zos, root + "src/main.tsx", renderer.render("frontend/src/main.tsx.ftl", model));
        putText(zos, root + "src/App.tsx", renderer.render("frontend/src/App.tsx.ftl", model));
        putText(zos, root + "src/index.css", renderer.render("frontend/src/index.css.ftl", model));
        putText(zos, root + "src/lib/utils.ts", renderer.render("frontend/src/lib/utils.ts.ftl", model));
        putText(zos, root + "src/lib/api.ts", renderer.render("frontend/src/lib/api.ts.ftl", model));

        if (spec.project().authEnabled()) {
            putText(zos, root + "src/store/authStore.ts", renderer.render("frontend/src/store/authStore.ts.ftl", model));
            putText(zos, root + "src/pages/LoginPage.tsx", renderer.render("frontend/src/pages/LoginPage.tsx.ftl", model));
        }

        if (spec.uiSpec() != null && spec.uiSpec().components() != null && !spec.uiSpec().components().isEmpty()) {
            putText(zos, root + "src/pages/Dashboard.tsx", renderer.render("frontend/src/pages/Dashboard.tsx.ftl", model));
        }

        if (spec.entities() != null) {
            for (Spec.Entity entity : spec.entities()) {
                Map<String, Object> entityModel = new HashMap<>(model);
                entityModel.put("entity", entity);
                
                String lowerName = entity.name().toLowerCase();
                putText(zos, root + "src/pages/" + entity.name() + "List.tsx", renderer.render("frontend/src/pages/EntityList.tsx.ftl", entityModel));
                putText(zos, root + "src/pages/" + entity.name() + "Form.tsx", renderer.render("frontend/src/pages/EntityForm.tsx.ftl", entityModel));
            }
        }
    }

    private void putText(ZipOutputStream zos, String path, String content) throws Exception {
        ZipEntry entry = new ZipEntry(path);
        zos.putNextEntry(entry);
        zos.write(content.getBytes(StandardCharsets.UTF_8));
        zos.closeEntry();
    }
}
