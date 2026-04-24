package com.nocode.platform.generator.template;

import freemarker.template.Configuration;
import freemarker.template.Template;

import java.io.StringWriter;
import java.nio.charset.StandardCharsets;
import java.util.Map;

/**
 * Обёртка над FreeMarker для рендеринга шаблонов кодогенерации.
 *
 * <p>Загружает {@code .ftl}-шаблоны из classpath ({@code templates/})
 * и рендерит их с заданной моделью данных.</p>
 */
public class TemplateRenderer {
    private final Configuration cfg;

    public TemplateRenderer() {
        cfg = new Configuration(Configuration.VERSION_2_3_32);
        cfg.setDefaultEncoding(StandardCharsets.UTF_8.name());
        cfg.setClassLoaderForTemplateLoading(getClass().getClassLoader(), "templates");
    }

    /**
     * Рендеринг FreeMarker-шаблона с заданной моделью.
     *
     * @param templateName имя шаблона (относительно каталога templates/)
     * @param model        карта значений для подстановки в шаблон
     * @return результат рендеринга в виде строки
     */
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