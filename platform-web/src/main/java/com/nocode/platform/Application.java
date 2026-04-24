package com.nocode.platform;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

/**
 * Точка входа в приложение No-Code CRUD Platform.
 *
 * <p>Запускает Spring Boot приложение с поддержкой асинхронных операций
 * (необходимо для параллельного развёртывания проектов через Docker).</p>
 */
@SpringBootApplication
@EnableAsync
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}