package com.nocode.platform.config;

import com.nocode.platform.domain.PlatformUser;
import com.nocode.platform.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Инициализатор начальных данных при запуске приложения.
 *
 * <p>Создаёт учётную запись администратора по умолчанию
 * (admin/admin), если она ещё не существует в базе данных.</p>
 */
@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

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
