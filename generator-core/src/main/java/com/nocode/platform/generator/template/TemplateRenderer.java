package com.nocode.platform.generator.template;

import freemarker.template.Configuration;
import freemarker.template.Template;

import java.io.StringWriter;
import java.nio.charset.StandardCharsets;
import java.util.Map;

public class TemplateRenderer {
    private final Configuration cfg;

    public TemplateRenderer() {
        cfg = new Configuration(Configuration.VERSION_2_3_32);
        cfg.setDefaultEncoding(StandardCharsets.UTF_8.name());
        cfg.setClassLoaderForTemplateLoading(getClass().getClassLoader(), "templates");
    }

    public String render(String templateName, Map<String, Object> model) {
        try (StringWriter out = new StringWriter()) {
            Template t = cfg.getTemplate(templateName);
            t.process(model, out);
            return out.toString();
        } catch (Exception e) {
            throw new IllegalStateException("Template render failed: " + templateName + ": " + e.getMessage(), e);
        }
    }
}