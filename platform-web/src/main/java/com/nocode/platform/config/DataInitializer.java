package com.nocode.platform.config;

import com.nocode.platform.domain.PlatformUser;
import com.nocode.platform.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Инициализатор начальных данных при запуске приложения.
 *
 * <p>Создаёт учётную запись администратора по умолчанию
 * (admin/admin), если она ещё не существует в базе данных.</p>
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (userRepository.findByUsername("admin").isEmpty()) {
            PlatformUser admin = new PlatformUser();
            admin.setUsername("admin");
            admin.setPassword(passwordEncoder.encode("admin"));
            admin.setRole("ADMIN");
            userRepository.save(admin);
            log.info("Default admin user created (username: admin, password: admin)");
        } else {
            log.info("Admin user already exists, skipping seed");
        }
    }
}
